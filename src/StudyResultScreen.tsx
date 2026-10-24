import React from 'react';
import {ArrowRight,RotateCcw,Trophy} from 'lucide-react';
import type {MissionGrade} from './missionGrade';
import type {BossDomain,BossGrade} from './bossCampaign';
import {BOSSES} from './bossCampaign';
import type {EnemyCampaign,CampaignHit} from './enemyCampaign';
import type {ExpeditionResult} from './expeditions';
import {summarizeDailyFive} from './dailyFive';
import type {StudyQuestion} from './StudyQuestionIntro';
import {TermsPanel} from './StudyQuestionIntro';
import {DailyFiveFinish} from './DailyFiveBoard';
import ResultOverview from './ResultOverview';
import EnemyCampaignPanel from './EnemyCampaignPanel';
import MonsterArt from './MonsterArt';
import ExamReviewPanel from './ExamReviewPanel';

type BossResult={
 domain:BossDomain;victory:boolean;grade:BossGrade|null;award:number;
 firstClear:boolean;upgraded:boolean
};
export type StudyResultScreenProps={
 correct:number;total:number;examMode:boolean;grade:MissionGrade;
 bossMode:boolean;bossReport:BossResult|null;
 campaign:EnemyCampaign;attack:CampaignHit|null;
 expeditionActive:boolean;expeditionResult:ExpeditionResult|null;
 titleIds:readonly string[];relicIds:readonly string[];
 dailyFocus:boolean;dailySummary:ReturnType<typeof summarizeDailyFive>|null;
 questions:StudyQuestion[];answers:Record<string,number[]>;
 createPrompt:(question:StudyQuestion,selectedAnswers?:number[])=>string;
 onShowStatus:()=>void;onShowTitles:()=>void;onHome:()=>void;onMore:()=>void;onRetry:()=>void;
};
/** Display-only stage result. All reward allocation, exam scoring, and replay setup remain in App. */
export default React.memo(function StudyResultScreen({
 correct,total,examMode,grade,bossMode,bossReport,campaign,attack,expeditionActive,expeditionResult,
 titleIds,relicIds,dailyFocus,dailySummary,questions,answers,createPrompt,
 onShowStatus,onShowTitles,onHome,onMore,onRetry
}:StudyResultScreenProps){
 return <section className="result"><ResultOverview correct={correct} total={total} exam={examMode} grade={grade} onNextRank={onShowStatus}/>{!examMode&&!bossMode&&<EnemyCampaignPanel campaign={campaign} compact attack={attack}/>}{bossMode&&bossReport&&<div className={'od4-result-report '+(bossReport.victory?'':'od4-defeat')} role="status">
 <MonsterArt id={({'セキュリティ':'cerberus','耐障害性':'phoenix','パフォーマンス':'titan','コスト最適化':'leviathan'} as const)[bossReport.domain]} small defeated={bossReport.victory} hpRatio={bossReport.victory?0:1}/><Trophy size={37}/><div><strong>{bossReport.victory?'DOMAIN BOSS DOWN! · '+bossReport.grade:'BOSS SURVIVED · TRY AGAIN'}</strong>
 <span>{bossReport.domain} · {correct}/{total} 正解 {bossReport.victory?'· '+(bossReport.firstClear?'初討伐':bossReport.upgraded?'勲章更新':'討伐記録更新')+' · BONUS +'+bossReport.award+' XP':'· 7問以上の正解で討伐'}</span></div>
 </div>}
 {expeditionActive&&expeditionResult&&<div className="expedition-result" role="status"><Trophy size={21}/><strong>{expeditionResult.success?'EXPEDITION CLEAR':'EXPEDITION INCOMPLETE'} · {expeditionResult.rareUnlocked?'✦ RARE EMBLEM UNLOCKED':expeditionResult.firstClear?'初討伐達成':correct+'/5 正解'}</strong><span>2問以上の翌日以降の復習成功でレアエンブレム。追加XPはありません。</span></div>}
 {bossMode&&bossReport?.firstClear&&<div className="od4-relic-drop" role="status"><Trophy size={21}/> NEW RELIC UNLOCKED · {BOSSES.find(x=>x.domain===bossReport.domain)?.code} CORE</div>}
 <p>{examMode?`PRACTICE ACCURACY ${total?Math.round(correct/total*100):0}% · NOT AN AWS SCALED SCORE`:bossMode&&bossReport?.victory?'BOSS DEFEATED!':correct===total?'FLAWLESS VICTORY!':'REVIEW. RETRY. OVERDRIVE.'}</p>{examMode&&(titleIds.length>0||relicIds.length>0)&&<div className="exam-earned-titles" role="status"><Trophy size={20}/><span>称号 {titleIds.length}個 · レリック {relicIds.length}個を解放</span><button type="button" onClick={onShowTitles}>獲得称号を見る <ArrowRight size={16}/></button></div>}{dailyFocus&&dailySummary&&<DailyFiveFinish correct={dailySummary.correct} total={dailySummary.answered} missed={dailySummary.missed.length} domains={dailySummary.uniqueDomains} due={dailySummary.observedDue} newConcepts={dailySummary.newConcepts} nextDay={dailySummary.suggestedDay} onExit={onHome} onMore={onMore}/>}{examMode&&<ExamReviewPanel questions={questions} answers={answers} createPrompt={createPrompt} renderTerms={item=><TermsPanel question={item}/>}/>} {!dailyFocus&&<div className="hero-actions"><button className="primary-btn" onClick={onRetry}>RETRY MISSION <RotateCcw size={18}/></button><button className="secondary-btn" onClick={onHome}>BACK TO BASE</button></div>}</section>;
});
