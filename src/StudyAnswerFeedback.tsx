import React from 'react';
import {ArrowRight,Trophy,Zap} from 'lucide-react';
import type {StudyQuestion} from './StudyQuestionIntro';
import {expandTerms} from './glossary';
import QuestionFeedback from './QuestionFeedback';

/** Practice feedback display only; graded actions and saved state remain in App/reducer. */
export type StudyAnswerFeedbackProps={
 question:StudyQuestion;correct:boolean;
 earnedXP:number;retentionBonus:number;combo:number;
 newTitleIds:readonly string[];newRelicIds:readonly string[];
 titles:readonly {id:string;name:string}[];relics:readonly {id:string;name:string}[];
 reflection:string;prompt:string;isLast:boolean;
 onEquipTitle:(id:string)=>void;
 onReflect:(quality:'again'|'unsure'|'good')=>void;
 onCopyPrompt:()=>void;onNext:()=>void;
};
export default React.memo(function StudyAnswerFeedback({question,correct,earnedXP,retentionBonus,combo,newTitleIds,newRelicIds,titles,relics,reflection,prompt,isLast,onEquipTitle,onReflect,onCopyPrompt,onNext}:StudyAnswerFeedbackProps){
 return <div className="explanation"><div className={`feedback ${correct?'success':''}`}>{correct?'✦ CORRECT':'◆ REVIEW'}</div><div className="xp-award" aria-label={"今回の獲得経験値 "+earnedXP+" XP"}><Zap size={22} fill="currentColor"/><strong>+{earnedXP} XP</strong>{retentionBonus>0&&<span className="retention-bonus">翌日以降の復習成功 +{retentionBonus} XP</span>}{combo>=2&&<span>{combo} COMBO · x{(1+Math.min(combo,10)*.2).toFixed(1)}</span>}</div>{newTitleIds.length>0&&<div className="title-drop" role="status" aria-live="polite"><div><Trophy size={21}/><span><small>TITLE UNLOCKED{newTitleIds.length>1?' · +'+(newTitleIds.length-1):''}</small><strong>{titles.find(t=>t.id===newTitleIds[0])?.name}</strong></span></div><button type="button" onClick={()=>{onEquipTitle(newTitleIds[0])}}>装備する <ArrowRight size={15}/></button></div>}{newRelicIds.length>0&&<div className="od4-relic-drop" role="status" aria-live="polite"><Trophy size={20}/> RELIC UNLOCKED · {relics.find(x=>x.id===newRelicIds[0])?.name}</div>}<p className="expanded-explanation">{expandTerms(question.explanation)}</p>{question.distractorReasons&&<details className="choice-reasons"><summary>選択肢ごとの解説を表示</summary>{question.choices.map((choice,i)=><div key={i}><strong>{'ABCDEFGH'[i]}. {choice}</strong><p>{expandTerms(question.distractorReasons![i])}</p></div>)}</details>}<div className="reflection"><strong>記憶チェック</strong><div><button disabled={reflection!==''} onClick={()=>onReflect('again')} title="翌日復習">忘れた</button><button disabled={reflection!==''} onClick={()=>onReflect('unsure')} title="翌日確認">微妙</button><button disabled={reflection!==''} onClick={()=>onReflect('good')}>理解できた</button></div>{reflection&&<small role="status">復習予定を更新しました</small>}</div><a href={question.reference} target="_blank" rel="noreferrer">AWS公式ドキュメント ↗</a><div className="ask-gpt"><a href={`https://chatgpt.com/?prompt=${encodeURIComponent(prompt)}`} target="_blank" rel="noopener noreferrer">ChatGPTに聞く ↗</a><button type="button" onClick={()=>{onCopyPrompt()}}>質問文をコピー</button></div><QuestionFeedback id={question.id} reviewedAt={question.reviewedAt}/><button className="primary-btn next-btn" onClick={onNext}>{isLast?'VIEW RESULTS':'NEXT QUESTION'} <ArrowRight size={18}/></button></div>;
});
