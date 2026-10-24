import React from 'react';
import {Flame} from 'lucide-react';
import CompactQuizHUD from './CompactQuizHUD';
import BossBattleHUD from './BossBattleHUD';
import EnemyCampaignPanel from './EnemyCampaignPanel';
import {ENEMIES,type EnemyCampaign,type CampaignHit} from './enemyCampaign.ts';
import type {BossDomain} from './bossCampaign.ts';
import type {QuizLayout} from './quizLayout.ts';

/** Pure quiz combat display; grading and saved state are passed in, never changed here. */
export default function QuizCombatStatus({quizLayout,examMode,bossMode,bossDomain,combo,session,enemyCampaign,campaignHit,poolLength}:{
 quizLayout:QuizLayout;examMode:boolean;bossMode:boolean;bossDomain:BossDomain|null;combo:number;
 session:{correct:number};enemyCampaign:EnemyCampaign;campaignHit:CampaignHit|null;poolLength:number;
}){
 return <>{quizLayout==='focus'&&!examMode?<div className="focus-battle-line" aria-label="戦闘状況"><span>{bossMode?'BOSS':'ENEMY'} · {bossMode?bossDomain:ENEMIES[enemyCampaign.stageIndex].short}</span><strong>{combo} COMBO · {bossMode?session.correct+'/'+poolLength:enemyCampaign.hp+' HP'}</strong></div>:quizLayout==='compact'&&!examMode?<CompactQuizHUD campaign={enemyCampaign} attack={campaignHit} combo={combo} bossDomain={bossMode?bossDomain:null} correct={session.correct} total={poolLength}/>:bossMode&&bossDomain?<BossBattleHUD domain={bossDomain} correct={session.correct} total={poolLength} combo={combo}/>:!examMode?<EnemyCampaignPanel campaign={enemyCampaign} compact attack={campaignHit}/>:null}{!examMode&&quizLayout==='detailed'&&<div className={'fever-meter '+(combo>=5?'charged':'')}><div className="fever-label"><Flame size={17}/><strong>{combo>=10?'MAXIMUM OVERDRIVE':combo>=5?'HYPER OVERDRIVE':combo>=3?'IGNITION':'FEVER CHARGE'}</strong><span>{Math.min(combo,10)} / 10</span></div><div className="fever-track" role="progressbar" aria-label="コンボエネルギー" aria-valuemin={0} aria-valuemax={10} aria-valuenow={Math.min(combo,10)}><div style={{width:Math.min(combo,10)*10+'%'}}/></div><div className="fever-milestones" aria-hidden="true">{[3,5,10].map(step=><span key={step} className={combo>=step?'achieved':''}><i/>{step}</span>)}</div></div>}</>;
}
