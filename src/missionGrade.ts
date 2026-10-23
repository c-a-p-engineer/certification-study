/** Practice-only mission report; not an AWS scaled score or pass/fail prediction. */
export type MissionGrade={letter:'S'|'A'|'B'|'C'|'D'|'—';name:string;percent:number};
export function missionGrade(correct:number,total:number):MissionGrade{
 if(!Number.isFinite(total)||total<=0)return {letter:'—',name:'未採点',percent:0};
 const c=Number.isFinite(correct)?Math.max(0,Math.min(total,Math.round(correct))):0;
 const percent=Math.round(c/total*100);
 if(percent>=95&&total>=5)return {letter:'S',name:'PERFECT RUN',percent};
 if(percent>=85)return {letter:'A',name:'SHARP THINKER',percent};
 if(percent>=70)return {letter:'B',name:'STRONG BUILD',percent};
 if(percent>=50)return {letter:'C',name:'KEEP BUILDING',percent};
 return {letter:'D',name:'RETRY TO GROW',percent};
}
export function comboMilestone(combo:number):boolean{
 return Number.isInteger(combo)&&combo>0&&(combo===3||combo===5||combo===10||(combo>10&&combo%10===0));
}
