import React from 'react';
import {ArrowRight,Trophy} from 'lucide-react';
import DailyContractBoard from './DailyContractBoard';
import HomeProgressSummary from './HomeProgressSummary';
import OfflineStatus from './OfflineStatus';

export type HomeDailyOverviewProps={
 uniqueCount:number;claimed:boolean;activeMission:boolean;
 contracts:React.ComponentProps<typeof DailyContractBoard>;
 stats:React.ComponentProps<typeof HomeProgressSummary>;
 onClaimDaily:()=>void;onStartMission:()=>void;
};
/** First-page learning evidence. Action callbacks are owned by App; no XP or storage mutation here. */
export default function HomeDailyOverview({uniqueCount,claimed,activeMission,contracts,stats,onClaimDaily,onStartMission}:HomeDailyOverviewProps){
 return <>
  <section className="daily-quest"><div className="daily-quest-header"><span>DAILY QUEST · 毎日コツコツ</span><strong>{Math.min(uniqueCount,5)} / 5 CLEAR</strong></div>{uniqueCount>=5&&<h2>DAILY QUEST COMPLETE!</h2>}<div className="daily-quest-track"><div style={{width:`${Math.min(uniqueCount,5)*20}%`}}/></div>{uniqueCount>=5&&!claimed?<button className="daily-claim" onClick={onClaimDaily}>DAILY CLEAR REWARD · +150 XP <Trophy size={18}/></button>:claimed?<strong className="daily-claimed">報酬受取済み · +150 XP</strong>:<button className="secondary-btn" onClick={onStartMission}>TODAY’S MISSION <ArrowRight size={17}/></button>}</section><DailyContractBoard {...contracts}/><HomeProgressSummary {...stats}/>
  <OfflineStatus activeMission={activeMission}/>
 </>;
}
