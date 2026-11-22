import React from 'react';
import QuestHero3D from './QuestHero3D.tsx';
import type {AvatarAppearance} from './avatarCollection.ts';
const HOME_IDLE_EVENT={seq:0,kind:'idle' as const,damage:0};

/** HOME has one intended visual mode: 3D. Legacy local 2D selections are ignored. */
export default function HomeAvatarPortrait({appearance,allow3d}:{appearance:AvatarAppearance;allow3d:boolean}){
 return <div className={'ac-home-portrait'+(allow3d?' ac-home-portrait-3d':'')} aria-label="ホームのマイアバター">
  <div className="ac-home-avatar-view">
   <QuestHero3D enabled={allow3d} appearance={appearance} pose="idle" event={HOME_IDLE_EVENT} view="portrait"/>
  </div>
  <span className="ac-home-avatar-label">{allow3d?'MY AVATAR · 3D':'MY AVATAR · 軽量表示'}</span>
 </div>;
}
