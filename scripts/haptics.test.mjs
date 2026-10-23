import test from 'node:test';
import assert from 'node:assert/strict';
import {HAPTIC_PATTERNS,hapticPattern,readHapticMode,triggerHaptic} from '../src/haptics.ts';
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
