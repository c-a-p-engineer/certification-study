/** Pure presentation plan. Never awards XP, changes answers, or writes browser storage. */
import type {SoundEffect} from '../audioDirector.ts';
import type {HapticEvent} from '../haptics.ts';

export type CelebrationKind='correct'|'wrong'|'combo'|'boss-hit'|'boss-win'|'finish'|'start';
export type Celebration={
 kind:CelebrationKind;
 title:string;
 subtitle:string;
 sound:SoundEffect;
 haptic:HapticEvent;
 intensity:1|2|3;
 particles:number;
};
export type CelebrationInput={
 correct:boolean;
 combo:number;
 damage:number;
 defeated:boolean;
 rewardedXp:number;
};
export function answerCelebration(input:CelebrationInput):Celebration{
 if(!input.correct)return {kind:'wrong',title:'惜しい！',subtitle:'解説で次につなげよう',sound:'wrong',haptic:'wrong',intensity:1,particles:6};
 if(input.defeated)return {kind:'boss-win',title:'MONSTER DOWN!',subtitle:'撃破成功',sound:'boss-win',haptic:'boss-win',intensity:3,particles:32};
 if(input.combo>=3)return {kind:'combo',title:input.combo+' COMBO!',subtitle:'連続正解中',sound:'combo',haptic:'combo',intensity:3,particles:24};
 if(input.damage>0)return {kind:'boss-hit',title:'CRITICAL HIT!',subtitle:'正解でダメージ',sound:'boss-hit',haptic:'boss-hit',intensity:2,particles:19};
 return {kind:'correct',title:'PERFECT ANSWER!',subtitle:input.rewardedXp>0?'XP GET!':'GOOD RECALL!',sound:'correct',haptic:'correct',intensity:2,particles:14};
}
export function burstGeometry(count:number,seed:number):{x:number;y:number;delay:number;rotation:number;size:number}[]{
 const n=Math.max(0,Math.min(36,Math.floor(count)));
 return Array.from({length:n},(_,i)=>({
  x:Math.round(Math.cos((i/n)*Math.PI*2+seed)* (90+((i*17)%100))),
  y:Math.round(Math.sin((i/n)*Math.PI*2+seed)* (60+((i*13)%90))),
  delay:(i%7)*19,
  rotation:(i*53+seed*31)%360,
  size:5+(i%4)*3
 }));
}
