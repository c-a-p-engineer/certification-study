/** Optional celebration intensity; always subordinate to motion-reduction preferences. */
export type VisualPower='balanced'|'overdrive';
export const VISUAL_POWER_KEY='cert-overdrive-visual-power-v1';
export function isVisualPower(value:unknown):value is VisualPower{return value==='balanced'||value==='overdrive'}
export function readVisualPower():VisualPower{
 try{if(typeof localStorage==='undefined')return 'balanced';const v=localStorage.getItem(VISUAL_POWER_KEY);return isVisualPower(v)?v:'balanced'}catch{return 'balanced'}
}
export function saveVisualPower(value:VisualPower):void{
 try{if(typeof localStorage!=='undefined')localStorage.setItem(VISUAL_POWER_KEY,value)}catch{}
}
