/** Lightweight original Web Audio synthesizer. No downloaded music, API keys or asset licenses. */
export type MusicScene='home'|'mission'|'recall'|'boss'|'exam'|'result';
export type SoundEffect='click'|'select'|'correct'|'wrong'|'combo'|'boss-hit'|'boss-win'|'rank'|'reward'|'finish'|'start';
export type AudioSettings={bgmEnabled:boolean;sfxEnabled:boolean;bgmVolume:number;sfxVolume:number};
export const DEFAULT_AUDIO_SETTINGS:AudioSettings={bgmEnabled:false,sfxEnabled:false,bgmVolume:0.3,sfxVolume:0.65};
export const clampVolume=(value:number)=>Number.isFinite(value)?Math.min(1,Math.max(0,value)):0;
export function readAudioSettings():AudioSettings{
 try{const value=JSON.parse(localStorage.getItem('cert-overdrive-audio-v1')||'null');if(!value)return {...DEFAULT_AUDIO_SETTINGS};
  return {bgmEnabled:value.bgmEnabled===true,sfxEnabled:value.sfxEnabled===true,bgmVolume:clampVolume(Number(value.bgmVolume??.3)),sfxVolume:clampVolume(Number(value.sfxVolume??.65))};
 }catch{return {...DEFAULT_AUDIO_SETTINGS}}
}
export function saveAudioSettings(settings:AudioSettings):void{try{localStorage.setItem('cert-overdrive-audio-v1',JSON.stringify(settings))}catch{}}
type Melody={bpm:number;root:number;lead:number[];bass:number[];chord:number[];brightness:number};
const REST=-1;
export const MUSIC:Record<MusicScene,Melody>={
 home:{bpm:110,root:57,lead:[0,REST,4,7,REST,9,7,4,5,REST,9,12,7,4,2,REST],bass:[0,0,5,5,7,7,5,5],chord:[0,5,7,5],brightness:.68},
 mission:{bpm:132,root:57,lead:[0,7,12,7,9,12,7,4,5,9,12,9,7,5,4,REST],bass:[0,0,7,7,5,5,7,7],chord:[0,7,5,7],brightness:.82},
 recall:{bpm:90,root:60,lead:[0,REST,REST,7,4,REST,REST,9,7,REST,12,REST,9,REST,4,REST],bass:[0,0,5,5,7,7,5,5],chord:[0,5,7,5],brightness:.36},
 boss:{bpm:154,root:45,lead:[0,0,7,12,0,3,7,10,0,0,10,12,7,5,3,REST],bass:[0,0,3,3,7,7,5,5],chord:[0,3,7,5],brightness:1},
 exam:{bpm:74,root:48,lead:[0,REST,REST,REST,7,REST,REST,REST,5,REST,REST,REST,7,REST,REST,REST],bass:[0,0,5,5,7,7,5,5],chord:[0,5,7,5],brightness:.21},
 result:{bpm:116,root:60,lead:[0,4,7,12,REST,7,9,12,5,9,12,16,12,REST,7,REST],bass:[0,0,5,5,7,7,5,5],chord:[0,5,7,5],brightness:.63}
};
const frequency=(midi:number)=>440*Math.pow(2,(midi-69)/12);
type BrowserAudioContext=AudioContext;
export class AudioDirector{
 private ctx:BrowserAudioContext|null=null;
 private musicBus:GainNode|null=null;
 private sfxBus:GainNode|null=null;
 private timer:number|undefined;
 private scene:MusicScene='home';
 private setting:AudioSettings={...DEFAULT_AUDIO_SETTINGS};
 private cursor=0;
 private nextNote=0;
 private unlocked=false;
 private disposed=false;
 private onVisibility=()=>{
  if(typeof document==='undefined')return;
  if(document.hidden){this.stopClock()}else if(this.unlocked&&this.setting.bgmEnabled){this.startClock()}
 };
 constructor(){if(typeof document!=='undefined')document.addEventListener('visibilitychange',this.onVisibility)}
 private initialize():BrowserAudioContext|null{
  if(this.ctx||this.disposed||typeof window==='undefined')return this.ctx;
  const AudioCtor=window.AudioContext;
  if(!AudioCtor)return null;
  try{this.ctx=new AudioCtor();this.musicBus=this.ctx.createGain();this.sfxBus=this.ctx.createGain();this.musicBus.connect(this.ctx.destination);this.sfxBus.connect(this.ctx.destination);this.configure(this.setting);return this.ctx}catch{return null}
 }
 async unlock():Promise<void>{
  const context=this.initialize();if(!context)return;
  try{if(context.state!=='running')await context.resume();this.unlocked=context.state==='running';if(this.unlocked&&this.setting.bgmEnabled)this.startClock()}catch{/* blocked until user gesture */}
 }
 configure(settings:AudioSettings):void{
  this.setting={...settings,bgmVolume:clampVolume(settings.bgmVolume),sfxVolume:clampVolume(settings.sfxVolume)};
  if(this.musicBus)this.musicBus.gain.setTargetAtTime(this.setting.bgmEnabled?this.setting.bgmVolume*.16:0,this.ctx!.currentTime,.06);
  if(this.sfxBus)this.sfxBus.gain.setTargetAtTime(this.setting.sfxEnabled?this.setting.sfxVolume*.34:0,this.ctx!.currentTime,.03);
  if(!this.setting.bgmEnabled)this.stopClock();
  else if(this.unlocked)this.startClock();
 }
 setScene(scene:MusicScene):void{
  if(this.scene===scene)return;this.scene=scene;this.cursor=0;
  this.nextNote=this.ctx?.currentTime??0;
  if(this.unlocked&&this.setting.bgmEnabled)this.startClock();
 }
 private tone(freq:number,start:number,duration:number,volume:number,type:OscillatorType,bus:AudioNode,slide=0):void{
  if(!this.ctx)return;
  const osc=this.ctx.createOscillator();const env=this.ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,start);
  if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(25,freq+slide),start+duration);
  env.gain.setValueAtTime(.0001,start);
  env.gain.exponentialRampToValueAtTime(Math.max(.001,volume),start+.012);
  env.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(env);env.connect(bus);osc.start(start);osc.stop(start+duration+.015);
 }
 private musicStep(at:number):void{
  if(!this.ctx||!this.musicBus)return;
  const m=MUSIC[this.scene],step=this.cursor%16,unit=60/m.bpm/2;
  const vol=m.brightness;
  if(m.lead[step]!==REST)this.tone(frequency(m.root+12+m.lead[step]),at,unit*.72,.18*vol,'triangle',this.musicBus);
  if(step%2===0)this.tone(frequency(m.root-12+m.bass[Math.floor(step/2)%m.bass.length]),at,unit*1.5,.18*vol,'sine',this.musicBus);
  if(step%4===0)this.tone(frequency(m.root+m.chord[Math.floor(step/4)%m.chord.length]),at,unit*3.1,.10*vol,'sine',this.musicBus);
  if(this.scene==='boss'&&step%4===0)this.tone(85,at,.13,.23,'triangle',this.musicBus,-55);
  if(this.scene!=='exam'&&this.scene!=='recall'&&step%2===1)this.tone(3800,at,.018,.008*vol,'square',this.musicBus,-3200);
  this.cursor++;
 }
 private schedule=()=>{
  if(!this.ctx||!this.musicBus||!this.setting.bgmEnabled||this.ctx.state!=='running')return;
  const unit=60/MUSIC[this.scene].bpm/2;
  let limit=0;
  while(this.nextNote<this.ctx.currentTime+.24&&limit<12){this.musicStep(this.nextNote);this.nextNote+=unit;limit++}
 };
 private startClock():void{
  if(!this.ctx||this.timer!==undefined||!this.setting.bgmEnabled||typeof document==='undefined'||document.hidden)return;
  this.nextNote=this.ctx.currentTime+.035;this.timer=window.setInterval(this.schedule,85);this.schedule();
 }
 private stopClock():void{if(this.timer!==undefined){window.clearInterval(this.timer);this.timer=undefined}}
 play(name:SoundEffect):void{
  if(!this.setting.sfxEnabled||!this.unlocked||!this.ctx||!this.sfxBus)return;
  const t=this.ctx.currentTime+.005,bus=this.sfxBus;
  const notes=(frequencies:number[],step:number,duration:number,vol=.3,type:OscillatorType='triangle')=>frequencies.forEach((freq,i)=>this.tone(freq,t+i*step,duration,vol,type,bus));
  switch(name){
   case 'click':notes([530,660],.032,.075,.13);break;
   case 'select':notes([430,700],.035,.1,.17);break;
   case 'start':notes([330,440,660,880],.09,.15,.2);break;
   case 'correct':notes([523,659,784,1046],.06,.17,.3);break;
   case 'wrong':notes([310,207],.1,.19,.24,'sawtooth');break;
   case 'combo':notes([659,880,1046,1318],.045,.16,.22,'square');break;
   case 'boss-hit':notes([180,130,90],.044,.19,.36,'sawtooth');break;
   case 'boss-win':notes([392,523,659,784,1046,1318],.095,.32,.3);break;
   case 'rank':notes([523,659,784,1046,1568],.12,.32,.28);break;
   case 'reward':notes([784,1046,1174,1568],.085,.27,.27);break;
   case 'finish':notes([392,494,587,784],.13,.3,.23);break;
  }
 }
 dispose():void{
  this.disposed=true;this.stopClock();
  if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this.onVisibility);
  if(this.ctx){void this.ctx.close().catch(()=>{});this.ctx=null}
 }
}
