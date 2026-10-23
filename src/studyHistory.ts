/** Browser-local answer history. Date buckets are local calendar days, not UTC dates. */
export type ActivityDay={answered:number;correct:number};
export type ActivityHistory=Record<string,ActivityDay>;
export type HistoryProgress={answered:number;correct:number;daily?:{date:string;answered:number;correct:number};activity?:ActivityHistory};
export type ActivityWindow=7|30|90|'all';
export type HistoryPoint={date:string;answered:number;correct:number;cumulativeAnswered:number;cumulativeCorrect:number};
const dayPattern=/^(\d{4})-(\d{2})-(\d{2})$/;
const integer=(value:unknown):number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:0;
export function localDateKey(value:Date):string{
 return [value.getFullYear(),String(value.getMonth()+1).padStart(2,'0'),String(value.getDate()).padStart(2,'0')].join('-');
}
export function parseLocalDate(key:string):Date|null{
 const match=dayPattern.exec(key);
 if(!match)return null;
 const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
 return localDateKey(date)===key?date:null;
}
export function shiftLocalDate(day:string,offset:number):string{
 const date=parseLocalDate(day);
 if(!date)return day;
 date.setDate(date.getDate()+offset);
 return localDateKey(date);
}
export function normalizeActivity(source:unknown):ActivityHistory{
 if(!source||typeof source!=='object'||Array.isArray(source))return {};
 const cleaned:ActivityHistory={};
 for(const [date,raw] of Object.entries(source)){
  if(!parseLocalDate(date)||!raw||typeof raw!=='object'||Array.isArray(raw))continue;
  const item=raw as Partial<ActivityDay>;
  const answered=integer(item.answered),correct=Math.min(answered,integer(item.correct));
  if(answered>0)cleaned[date]={answered,correct};
 }
 return cleaned;
}
/** The legacy progress stores the last daily quest date; it cannot reveal earlier dates.
 * Restore that one *known* date, and leave all remaining answers unattributed.
 */
export function migrateActivity(progress:HistoryProgress):ActivityHistory{
 if(progress.activity!==undefined)return normalizeActivity(progress.activity);
 const daily=progress.daily;
 if(!daily||!parseLocalDate(daily.date))return {};
 const answered=Math.min(integer(progress.answered),integer(daily.answered));
 if(answered===0)return {};
 return {[daily.date]:{answered,correct:Math.min(answered,integer(progress.correct),integer(daily.correct))}};
}
export function recordDailyAnswer(history:ActivityHistory,day:string,correct:boolean):ActivityHistory{
 if(!parseLocalDate(day))return history;
 const record=history[day]??{answered:0,correct:0};
 return {...history,[day]:{answered:record.answered+1,correct:record.correct+(correct?1:0)}};
}
export function activitySummary(history:ActivityHistory,totalAnswered:number,totalCorrect:number,today=localDateKey(new Date())){
 const records=normalizeActivity(history);
 const keys=Object.keys(records).filter(day=>day<=today).sort();
 const loggedAnswered=keys.reduce((total,date)=>total+records[date].answered,0);
 const loggedCorrect=keys.reduce((total,date)=>total+records[date].correct,0);
 const dateSet=new Set(keys);
 let day=dateSet.has(today)?today:shiftLocalDate(today,-1);
 let streak=0;
 while(dateSet.has(day)){streak++;day=shiftLocalDate(day,-1)}
 let longestStreak=0,currentRun=0,previous='';
 for(const date of keys){
  currentRun=previous&&shiftLocalDate(previous,1)===date?currentRun+1:1;
  longestStreak=Math.max(longestStreak,currentRun);
  previous=date;
 }
 return {activeDays:keys.length,streak,longestStreak,firstDay:keys[0]??null,lastDay:keys[keys.length-1]??null,
  todayAnswered:records[today]?.answered??0,todayCorrect:records[today]?.correct??0,
  loggedAnswered,loggedCorrect,
  unattributedAnswered:Math.max(0,integer(totalAnswered)-loggedAnswered),
  unattributedCorrect:Math.max(0,integer(totalCorrect)-loggedCorrect),
  totalAnswered:integer(totalAnswered),totalCorrect:integer(totalCorrect)};
}
/** A day before logging began is unknown, NOT a zero. Only yield known-date spans. */
export function activitySeries(history:ActivityHistory,totalAnswered:number,totalCorrect:number,window:ActivityWindow=30,today=localDateKey(new Date())):HistoryPoint[]{
 const records=normalizeActivity(history);
 const stats=activitySummary(records,totalAnswered,totalCorrect,today);
 if(!stats.firstDay)return [];
 const windowStart=window==='all'?stats.firstDay:shiftLocalDate(today,1-window);
 const start=windowStart>stats.firstDay?windowStart:stats.firstDay;
 if(start>today)return [];
 let sumA=stats.unattributedAnswered, sumC=stats.unattributedCorrect;
 for(const [day,item] of Object.entries(records)){if(day<start){sumA+=item.answered;sumC+=item.correct}}
 const points:HistoryPoint[]=[];
 let day=start;
 for(let n=0;n<10000&&day<=today;n++,day=shiftLocalDate(day,1)){
  const current=records[day]??{answered:0,correct:0};
  sumA+=current.answered;sumC+=current.correct;
  points.push({date:day,answered:current.answered,correct:current.correct,cumulativeAnswered:sumA,cumulativeCorrect:sumC});
 }
 return points;
}
