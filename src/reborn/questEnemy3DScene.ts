/// <reference types="vite/client" />
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {enemy3DAsset,type Enemy3DVariant} from './questEnemyVariant.ts';
import {enemyCardFrustumHalfHeight} from './enemyCardFraming.ts';
import {createPhoenixAccent} from './phoenix3DAccent.ts';
import type {BattleEvent} from './BattleStage.tsx';

type Model=Awaited<ReturnType<GLTFLoader['loadAsync']>>;
export type Enemy3DDriver={update:(event:BattleEvent,hp:number)=>void;dispose:()=>void};
const caches=new Map<Enemy3DVariant,Promise<Model>>();
function loadEnemy(variant:Enemy3DVariant):Promise<Model>{
 let existing=caches.get(variant);
 if(existing)return existing;
 const path=import.meta.env.BASE_URL+enemy3DAsset(variant).path;
 const next=new GLTFLoader().loadAsync(path).catch(error=>{caches.delete(variant);throw error});
 caches.set(variant,next);
 return next;
}
export async function mountQuestEnemy3D(host:HTMLDivElement,variant:Enemy3DVariant,onUnavailable:()=>void,view:'battle'|'card'='battle'):Promise<Enemy3DDriver>{
 const model=await loadEnemy(variant);
 if(!host.isConnected)throw new Error('Enemy mount detached');
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
 renderer.setClearColor(0x17233a,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.65;
 renderer.domElement.className='cs-enemy-3d-canvas';
 renderer.domElement.setAttribute('aria-hidden','true');
 renderer.domElement.style.pointerEvents='none';
 host.appendChild(renderer.domElement);

 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-1,1,1.55,-1.55,.1,60);
 // The mirrored camera gives the enemy a three-quarter pose facing screen-left.
 camera.position.set(3.35,1.2,4.0);camera.lookAt(0,0,0);
 scene.add(new THREE.AmbientLight(0xffffff,2.2));
 const key=new THREE.DirectionalLight(0xffe0b7,3.0);
 key.position.set(-3,5,6);scene.add(key);
 const rim=new THREE.DirectionalLight(0xeb83cb,1.9);
 rim.position.set(3,2,-4);scene.add(rim);
 const root=new THREE.Group();scene.add(root);
 const actor=clone(model.scene);
 const bounds=new THREE.Box3().setFromObject(actor),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const scale=2.4/Math.max(.01,size.y);
 actor.scale.setScalar(scale);
 actor.position.set(-center.x*scale,-bounds.min.y*scale-1.20,-center.z*scale);
 root.add(actor);
 // A locally authored, disposable feather/ember overlay turns the CC0 bird into a
 // distinct fiery Phoenix; no external asset or second animation renderer.
 const phoenixAccent=variant==='phoenix'?createPhoenixAccent(actor,root):null;
 // Source meshes have very different aspect ratios (e.g. sharks vs skeletons).
 // Card framing projects all eight model-bound corners into camera space.
 // The gameplay camera is intentionally unchanged.
 const cardBounds=new THREE.Box3().setFromObject(root);
 const cardCorners:THREE.Vector3[]=[];
 for(const x of [cardBounds.min.x,cardBounds.max.x]){
  for(const y of [cardBounds.min.y,cardBounds.max.y]){
   for(const z of [cardBounds.min.z,cardBounds.max.z])cardCorners.push(new THREE.Vector3(x,y,z));
  }
 }

 const groundMaterial=new THREE.MeshBasicMaterial({color:0xed88b7,transparent:true,opacity:.31,side:THREE.DoubleSide});
 const ground=new THREE.Mesh(new THREE.RingGeometry(.55,.63,32),groundMaterial);
 if(phoenixAccent){
  groundMaterial.color.setHex(0xff9426);
  rim.color.setHex(0xffbb59);
 }
 ground.rotation.x=-Math.PI/2;ground.position.y=-1.2;scene.add(ground);

 const mixer=new THREE.AnimationMixer(actor);
 const isGobkit=enemy3DAsset(variant).isGobkit;
 const bakedClip=isGobkit?model.animations[0]:undefined;
 const bakedAction=bakedClip?mixer.clipAction(bakedClip):null;
 bakedAction?.play();
 let segment:'idle'|'attack'|'dead'='idle',segmentAt=performance.now();
 const frameUnit=bakedClip?.duration?bakedClip.duration/((variant==='phoenix'||variant.startsWith('gobkit-animal-'))?119:89):1/24;
 const segmentSeconds=30*frameUnit;
 const idleClip=model.animations.find(clip=>/^Idle$/i.test(clip.name))??model.animations.find(clip=>/idle/i.test(clip.name))??model.animations[0];
 const idle=!isGobkit&&idleClip?mixer.clipAction(idleClip):null;
 idle?.play();
 let event:BattleEvent={seq:0,kind:'idle',damage:0};
 let enemyHp=1,reactedSeq=0,reactedAt=-1e4;
 let activeAction:THREE.AnimationAction|null=null;
 let visible=true,disposed=false,running=false,lastFrame=performance.now();

 const onContextLost=(e:Event)=>{e.preventDefault();onUnavailable()};
 renderer.domElement.addEventListener('webglcontextlost',onContextLost);
 function resize(){
  if(disposed)return;
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),aspect=w/h;
  let halfHeight=1.52;
  // Phoenix feathers can be wider than the base bird: fit even inside the
  // compact battle actor slot, without touching other enemies' camera poses.
  if((view==='card'||variant==='phoenix')&&cardCorners.length){
   camera.updateMatrixWorld();
   let horizontalExtent=0,verticalExtent=0;
   for(const corner of cardCorners){
    const projected=corner.clone().applyMatrix4(camera.matrixWorldInverse);
    horizontalExtent=Math.max(horizontalExtent,Math.abs(projected.x));
    verticalExtent=Math.max(verticalExtent,Math.abs(projected.y));
   }
   halfHeight=enemyCardFrustumHalfHeight(w,h,horizontalExtent,verticalExtent);
  }
  camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;
  camera.top=halfHeight;camera.bottom=-halfHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
 }
 const onFinished=(e:{action:THREE.AnimationAction})=>{
  if(e.action!==activeAction||enemyHp===0)return;
  activeAction.stop();
  activeAction=null;
  idle?.reset().fadeIn(.14).play();
 };
 mixer.addEventListener('finished',onFinished);
 function play(pattern:RegExp,defeated:boolean){
  const clip=model.animations.find(x=>pattern.test(x.name));
  if(!clip)return;
  if(activeAction){activeAction.stop();activeAction=null}
  const action=mixer.clipAction(clip);
  action.reset().setLoop(THREE.LoopOnce,1);
  action.clampWhenFinished=defeated;
  idle?.fadeOut(.1);
  activeAction=action;
  action.fadeIn(.1).play();
 }
 function update(next:BattleEvent,hp:number){
  if(disposed)return;
  event=next;enemyHp=Math.max(0,hp);
  if(next.seq===0){reactedSeq=0;return}
  if(next.seq===reactedSeq)return;
  reactedSeq=next.seq;reactedAt=performance.now();
  if(isGobkit){
   // The author's single baked track uses idle 0-29, attack 30-59, dead 60-89.
   segment=enemyHp===0?'dead':next.kind==='hurt'?'attack':'idle';
   segmentAt=reactedAt;
   return;
  }
  if(next.kind==='hit'){
   if(enemyHp===0)play(/^Death_A$|^Death_B$|death/i,true);
   else play(/^Hit_A$|^Hit_B$|^Hit$|hurt/i,false);
  }else if(next.kind==='hurt'){
   play(/Attack|Melee|Shoot|Spellcast|Punch/i,false);
  }
 }
 function frame(now:number){
  if(disposed)return;
  const dt=Math.max(0,Math.min(.055,(now-lastFrame)/1000));lastFrame=now;
  if(isGobkit&&bakedAction){
   const elapsed=Math.max(0,(now-segmentAt)/1000);
   if(segment==='attack'&&elapsed>=segmentSeconds){segment='idle';segmentAt=now}
   const advanced=Math.max(0,(now-segmentAt)/1000);
   const start=segment==='idle'?0:segment==='attack'?30:60;
   const offset=segment==='dead'?Math.min(29*frameUnit,advanced):advanced%segmentSeconds;
   mixer.setTime(Math.min(bakedClip!.duration,start*frameUnit+offset));
  }else mixer.update(dt);
  const impact=Math.max(0,1-(now-reactedAt)/540);
  // No additional particles or GPU ticker; the existing rim and ring react.
  rim.intensity=1.9+impact*1.7;
  ground.scale.setScalar(1+impact*.22);
  const t=now/1000;
  if(event.kind==='hit'&&impact>0){
   root.position.x=impact*.18;root.rotation.z=impact*.11;
   groundMaterial.opacity=.3+impact*.4;
  }else if(event.kind==='hurt'&&impact>0){
   root.position.x=-impact*.24;root.rotation.z=-impact*.13;
   groundMaterial.opacity=.3+impact*.2;
  }else{
   root.position.set(0,Math.sin(t*1.55)*.02,0);
   root.rotation.z=0;groundMaterial.opacity=.3;
  }
  if(enemyHp===0){root.position.y=-.08;groundMaterial.opacity=.12}
  root.rotation.y=-.22+Math.sin(t*.63)*.035;
  ground.rotation.z=t*.29;
  phoenixAccent?.update(t,enemyHp===0);
  renderer.render(scene,camera);
 }
 function setRunning(){
  const want=!disposed&&visible&&!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(want===running)return;
  running=want;renderer.setAnimationLoop(want?frame:null);
  if(want){lastFrame=performance.now();resize()}
 }
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const onMotion=()=>setRunning();
 const onVisibility=()=>setRunning();
 motion.addEventListener?.('change',onMotion);
 document.addEventListener('visibilitychange',onVisibility);
 const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{visible=Boolean(entries[0]?.isIntersecting);setRunning()},{threshold:.01});
 observer?.observe(host);
 const resizer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(resize);
 resizer?.observe(host);
 window.addEventListener('resize',resize);
 resize();setRunning();
 return {update,dispose(){
  if(disposed)return;
  disposed=true;renderer.setAnimationLoop(null);
  observer?.disconnect();resizer?.disconnect();
  window.removeEventListener('resize',resize);
  document.removeEventListener('visibilitychange',onVisibility);
  motion.removeEventListener?.('change',onMotion);
  renderer.domElement.removeEventListener('webglcontextlost',onContextLost);
  mixer.removeEventListener('finished',onFinished);
  mixer.stopAllAction();mixer.uncacheRoot(actor);
  ground.geometry.dispose();groundMaterial.dispose();
  phoenixAccent?.dispose();
  // GLTF geometry and textures belong to the shared immutable model cache.
  renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
 }};
}
