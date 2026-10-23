import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {BACKUP_KEYS,RESTORE_JOURNAL_KEY,createBackup,parseBackup,restoreBackup,recoverInterruptedRestore,validProgress,validateJsonShape,MAX_NESTING_DEPTH} from '../src/backup.ts';
import {inspectOffline} from '../src/offlineStatus.ts';
const progress={xp:10,best:1,answered:1,correct:1,mistakes:[],domains:{},reviews:{},answerHistory:[]};
const store=(seed={},failAt=null)=>{
 const values=new Map(Object.entries(seed));let fail=false;
 return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(k===failAt&&!fail){fail=true;throw Error('quota')}values.set(k,v)},removeItem:k=>values.delete(k)};
};
test('nested or prototype-hostile backup is rejected before touching storage',()=>{
 const good=createBackup(store({[BACKUP_KEYS[0]]:JSON.stringify(progress)}));
 const deep=Array.from({length:MAX_NESTING_DEPTH+5},()=>({}));let nest={};for(let i=0;i<MAX_NESTING_DEPTH+5;i++)nest={child:nest};
 assert.equal(validateJsonShape(nest),false);
 assert.throws(()=>parseBackup(JSON.stringify({...good,items:{...good.items,[BACKUP_KEYS[0]]:JSON.stringify({...progress,activity:{evil:nest}})}})));
 const malicious='{"xp":10,"best":1,"answered":1,"correct":1,"mistakes":[],"domains":{},"reviews":{},"__proto__":{"polluted":true}}';
 assert.throws(()=>parseBackup(JSON.stringify({...good,items:{...good.items,[BACKUP_KEYS[0]]:malicious}})));
 assert.equal(validProgress({...progress,answerHistory:[{bad:true}]}),false);
});
test('restore writes rollback journal before changing local XP and clears it upon success',()=>{
 const incoming=createBackup(store({[BACKUP_KEYS[0]]:JSON.stringify({...progress,xp:555})}));
 const dest=store({[BACKUP_KEYS[0]]:JSON.stringify(progress)});
 restoreBackup(incoming,dest);
 assert.equal(JSON.parse(dest.getItem(BACKUP_KEYS[0])).xp,555);
 assert.equal(dest.getItem(RESTORE_JOURNAL_KEY),null);
});
test('an interrupted restore on app restart recovers previous XP and missing local preferences',()=>{
 const previous=Object.fromEntries(BACKUP_KEYS.map(key=>[key,null]));
 previous[BACKUP_KEYS[0]]=JSON.stringify({...progress,xp:99});
 previous['cert-overdrive-smart-profile-v1']='balanced';
 const dest=store({[BACKUP_KEYS[0]]:JSON.stringify({...progress,xp:7}),'cert-overdrive-smart-profile-v1':'explore',[RESTORE_JOURNAL_KEY]:JSON.stringify({version:1,previous})});
 assert.equal(recoverInterruptedRestore(dest),true);
 assert.equal(JSON.parse(dest.getItem(BACKUP_KEYS[0])).xp,99);
 assert.equal(dest.getItem('cert-overdrive-smart-profile-v1'),'balanced');
 assert.equal(dest.getItem(RESTORE_JOURNAL_KEY),null);
 assert.equal(recoverInterruptedRestore(dest),false);
});
test('quota failure rolls back to original XP, leaving unrelated origin data untouched',()=>{
 const incoming=createBackup(store({[BACKUP_KEYS[0]]:JSON.stringify({...progress,xp:444}),'cert-overdrive-haptics-v1':'off'}));
 const original=JSON.stringify({...progress,xp:50});
 const dest=store({[BACKUP_KEYS[0]]:original,other:'preserve'},'cert-overdrive-haptics-v1');
 assert.throws(()=>restoreBackup(incoming,dest),/quota/);
 assert.equal(dest.getItem(BACKUP_KEYS[0]),original);
 assert.equal(dest.getItem('other'),'preserve');
 assert.equal(dest.getItem(RESTORE_JOURNAL_KEY),null);
});
test('invalid journal never overwrites progress during startup and visible warning exists',()=>{
 const dest=store({[BACKUP_KEYS[0]]:JSON.stringify(progress),[RESTORE_JOURNAL_KEY]:'corrupt'});
 assert.throws(()=>recoverInterruptedRestore(dest),/壊れています/);
 assert.equal(JSON.parse(dest.getItem(BACKUP_KEYS[0])).xp,10);
 const main=readFileSync('src/main.tsx','utf8');
 assert.ok(main.includes('recoverInterruptedRestore(localStorage)'));
 assert.ok(main.includes("localStorage.getItem(RESTORE_JOURNAL_KEY)===null"));
 assert.ok(main.includes('保存データの復旧が未完了です'));
});
test('offline status reports valid build cache and gracefully handles no caching support',async()=>{
 const desc=Object.getOwnPropertyDescriptor(globalThis,'caches');
 try{
  Object.defineProperty(globalThis,'caches',{configurable:true,value:{
   keys:async()=>['unrelated','cert-overdrive-1234567890abcdef'],
   open:async()=>({keys:async()=>[{url:'https://example.com/certification-study/index.html'},{url:'https://example.com/certification-study/assets/app-42.js'}]})
  }});
  const result=await inspectOffline();
  assert.equal(result.status,'ready');assert.equal(result.assetCount,2);assert.equal(result.cacheRevision,'1234567890abcdef');
  Object.defineProperty(globalThis,'caches',{configurable:true,value:{keys:async()=>[]}});
  assert.equal((await inspectOffline()).status,'unavailable');
 }finally{if(desc)Object.defineProperty(globalThis,'caches',desc);else delete globalThis.caches}
 const ui=readFileSync('src/OfflineStatus.tsx','utf8');
 assert.ok(ui.includes('ストレージの消去'));assert.ok(ui.includes('disabled={activeMission}'));
});
