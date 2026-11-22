import type {EnemyId} from '../enemyCampaign.ts';
/** Cosmetic 3D selection; enemy game IDs, HP and reward logic are authoritative elsewhere. */
export type SkeletonVariant='minion'|'warrior'|'mage';
export const GOBKIT_VISUALS={
 'gobkit-animal-anglerfish':{path:'characters/gobkit/animal/Anglerfish.glb',label:'Gobkit Anglerfish'},
 'gobkit-animal-bat':{path:'characters/gobkit/animal/Bat.glb',label:'Gobkit Bat'},
 'gobkit-animal-corgi':{path:'characters/gobkit/animal/Corgi.glb',label:'Gobkit Corgi'},
 'gobkit-animal-duck':{path:'characters/gobkit/animal/Duck.glb',label:'Gobkit Duck'},
 'gobkit-animal-hippo':{path:'characters/gobkit/animal/Hippo.glb',label:'Gobkit Hippo'},
 'gobkit-animal-jellyfish':{path:'characters/gobkit/animal/Jellyfish.glb',label:'Gobkit Jellyfish'},
 'gobkit-animal-platypus':{path:'characters/gobkit/animal/Platypus.glb',label:'Gobkit Platypus'},
 'gobkit-animal-red':{path:'characters/gobkit/animal/Red.glb',label:'Gobkit Red'},
 'gobkit-animal-rhino':{path:'characters/gobkit/animal/Rhino.glb',label:'Gobkit Rhino'},
 'gobkit-animal-shark':{path:'characters/gobkit/animal/Shark.glb',label:'Gobkit Shark'},
 'gobkit-minion-a01':{path:'characters/gobkit/minion/minion-a01.glb',label:'Gobkit minion a01'},
 'gobkit-minion-a02':{path:'characters/gobkit/minion/minion-a02.glb',label:'Gobkit minion a02'},
 'gobkit-minion-b01':{path:'characters/gobkit/minion/minion-b01.glb',label:'Gobkit minion b01'},
 'gobkit-minion-b02':{path:'characters/gobkit/minion/minion-b02.glb',label:'Gobkit minion b02'},
 'gobkit-minion-c01':{path:'characters/gobkit/minion/minion-c01.glb',label:'Gobkit minion c01'},
 'gobkit-minion-c02':{path:'characters/gobkit/minion/minion-c02.glb',label:'Gobkit minion c02'},
 'gobkit-minion-d01':{path:'characters/gobkit/minion/minion-d01.glb',label:'Gobkit minion d01'},
 'gobkit-minion-d02':{path:'characters/gobkit/minion/minion-d02.glb',label:'Gobkit minion d02'},
} as const;
export type GobkitVariant=keyof typeof GOBKIT_VISUALS;
export type Enemy3DVariant=SkeletonVariant|GobkitVariant;
export const SKELETON_LABELS:Record<SkeletonVariant,string>={minion:'Skeleton Minion',warrior:'Skeleton Warrior',mage:'Skeleton Mage'};
export function enemy3DAsset(variant:Enemy3DVariant):{path:string;label:string;isGobkit:boolean}{
 if(variant in GOBKIT_VISUALS){
  const model=GOBKIT_VISUALS[variant as GobkitVariant];
  return {path:model.path,label:model.label,isGobkit:true};
 }
 return {path:'characters/kaykit/skeleton_'+variant+'.glb',label:SKELETON_LABELS[variant as SkeletonVariant],isGobkit:false};
}
const ROSTERS:Record<'slime'|'zombie'|'armor'|'chimera'|'cerberus'|'phoenix'|'titan'|'leviathan',readonly GobkitVariant[]>={
 slime:['gobkit-animal-jellyfish','gobkit-minion-a01'],
 zombie:['gobkit-minion-a02','gobkit-minion-b01'],
 chimera:['gobkit-animal-red','gobkit-animal-platypus'],
 cerberus:['gobkit-animal-corgi','gobkit-animal-rhino'],
 armor:['gobkit-minion-a01','gobkit-minion-a02','gobkit-minion-b01','gobkit-minion-b02','gobkit-minion-d01','gobkit-minion-d02'],
 phoenix:['gobkit-animal-bat','gobkit-animal-duck','gobkit-animal-jellyfish','gobkit-animal-red'],
 titan:['gobkit-minion-c01','gobkit-minion-c02','gobkit-animal-rhino','gobkit-animal-hippo'],
 leviathan:['gobkit-animal-shark','gobkit-animal-anglerfish','gobkit-animal-platypus','gobkit-animal-corgi']
};
/** Nonzero seed rotates all 18 CC0 models among QUEST stage routes without changing enemy IDs. */
export function questEnemyVariant(enemyId:EnemyId,boss:boolean,visualSeed=0):Enemy3DVariant{
 if(!Number.isSafeInteger(visualSeed)||visualSeed===0){
  if(boss||enemyId==='dragon')return 'mage';
  if(enemyId==='armor'||enemyId==='phoenix')return 'minion';
  return 'warrior';
 }
 if(boss||enemyId==='dragon')return 'mage';
 const roster=enemyId in ROSTERS?ROSTERS[enemyId as keyof typeof ROSTERS]:null;
 return roster?roster[Math.abs(visualSeed)%roster.length]:'warrior';
}
