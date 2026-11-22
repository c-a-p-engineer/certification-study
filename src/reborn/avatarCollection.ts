import {normalizeAnswerHistory} from '../growthAnalytics.ts';

export type AvatarSlot='hair'|'outfit'|'weapon'|'head';
export type AvatarAppearance={hair:string;outfit:string;weapon:string;head:string};
export type AvatarItem={slot:AvatarSlot;id:string;label:string;needed:number;description:string};
export const AVATAR_SLOTS:readonly AvatarSlot[]=['hair','outfit','weapon','head'];
export const STARTER_AVATAR:AvatarAppearance={hair:'gold',outfit:'azure',weapon:'blade',head:'none'};
/** All cosmetics are deterministic milestones, not random drops or purchases. */
export const AVATAR_ITEMS:readonly AvatarItem[]=[
 {slot:'hair',id:'gold',label:'サンライトブロンド',needed:0,description:'初期の金髪'},
 {slot:'hair',id:'rose',label:'ローズピンク',needed:7,description:'異なる7問を正解'},
 {slot:'hair',id:'mint',label:'ミントグリーン',needed:22,description:'異なる22問を正解'},
 {slot:'outfit',id:'azure',label:'アズールジャケット',needed:0,description:'初期の青い衣装'},
 {slot:'outfit',id:'crimson',label:'クリムゾンスーツ',needed:11,description:'異なる11問を正解'},
 {slot:'outfit',id:'midnight',label:'ミッドナイトアーマー',needed:40,description:'異なる40問を正解'},
 {slot:'weapon',id:'blade',label:'プラズマブレード',needed:0,description:'初期の光剣'},
 {slot:'weapon',id:'staff',label:'マジックスタッフ',needed:15,description:'異なる15問を正解'},
 {slot:'weapon',id:'orb',label:'アークオーブ',needed:50,description:'異なる50問を正解'},
 {slot:'head',id:'none',label:'ノーアクセサリー',needed:0,description:'初期の装飾'},
 {slot:'head',id:'visor',label:'サイバーバイザー',needed:10,description:'異なる10問を正解'},
 {slot:'head',id:'halo',label:'スターヘイロー',needed:65,description:'異なる65問を正解'}
];
export const AVATAR_SLOT_NAMES:Record<AvatarSlot,string>={hair:'ヘアカラー',outfit:'衣装',weapon:'武器',head:'頭飾り'};
/** Verified local non-exam correct events, distinct by stable question ID. */
export function avatarMilestone(history:unknown):number{
 return new Set(normalizeAnswerHistory(history).filter(e=>e.correct&&!e.exam).map(e=>e.id)).size;
}
export function avatarItemAvailable(item:AvatarItem,correctUnique:number):boolean{
 return Number.isFinite(correctUnique)&&correctUnique>=item.needed;
}
export function safeAvatarAppearance(raw:unknown,correctUnique:number):AvatarAppearance{
 const source=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
 return Object.fromEntries(AVATAR_SLOTS.map(slot=>{
  const valid=AVATAR_ITEMS.find(item=>item.slot===slot&&item.id===source[slot]&&avatarItemAvailable(item,correctUnique));
  return [slot,valid?.id??STARTER_AVATAR[slot]];
 })) as AvatarAppearance;
}
export function equipAvatarItem(current:unknown,itemId:string,correctUnique:number):AvatarAppearance|null{
 const item=AVATAR_ITEMS.find(x=>x.id===itemId);
 if(!item||!avatarItemAvailable(item,correctUnique))return null;
 return {...safeAvatarAppearance(current,correctUnique),[item.slot]:item.id};
}
