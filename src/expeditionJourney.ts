/** Pure, five-step expedition presentation. Never grades answers, advances saved state or grants XP. */
import {EXPEDITIONS,type ExpeditionId} from './expeditions.ts';
export type ExpeditionJourneyId=ExpeditionId;
const STEPS=[
 {label:'索敵',intent:'まず要件と制約を特定'},
 {label:'遭遇',intent:'サービスの役割を比較'},
 {label:'対策',intent:'失敗モードと保護策を判断'},
 {label:'反撃',intent:'トレードオフを根拠で確認'},
 {label:'決戦',intent:'正しい設計を最後まで選ぶ'}
] as const;
export function planExpeditionJourney(id:ExpeditionId,index:number,total=5){
 const expedition=EXPEDITIONS.find(item=>item.id===id);
 if(!expedition||total!==5||!Number.isSafeInteger(index)||index<0||index>=total)return null;
 return {id,enemy:expedition.enemy,title:expedition.title,tier:expedition.tier,
  current:index+1,total,steps:STEPS.map((step,i)=>({...step,order:i+1,done:i<index,active:i===index})),
  telegraph:`${expedition.tier} · ${STEPS[index].intent}`};
}
