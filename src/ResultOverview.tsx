import React from 'react';
import {ArrowRight,Trophy} from 'lucide-react';
import type {MissionGrade} from './missionGrade';

/** Read-only practice/exam result summary. Does not write XP, grades or localStorage. */
export default function ResultOverview({correct,total,exam,grade,onNextRank}:{correct:number;total:number;exam:boolean;grade:MissionGrade;onNextRank:()=>void}){
 return <>
  <Trophy size={66} className="result-trophy"/>
  <h1>STAGE <span className="gradient-text">CLEAR!</span></h1>
  <div className="result-score">{correct} <span>/ {total} CORRECT</span></div>
  {!exam&&<div className="clear-judgement" role="group" aria-label="今回のミッション評価">
   <div className={'clear-grade grade-'+grade.letter}>{grade.letter}</div>
   <div className="clear-grade-details"><span>MISSION RATING · {grade.percent}%</span><strong>{grade.name}</strong></div>
   <button onClick={onNextRank}>NEXT RANK <ArrowRight size={16}/></button>
  </div>}
 </>;
}
