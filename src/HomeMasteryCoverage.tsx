import React from 'react';
import {TOPICS,type TopicName,type MasteryEntry} from './mastery';
import type {StudyQuestion} from './StudyQuestionIntro';
import type {ReviewMap} from './studyScheduler';

const DOMAINS=['セキュリティ','耐障害性','パフォーマンス','コスト最適化'] as const;
/** Read-only mastery and question coverage; no session, grading or local storage mutation. */
export default React.memo(function HomeMasteryCoverage({questions,masteryMap,reviews}:{
 questions:readonly StudyQuestion[];
 masteryMap:Record<TopicName,MasteryEntry>;
 reviews:ReviewMap;
}){
 const DOMAIN_QUESTION_COUNTS=Object.fromEntries(DOMAINS.map(domain=>[domain,questions.filter(q=>q.domain===domain).length]));
 return <>
<section className="mastery-section"><h2>MASTERY <span>RADAR</span></h2><div className="mastery-grid">{TOPICS.map(topic=>{const x=masteryMap[topic.name];return <div key={topic.name} className="mastery-tile"><strong>{topic.name}</strong><span>定着候補 {x.retained} / 学習済 {x.seen}</span><div className="coverage-track"><div style={{width:`${x.seen?x.retained/x.seen*100:0}%`}}/></div><small>復習期限 {x.due} · 忘却回数 {x.lapses}</small></div>})}</div><details className="metric-method"><summary>定着度の判定基準</summary><p>3回以上の連続正解を定着候補として集計。合格確率ではありません。</p></details></section><section className="coverage-panel"><h2>QUEST BANK <span>EXPLORER</span></h2><div className="coverage-grid">{["セキュリティ","耐障害性","パフォーマンス","コスト最適化"].map(d=>{const total=DOMAIN_QUESTION_COUNTS[d]??0;const attempted=questions.filter(x=>x.domain===d&&reviews?.[x.id]).length;return <div className="coverage-tile" key={d}><strong>{d}</strong><span>{attempted} / {total} SEEN</span><div className="coverage-track"><div style={{width:`${total?attempted/total*100:0}%`}}/></div></div>})}</div></section>
 </>;
});
