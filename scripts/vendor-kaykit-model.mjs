import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

/** Immutable upstream asset, from the author's own public CC0 repository. */
export const KAYKIT_MAGE={
 repository:'KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0',
 commit:'672074b73ba276876a19e8816ecdc5241817ab47',
 blob:'c89f19f6e707f6e07e4632a08876bd6d0172b082',
 upstreamPath:'addons/kaykit_character_pack_adventures/Characters/gltf/Mage.glb',
 output:'public/characters/kaykit/mage.glb',
};
export const MAGE_URL=`https://raw.githubusercontent.com/${KAYKIT_MAGE.repository}/${KAYKIT_MAGE.commit}/${KAYKIT_MAGE.upstreamPath}`;

export function verifyMageGlb(buffer){
 if(!Buffer.isBuffer(buffer))throw new Error('Expected binary model bytes');
 if(buffer.length<20||buffer.toString('ascii',0,4)!=='glTF')throw new Error('KayKit Mage is not a GLB');
 if(buffer.readUInt32LE(4)!==2||buffer.readUInt32LE(8)!==buffer.length)throw new Error('GLB version or length mismatch');
 const chunkLength=buffer.readUInt32LE(12);
 if(chunkLength<10||chunkLength>buffer.length-20||buffer.readUInt32LE(16)!==0x4E4F534A)throw new Error('GLB JSON chunk missing');
 let model;
 try{model=JSON.parse(buffer.toString('utf8',20,20+chunkLength).trimEnd())}catch{throw new Error('GLB JSON invalid')}
 if(model.asset?.version!=='2.0'||!model.meshes?.length||!model.nodes?.length)throw new Error('GLB lacks a valid scene');
 const gitHash=createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
 if(gitHash!==KAYKIT_MAGE.blob)throw new Error(`KayKit Mage source hash mismatch: ${gitHash}`);
 return {bytes:buffer.length,animations:model.animations?.map(x=>x.name)??[],nodes:model.nodes.length,meshes:model.meshes.length,gitHash};
}
async function vendor(){
 const output=KAYKIT_MAGE.output;
 try{
  const previous=await readFile(output);
  const valid=verifyMageGlb(previous);
  console.log('KayKit Mage cached',valid.bytes,'bytes',valid.animations.length,'animations');return;
 }catch{/* Cache missing or stale. Retry immutable upstream. */}
 if(process.argv.includes('--check'))throw new Error('Verified KayKit Mage asset missing; run npm run vendor:3d');
 let last;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await fetch(MAGE_URL,{signal:AbortSignal.timeout(45000),headers:{'user-agent':'certification-overdrive-build/1'}});
   if(!response.ok)throw new Error(`KayKit download HTTP ${response.status}`);
   const buffer=Buffer.from(await response.arrayBuffer());
   const info=verifyMageGlb(buffer);
   await mkdir(dirname(output),{recursive:true});await writeFile(output,buffer);
   console.log('Vendored KayKit Mage CC0',info.bytes,'bytes, animations:',info.animations.join(', ')||'none');
   return;
  }catch(err){last=err;console.warn('KayKit download attempt',attempt+1,String(err))}
 }
 throw new Error('Unable to vendor verified KayKit Mage model: '+String(last));
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('vendor-kaykit-model.mjs'))await vendor();
