/** Reading comfort preference; local-only and independent from animation reduction. */
export type TextScale='compact'|'small'|'standard'|'large'|'extra';
export const TEXT_SCALE_KEY='cert-overdrive-text-scale-v1';
export const TEXT_SCALES=['compact','small','standard','large','extra'] as const;
export function isTextScale(value:unknown):value is TextScale{return TEXT_SCALES.some(s=>s===value)}
export function readTextScale():TextScale{
 try{if(typeof localStorage==='undefined')return 'standard';const value=localStorage.getItem(TEXT_SCALE_KEY);return isTextScale(value)?value:'standard'}catch{return 'standard'}
}
export function saveTextScale(value:TextScale):void{
 try{if(typeof localStorage!=='undefined')localStorage.setItem(TEXT_SCALE_KEY,value)}catch{}
}
export function textScaleClass(value:TextScale):string{return value==='standard'?'':'reading-'+value}
/** Stepwise access from the quiz; never make text smaller than the explicit 'compact' preference. */
export function shiftTextScale(value:TextScale,direction:-1|1):TextScale{
 const index=TEXT_SCALES.indexOf(value);
 return TEXT_SCALES[Math.max(0,Math.min(TEXT_SCALES.length-1,index+direction))];
}
