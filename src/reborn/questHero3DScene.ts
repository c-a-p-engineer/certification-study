/// <reference types="vite/client" />
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

export type Hero3DReaction={seq:number;kind:'idle'|'hit'|'hurt'|'victory';damage:number};
export type Hero3DDriver={update:(event:Hero3DReaction)=>void;dispose:()=>void};
type Model=Awaited<ReturnType<GLTFLoader['loadAsync']>>;

// One immutable scene load per tab; HOME and QUEST share this asset and the same lazy module.
let cached:Promise<Model>|null=null;
function loadMage():Promise<Model>{
 if(!cached){
  const path=import.meta.env.BASE_URL+'characters/kaykit/mage.glb';
  cached=new GLTFLoader().loadAsync(path).catch(e=>{cached=null;throw e});
 }
 return cached;
}
/** Mount a KayKit-authored GLB. Rendering is a presentation sidecar, not a second game engine. */
export async function mountQuestHero3D(host:HTMLDivElement,onUnavailable:()=>void,view:'battle'|'portrait'='battle'):Promise<Hero3DDriver>{
 const model=await loadMage();
 if(!host.isConnected)throw new Error('3D host unmounted');
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(1.35,window.devicePixelRatio||1));
 renderer.setClearColor(0x101b32,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.55;
 renderer.domElement.className='cs-hero-3d-canvas';
 renderer.domElement.setAttribute('aria-hidden','true');
 renderer.domElement.style.pointerEvents='none';
 host.appendChild(renderer.domElement);
 const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-1.4,1.4,1.55,-1.55,.1,80);
 // The home portrait faces the viewer; battle keeps the original inward-facing camera.
 if(view==='portrait')camera.position.set(1.15,1.22,4.5);
 else camera.position.set(-3.35,1.25,4.0);
 camera.lookAt(0,-.05,0);
 scene.add(new THREE.AmbientLight(0xe9f5ff,2.15));
 const main=new THREE.DirectionalLight(0xfff2d9,3.0);main.position.set(-3,5,5);scene.add(main);
 const rim=new THREE.DirectionalLight(0x8db9ff,2.0);rim.position.set(3,3,-3);scene.add(rim);
 const root=new THREE.Group();scene.add(root);
 const figure=clone(model.scene);
 const box=new THREE.Box3().setFromObject(figure);
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 const scale=2.4/Math.max(.01,size.y);
 figure.scale.setScalar(scale);
 figure.position.set(-center.x*scale,-box.min.y*scale-1.2,-center.z*scale);
 root.add(figure);
 const ringMaterial=new THREE.MeshBasicMaterial({color:0x61d7f4,transparent:true,opacity:.36,side:THREE.DoubleSide});
 const ring=new THREE.Mesh(new THREE.RingGeometry(.58,.66,36),ringMaterial);
 ring.rotation.x=-Math.PI/2;ring.position.y=-1.18;scene.add(ring);
 const mixer=new THREE.AnimationMixer(figure);
 const idleClip=model.animations.find(x=>/idle|stand/i.test(x.name))??model.animations[0];
 const idleAction=idleClip?mixer.clipAction(idleClip):null;
 idleAction?.play();
 let reaction:Hero3DReaction={seq:0,kind:'idle',damage:0};
 let reactedSeq=0,reactedAt=-10000;
 let visible=true,running=false,disposed=false;
 let lastFrame=performance.now();
 const onContextLost=(event:Event)=>{event.preventDefault();onUnavailable()};
 renderer.domElement.addEventListener('webglcontextlost',onContextLost);
 function sizeCanvas(){
  if(disposed)return;
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),aspect=w/h;
  camera.left=-1.58*aspect;camera.right=1.58*aspect;
  camera.top=1.58;camera.bottom=-1.58;camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
 }
 function tick(time:number){
  if(disposed)return;
  const delta=Math.min(.06,Math.max(0,(time-lastFrame)/1000));lastFrame=time;
  mixer.update(delta);
  const t=time*.001;
  const impact=Math.max(0,1-(time-reactedAt)/520);
  // A brief stage-light surge reinforces only the confirmed impact event.
  rim.intensity=2.0+impact*1.5;
  ring.scale.setScalar(1+impact*.23);
  if(reaction.kind==='hit'&&impact>0){
   root.position.x=impact*.35;
   root.rotation.z=-impact*.12;
   ringMaterial.opacity=.35+impact*.52;
  }else if(reaction.kind==='victory'&&impact>0){
   root.position.y=impact*.22;root.rotation.z=-impact*.07;ringMaterial.opacity=.45;
  }else if(reaction.kind==='hurt'&&impact>0){
   root.position.x=-impact*.24;
   root.rotation.z=impact*.17;
   ringMaterial.opacity=.35;
  }else{
   root.position.set(0,Math.sin(t*1.8)*.025,0);
   root.rotation.z=0;
   ringMaterial.opacity=.32;
  }
  if(view==='portrait')root.rotation.y=.12+Math.sin(t*.7)*.035;
  else root.rotation.y=.22+Math.sin(t*.7)*.035;
  ring.rotation.z=t*.36;
  renderer.render(scene,camera);
 }
 function setRunning(){
  const mayRun=!disposed&&visible&&!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(mayRun===running)return;
  running=mayRun;
  renderer.setAnimationLoop(mayRun?tick:null);
  if(mayRun){lastFrame=performance.now();sizeCanvas()}
 }
 const visibility=()=>setRunning();
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 const reduced=()=>setRunning();
 document.addEventListener('visibilitychange',visibility);
 media.addEventListener?.('change',reduced);
 const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{visible=Boolean(entries[0]?.isIntersecting);setRunning()},{threshold:.01});
 observer?.observe(host);
 const resizer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(sizeCanvas);
 resizer?.observe(host);
 window.addEventListener('resize',sizeCanvas);
 sizeCanvas();setRunning();
 return {
  update(event){
   if(disposed)return;
   reaction=event;
   if(event.seq>0&&event.seq!==reactedSeq){
    reactedSeq=event.seq;reactedAt=performance.now();
    // Use an authored attack/hurt clip when one exists, otherwise retain
    // the authored idle clip and apply a small grounded model movement.
    const pattern=event.kind==='victory'?/^Cheer$/i:event.kind==='hit'?/attack|cast|swing|slash|spell/i:event.kind==='hurt'?/^Hit_|hurt|damage|stagger/i:null;
    if(pattern){
     const clip=model.animations.find(x=>pattern.test(x.name));
     if(clip){
      const action=mixer.clipAction(clip);
      action.reset().setLoop(THREE.LoopOnce,1).play();
      action.clampWhenFinished=false;
      idleAction?.fadeOut(.1);
      const onFinished=(finished:{action:THREE.AnimationAction})=>{
       if(finished.action!==action)return;
       mixer.removeEventListener('finished',onFinished);
       action.stop();idleAction?.reset().fadeIn(.12).play();
      };
      mixer.addEventListener('finished',onFinished);
     }
    }
   }
  },
  dispose(){
   if(disposed)return;
   disposed=true;
   renderer.setAnimationLoop(null);
   document.removeEventListener('visibilitychange',visibility);
   media.removeEventListener?.('change',reduced);
   renderer.domElement.removeEventListener('webglcontextlost',onContextLost);
   window.removeEventListener('resize',sizeCanvas);
   observer?.disconnect();resizer?.disconnect();
   mixer.stopAllAction();mixer.uncacheRoot(figure);
   ring.geometry.dispose();ringMaterial.dispose();
   // Shared textures and geometries in cached GLTF belong to modelCache, not this mount.
   renderer.dispose();renderer.forceContextLoss();
   renderer.domElement.remove();
  }
 };
}
