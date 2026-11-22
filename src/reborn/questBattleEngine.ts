import type {EnemyId} from '../enemyCampaign.ts';
import type {QuestSkill} from './soloArcadeEngine.ts';

/** QUEST RUN combat is a session-only game, never the persistent enemy campaign. */
export type QuestOpponent={id:EnemyId;name:string;maxHp:number};
const ROUTE_ENEMIES:Record<string,Pick<QuestOpponent,'id'|'name'>>={
 security:{id:'armor',name:'CACHE ARMOR'},
 resilience:{id:'phoenix',name:'FAILOVER PHOENIX'},
 performance:{id:'titan',name:'LATENCY TITAN'},
 cost:{id:'leviathan',name:'COST LEVIATHAN'},
};
const HP=[95,135,190] as const;
const BASE_DAMAGE=[23,29,39] as const;
export function opponentForStage(stage:number,routeId:string):QuestOpponent{
 if(!Number.isInteger(stage)||stage<0||stage>2)throw new Error('Invalid quest stage');
 if(stage===2)return {id:'dragon',name:'ARCHITECT DRAGON',maxHp:HP[2]};
 const route=ROUTE_ENEMIES[routeId];
 if(!route)throw new Error('Unknown quest route: '+routeId);
 return {...route,maxHp:HP[stage]};
}
export function questHitDamage(correct:boolean,stage:number,combo:number,skills:readonly QuestSkill[]):number{
 if(!Number.isInteger(stage)||stage<0||stage>2)throw new Error('Invalid quest stage');
 if(!correct)return 0;
 const chain=Number.isFinite(combo)?Math.max(0,Math.floor(combo)):0;
 const bonus=chain>=3?6:0;
 const amplified=skills.includes('amplifier')?1.5:1;
 const chained=skills.includes('combo')&&chain>=3?1.25:1;
 return Math.round((BASE_DAMAGE[stage]+bonus)*amplified*chained);
}
export function enemyHpAfterHit(hp:number,damage:number):number{
 if(!Number.isFinite(hp)||!Number.isFinite(damage)||hp<0||damage<0)throw new Error('Invalid combat HP/damage');
 return Math.max(0,Math.round(hp)-Math.round(damage));
}
export function questBossWon(stage:number,bossHp:number,playerHp:number):boolean{
 return stage===2&&bossHp===0&&playerHp>0;
}
