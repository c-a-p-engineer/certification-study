/** Daily goals based on distinct, correctly answered questions. No exam answers or repetitive farming. */
export type ContractId='warmup'|'explore'|'recover'|'recall';
export type DailyContracts={date:string;warmup:string[];explore:string[];recover:string[];recall:string[];claimed:ContractId[]};
export type ContractAnswer={date:string;questionId:string;correct:boolean;exam:boolean;firstAttempt:boolean;previouslyIncorrect:boolean;reviewDue:boolean};
export const CONTRACTS=[
 {id:'warmup',name:'POWER UP',subtitle:'異なる3問に正解',target:3,reward:80},
 {id:'explore',name:'NEW FRONTIER',subtitle:'初見問題3問に正解',target:3,reward:120},
 {id:'recover',name:'COMEBACK',subtitle:'間違えた問題2問を克服',target:2,reward:160},
 {id:'recall',name:'MEMORY RAID',subtitle:'復習期限の問題2問に正解',target:2,reward:180}
] as const;
const ids=new Set<ContractId>(CONTRACTS.map(item=>item.id));
const uniqueIds=(value:unknown):string[]=>Array.isArray(value)?Array.from(new Set(value.filter((id):id is string=>typeof id==='string'&&id.length>0&&id.length<=160))).slice(0,3):[];
/** Only the current local day counts. Previous dates remain in the activity timeline. */
export function todayContracts(value:unknown,date:string):DailyContracts{
 const raw=value&&typeof value==='object'&&!Array.isArray(value)?value as Partial<DailyContracts>:{};
 const same=raw.date===date;
 return {date,warmup:same?uniqueIds(raw.warmup):[],explore:same?uniqueIds(raw.explore):[],
  recover:same?uniqueIds(raw.recover):[],recall:same?uniqueIds(raw.recall):[],
  claimed:same&&Array.isArray(raw.claimed)?Array.from(new Set(raw.claimed.filter((id):id is ContractId=>ids.has(id as ContractId)))):[]};
}
export function recordContractAnswer(value:unknown,event:ContractAnswer):DailyContracts{
 const state=todayContracts(value,event.date);
 if(!event.correct||event.exam||!event.questionId)return state;
 const add=(items:string[],eligible:boolean)=>eligible&&!items.includes(event.questionId)?[...items,event.questionId].slice(0,3):items;
 return {...state,warmup:add(state.warmup,true),explore:add(state.explore,event.firstAttempt),
  recover:add(state.recover,event.previouslyIncorrect),recall:add(state.recall,event.reviewDue)};
}
export function claimContract(value:unknown,date:string,id:ContractId):{contracts:DailyContracts;award:number}{
 const state=todayContracts(value,date);
 const definition=CONTRACTS.find(item=>item.id===id);
 if(!definition||state.claimed.includes(id)||state[id].length<definition.target)return {contracts:state,award:0};
 return {contracts:{...state,claimed:[...state.claimed,id]},award:definition.reward};
}
export function contractsCompleted(value:unknown,date:string):number{
 const state=todayContracts(value,date);
 return CONTRACTS.filter(item=>state.claimed.includes(item.id)).length;
}
