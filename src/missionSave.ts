/** Local-only persisted study run, kept separate from timed exam snapshots. */
export const MISSION_SAVE_KEY='cert-overdrive-mission-save-v1';
export type MissionSave={
 version:1;
 ids:string[];
 index:number;
 selected:number|null;
 multiChoices:number[];
 choiceOrder:number[];
 answers:Record<string,number[]>;
 session:{correct:number;total:number};
 combo:number;
 weak:boolean;
 boss:boolean;
 scenario?:boolean;
 due:boolean;
 showChoices:boolean;
 reflection:string;
 savedAt:number;
};
export function isMissionSave(value:unknown):value is MissionSave{
 if(!value||typeof value!=='object')return false;
 const x=value as Partial<MissionSave>;
 if(x.version!==1||!Array.isArray(x.ids)||x.ids.length<1||x.ids.length>1000||x.ids.some(id=>typeof id!=='string'))return false;
 if(typeof x.index!=='number'||!Number.isInteger(x.index)||x.index<0||x.index>=x.ids.length)return false;
 if(x.selected!==null&&(!Number.isInteger(x.selected)||x.selected!< -2))return false;
 if(!Array.isArray(x.multiChoices)||!Array.isArray(x.choiceOrder)||!x.multiChoices.every(Number.isInteger)||!x.choiceOrder.every(Number.isInteger))return false;
 if(!x.answers||typeof x.answers!=='object'||Array.isArray(x.answers))return false;
 if(!x.session||!Number.isInteger(x.session.correct)||!Number.isInteger(x.session.total))return false;
 if(!Number.isInteger(x.combo)||typeof x.weak!=='boolean'||typeof x.boss!=='boolean'||(x.scenario!==undefined&&typeof x.scenario!=='boolean')||typeof x.due!=='boolean'||typeof x.showChoices!=='boolean'||typeof x.reflection!=='string'||!Number.isFinite(x.savedAt))return false;
 return true;
}
export function readMissionSave():MissionSave|null{
 try{return typeof localStorage==='undefined'?null:(()=>{const data=JSON.parse(localStorage.getItem(MISSION_SAVE_KEY)||'null');return isMissionSave(data)?data:null})()}catch{return null}
}
export function writeMissionSave(value:MissionSave):void{
 try{localStorage.setItem(MISSION_SAVE_KEY,JSON.stringify(value))}catch{/* private mode or quota */}
}
export function clearMissionSave():void{try{localStorage.removeItem(MISSION_SAVE_KEY)}catch{}}
export function restoredMissionIsValid(value:MissionSave,options:readonly string[]):boolean{
 return options.length>=4&&value.choiceOrder.length===options.length&&new Set(value.choiceOrder).size===options.length&&value.choiceOrder.every(n=>n>=0&&n<options.length)&&value.multiChoices.every(n=>n>=0&&n<options.length)&&(!value.answers[value.ids[value.index]]||Array.isArray(value.answers[value.ids[value.index]]));
}
