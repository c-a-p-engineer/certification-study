import React from 'react';
import {Flame} from 'lucide-react';
import {shiftTextScale,TEXT_SCALES,type TextScale} from './readability';
import type {QuizLayout} from './quizLayout';

export type QuizStageHeaderProps={
 examMode:boolean;timeLeft:number;bossMode:boolean;expeditionMode:boolean;caseMode:boolean;
 dailyFocus:boolean;retentionMode:boolean;adaptiveMode:boolean;
 index:number;total:number;combo:number;quizLayout:QuizLayout;textScale:TextScale;
 onHome:()=>void;onTextScale:(value:TextScale)=>void;onQuizLayout:(value:QuizLayout)=>void;
};
/** Quiz header + accessible reader controls. The parent owns mode transitions and persistence. */
export default React.memo(function QuizStageHeader({examMode,timeLeft,bossMode,expeditionMode,caseMode,dailyFocus,retentionMode,adaptiveMode,index,total,combo,quizLayout,textScale,onHome,onTextScale,onQuizLayout}:QuizStageHeaderProps){
 return <div className="quiz-top"><button className="back" onClick={onHome}>← DASHBOARD</button>{examMode&&<span className={`exam-clock ${timeLeft<=600?"urgent":""}`} role="timer" aria-label="模擬演習の残り時間">{String(Math.floor(timeLeft/3600)).padStart(2,"0")}:{String(Math.floor(timeLeft%3600/60)).padStart(2,"0")}:{String(timeLeft%60).padStart(2,"0")}</span>}<div className="quiz-stage">{examMode?"EXAM TRIAL":bossMode?"BOSS RUSH":expeditionMode?"EXPEDITION":caseMode?"CASE FILES":dailyFocus?"DAILY FIVE":retentionMode?"RECALL MICRO RAID":adaptiveMode?"SMART QUEST":"MISSION"} {String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}</div>{quizLayout==='detailed'&&!examMode&&<div className="combo"><Flame size={17}/> {combo} COMBO</div>}
 <div className="cq-controls" role="group" aria-label="文字とクイズ画面の調整">
  <button type="button" title="文字を小さくする" aria-label="文字を一段階小さくする" onClick={()=>onTextScale(shiftTextScale(textScale,-1))} disabled={textScale===TEXT_SCALES[0]}>A−</button>
  <span className="cq-scale-indicator" aria-live="polite">{({'compact':'最小','small':'小さめ','standard':'標準','large':'大きく','extra':'特大'} as const)[textScale]}</span>
  <button type="button" title="文字を大きくする" aria-label="文字を一段階大きくする" onClick={()=>onTextScale(shiftTextScale(textScale,1))} disabled={textScale===TEXT_SCALES[TEXT_SCALES.length-1]}>A＋</button>
  <button type="button" className="cq-layout-toggle" aria-pressed={quizLayout==='compact'} aria-label={quizLayout==='compact'?'詳細レイアウトに切り替える':'省スペース表示に切り替える'} onClick={()=>onQuizLayout(quizLayout==='compact'?'detailed':'compact')}>{quizLayout==='compact'?'詳細':'省スペース'}</button>
  <button type="button" className="cq-focus-toggle" aria-pressed={quizLayout==='focus'} aria-label={quizLayout==='focus'?'モンスター表示に戻す':'問題と回答を優先する集中表示'} onClick={()=>onQuizLayout(quizLayout==='focus'?'compact':'focus')}>{quizLayout==='focus'?'戦闘表示':'集中'}</button>
 </div></div>;
});
