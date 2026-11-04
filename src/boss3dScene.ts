import * as THREE from 'three';
import type {BossDomain} from './bossCampaign.ts';
import {bossArmorPhase} from './bossArmorPhase.ts';

export type Boss3DDriver={update:(remaining:number,target:number,correct:number)=>void;dispose:()=>void};

type ArmorPiece={mesh:THREE.Mesh;base:THREE.Vector3;offset:THREE.Vector3;spin:number};

const THEME={
 'セキュリティ':{primary:0x894eb2,accent:0xf7a0f5,secondary:0x342858},
 '耐障害性':{primary:0xbb6656,accent:0xffdf8e,secondary:0x68334d},
 'パフォーマンス':{primary:0x4163be,accent:0x82f5ff,secondary:0x1e365e},
 'コスト最適化':{primary:0x287b7c,accent:0x8affd4,secondary:0x1b4858},
} as const;

export function mountBoss3D(host:HTMLDivElement,domain:BossDomain,onUnavailable:()=>void):Boss3DDriver{
 const palette=THEME[domain];
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(39,2,0.1,80);
 camera.position.set(0,0.35,7.2);
 camera.lookAt(0,0,0);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));
 renderer.setClearColor(0x081629,0);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.4;
 renderer.domElement.className='od4-cinematic-canvas';
 renderer.domElement.setAttribute('aria-hidden','true');
 host.appendChild(renderer.domElement);
 const ambient=new THREE.AmbientLight(0xbedbf7,1.7);
 const key=new THREE.DirectionalLight(0xffffff,3.3);key.position.set(-3,4,6);
 const rim=new THREE.PointLight(palette.accent,55,12);rim.position.set(2,1,3);
 scene.add(ambient,key,rim);
 const root=new THREE.Group();scene.add(root);
 const dark=new THREE.MeshStandardMaterial({color:palette.secondary,metalness:.85,roughness:.28});
 const armor=new THREE.MeshStandardMaterial({color:palette.primary,metalness:.76,roughness:.24,flatShading:true});
 const trim=new THREE.MeshStandardMaterial({color:palette.accent,metalness:.6,roughness:.25,emissive:palette.accent,emissiveIntensity:.24});
 const coreMaterial=new THREE.MeshStandardMaterial({color:palette.accent,metalness:.35,roughness:.12,emissive:palette.accent,emissiveIntensity:1.55});
 const shardMaterial=new THREE.MeshBasicMaterial({color:palette.accent,transparent:true,opacity:0});
 const shockMaterial=new THREE.MeshBasicMaterial({color:palette.accent,transparent:true,opacity:0,side:THREE.DoubleSide});
 const chassis=new THREE.Mesh(new THREE.IcosahedronGeometry(.88,1),dark);
 chassis.scale.set(1.1,1.15,.8);root.add(chassis);
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.36,2),coreMaterial);
 core.position.z=.67;root.add(core);
 const iris=new THREE.Mesh(new THREE.OctahedronGeometry(.19,0),trim);iris.position.z=1.02;root.add(iris);
 const mainRing=new THREE.Mesh(new THREE.TorusGeometry(.73,.025,7,64),trim);
 mainRing.rotation.x=.45;mainRing.position.z=.78;root.add(mainRing);
 const outerRing=new THREE.Mesh(new THREE.TorusGeometry(1.24,.014,5,64),trim);
 outerRing.rotation.x=.35;root.add(outerRing);
 const pieces:ArmorPiece[]=[];
 function addPiece(geo:THREE.BufferGeometry,x:number,y:number,z:number,offsetX:number,offsetY:number,offsetZ:number,material:THREE.Material=armor,rx=0,ry=0,rz=0){
  const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.rotation.set(rx,ry,rz);root.add(mesh);
  pieces.push({mesh,base:mesh.position.clone(),offset:new THREE.Vector3(offsetX,offsetY,offsetZ),spin:rz});
  return mesh;
 }
 // Armor moves out along meaningful 3D axes as the boss shield loses integrity.
 for(const side of [-1,1]){
  addPiece(new THREE.BoxGeometry(.64,1.02,.32),side*.66,.1,.67,side*1.7,.4,1.6,armor,0,side*.36,side*-.14);
  addPiece(new THREE.BoxGeometry(.53,.42,.38),side*.66,-.64,.53,side*1.65,-1,1.3,armor,side*.13,0,side*.1);
  addPiece(new THREE.BoxGeometry(.42,.28,.52),side*.45,.88,.48,side*1.2,1.5,1.3,armor,0,0,side*.2);
  addPiece(new THREE.BoxGeometry(.48,.14,.23),side*1.05,.26,.64,side*2.2,.3,1.8,trim,0,0,side*.3);
 }
 // Four recognizable biomechanical silhouettes, not the same generic boss recolored.
 if(domain==='セキュリティ'){
  for(const x of [-.62,0,.62]){
   addPiece(new THREE.ConeGeometry(.3,.65,5),x,1.15,.22,x*1.75,1.8,1.25,armor,0,0,Math.PI);
   addPiece(new THREE.BoxGeometry(.28,.11,.23),x,.9,.72,x*1.5,1.45,1.3,trim);
  }
 }else if(domain==='耐障害性'){
  for(const side of [-1,1]){
   addPiece(new THREE.ConeGeometry(.55,1.7,3),side*1.35,.35,-.25,side*2.4,1.2,1.9,armor,0,0,side*-.85);
   addPiece(new THREE.BoxGeometry(.25,1.1,.25),side*1.1,.35,.1,side*2.3,1.15,1.3,trim,0,0,side*-.4);
  }
 }else if(domain==='パフォーマンス'){
  for(const side of [-1,1]){
   addPiece(new THREE.BoxGeometry(.72,.7,.7),side*1.17,.5,-.15,side*2.6,1,1.4,armor,0,0,side*.25);
   addPiece(new THREE.CylinderGeometry(.22,.22,.9,7),side*1.5,-.48,0,side*2.7,-1.5,1.4,trim,0,0,side*-.25);
  }
 }else{
  for(const side of [-1,1]){
   addPiece(new THREE.ConeGeometry(.36,1.25,5),side*1.12,.05,-.24,side*2.45,.9,1.4,armor,0,0,side*-.65);
   addPiece(new THREE.OctahedronGeometry(.27,0),side*1.25,-.56,.1,side*2.3,-1.4,1.2,trim);
  }
 }
 const floor=new THREE.GridHelper(12,20,palette.accent,0x24465d);
 floor.position.y=-1.85;
 (floor.material as THREE.Material).transparent=true;
 (floor.material as THREE.Material).opacity=.32;
 scene.add(floor);
 const shock=new THREE.Mesh(new THREE.RingGeometry(.85,.92,48),shockMaterial);
 shock.position.z=1.45;root.add(shock);
 const fragmentGeo=new THREE.TetrahedronGeometry(.08,0);
 const fragments=Array.from({length:18},(_,i)=>{
  const piece=new THREE.Mesh(fragmentGeo,shardMaterial);
  piece.visible=false;root.add(piece);
  const angle=i*Math.PI*2/18;
  return {mesh:piece,angle,speed:1+(i%4)*.12};
 });
 let current={remaining:7,target:7,correct:0};
 let hitAt=-10000;
 let previousCorrect:number|null=null;
 let visible=true,disposed=false,running=false;
 let clockStart=performance.now();
 function update(remaining:number,target:number,correct:number){
  if(disposed)return;
  if(previousCorrect!==null&&correct>previousCorrect)hitAt=performance.now();
  previousCorrect=correct;
  current={remaining,target,correct};
 }
 function resize(){
  if(disposed)return;
  const width=Math.max(1,host.clientWidth);
  const height=Math.max(1,host.clientHeight);
  camera.aspect=width/height;camera.updateProjectionMatrix();
  // Keep the full silhouette visible on narrow Android screens.
  camera.position.z=camera.aspect<1.5?8.8:7.2;
  renderer.setSize(width,height,false);
 }
 const animation=(time:number)=>{
  if(disposed)return;
  const seconds=(time-clockStart)/1000;
  const phase=bossArmorPhase(current.remaining,current.target);
  const spread=phase==='broken'?2.0:phase==='exposed'?1.12:phase==='strained'?.42:0;
  const hit=Math.max(0,1-(time-hitAt)/520);
  root.rotation.y=Math.sin(seconds*.48)*.18+hit*.08;
  root.rotation.x=-.08+Math.sin(seconds*.31)*.055;
  root.position.x=Math.sin(seconds*1.12)*.045+hit*Math.sin(time*.09)*.06;
  for(const piece of pieces){
   const goal=piece.base.clone().addScaledVector(piece.offset,spread);
   piece.mesh.position.lerp(goal,.11);
   piece.mesh.rotation.z+=(piece.spin+(phase==='broken'?Math.sign(piece.offset.x)*.5:0)-piece.mesh.rotation.z)*.09;
  }
  core.rotation.y+=.018;iris.rotation.z-=.011;mainRing.rotation.z+=.012;outerRing.rotation.z-=.007;
  const coreIntense=phase==='broken'?.05:phase==='exposed'?2.3:1.25;
  coreMaterial.emissiveIntensity=coreIntense+(phase==='broken'?0:Math.sin(seconds*3)*.2)+hit*2.6;
  core.scale.setScalar(phase==='broken'?.6:1+hit*.24);
  shock.visible=hit>0;
  shock.scale.setScalar(1+(1-hit)*2.6);
  shockMaterial.opacity=Math.max(0,hit*.55);
  shardMaterial.opacity=Math.max(0,hit*.95);
  fragments.forEach(({mesh,angle,speed},i)=>{
   mesh.visible=hit>0;
   if(hit>0){
    const length=(1-hit)*speed*2.3;
    mesh.position.set(Math.cos(angle)*length,Math.sin(angle)*length,1.3+(i%3)*.12);
    mesh.rotation.set(seconds*3+i,seconds*5+i,angle);
   }
  });
  if(phase==='broken')camera.position.x+=(.55-camera.position.x)*.025;
  else camera.position.x+=(0-camera.position.x)*.06;
  camera.lookAt(0,0,0);
  renderer.render(scene,camera);
 };
 function setRunning(){
  const shouldRun=!disposed&&visible&&!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(shouldRun===running)return;
  running=shouldRun;
  renderer.setAnimationLoop(shouldRun?animation:null);
  if(shouldRun)resize();
 }
 const onVisibility=()=>setRunning();
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const motionChange=()=>setRunning();
 document.addEventListener('visibilitychange',onVisibility);
 motion.addEventListener?.('change',motionChange);
 const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;setRunning()},{threshold:.03});
 observer?.observe(host);
 const resizer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>resize());
 resizer?.observe(host);
 window.addEventListener('resize',resize);
 // Device reset/context loss falls back to the lightweight SVG already in the app.
 const lost=(event:Event)=>{event.preventDefault();onUnavailable();};
 renderer.domElement.addEventListener('webglcontextlost',lost);
 resize();setRunning();
 return {update,dispose(){
  disposed=true;renderer.setAnimationLoop(null);
  observer?.disconnect();resizer?.disconnect();
  window.removeEventListener('resize',resize);
  document.removeEventListener('visibilitychange',onVisibility);
  motion.removeEventListener?.('change',motionChange);
  renderer.domElement.removeEventListener('webglcontextlost',lost);
  scene.traverse(obj=>{
   if(obj instanceof THREE.Mesh){
    obj.geometry.dispose();
    if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());
    else obj.material.dispose();
   }
  });
  (floor.geometry as THREE.BufferGeometry).dispose();
  (floor.material as THREE.Material).dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  renderer.domElement.remove();
 }};
}
