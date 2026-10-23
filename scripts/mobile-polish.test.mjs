import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {BACKUP_KEYS,createBackup,parseBackup,restoreBackup,backupPreview} from '../src/backup.ts';
import {initialEnemyCampaign} from '../src/enemyCampaign.ts';
const main=readFileSync('src/main.tsx','utf8'),offline=readFileSync('src/offline.ts','utf8'),sw=readFileSync('scripts/sw-template.js','utf8');
const backupUI=readFileSync('src/BackupPanel.tsx','utf8');
const state={xp:10,answered:1,correct:1,best:1,mistakes:[],reviews:{},domains:{},enemyCampaign:initialEnemyCampaign()};
const store=(data=new Map())=>({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)});
test('old version 1 backup remains importable when 5.x optional keys are absent',()=>{
 const data=new Map([['certification-overdrive-progress-v1',JSON.stringify(state)]]);
 const old=createBackup(store(data));
 const parsed=parseBackup(JSON.stringify(old));
 assert.equal(parsed.version,1);
 const restored=new Map();
 restoreBackup(parsed,store(restored));
 assert.deepEqual(JSON.parse(restored.get(BACKUP_KEYS[0])).enemyCampaign,initialEnemyCampaign());
 assert.equal(restored.has('cert-overdrive-question-reports-v1'),false);
});
test('reports and SMART preset survive cross-device backup',()=>{
 const p=JSON.stringify([{id:'saa-101',reason:'誤字・表示問題',comment:'説明の改行',createdAt:'2026-10-24T00:00:00Z'}]);
 const m=new Map([[BACKUP_KEYS[0],JSON.stringify(state)],['cert-overdrive-question-reports-v1',p],['cert-overdrive-smart-profile-v1','review']]);
 const snapshot=createBackup(store(m)),out=new Map();restoreBackup(parseBackup(JSON.stringify(snapshot)),store(out));
 assert.equal(out.get('cert-overdrive-question-reports-v1'),p);
 assert.equal(out.get('cert-overdrive-smart-profile-v1'),'review');
 assert.throws(()=>parseBackup(JSON.stringify({...snapshot,items:{...snapshot.items,'cert-overdrive-smart-profile-v1':'illegal'}})));
});
test('recovery preview contrasts old and new XP, with explicit confirmation and reload',()=>{
 assert.ok(backupUI.includes('現在の記録'));
 assert.ok(backupUI.includes('復元ファイル'));
 assert.ok(backupUI.includes('window.confirm('));
 assert.ok(backupUI.includes('window.location.reload()'));
});
test('SW update is only activated by click and deferred until home screen',()=>{
 assert.ok(sw.includes("event.data?.type==='ACTIVATE_UPDATE'"));
 assert.ok(sw.includes('void self.skipWaiting()'));
 assert.ok(offline.includes("reg.waiting.postMessage({type:'ACTIVATE_UPDATE'})"));
 assert.ok(offline.includes("navigator.serviceWorker.addEventListener('controllerchange'"));
 assert.ok(main.includes("updateAvailable&&mode==='home'"));
 assert.ok(main.includes('applyOfflineUpdate()'));
 assert.ok(!sw.includes("addEventListener('install',event=>{event.waitUntil(self.skipWaiting()") );
});
test('reading controls and question scroll remain responsive and accessible',()=>{
 const density=readFileSync('src/quizDensity.css','utf8');
 const visual=readFileSync('src/qualityGrowth.css','utf8');
 assert.ok(main.includes('questionRef.current?.scrollIntoView'));
 assert.ok(main.includes('shiftTextScale(textScale,-1)'));
 assert.ok(density.includes('@media(max-width:700px)'));
 assert.ok(visual.includes('@media(max-width:750px)'));
 assert.ok(visual.includes(':focus-visible'));
});
