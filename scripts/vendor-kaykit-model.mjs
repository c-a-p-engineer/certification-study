import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

/** Immutable author-issued CC0 packs, pinned to exact Git blobs. */
export const KAYKIT_MAGE={
 repository:'KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0',
 commit:'672074b73ba276876a19e8816ecdc5241817ab47',
 blob:'c89f19f6e707f6e07e4632a08876bd6d0172b082',
 upstreamPath:'addons/kaykit_character_pack_adventures/Characters/gltf/Mage.glb',
 output:'public/characters/kaykit/mage.glb',
};
const SKELETON_REPOSITORY='KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0';
const SKELETON_COMMIT='15b62b9bad122f72926c10fb14d622c73819fa54';
const skeleton=(name,blob,size)=>({
 repository:SKELETON_REPOSITORY,commit:SKELETON_COMMIT,blob,size,
 upstreamPath:`addons/kaykit_character_pack_skeletons/Characters/gltf/Skeleton_${name}.glb`,
 output:`public/characters/kaykit/skeleton_${name.toLowerCase()}.glb`,
});
export const KAYKIT_ENEMIES={
 minion:skeleton('Minion','3b7e7ee4f1c8dd6dd99ddad27824ef1dc52ff12d',4814296),
 warrior:skeleton('Warrior','769e85c9e4cee8d1bd0952ddb3e9d26293144581',4863620),
 mage:skeleton('Mage','5f85aea26b4f33b88080d6eb57d25d1ae5d84d14',4761048),
};
export const MAGE_URL=`https://raw.githubusercontent.com/${KAYKIT_MAGE.repository}/${KAYKIT_MAGE.commit}/${KAYKIT_MAGE.upstreamPath}`;
export function verifyKaykitGlb(buffer,asset){
 if(!Buffer.isBuffer(buffer))throw new Error('Expected binary model bytes');
 if(buffer.length<20||buffer.toString('ascii',0,4)!=='glTF')throw new Error('KayKit model is not a GLB');
 if(buffer.readUInt32LE(4)!==2||buffer.readUInt32LE(8)!==buffer.length)throw new Error('GLB version or length mismatch');
 const chunkLength=buffer.readUInt32LE(12);
 if(chunkLength<10||chunkLength>buffer.length-20||buffer.readUInt32LE(16)!==0x4E4F534A)throw new Error('GLB JSON chunk missing');
 let model;
 try{model=JSON.parse(buffer.toString('utf8',20,20+chunkLength).trimEnd())}catch{throw new Error('GLB JSON invalid')}
 if(model.asset?.version!=='2.0'||!model.meshes?.length||!model.nodes?.length)throw new Error('GLB lacks a valid scene');
 const external=[...(model.images??[]),...(model.buffers??[])].map(x=>x.uri).filter(uri=>typeof uri==='string'&&!uri.startsWith('data:'));
 if(external.length)throw new Error('Model references unbundled textures/buffers: '+external.join(', '));
 const gitHash=createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
 if(gitHash!==asset.blob)throw new Error(`KayKit model source hash mismatch: ${gitHash}`);
 if(asset.size&&asset.size!==buffer.length)throw new Error('KayKit model size mismatch');
 return {bytes:buffer.length,animations:model.animations?.map(x=>x.name)??[],nodes:model.nodes.length,meshes:model.meshes.length,gitHash};
}
export function verifyMageGlb(buffer){return verifyKaykitGlb(buffer,KAYKIT_MAGE)}
export function verifyEnemyGlb(buffer,variant){
 const asset=KAYKIT_ENEMIES[variant];
 if(!asset)throw new Error('Invalid KayKit enemy variant');
 return verifyKaykitGlb(buffer,asset);
}
async function vendorOne(asset){
 try{
  const previous=await readFile(asset.output);
  const valid=verifyKaykitGlb(previous,asset);
  console.log('KayKit cached',asset.output,valid.bytes,'bytes');return;
 }catch{/* Missing or corrupt cache must be refetched and verified. */}
 if(process.argv.includes('--check'))throw new Error('Verified KayKit model missing: '+asset.output);
 const source=`https://raw.githubusercontent.com/${asset.repository}/${asset.commit}/${asset.upstreamPath}`;
 let last;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await fetch(source,{signal:AbortSignal.timeout(45000),headers:{'user-agent':'certification-overdrive-build/1'}});
   if(!response.ok)throw new Error(`KayKit download HTTP ${response.status}`);
   const bytes=Buffer.from(await response.arrayBuffer());
   const verified=verifyKaykitGlb(bytes,asset);
   await mkdir(dirname(asset.output),{recursive:true});await writeFile(asset.output,bytes);
   console.log('Vendored CC0',asset.output,verified.bytes,'bytes, animations:',verified.animations.join(', ')||'none');
   return;
  }catch(err){last=err;console.warn('KayKit download attempt',attempt+1,String(err))}
 }
 throw new Error('Unable to vendor verified KayKit model '+asset.output+': '+String(last));
}
export async function vendorKaykit(){
 for(const asset of [KAYKIT_MAGE,...Object.values(KAYKIT_ENEMIES)])await vendorOne(asset);
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('vendor-kaykit-model.mjs'))await vendorKaykit();
