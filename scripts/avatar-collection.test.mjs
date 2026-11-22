import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {avatarMilestone,AVATAR_ITEMS,AVATAR_SLOTS,STARTER_AVATAR,safeAvatarAppearance,equipAvatarItem,avatarItemAvailable} from '../src/reborn/avatarCollection.ts';
import {validProgress,createBackup,parseBackup} from '../src/backup.ts';

const event=(id,correct=true,exam=false)=>({id,domain:'セキュリティ',day:'2026-11-22',correct,firstAttempt:true,due:false,recovery:false,exam,mode:exam?'exam':'daily'});
test('no item reward from wrong answers, mock exam or repeated question IDs',()=>{
 const history=[event('a'),event('a'),event('a',false),event('b',true,true),event('c',false),event('d',true)];
 assert.equal(avatarMilestone(history),2);
 assert.equal(avatarMilestone([]),0);
 assert.equal(avatarMilestone(null),0);
 assert.equal(avatarMilestone([event('a'),event('a')]),1);
 const many=Array.from({length:70},(_,i)=>event('q'+i));
 assert.equal(avatarMilestone(many),70);
 assert.ok(AVATAR_ITEMS.some(x=>x.needed>=65));
});
test('all four slots have a starter and unlockable collectibles with safe equip',()=>{
 assert.deepEqual(AVATAR_SLOTS,['hair','outfit','weapon','head']);
 assert.equal(AVATAR_ITEMS.length,12);
 assert.equal(new Set(AVATAR_ITEMS.map(x=>x.id)).size,12);
 for(const slot of AVATAR_SLOTS){
  assert.equal(AVATAR_ITEMS.filter(x=>x.slot===slot).length,3);
  assert.ok(AVATAR_ITEMS.some(x=>x.slot===slot&&x.needed===0&&STARTER_AVATAR[slot]===x.id));
 }
 assert.deepEqual(safeAvatarAppearance(null,0),STARTER_AVATAR);
 assert.equal(equipAvatarItem(null,'rose',6),null);
 assert.equal(equipAvatarItem(null,'rose',7)?.hair,'rose');
 assert.equal(equipAvatarItem(null,'visor',10)?.head,'visor');
 assert.equal(equipAvatarItem(null,'midnight',39),null);
 assert.equal(equipAvatarItem(null,'midnight',40)?.outfit,'midnight');
 assert.equal(avatarItemAvailable(AVATAR_ITEMS.find(x=>x.id==='halo'),65),true);
 assert.deepEqual(safeAvatarAppearance({hair:'hacked',outfit:'midnight',weapon:'orb',head:'halo'},0),STARTER_AVATAR);
 assert.equal(safeAvatarAppearance({hair:'mint',outfit:'crimson',weapon:'orb',head:'visor'},50).hair,'mint');
 assert.equal(safeAvatarAppearance({hair:'mint',outfit:'crimson',weapon:'orb',head:'visor'},50).weapon,'orb');
});
test('appearance is an optional field in the existing progress and backup format',()=>{
 const progress={xp:200,best:1,answered:10,correct:7,mistakes:[],domains:{},reviews:{},
  answerHistory:[event('a')],avatarAppearance:{...STARTER_AVATAR,hair:'rose'}};
 assert.equal(validProgress(progress),true);
 const storage=new Map([['certification-overdrive-progress-v1',JSON.stringify(progress)]]);
 const store={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 const backup=createBackup(store);
 assert.ok(JSON.stringify(backup).includes('avatarAppearance'));
 assert.equal(backup.version,1);
 assert.ok(JSON.stringify(backup).includes('rose'));
});
test('current REBORN and legacy .app both load original nine monster color palettes',()=>{
 const css=readFileSync('src/enemyVisual.css','utf8');
 assert.match(css,/:is\(\.app,\.reborn\) \.monster-visual/);
 assert.match(css,/:is\(\.app,\.reborn\) \.mv-body\{fill:var\(--mv-body\)/);
 for(const id of ['slime','zombie','armor','chimera','dragon','cerberus','phoenix','titan','leviathan']){
  if(id!=='slime')assert.ok(css.includes(':is(.app,.reborn) .mv-'+id+'{'),id);
 }
 const playerCss=readFileSync('src/reborn/characterStage.css','utf8');
 assert.match(playerCss,/\.ac-home-heading/);
 assert.match(playerCss,/@media\(max-width:380px\)/);
 assert.match(playerCss,/\.reborn\.is-reduced/);
});
test('SSR renders visibly different avatar colors and equipped item assets',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:PlayerAvatar}=await vite.ssrLoadModule('/src/reborn/PlayerAvatar.tsx');
  const {default:AvatarCloset}=await vite.ssrLoadModule('/src/reborn/AvatarCloset.tsx');
  const {default:RebornApp}=await vite.ssrLoadModule('/src/reborn/RebornApp.tsx');
  const basic=renderToStaticMarkup(React.createElement(PlayerAvatar));
  const styled=renderToStaticMarkup(React.createElement(PlayerAvatar,{appearance:{hair:'rose',outfit:'crimson',weapon:'staff',head:'visor'}}));
  assert.match(basic,/csSuit/);
  assert.ok(basic.includes('#fff4a9'));
  assert.ok(styled.includes('#ffc0e2'));
  assert.ok(styled.includes('#ff879b'));
  assert.ok(styled.includes('cs-accessory'));
  assert.ok(styled.includes('rose-crimson-staff-visor'));
  assert.notEqual(basic,styled);
  const shop=renderToStaticMarkup(React.createElement(AvatarCloset,{appearance:STARTER_AVATAR,correctUnique:15,canEquip:true,onEquip:()=>{}}));
  assert.match(shop,/マイキャラ・装備アイテム/);
  assert.match(shop,/獲得済み/);
  assert.match(shop,/あと.*種類の正解で獲得/);
  assert.match(shop,/装備中/);
  const home=renderToStaticMarkup(React.createElement(RebornApp));
  assert.match(home,/MY AVATAR/);
  assert.match(home,/ac-home-portrait/);
  assert.ok(home.indexOf('ac-home-portrait')<home.indexOf('攻略を始める'));
  const src=readFileSync('src/reborn/RebornApp.tsx','utf8');
  assert.ok(src.includes('avatarAppearance:next'));
  assert.ok(src.includes('if(!canWrite)'));
  assert.ok(src.includes('appearance={avatarAppearance} onExit={quit}'));
 }finally{await vite.close()}
});
test('quest, blitz and daily character views consume the same appearance',()=>{
 const battle=readFileSync('src/reborn/BattleStage.tsx','utf8');
 const solo=readFileSync('src/reborn/SoloArcade.tsx','utf8');
 const daily=readFileSync('src/reborn/DailyCode.tsx','utf8');
 assert.ok(battle.includes('appearance={appearance}'));
 assert.ok(solo.includes('<BattleStage appearance={appearance}'));
 assert.ok(solo.includes('<PlayerAvatar appearance={appearance}'));
 assert.ok(daily.includes('<PlayerAvatar appearance={appearance}'));
});
