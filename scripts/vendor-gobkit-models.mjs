import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {verifyKaykitGlb} from './vendor-kaykit-model.mjs';

/** Upstream creator's CC0 GLBs, pinned to a source commit and exact Git blob hashes. */
export const GOBKIT_REPOSITORY='Ariescar/gobkit-free-assets';
export const GOBKIT_COMMIT='4e73c68fa6e8ca9d948fcc0ce7215c830a022c3b';
export const GOBKIT_MODELS=[
 {upstreamPath:'animal/Anglerfish.glb',output:'public/characters/gobkit/animal/Anglerfish.glb',size:57640,blob:'e3ed5728a2445eb65f8f4184d4adeec7862accc9'},
 {upstreamPath:'animal/Bat.glb',output:'public/characters/gobkit/animal/Bat.glb',size:63308,blob:'766de4372d17206835c491f80f6b0db367ca0012'},
 {upstreamPath:'animal/Corgi.glb',output:'public/characters/gobkit/animal/Corgi.glb',size:73516,blob:'5e76b79fe002de2158309d56fdd02402de69f8af'},
 {upstreamPath:'animal/Duck.glb',output:'public/characters/gobkit/animal/Duck.glb',size:70104,blob:'a2c381021e66ffc15a44d6c1573848c54030d9fc'},
 {upstreamPath:'animal/Hippo.glb',output:'public/characters/gobkit/animal/Hippo.glb',size:66300,blob:'fc39675ae6400f797f92434246543a097f1d03f6'},
 {upstreamPath:'animal/Jellyfish.glb',output:'public/characters/gobkit/animal/Jellyfish.glb',size:66972,blob:'147c575f5b12ec9af5ed8ab51061fd98fb422c46'},
 {upstreamPath:'animal/Platypus.glb',output:'public/characters/gobkit/animal/Platypus.glb',size:74604,blob:'9246ccaad0217e3a66f64ff085035c8b9a1e27a9'},
 {upstreamPath:'animal/Red.glb',output:'public/characters/gobkit/animal/Red.glb',size:77092,blob:'8a336ef01092bb5a63edea95bd4ede792e303248'},
 {upstreamPath:'animal/Rhino.glb',output:'public/characters/gobkit/animal/Rhino.glb',size:70364,blob:'f638b1cf00a6472192beb85b1a4162535bfc189e'},
 {upstreamPath:'animal/Shark.glb',output:'public/characters/gobkit/animal/Shark.glb',size:61616,blob:'d2bc2497bbae415bd1fa7e297dc201b5f3f38ae4'},
 {upstreamPath:'minion/minion-a01.glb',output:'public/characters/gobkit/minion/minion-a01.glb',size:170752,blob:'f7700d62b6252f14601743f156049ef3b8454f96'},
 {upstreamPath:'minion/minion-a02.glb',output:'public/characters/gobkit/minion/minion-a02.glb',size:170764,blob:'7efd8a207b30a0261c10acafb08f173b975c4d2b'},
 {upstreamPath:'minion/minion-b01.glb',output:'public/characters/gobkit/minion/minion-b01.glb',size:174432,blob:'b8419a471e5f2619c17b2a8905dec1a04101430b'},
 {upstreamPath:'minion/minion-b02.glb',output:'public/characters/gobkit/minion/minion-b02.glb',size:174432,blob:'b351ace190813b69bd6c67b03f3755565ca1c2dc'},
 {upstreamPath:'minion/minion-c01.glb',output:'public/characters/gobkit/minion/minion-c01.glb',size:151100,blob:'584b85913b3a075948e6630b6a0d48883227c6d4'},
 {upstreamPath:'minion/minion-c02.glb',output:'public/characters/gobkit/minion/minion-c02.glb',size:151108,blob:'b776b3d91835e56009ea9ca79362039e89f7d3b5'},
 {upstreamPath:'minion/minion-d01.glb',output:'public/characters/gobkit/minion/minion-d01.glb',size:189716,blob:'ceb7beba04fa67b9607af9c8e704d1d084dd13ee'},
 {upstreamPath:'minion/minion-d02.glb',output:'public/characters/gobkit/minion/minion-d02.glb',size:189724,blob:'435125411965f24ec4d4693029eae7925201f0bb'},
].map(asset=>({...asset,repository:GOBKIT_REPOSITORY,commit:GOBKIT_COMMIT}));
export function verifyGobkitGlb(bytes,asset){
 if(!GOBKIT_MODELS.includes(asset))throw new Error('Unexpected Gobkit model');
 return verifyKaykitGlb(bytes,asset);
}
async function vendorOne(asset){
 try{const previous=await readFile(asset.output);verifyGobkitGlb(previous,asset);console.log('Gobkit cached',asset.output);return}
 catch{/* Missing/corrupt cache must be refetched and verified. */}
 if(process.argv.includes('--check'))throw new Error('Verified Gobkit model missing: '+asset.output);
 const source=`https://raw.githubusercontent.com/${GOBKIT_REPOSITORY}/${GOBKIT_COMMIT}/${asset.upstreamPath}`;
 let last;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await fetch(source,{signal:AbortSignal.timeout(45000),headers:{'user-agent':'certification-overdrive-build/1'}});
   if(!response.ok)throw new Error('Gobkit download HTTP '+response.status);
   const bytes=Buffer.from(await response.arrayBuffer());
   const verified=verifyGobkitGlb(bytes,asset);
   if(!verified.animations.length)throw new Error('Gobkit model has no authored animation: '+asset.upstreamPath);
   await mkdir(dirname(asset.output),{recursive:true});await writeFile(asset.output,bytes);
   console.log('Vendored CC0',asset.output,verified.bytes,'bytes');return;
  }catch(e){last=e;console.warn('Gobkit download attempt',attempt+1,String(e))}
 }
 throw new Error('Unable to vendor Gobkit model '+asset.output+': '+String(last));
}
export async function vendorGobkit(){
 for(let start=0;start<GOBKIT_MODELS.length;start+=4)await Promise.all(GOBKIT_MODELS.slice(start,start+4).map(vendorOne));
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('vendor-gobkit-models.mjs'))await vendorGobkit();
