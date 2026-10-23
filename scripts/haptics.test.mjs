import test from 'node:test';
import assert from 'node:assert/strict';
import {HAPTIC_PATTERNS,hapticPattern,readHapticMode,triggerHaptic,getHapticEnvironment,testHapticDevice} from '../src/haptics.ts';
test('haptics are optional and distinct for right and wrong answers',()=>{
 assert.notDeepEqual(HAPTIC_PATTERNS.correct,HAPTIC_PATTERNS.wrong);
 assert.deepEqual(hapticPattern('correct','off'),[]);
 assert.ok(hapticPattern('correct','normal').length>=2);
 assert.ok(hapticPattern('boss-win','overdrive').every(x=>x<=180));
 assert.ok(hapticPattern('combo','overdrive')[0]>hapticPattern('combo','normal')[0]);
});
test('safe fallback on unsupported runtimes and no vibration during reduced-motion',()=>{
 assert.equal(triggerHaptic('correct','normal'),false);
 assert.equal(triggerHaptic('wrong','off'),false);
 assert.equal(triggerHaptic('wrong','overdrive',true),false);
 assert.equal(triggerHaptic('correct','normal',false,true),false);
 assert.equal(readHapticMode(),'normal');
});
test('vibrate never emits invalid or excessive durations',()=>{
 for(const pattern of Object.values(HAPTIC_PATTERNS)){
  assert.ok(pattern.length>0&&pattern.length<9);
  assert.ok(pattern.every(ms=>Number.isInteger(ms)&&ms>0&&ms<=180));
 }
});

test('diagnostics tell OFF and reduced effects apart from browser rejection',()=>{
 assert.equal(testHapticDevice('off').status,'disabled');
 assert.equal(testHapticDevice('normal',true).status,'reduced');
 assert.equal(typeof getHapticEnvironment().apiAvailable,'boolean');
});
test('test differentiates API acceptance and refusal and never claims hardware vibration',()=>{
 const previousNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 try{
  let calledWith=null;
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{vibrate:pattern=>{calledWith=pattern;return true},userActivation:{hasBeenActive:true}}});
  Object.defineProperty(globalThis,'window',{configurable:true,value:{isSecureContext:true,matchMedia:()=>({matches:false})}});
  const accepted=testHapticDevice('normal');
  assert.deepEqual(calledWith,[180,80,180]);
  assert.equal(accepted.status,'accepted');
  assert.match(accepted.message,/実際に振動したか/);
  assert.equal(accepted.hasGesture,true);
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{vibrate:()=>false,userActivation:{hasBeenActive:true}}});
  assert.equal(testHapticDevice('normal').status,'rejected');
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userActivation:{hasBeenActive:true}}});
  assert.equal(testHapticDevice('normal').status,'unsupported');
  Object.defineProperty(globalThis,'window',{configurable:true,value:{matchMedia:()=>({matches:true})}});
  assert.equal(testHapticDevice('normal').status,'reduced');
 }finally{
  if(previousNavigator)Object.defineProperty(globalThis,'navigator',previousNavigator);else delete globalThis.navigator;
  if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else delete globalThis.window;
 }
});
