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

/** A browser's true return value only means the request was accepted, not that the motor moved. */
export type HapticTestResult={
 status:'accepted'|'rejected'|'unsupported'|'reduced'|'disabled'|'error';
 message:string;
 hasGesture:boolean|null;
};
export function getHapticEnvironment(){
 const apiAvailable=typeof navigator!=='undefined'&&typeof navigator.vibrate==='function';
 const systemReducedMotion=typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const hasGesture=typeof navigator!=='undefined'&&navigator.userActivation?navigator.userActivation.hasBeenActive:null;
 const secureContext=typeof window!=='undefined'&&typeof window.isSecureContext==='boolean'?window.isSecureContext:null;
 return {apiAvailable,systemReducedMotion,hasGesture,secureContext};
}
/** Call synchronously inside the user's test-button click handler (not inside a promise). */
export function testHapticDevice(mode:HapticMode,reduced=false):HapticTestResult{
 const environment=getHapticEnvironment();
 const hasGesture=environment.hasGesture;
 if(mode==='off')return {status:'disabled',message:'振動設定がOFFです。NORMALまたはOVERDRIVEを選択してください。',hasGesture};
 if(reduced||environment.systemReducedMotion)return {status:'reduced',message:'動きの軽減が有効です。振動は抑制されています。',hasGesture};
 if(!environment.apiAvailable)return {status:'unsupported',message:'このブラウザではWeb振動APIが利用できません。',hasGesture};
 try{
  // Longer than ordinary tap haptics so it can be felt even with weak actuator response.
  const accepted=navigator.vibrate([180,80,180]);
  return accepted
   ?{status:'accepted',message:'ブラウザは振動要求を受理しました。実際に振動したかは端末で確認してください。',hasGesture}
   :{status:'rejected',message:'ブラウザが振動要求を拒否しました。ページを直接タップしてから再試行してください。',hasGesture};
 }catch{
  return {status:'error',message:'振動APIの呼び出しでエラーが発生しました。',hasGesture};
 }
}
