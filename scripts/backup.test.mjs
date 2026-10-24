import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BACKUP_KEYS,createBackup,parseBackup,restoreBackup,backupPreview,MAX_BACKUP_BYTES,validProgress} from '../src/backup.ts';
const progress={xp:1200,best:5,answered:10,correct:8,mistakes:['q1'],domains:{'セキュリティ':{answered:10,correct:8}},reviews:{q1:{streak:1,lapses:0,dueAt:999,lastReviewedAt:100,intervalDays:1}},enemyCampaign:{stageIndex:0,hp:20,cleared:[],hitIds:['q2'],completed:false}};
const fakeStore=(seed={},failKey=null)=>{
 const data=new Map(Object.entries(seed));
 return {data,getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>{if(k===failKey)throw Error('quota');data.set(k,v)},removeItem:k=>data.delete(k)};
};
test('backup exports only approved local keys, full study progress and date',()=>{
 const store=fakeStore({[BACKUP_KEYS[0]]:JSON.stringify(progress),unrelated:'SECRET','cert-overdrive-haptics-v1':'normal'});
 const backup=createBackup(store,new Date('2026-10-23T12:00:00Z'));
 assert.equal(backup.version,1);assert.equal(backup.createdAt,'2026-10-23T12:00:00.000Z');
 assert.ok(backup.items[BACKUP_KEYS[0]].includes('"xp":1200'));
 assert.equal(backup.items.unrelated,undefined);
 assert.equal(backupPreview(parseBackup(JSON.stringify(backup))).stage,1);
});
test('restores prior HP, XP and settings safely without touching unrelated keys',()=>{
 const incoming=createBackup(fakeStore({[BACKUP_KEYS[0]]:JSON.stringify(progress),'cert-overdrive-haptics-v1':'normal'}));
 const target=fakeStore({[BACKUP_KEYS[0]]:JSON.stringify({...progress,xp:50}),'unrelated':'keep','cert-overdrive-quiz-layout-v1':'detailed'});
 restoreBackup(incoming,target);
 assert.equal(JSON.parse(target.getItem(BACKUP_KEYS[0])).enemyCampaign.hp,20);
 assert.equal(JSON.parse(target.getItem(BACKUP_KEYS[0])).xp,1200);
 assert.equal(target.getItem('unrelated'),'keep');
 assert.equal(target.getItem('cert-overdrive-quiz-layout-v1'),null);
});
test('malformed, excessive, unknown keys or invalid progress never overwrite storage',()=>{
 const good=createBackup(fakeStore({[BACKUP_KEYS[0]]:JSON.stringify(progress)}));
 const edit=fn=>JSON.stringify({...good,items:fn({...good.items})});
 assert.throws(()=>parseBackup('nope'));
 assert.throws(()=>parseBackup(' '.repeat(MAX_BACKUP_BYTES+1)));
 assert.throws(()=>parseBackup(edit(x=>({...x,unknown:'oops'}))));
 assert.throws(()=>parseBackup(edit(x=>({...x,[BACKUP_KEYS[0]]:JSON.stringify({...progress,xp:-999})}))));
 assert.throws(()=>parseBackup(edit(x=>({...x,[BACKUP_KEYS[0]]:'notjson'}))));
 assert.equal(validProgress({...progress,answered:1,correct:8}),false);
 assert.throws(()=>parseBackup(JSON.stringify({...good,version:7})));
});
test('quota exception triggers rollback without losing existing progress',()=>{
 const incoming=createBackup(fakeStore({[BACKUP_KEYS[0]]:JSON.stringify(progress),'cert-overdrive-haptics-v1':'overdrive'}));
 const old=JSON.stringify({...progress,xp:42});
 const target=fakeStore({[BACKUP_KEYS[0]]:old,'cert-overdrive-haptics-v1':'off'},'cert-overdrive-haptics-v1');
 assert.throws(()=>restoreBackup(incoming,target),/quota/);
 assert.equal(target.getItem(BACKUP_KEYS[0]),old);
 assert.equal(target.getItem('cert-overdrive-haptics-v1'),'off');
});
test('real UI requires explicit preview and confirmation before reload',()=>{
 const ui=readFileSync('src/BackupPanel.tsx','utf8');const menu=readFileSync('src/GameMenu.tsx','utf8');
 assert.ok(ui.includes('readPortableBackup(await file.text())'));
 assert.ok(ui.includes('window.confirm('));assert.ok(ui.includes('restoreBackup(incoming,localStorage)'));
 assert.ok(ui.includes('window.location.reload()'));assert.ok(menu.includes('<BackupPanel/>'));
});
