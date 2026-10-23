/** Reading comfort preference; local-only and independent from animation reduction. */
export type TextScale='standard'|'large'|'extra';
export const TEXT_SCALE_KEY='cert-overdrive-text-scale-v1';
export const TEXT_SCALES=['standard','large','extra'] as const;
export function isTextScale(value:unknown):value is TextScale{return value==='standard'||value==='large'||value==='extra'}
export function readTextScale():TextScale{
 try{if(typeof localStorage==='undefined')return 'standard';const value=localStorage.getItem(TEXT_SCALE_KEY);return isTextScale(value)?value:'standard'}catch{return 'standard'}
}
export function saveTextScale(value:TextScale):void{
 try{if(typeof localStorage!=='undefined')localStorage.setItem(TEXT_SCALE_KEY,value)}catch{}
}
export function textScaleClass(value:TextScale):string{return value==='standard'?'':'reading-'+value}
