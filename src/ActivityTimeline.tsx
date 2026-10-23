import React,{useState} from 'react';
import {Activity,CalendarDays,ChevronLeft,ChevronRight,Flame} from 'lucide-react';
import {activitySeries,activitySummary,localDateKey,type ActivityHistory,type ActivityWindow} from './studyHistory.ts';
import './activityTimeline.css';

type ViewMode='daily'|'cumulative';
type ChartPoint={date:string;answered:number;correct:number;cumulativeAnswered:number;cumulativeCorrect:number};
const formatDate=(date:string)=>{const [y,m,d]=date.split('-');return y+'/'+m+'/'+d};
const number=(n:number)=>n.toLocaleString('ja-JP');
const formatDayLabel=(date:string)=>{const [,m,d]=date.split('-');return Number(m)+'/'+Number(d)};
export default function ActivityTimeline({history,totalAnswered,totalCorrect}:{history:ActivityHistory;totalAnswered:number;totalCorrect:number}){
 const [windowDays,setWindowDays]=useState<ActivityWindow>(30);
 const [mode,setMode]=useState<ViewMode>('daily');
 const [focusDate,setFocusDate]=useState<string|null>(null);
 const today=localDateKey(new Date());
 const summary=activitySummary(history,totalAnswered,totalCorrect,today);
 const points=activitySeries(history,totalAnswered,totalCorrect,windowDays,today);
 const index=Math.max(0,points.findIndex(point=>point.date===(focusDate??points[points.length-1]?.date)));
 const focused=points[index]??points[points.length-1];
 const getA=(point:ChartPoint)=>mode==='daily'?point.answered:point.cumulativeAnswered;
 const getC=(point:ChartPoint)=>mode==='daily'?point.correct:point.cumulativeCorrect;
 const allY=points.flatMap(point=>[getA(point),getC(point)]);
 const high=Math.max(1,...allY);
 const low=mode==='daily'?0:Math.max(0,Math.min(...allY,0)+0);
 const minimum=mode==='daily'?0:(allY.length?Math.max(0,Math.floor((Math.min(...allY)-Math.max(8,(high-Math.min(...allY))*.5))/10)*10):0);
 const maximum=Math.max(minimum+1,high+Math.max(1,Math.ceil((high-minimum)*.12)));
 const VIEW_W=680,VIEW_H=228,LEFT=47,RIGHT=13,TOP=15,BOTTOM=37;
 const width=VIEW_W-LEFT-RIGHT,height=VIEW_H-TOP-BOTTOM;
 const x=(position:number)=>LEFT+(points.length===1?width/2:position/(points.length-1)*width);
 const y=(value:number)=>TOP+height-(value-minimum)/(maximum-minimum)*height;
 const path=(get:(point:ChartPoint)=>number)=>points.map((point,i)=>(i===0?'M':'L')+x(i).toFixed(1)+' '+y(get(point)).toFixed(1)).join(' ');
 const stepLabels=[0,1,2,3,4].map(i=>minimum+(maximum-minimum)*i/4);
 const ticks=[0,Math.floor((points.length-1)/2),points.length-1].filter((v,i,a)=>a.indexOf(v)===i);
 function changeWindow(value:ActivityWindow){setWindowDays(value);setFocusDate(null)}
 return <section className="activity-panel" aria-labelledby="activity-title">
  <div className="activity-header"><div className="activity-title"><Activity size={23}/><h2 id="activity-title">LEARNING TIMELINE</h2></div><div className="activity-window" role="group" aria-label="表示期間">{([7,30,90,'all'] as const).map(value=><button key={value} type="button" className={windowDays===value?'active':''} aria-pressed={windowDays===value} onClick={()=>changeWindow(value)}>{value==='all'?'全期間':value+'日'}</button>)}</div></div>
  <div className="activity-kpis">
   <div><span>累計回答</span><strong>{number(summary.totalAnswered)}<small>問</small></strong></div>
   <div><span>活動日数</span><strong>{summary.activeDays}<small>日</small></strong></div>
   <div><span><Flame size={15}/> 連続学習</span><strong>{summary.streak}<small>日</small></strong></div>
   <div><span><CalendarDays size={15}/> 今日</span><strong>{summary.todayAnswered}<small>問</small></strong></div>
  </div>
  <div className="activity-chart-controls"><div className="activity-modes" role="group" aria-label="グラフ表示形式"><button aria-pressed={mode==='daily'} className={mode==='daily'?'active':''} onClick={()=>setMode('daily')}>日別</button><button aria-pressed={mode==='cumulative'} className={mode==='cumulative'?'active':''} onClick={()=>setMode('cumulative')}>累計</button></div><div className="activity-legend"><span className="total">回答数</span><span className="correct">正解数</span></div></div>
  {points.length?<>
   <svg className="activity-chart" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={mode==='daily'?'日付ごとの回答数と正解数の折れ線グラフ':'日付ごとの累計回答数と累計正解数の折れ線グラフ'}>
    <defs><linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#77eff7" stopOpacity=".22"/><stop offset="100%" stopColor="#77eff7" stopOpacity="0"/></linearGradient></defs>
    {stepLabels.map((value,i)=><g key={i}><line x1={LEFT} x2={VIEW_W-RIGHT} y1={y(value)} y2={y(value)} className="activity-grid-line"/><text className="activity-y-label" x={LEFT-9} y={y(value)+4} textAnchor="end">{number(Math.round(value))}</text></g>)}
    {ticks.map(index=><text className="activity-x-label" key={index} x={x(index)} y={VIEW_H-12} textAnchor={index===0?'start':index===points.length-1?'end':'middle'}>{formatDayLabel(points[index].date)}</text>)}
    {points.length>1&&<path d={path(getA)+` L ${x(points.length-1).toFixed(1)} ${(TOP+height).toFixed(1)} L ${x(0).toFixed(1)} ${(TOP+height).toFixed(1)} Z`} fill="url(#activity-fill)"/>}
    <path d={path(getA)} className="activity-answer-line" fill="none"/>
    <path d={path(getC)} className="activity-correct-line" fill="none"/>
    {points.length===1&&<circle cx={x(0)} cy={y(getA(points[0]))} r="6" className="activity-answer-dot"/>}
    {focused&&<><line x1={x(index)} x2={x(index)} y1={TOP} y2={TOP+height} className="activity-focus-line"/><circle cx={x(index)} cy={y(getA(focused))} r="7" className="activity-answer-dot"/><circle cx={x(index)} cy={y(getC(focused))} r="5" className="activity-correct-dot"/></>}
   </svg>
   <div className="activity-inspector">
    <button aria-label="前の日を表示" disabled={index===0} onClick={()=>setFocusDate(points[index-1].date)}><ChevronLeft size={21}/></button>
    <div className="activity-point-info" aria-live="polite"><strong>{formatDate(focused.date)}</strong><span>{mode==='daily'?number(focused.answered)+'問回答 · '+number(focused.correct)+'問正解':number(focused.cumulativeAnswered)+'問回答 · '+number(focused.cumulativeCorrect)+'問正解'}</span></div>
    <button aria-label="次の日を表示" disabled={index===points.length-1} onClick={()=>setFocusDate(points[index+1].date)}><ChevronRight size={21}/></button>
   </div>
   <input className="activity-date-scrubber" aria-label="日付を選択" type="range" min={0} max={Math.max(0,points.length-1)} step="1" value={index} disabled={points.length===1} onChange={e=>setFocusDate(points[Number(e.target.value)].date)}/>
  </>:<div className="activity-empty"><CalendarDays size={28}/><strong>日別データはこれから記録します</strong><span>次の問題に答えると、回答数がこのグラフに追加されます。</span></div>}
  {summary.unattributedAnswered>0&&<p className="activity-legacy">日付の分からない過去の{number(summary.unattributedAnswered)}問は累計に含めています。日別グラフには割り振っていません。</p>}
  {summary.firstDay&&<p className="activity-since">日別記録の開始：{formatDate(summary.firstDay)} · このブラウザのローカルデータ</p>}
 </section>;
}
