/** Cosmetics unlocked through verified local study milestones, never purchases or randomness. */
import {BOSSES,normalizeBossRecords,type BossRecords} from './bossCampaign.ts';
import type {SkillNode} from './skillTree.ts';
export type RelicRarity='EPIC'|'LEGENDARY'|'MYTHIC';
export type Relic={id:string;name:string;rarity:RelicRarity;description:string;condition:string;unlocked:boolean};
export function relicCollection(rawBosses:BossRecords|undefined,nodes:readonly SkillNode[]):Relic[]{
 const records=normalizeBossRecords(rawBosses);
 const advanced=nodes.filter(n=>n.tier>=2).length;
 const ascended=nodes.filter(n=>n.tier===3).length;
 const victories=BOSSES.filter(b=>!!records[b.domain]).length;
 return [
  ...BOSSES.map(b=>({
   id:'boss-'+b.code.toLowerCase(),name:b.code+' CORE',rarity:'EPIC' as const,
   description:b.domain+'の守護者を討伐した証',condition:b.domain+'ボスを7/10問以上で倒す',
   unlocked:!!records[b.domain]
  })),
  {id:'memory-prism',name:'MEMORY PRISM',rarity:'LEGENDARY',description:'複数分野で知識が結び付いた証',condition:'3トピックを訓練中以上にする',unlocked:advanced>=3},
  {id:'architect-halo',name:'ARCHITECT HALO',rarity:'LEGENDARY',description:'4領域の守護者を突破した勲章',condition:'4分野のボスをすべて討伐',unlocked:victories===4},
  {id:'ascendant-crown',name:'ASCENDANT CROWN',rarity:'MYTHIC',description:'学習の継続と復習による究極の装飾',condition:'9トピックが定着候補になり4ボスを討伐',unlocked:ascended===nodes.length&&nodes.length===9&&victories===4}
 ];
}
export function validEquippedRelic(value:unknown,collection:readonly Relic[]):string|null{
 return typeof value==='string'&&collection.some(r=>r.id===value&&r.unlocked)?value:null;
}
