/** Equipable achievement titles, independent from rank progression or AWS exam scores. */
export type TitleProgress={
 xp:number;answered:number;correct:number;best:number;
 reviews:Record<string,{streak:number;dueAt:number;lapses:number}>;
 activity?:Record<string,{answered:number;correct:number}>;
 domains?:Record<string,{answered:number;correct:number}>;
};
export type TitleStats={xp:number;answered:number;correct:number;best:number;days:number;streak:number;seen:number;retained:number;domains:Record<string,{answered:number;correct:number}>};
export type Title={id:string;name:string;description:string;unlocked:boolean};
type Definition={id:string;name:string;description:string;requires:(x:TitleStats)=>boolean};
const domain=(name:string,needed:number)=>(p:TitleStats)=>(p.domains[name]?.correct??0)>=needed;
const titles:Definition[]=[
 {id:'starter',name:'雲を見上げる者',description:'最初から使用可能',requires:()=>true},
 {id:'first-answer',name:'初陣のアーキテクト',description:'1問回答',requires:p=>p.answered>=1},
 {id:'spark',name:'知識の着火者',description:'10問回答',requires:p=>p.answered>=10},
 {id:'apprentice',name:'設計図の見習い',description:'30問回答',requires:p=>p.answered>=30},
 {id:'half-centurion',name:'五十問の突破者',description:'50問回答',requires:p=>p.answered>=50},
 {id:'centurion',name:'百問斬りの勇者',description:'100問回答',requires:p=>p.answered>=100},
 {id:'cartographer',name:'雲界の地図師',description:'200問回答',requires:p=>p.answered>=200},
 {id:'architect',name:'千の構成を描く者',description:'500問回答',requires:p=>p.answered>=500},
 {id:'legend-explorer',name:'果てなき試練の覇者',description:'1,000問回答',requires:p=>p.answered>=1000},
 {id:'combo-3',name:'連鎖の火種',description:'3連続正解',requires:p=>p.best>=3},
 {id:'combo-5',name:'連撃の使い手',description:'5連続正解',requires:p=>p.best>=5},
 {id:'combo-10',name:'十連鎖の破壊者',description:'10連続正解',requires:p=>p.best>=10},
 {id:'combo-20',name:'絶対零落のコンボ王',description:'20連続正解',requires:p=>p.best>=20},
 {id:'day-1',name:'今日から始まる伝説',description:'学習日1日',requires:p=>p.days>=1},
 {id:'day-7',name:'七日を越えし者',description:'学習日7日',requires:p=>p.days>=7},
 {id:'day-30',name:'一月を貫く修練者',description:'学習日30日',requires:p=>p.days>=30},
 {id:'day-50',name:'五十夜の探究者',description:'学習日50日',requires:p=>p.days>=50},
 {id:'streak-3',name:'三日三晩の修行僧',description:'3日連続学習',requires:p=>p.streak>=3},
 {id:'streak-7',name:'七連勤の知識魔神',description:'7日連続学習',requires:p=>p.streak>=7},
 {id:'streak-14',name:'不眠不休の雲使い',description:'14日連続学習',requires:p=>p.streak>=14},
 {id:'security-10',name:'IAMの門番',description:'セキュリティ10問正解',requires:domain('セキュリティ',10)},
 {id:'security-40',name:'ゼロトラストの守護神',description:'セキュリティ40問正解',requires:domain('セキュリティ',40)},
 {id:'resilience-10',name:'フェイルオーバーの番人',description:'耐障害性10問正解',requires:domain('耐障害性',10)},
 {id:'resilience-40',name:'不死鳥の復旧術師',description:'耐障害性40問正解',requires:domain('耐障害性',40)},
 {id:'performance-10',name:'レイテンシーの狩人',description:'パフォーマンス10問正解',requires:domain('パフォーマンス',10)},
 {id:'performance-40',name:'超低遅延の支配者',description:'パフォーマンス40問正解',requires:domain('パフォーマンス',40)},
 {id:'cost-10',name:'予算を守る錬金術師',description:'コスト最適化10問正解',requires:domain('コスト最適化',10)},
 {id:'cost-40',name:'請求書を砕く者',description:'コスト最適化40問正解',requires:domain('コスト最適化',40)},
 {id:'accuracy-80',name:'精密設計の職人',description:'50問以上で正答率80%以上',requires:p=>p.answered>=50&&p.correct/p.answered>=.8},
 {id:'accuracy-90',name:'九割の選択眼',description:'100問以上で正答率90%以上',requires:p=>p.answered>=100&&p.correct/p.answered>=.9},
 {id:'explore-50',name:'未知のサービス探索者',description:'異なる50問に挑戦',requires:p=>p.seen>=50},
 {id:'explore-200',name:'問題庫の解放者',description:'異なる200問に挑戦',requires:p=>p.seen>=200},
 {id:'master-30',name:'記憶の鍛冶師',description:'30問が3連続正解',requires:p=>p.retained>=30},
 {id:'xp-20k',name:'二万XPの風を切る者',description:'20,000 XP達成',requires:p=>p.xp>=20000},
 {id:'xp-100k',name:'雲上の超越者',description:'100,000 XP達成',requires:p=>p.xp>=100000}
];
export const DEFAULT_TITLE_ID='starter';
export const EQUIPPED_TITLE_KEY='certification-overdrive-equipped-title-v1';
export function earnedTitles(stats:TitleStats):Title[]{return titles.map(x=>({id:x.id,name:x.name,description:x.description,unlocked:x.requires(stats)}))}
export function titleStats(progress:TitleProgress,days:number,streak:number):TitleStats{
 const reviews=Object.values(progress.reviews??{});
 return {xp:progress.xp,answered:progress.answered,correct:progress.correct,best:progress.best,days,streak,seen:reviews.length,retained:reviews.filter(x=>x.streak>=3).length,domains:progress.domains??{}};
}
export function validEquippedTitle(equipped:unknown,all:Title[]):string{
 return typeof equipped==='string'&&all.some(x=>x.id===equipped&&x.unlocked)?equipped:DEFAULT_TITLE_ID;
}
export function readEquippedTitle():string{
 try{return typeof localStorage==='undefined'?DEFAULT_TITLE_ID:localStorage.getItem(EQUIPPED_TITLE_KEY)??DEFAULT_TITLE_ID}catch{return DEFAULT_TITLE_ID}
}
export function saveEquippedTitle(id:string):void{
 try{if(typeof localStorage!=='undefined')localStorage.setItem(EQUIPPED_TITLE_KEY,id)}catch{}
}
