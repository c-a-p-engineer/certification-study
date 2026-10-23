/** Deterministic, local-only PvE progression driven by distinct correct practice answers.
 * Enemy HP persists across missions; repeated answers cannot be farmed on the same enemy.
 */
export const ENEMIES=[
 {id:'slime',name:'TRAINING SLIME',short:'スライム',hp:40,rewardXp:60,description:'まずは一撃ずつ。正解でぷるぷるの敵を削ろう',rarity:'COMMON'},
 {id:'zombie',name:'MEMORY ZOMBIE',short:'ゾンビ',hp:75,rewardXp:100,description:'忘却から復活する、しぶとい敵',rarity:'COMMON'},
 {id:'armor',name:'CACHE ARMOR',short:'アーマー',hp:120,rewardXp:140,description:'硬い装甲をコンボで打ち破れ',rarity:'RARE'},
 {id:'chimera',name:'MULTI-SERVICE CHIMERA',short:'キマイラ',hp:180,rewardXp:220,description:'AWSサービスを跨ぐ複合構成の敵',rarity:'RARE'},
 {id:'dragon',name:'ARCH DRAGON',short:'ドラゴン',hp:260,rewardXp:320,description:'長期戦は知識の積み重ねで制する',rarity:'EPIC'},
 {id:'cerberus',name:'ZERO TRUST CERBERUS',short:'ケルベロス',hp:320,rewardXp:400,description:'権限と境界を守る三つ首の番犬',rarity:'EPIC'},
 {id:'phoenix',name:'FAILOVER PHOENIX',short:'フェニックス',hp:400,rewardXp:450,description:'障害から蘇る炎の守護者',rarity:'LEGENDARY'},
 {id:'titan',name:'LATENCY TITAN',short:'タイタン',hp:480,rewardXp:500,description:'高速回線を纏う鉄の巨人',rarity:'LEGENDARY'},
 {id:'leviathan',name:'COST LEVIATHAN',short:'リヴァイアサン',hp:600,rewardXp:600,description:'無駄を呑み込む最終巨獣',rarity:'MYTHIC'}
] as const;
export type EnemyId=typeof ENEMIES[number]['id'];
export type EnemyCampaign={
 stageIndex:number;hp:number;cleared:EnemyId[];hitIds:string[];completed:boolean
};
export type CampaignAnswer={
 questionId:string;correct:boolean;exam:boolean;boss:boolean;combo:number;
 difficulty?:number;reviewDue?:boolean;previouslyIncorrect?:boolean
};
export type CampaignHit={
 state:EnemyCampaign;damage:number;multiplier:number;bonusXp:number;
 defeated:typeof ENEMIES[number]|null;credited:boolean;critical:boolean
};
export const initialEnemyCampaign=():EnemyCampaign=>({stageIndex:0,hp:ENEMIES[0].hp,cleared:[],hitIds:[],completed:false});
const isEnemyId=(value:unknown):value is EnemyId=>ENEMIES.some(e=>e.id===value);
const validIds=(value:unknown):string[]=>Array.isArray(value)?[...new Set(value.filter((v):v is string=>typeof v==='string'&&v.length>0&&v.length<=160))].slice(0,500):[];
/** Invalid, missing or legacy progress data cannot manufacture a cleared monster. */
export function normalizeEnemyCampaign(value:unknown):EnemyCampaign{
 if(!value||typeof value!=='object'||Array.isArray(value))return initialEnemyCampaign();
 const raw=value as Partial<EnemyCampaign>;
 const stageIndex=Number.isInteger(raw.stageIndex)&&raw.stageIndex!>=0&&raw.stageIndex!<ENEMIES.length?raw.stageIndex!:0;
 const stage=ENEMIES[stageIndex];
 const expectedCleared=ENEMIES.slice(0,stageIndex).map(e=>e.id);
 const cleared=Array.isArray(raw.cleared)?raw.cleared.filter(isEnemyId):[];
 const hasHistory=expectedCleared.every(id=>cleared.includes(id));
 if(stageIndex>0&&!hasHistory)return initialEnemyCampaign();
 const completed=stageIndex===ENEMIES.length-1&&raw.completed===true&&cleared.includes(stage.id);
 const hp=completed?0:Number.isInteger(raw.hp)&&raw.hp!>0&&raw.hp!<=stage.hp?raw.hp!:stage.hp;
 return {stageIndex,hp,cleared:completed?[...new Set([...expectedCleared,stage.id])]:expectedCleared,
  hitIds:completed?[]:validIds(raw.hitIds),completed};
}
export function currentEnemy(value:unknown){return ENEMIES[normalizeEnemyCampaign(value).stageIndex]}
export function comboMultiplier(combo:number):number{
 if(!Number.isFinite(combo))return 1;
 return combo>=7?2:combo>=5?1.5:combo>=3?1.2:1;
}
export function damageForAnswer(event:CampaignAnswer):number{
 if(!event.correct||event.exam||event.boss)return 0;
 const base=10+(event.difficulty===3?3:0)+(event.reviewDue?2:0)+(event.previouslyIncorrect?2:0);
 return Math.round(base*comboMultiplier(event.combo));
}
/** At most one hit per question per monster, with no HP overflow or repeated clear XP. */
export function applyCampaignAnswer(value:unknown,event:CampaignAnswer):CampaignHit{
 const state=normalizeEnemyCampaign(value),multiplier=comboMultiplier(event.combo);
 const empty={state,damage:0,multiplier,bonusXp:0,defeated:null,credited:false,critical:false};
 const damage=damageForAnswer(event);
 if(state.completed||damage<=0||!event.questionId||event.questionId.length>160||state.hitIds.includes(event.questionId))return empty;
 const enemy=ENEMIES[state.stageIndex],remaining=Math.max(0,state.hp-damage),defeated=remaining===0;
 const nextIndex=Math.min(state.stageIndex+1,ENEMIES.length-1),last=state.stageIndex===ENEMIES.length-1;
 const next:EnemyCampaign=defeated
  ?{stageIndex:nextIndex,hp:last?0:ENEMIES[nextIndex].hp,
    cleared:[...state.cleared,enemy.id],hitIds:[],completed:last}
  :{...state,hp:remaining,hitIds:[...state.hitIds,event.questionId]};
 return {state:next,damage:Math.min(state.hp,damage),multiplier,
  bonusXp:defeated?enemy.rewardXp:0,defeated:defeated?enemy:null,
  credited:true,critical:event.difficulty===3||!!event.reviewDue||!!event.previouslyIncorrect};
}
export function campaignCollection(value:unknown){
 const state=normalizeEnemyCampaign(value);
 return ENEMIES.map((enemy,i)=>({...enemy,discovered:i<=state.stageIndex,cleared:state.cleared.includes(enemy.id)}));
}
