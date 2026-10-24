/** Local-only reading aid; does not rewrite question text or answer data. */
export const READING_GUIDE_KEY='cert-overdrive-reading-guide-v1';
export function readReadingGuide():boolean{
 try{return typeof localStorage!=='undefined'&&localStorage.getItem(READING_GUIDE_KEY)==='on'}catch{return false}
}
export function saveReadingGuide(enabled:boolean):void{
 try{if(typeof localStorage!=='undefined')localStorage.setItem(READING_GUIDE_KEY,enabled?'on':'off')}catch{}
}
/** Retain punctuation and whitespace exactly; visual groups must reconstruct the authored source. */
export function splitReadingSentences(question:string):string[]{
 if(!question)return [];
 return question.match(/[^。！？!?]*[。！？!?]+|[^。！？!?]+$/gu)??[question];
}
