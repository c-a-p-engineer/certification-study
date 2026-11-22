import React,{useState} from 'react';
import QuestHero3D from './QuestHero3D.tsx';
import type {AvatarAppearance} from './avatarCollection.ts';

export type HomeAvatarMode='3d'|'2d';
export const HOME_AVATAR_MODE_KEY='cert-overdrive-home-avatar-mode-v1';
const HOME_IDLE_EVENT={seq:0,kind:'idle' as const,damage:0};

type DisplayStore={
 getItem:(key:string)=>string|null;
 setItem:(key:string,value:string)=>void;
};

export function readHomeAvatarMode(store?:Pick<DisplayStore,'getItem'>):HomeAvatarMode{
 try{
  const target=store??(typeof window==='undefined'?null:window.localStorage);
  return target?.getItem(HOME_AVATAR_MODE_KEY)==='2d'?'2d':'3d';
 }catch{return '3d'}
}
export function saveHomeAvatarMode(mode:HomeAvatarMode,store?:Pick<DisplayStore,'setItem'>):void{
 try{
  const target=store??(typeof window==='undefined'?null:window.localStorage);
  target?.setItem(HOME_AVATAR_MODE_KEY,mode);
 }catch{/* Display preference is optional; learning progress remains safe. */}
}

/** HOME avatar reuses the real KayKit Mage GLB, not an image or duplicate render engine. */
export default function HomeAvatarPortrait({appearance,allow3d}:{
 appearance:AvatarAppearance;allow3d:boolean;
}){
 const [preferred,setPreferred]=useState<HomeAvatarMode>(readHomeAvatarMode);
 const threeD=allow3d&&preferred==='3d';
 function toggle(){
  const next:HomeAvatarMode=threeD?'2d':'3d';
  setPreferred(next);
  saveHomeAvatarMode(next);
 }
 return <div className={'ac-home-portrait'+(threeD?' ac-home-portrait-3d':'')} aria-label="ホームのマイアバター">
  <div className="ac-home-avatar-view">
   <QuestHero3D enabled={threeD} appearance={appearance} pose="idle" event={HOME_IDLE_EVENT} view="portrait"/>
  </div>
  <span className="ac-home-avatar-label">MY AVATAR · {threeD?'3D':'2D'}</span>
  {allow3d?<button className="ac-home-avatar-switch" type="button"
   onClick={toggle} aria-label={threeD?'ホームのキャラを2Dに切り替える':'ホームのキャラを3Dに切り替える'}>
   {threeD?'2Dに切替':'3Dに切替'}
  </button>:<small className="ac-home-avatar-lowfx">軽量2D表示</small>}
 </div>;
}
