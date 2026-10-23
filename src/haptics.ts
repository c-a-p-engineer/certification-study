/** Mobile haptics; web vibration is optional and silently unavailable on iOS/desktop. */
export type HapticMode='off'|'normal'|'overdrive';
export type HapticEvent='select'|'correct'|'wrong'|'combo'|'boss-hit'|'boss-win'|'rank'|'reward'|'start';
export const HAPTIC_KEY='cert-overdrive-haptics-v1';
export const DEFAULT_HAPTIC_MODE:HapticMode='normal';
export const HAPTIC_PATTERNS:Record<HapticEvent,readonly number[]>={
 select:[12],
 correct:[28,32,42],
 wrong:[105,65,110],
 combo:[25,30,35,30,70],
 'boss-hit':[42,20,85],
 'boss-win':[70,45,80,45,150],
 rank:[36,30,36,30,125],
 reward:[18,25,32,25,70],
 start:[35,35,45]
};
export function isHapticMode(x:unknown):x is HapticMode{return x==='off'||x==='normal'||x==='overdrive'}
export function readHapticMode():HapticMode{
 try{if(typeof localStorage==='undefined')return DEFAULT_HAPTIC_MODE;const x=localStorage.getItem(HAPTIC_KEY);return isHapticMode(x)?x:DEFAULT_HAPTIC_MODE}catch{return DEFAULT_HAPTIC_MODE}
}
export function writeHapticMode(mode:HapticMode):void{try{if(typeof localStorage!=='undefined')localStorage.setItem(HAPTIC_KEY,mode)}catch{}}
export function hapticPattern(event:HapticEvent,mode:HapticMode):number[]{
 if(mode==='off')return [];
 const base=[...HAPTIC_PATTERNS[event]];
 return mode==='overdrive'?base.map((t,i)=>i%2===0?Math.min(180,Math.round(t*1.45)):t):base;
}
export function triggerHaptic(event:HapticEvent,mode:HapticMode,reduced=false,exam=false):boolean{
 if(mode==='off'||reduced||(exam&&event!=='select'))return false;
 if(typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
 if(typeof navigator==='undefined'||typeof navigator.vibrate!=='function')return false;
 try{return Boolean(navigator.vibrate(hapticPattern(event,mode)))}catch{return false}
}
