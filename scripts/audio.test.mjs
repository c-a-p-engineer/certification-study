import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_AUDIO_SETTINGS,MUSIC,clampVolume,readAudioSettings} from '../src/audioDirector.ts';

test('sound is OFF by default and configured for modest volume',()=>{
 const settings=readAudioSettings();
 assert.equal(settings.bgmEnabled,false);
 assert.equal(settings.sfxEnabled,false);
 assert.ok(settings.bgmVolume<=.4);
 assert.ok(settings.sfxVolume<=.75);
 assert.deepEqual(settings,DEFAULT_AUDIO_SETTINGS);
});
test('scene soundtracks are distinct, finite and within sensible tempos',()=>{
 const names=Object.keys(MUSIC);
 assert.deepEqual(names.sort(),['boss','exam','home','mission','recall','result']);
 for(const [scene,track] of Object.entries(MUSIC)){
  assert.ok(track.bpm>=65&&track.bpm<=170,scene);
  assert.equal(track.lead.length,16,scene);
  assert.ok(track.lead.every(x=>Number.isInteger(x)),scene);
  assert.ok(track.bass.length>=4,scene);
  assert.ok(track.brightness>0&&track.brightness<=1,scene);
 }
 assert.ok(MUSIC.exam.bpm<MUSIC.boss.bpm);
 assert.ok(MUSIC.exam.brightness<MUSIC.mission.brightness);
});
test('gain controls clamp invalid ranges',()=>{
 assert.equal(clampVolume(-2),0);
 assert.equal(clampVolume(3),1);
 assert.equal(clampVolume(Number.NaN),0);
 assert.equal(clampVolume(.45),.45);
});
