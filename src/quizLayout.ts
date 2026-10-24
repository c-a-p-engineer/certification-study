/** Independent browser-local mobile reading layout preference. */
export type QuizLayout='compact'|'detailed'|'focus';
export const QUIZ_LAYOUT_KEY='cert-overdrive-quiz-layout-v1';
export function isQuizLayout(value:unknown):value is QuizLayout{return value==='compact'||value==='detailed'||value==='focus'}
export function defaultQuizLayout(isNarrow:boolean):QuizLayout{return isNarrow?'compact':'detailed'}
export function readQuizLayout():QuizLayout{
 try{
  const saved=typeof localStorage==='undefined'?null:localStorage.getItem(QUIZ_LAYOUT_KEY);
  if(isQuizLayout(saved))return saved;
  return defaultQuizLayout(typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(max-width: 700px)').matches);
 }catch{return 'detailed'}
}
export function saveQuizLayout(value:QuizLayout):void{
 try{if(typeof localStorage!=='undefined')localStorage.setItem(QUIZ_LAYOUT_KEY,value)}catch{}
}
