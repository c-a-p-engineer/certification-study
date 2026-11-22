import React from 'react';
import {Check,ChevronDown,Lock,Shirt,Sparkles} from 'lucide-react';
import {AVATAR_ITEMS,AVATAR_SLOTS,AVATAR_SLOT_NAMES,avatarItemAvailable,type AvatarAppearance} from './avatarCollection.ts';
import PlayerAvatar from './PlayerAvatar.tsx';

export default function AvatarCloset({appearance,correctUnique,canEquip,onEquip}:{
 appearance:AvatarAppearance;correctUnique:number;canEquip:boolean;onEquip:(itemId:string)=>void
}){
 const unlocked=AVATAR_ITEMS.filter(item=>avatarItemAvailable(item,correctUnique)).length;
 return <details className="ac-wardrobe">
  <summary><Shirt size={22}/><span><strong>マイキャラ・装備アイテム</strong><small>{unlocked}/{AVATAR_ITEMS.length}アイテム獲得 · 外見を自由に変更</small></span><ChevronDown size={19}/></summary>
  <div className="ac-wardrobe-inner">
   <div className="ac-wardrobe-preview"><div className="ac-wardrobe-avatar"><PlayerAvatar appearance={appearance}/></div><div><strong>装備プレビュー（2D）</strong><span>異なる問題への正解：{correctUnique}問</span><small>着せ替えの色・武器・頭飾りはこちらの2Dで確認できます。ホーム／戦闘の3D試作モデルには装備をまだ反映していません。</small><small>正解した問題の種類に応じて新しい装備が解放されます。購入・抽選・連続ログインは不要です。</small></div></div>
   {AVATAR_SLOTS.map(slot=><section key={slot} className="ac-items-section"><h3>{AVATAR_SLOT_NAMES[slot]}</h3><div className="ac-item-grid">{AVATAR_ITEMS.filter(x=>x.slot===slot).map(item=>{
    const acquired=avatarItemAvailable(item,correctUnique);
    const equipped=appearance[slot]===item.id;
    return <button type="button" key={item.id} className={'ac-item'+(equipped?' is-equipped':'')+(acquired?' is-owned':' is-locked')}
     aria-pressed={equipped} disabled={!acquired||!canEquip}
     onClick={()=>onEquip(item.id)}>
     <span className="ac-item-icon">{!acquired?<Lock size={15}/>:equipped?<Check size={16}/>:<Sparkles size={16}/>}</span>
     <span className="ac-item-description"><strong>{item.label}</strong><small>{equipped?'装備中':acquired?'獲得済み · 装備する':'あと'+(item.needed-correctUnique)+'種類の正解で獲得'}</small></span>
    </button>})}</div></section>)}
   <p className="ac-item-notice">アイテムは外見専用です。学習XP、AWSの解答や実力判定、戦闘ダメージには影響しません。</p>
  </div>
 </details>;
}
