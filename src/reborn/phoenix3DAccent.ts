import * as THREE from 'three';

export type PhoenixAccent={
 update:(timeSeconds:number,defeated:boolean)=>void;
 dispose:()=>void;
};

/**
 * Small authored 3D feather silhouette and warm flame materials, applied only
 * to the Gobkit CC0 Duck copy when its logical enemy ID is PHOENIX.
 * Underlying model geometry/textures remain shared and are never disposed.
 */
export function createPhoenixAccent(actor:THREE.Object3D,root:THREE.Group):PhoenixAccent{
 const ownedMaterials:THREE.Material[]=[];
 const ownedGeometries:THREE.BufferGeometry[]=[];
 const warmBody:THREE.MeshStandardMaterial[]=[];
 const warm=new THREE.Color(0xff7320);
 actor.traverse(node=>{
  if(!(node instanceof THREE.Mesh))return;
  const tint=(source:THREE.Material):THREE.Material=>{
   const copy=source.clone();
   ownedMaterials.push(copy);
   if(copy instanceof THREE.MeshStandardMaterial){
    copy.color.lerp(warm,.82);
    copy.emissive.setHex(0xae2800);
    copy.emissiveIntensity=.55;
    copy.roughness=.65;
    warmBody.push(copy);
   }else if(copy instanceof THREE.MeshBasicMaterial){
    copy.color.lerp(warm,.8);
   }
   return copy;
  };
  node.material=Array.isArray(node.material)?node.material.map(tint):tint(node.material);
 });

 const copper=new THREE.MeshStandardMaterial({
  color:0xff5718,emissive:0xe43200,emissiveIntensity:.9,roughness:.42,
  metalness:.05,flatShading:true,side:THREE.DoubleSide,
 });
 const gold=new THREE.MeshStandardMaterial({
  color:0xffd257,emissive:0xff8800,emissiveIntensity:.85,roughness:.45,
  metalness:.02,flatShading:true,side:THREE.DoubleSide,
 });
 const ember=new THREE.MeshBasicMaterial({color:0xffed7c});
 ownedMaterials.push(copper,gold,ember);
 const decorations=new THREE.Group();
 decorations.name='phoenix-flame-feathers';
 root.add(decorations);
 const wings:THREE.Group[]=[];
 const sparks:THREE.Object3D[]=[];

 function plume(radius:number,length:number,material:THREE.Material):THREE.Mesh{
  const geometry=new THREE.ConeGeometry(radius,length,5);
  ownedGeometries.push(geometry);
  return new THREE.Mesh(geometry,material);
 }
 // Wing fans are visibly extended beyond the stock bird's silhouette.
 for(const side of [-1,1]){
  const wing=new THREE.Group();
  wing.position.set(side*.35,.05,-.23);
  for(let i=0;i<4;i++){
   const feather=plume(.16+i*.018,1.18+i*.1,i%2?copper:gold);
   feather.position.set(side*(.14+i*.17),.2-i*.085,-.035-i*.04);
   feather.rotation.z=-side*(.86+i*.14);
   wing.add(feather);
  }
  decorations.add(wing);wings.push(wing);
 }
 // Three trailing flame feathers and a bright three-point crown.
 for(const i of [-1,0,1]){
  const tail=plume(.16,1.18+(1-Math.abs(i))*.28,i===0?gold:copper);
  tail.position.set(i*.25,-.63,-.49);
  tail.rotation.z=Math.PI+i*.24;
  decorations.add(tail);
  const crest=plume(.11,.52+(1-Math.abs(i))*.22,i===0?gold:copper);
  crest.position.set(i*.17,1.15,-.1);
  crest.rotation.z=-i*.32;
  decorations.add(crest);
 }
 const sparkGeometry=new THREE.SphereGeometry(.05,6,4);
 ownedGeometries.push(sparkGeometry);
 for(let i=0;i<5;i++){
  const spark=new THREE.Mesh(sparkGeometry,ember);
  spark.position.set(Math.sin(i*2.4)*1.02,-.4+i*.34,.3);
  decorations.add(spark);sparks.push(spark);
 }
 return {
  update(t,defeated){
   const flutter=Math.sin(t*3.2)*.19;
   wings[0].rotation.y=.12+flutter;
   wings[1].rotation.y=-.12-flutter;
   copper.emissiveIntensity=defeated?.12:.85+Math.sin(t*4)*.16;
   gold.emissiveIntensity=defeated?.12:.9+Math.sin(t*4+1)*.15;
   for(const material of warmBody)material.emissiveIntensity=defeated?.1:.48+Math.sin(t*3)*.12;
   for(let i=0;i<sparks.length;i++){
    const s=sparks[i];
    s.position.y=-.62+((t*.43+i*.26)%1)*2.1;
    s.position.x=Math.sin(t*1.3+i*2.5)*(.65+i*.09);
    s.visible=!defeated;
   }
  },
  dispose(){
   decorations.removeFromParent();
   for(const geometry of ownedGeometries)geometry.dispose();
   for(const material of ownedMaterials)material.dispose();
  },
 };
}
