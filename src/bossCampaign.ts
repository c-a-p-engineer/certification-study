/** Domain-specific boss encounters, with capped knowledge-based progression rewards. */
export const BOSSES=[
 {domain:'セキュリティ',code:'CERBERUS',name:'ZERO TRUST CERBERUS',subtitle:'権限と境界を見破れ',weakness:'IAM・認証・暗号化',symbol:'◆'},
 {domain:'耐障害性',code:'PHOENIX',name:'FAILOVER PHOENIX',subtitle:'障害からサービスを守れ',weakness:'冗長化・DR・RTO/RPO',symbol:'✦'},
 {domain:'パフォーマンス',code:'TITAN',name:'LATENCY TITAN',subtitle:'遅延とボトルネックを砕け',weakness:'配信・キャッシュ・負荷分散',symbol:'◈'},
 {domain:'コスト最適化',code:'LEVIATHAN',name:'COST LEVIATHAN',subtitle:'性能を守りながら無駄を断て',weakness:'料金・購入オプション・運用',symbol:'⬡'}
] as const;
export type BossDomain=typeof BOSSES[number]['domain'];
export type BossGrade='B'|'A'|'S';
export type BossRecord={bestCorrect:number;firstClearedAt:number};
export type BossRecords=Partial<Record<BossDomain,BossRecord>>;
const gradeOrder:Record<BossGrade,number>={B:1,A:2,S:3};
export function isBossDomain(value:unknown):value is BossDomain{return BOSSES.some(b=>b.domain===value)}
export function bossFor(domain:unknown){return BOSSES.find(item=>item.domain===domain)??null}
export function bossOutcome(correct:number,total:number){
 const valid=Number.isInteger(total)&&total>0&&Number.isInteger(correct)&&correct>=0&&correct<=total;
 const target=valid?Math.ceil(total*.7):0;
 const victory=valid&&correct>=target;
 const grade:BossGrade|null=!victory?null:correct===total?'S':correct>=Math.ceil(total*.9)?'A':'B';
 return {victory,grade,target,remaining:Math.max(0,target-(valid?correct:0)),total:valid?total:0,correct:valid?correct:0,
  hpPercent:target>0?Math.round(Math.max(0,target-correct)/target*100):100};
}
function readRecord(value:unknown):BossRecord|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const x=value as Partial<BossRecord>;
 return Number.isInteger(x.bestCorrect)&&x.bestCorrect!>=7&&x.bestCorrect!<=10&&
  Number.isFinite(x.firstClearedAt)&&x.firstClearedAt!>=0?
  {bestCorrect:x.bestCorrect!,firstClearedAt:x.firstClearedAt!}:null;
}
/** Ignore unknown/invalid legacy fields; the existing progress key and data remain unchanged. */
export function normalizeBossRecords(value:unknown):BossRecords{
 if(!value||typeof value!=='object'||Array.isArray(value))return {};
 const raw=value as Record<string,unknown>;
 return Object.fromEntries(BOSSES.flatMap(b=>{const record=readRecord(raw[b.domain]);return record?[[b.domain,record]]:[]})) as BossRecords;
}
const gradeFor=(correct:number):BossGrade=>correct>=10?'S':correct>=9?'A':'B';
export function recordBossVictory(raw:unknown,domain:unknown,correct:number,total:number,now=Date.now()){
 const records=normalizeBossRecords(raw),outcome=bossOutcome(correct,total);
 if(!isBossDomain(domain)||total!==10||!outcome.victory)return {records,award:0,firstClear:false,upgraded:false,outcome};
 const previous=records[domain];
 const firstClear=!previous;
 const upgraded=!!previous&&gradeOrder[gradeFor(correct)]>gradeOrder[gradeFor(previous.bestCorrect)];
 const award=firstClear?400:upgraded?120:0;
 const bestCorrect=Math.max(previous?.bestCorrect??0,correct);
 return {records:{...records,[domain]:{bestCorrect,firstClearedAt:previous?.firstClearedAt??now}},award,firstClear,upgraded,outcome};
}
