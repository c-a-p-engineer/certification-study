/// <reference types="vite/client" />
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import type {SkeletonVariant} from './questEnemyVariant.ts';
import type {BattleEvent} from './BattleStage.tsx';

type Model=Awaited<ReturnType<GLTFLoader['loadAsync']>>;
export type Enemy3DDriver={update:(event:BattleEvent,hp:number)=>void;dispose:()=>void};
const caches=new Map<SkeletonVariant,Promise<Model>>();
function loadEnemy(variant:SkeletonVariant):Promise<Model>{
 let existing=caches.get(variant);
 if(existing)return existing;
 const path=import.meta.env.BASE_URL+'characters/kaykit/skeleton_'+variant+'.glb';
 const next=new GLTFLoader().loadAsync(path).catch(error=>{caches.delete(variant);throw error});
 caches.set(variant,next);
 return next;
}
export async function mountQuestEnemy3D(host:HTMLDivElement,variant:SkeletonVariant,onUnavailable:()=>void):Promise<Enemy3DDriver>{
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

 const groundMaterial=new THREE.MeshBasicMaterial({color:0xed88b7,transparent:true,opacity:.31,side:THREE.DoubleSide});
 const ground=new THREE.Mesh(new THREE.RingGeometry(.55,.63,32),groundMaterial);
 ground.rotation.x=-Math.PI/2;ground.position.y=-1.2;scene.add(ground);

 const mixer=new THREE.AnimationMixer(actor);
 const idleClip=model.animations.find(clip=>/^Idle$/i.test(clip.name))??model.animations.find(clip=>/idle/i.test(clip.name))??model.animations[0];
 const idle=idleClip?mixer.clipAction(idleClip):null;
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
  camera.left=-1.52*aspect;camera.right=1.52*aspect;
  camera.top=1.52;camera.bottom=-1.52;
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
  mixer.update(dt);
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
  // GLTF geometry and textures belong to the shared immutable model cache.
  renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
 }};
}
