import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {PROGRESS_SAVE_KEY,RESTORE_PENDING_KEY,PROGRESS_LOCK_NAME,parseProgressMeta,guardedProgressSave,progressStorageChanged,progressConflictSnapshot} from '../src/progressSync.ts';
import {validProgress,createBackup,parseBackup,restoreBackup} from '../src/backup.ts';
const progress={xp:100,best:1,answered:1,correct:1,mistakes:[],reviews:{},domains:{}};
const store=(items={})=>{const map=new Map(Object.entries(items));return {map,getItem:key=>map.get(key)??null,setItem:(key,v)=>map.set(key,v),removeItem:key=>map.delete(key)}};
test('legacy saved progress receives optional revision metadata without mutating historical XP',async()=>{
 const raw=JSON.stringify(progress),db=store({[PROGRESS_SAVE_KEY]:raw});
 const result=await guardedProgressSave(db,raw,{...progress,xp:125},'tab-writer-123',100,undefined);
 assert.equal(result.status,'saved');if(result.status!=='saved')return;
 assert.equal(result.meta.revision,1);assert.equal(result.meta.writerId,'tab-writer-123');
 assert.equal(JSON.parse(result.serialized).xp,125);
 assert.equal(validProgress(JSON.parse(result.serialized)),true);
 const next=await guardedProgressSave(db,result.serialized,{...progress,xp:150},'tab-writer-123',101);
 assert.equal(next.status,'saved');if(next.status==='saved')assert.equal(next.meta.revision,2);
});
test('two tabs cannot silently overwrite a known newer snapshot',async()=>{
 const db=store({[PROGRESS_SAVE_KEY]:JSON.stringify(progress)}),old=db.getItem(PROGRESS_SAVE_KEY);
 const a=await guardedProgressSave(db,old,{...progress,xp:160},'tab-writer-A',100);
 assert.equal(a.status,'saved');
 const b=await guardedProgressSave(db,old,{...progress,xp:180},'tab-writer-B',101);
 assert.equal(b.status,'conflict');
 assert.equal(JSON.parse(db.getItem(PROGRESS_SAVE_KEY)).xp,160);
});
test('Web Locks coordination serializes competing writers in the tested contract',async()=>{
 const db=store({[PROGRESS_SAVE_KEY]:JSON.stringify(progress)}),old=db.getItem(PROGRESS_SAVE_KEY);
 let tail=Promise.resolve();
 const lock={request:async(name,options,work)=>{
  assert.equal(name,PROGRESS_LOCK_NAME);assert.equal(options.mode,'exclusive');
  const wait=tail;let release;tail=new Promise(r=>release=r);await wait;
  try{return await work()}finally{release()}
 }};
 const [first,second]=await Promise.all([
  guardedProgressSave(db,old,{...progress,xp:120},'first-tab',100,lock),
  guardedProgressSave(db,old,{...progress,xp:130},'second-tab',101,lock)
 ]);
 assert.deepEqual([first.status,second.status],['saved','conflict']);
 assert.equal(JSON.parse(db.getItem(PROGRESS_SAVE_KEY)).xp,120);
 if(first.status==='saved')assert.equal(first.atomic,true);
});
test('restore journal blocks any autosave, preserving rollback data and XP',async()=>{
 const raw=JSON.stringify(progress),db=store({[PROGRESS_SAVE_KEY]:raw,[RESTORE_PENDING_KEY]:'{"version":1}'});
 const result=await guardedProgressSave(db,raw,{...progress,xp:900},'tab-writer-123');
 assert.equal(result.status,'restore-pending');
 assert.equal(db.getItem(PROGRESS_SAVE_KEY),raw);
 assert.equal(db.getItem(RESTORE_PENDING_KEY),'{"version":1}');
});
test('quota or access denial returns non-success and leaves previous values intact',async()=>{
 const raw=JSON.stringify(progress),db=store({[PROGRESS_SAVE_KEY]:raw});
 db.setItem=()=>{throw Error('quota')};
 const result=await guardedProgressSave(db,raw,{...progress,xp:200},'tab-writer-123');
 assert.equal(result.status,'unavailable');
 assert.equal(db.getItem(PROGRESS_SAVE_KEY),raw);
});
test('invalid progress metadata fails v1 backup checks while valid revision survives restore',async()=>{
 assert.equal(validProgress({...progress,_sync:{revision:-2,writerId:'bad',updatedAt:0}}),false);
 assert.equal(validProgress({...progress,_sync:{revision:1,writerId:'good-tab',updatedAt:0}}),true);
 const db=store({[PROGRESS_SAVE_KEY]:JSON.stringify({...progress,_sync:{revision:1,writerId:'good-tab',updatedAt:0}})});
 const v1=createBackup(db);
 const validated=parseBackup(JSON.stringify(v1));
 const target=store();restoreBackup(validated,target);
 assert.equal(JSON.parse(target.getItem(PROGRESS_SAVE_KEY))._sync.revision,1);
});
test('external storage event and emergency snapshot provide read-only conflict recovery',()=>{
 const raw=JSON.stringify(progress);
 assert.equal(progressStorageChanged(raw,{key:PROGRESS_SAVE_KEY,newValue:raw}),false);
 assert.equal(progressStorageChanged(raw,{key:PROGRESS_SAVE_KEY,newValue:'changed'}),true);
 assert.equal(progressStorageChanged(raw,{key:RESTORE_PENDING_KEY,newValue:'journal'}),true);
 const snapshot=progressConflictSnapshot({...progress,xp:115},raw,'{"xp":160}',new Date('2026-10-24T00:00:00Z'));
 assert.equal(snapshot.format,'CERT-OVERDRIVE-CONFLICT-SNAPSHOT');
 assert.equal(snapshot.localUnsavedProgress.xp,115);
 assert.equal(snapshot.currentSavedRaw,'{"xp":160}');
 assert.equal(snapshot.expectedSavedRaw,raw);
 assert.equal(JSON.stringify(snapshot).includes('private diagnostic snapshot'),true);
});
test('React blocks stale quiz answers and autosave and displays accessible recovery-only screen',()=>{
 const hook=readFileSync('src/useProgressConflict.ts','utf8'),main=readFileSync('src/main.tsx','utf8');
 const css=readFileSync('src/qualityGrowth.css','utf8');
 assert.ok(main.includes("import {useProgressConflict} from './useProgressConflict.ts'"));
 assert.ok(main.includes('syncBlocked.current||restoreBlocked||selected!==null'));
 assert.ok(main.includes('if(syncBlocked.current||restoreBlocked)return;'));
 assert.ok(main.includes('if(syncIssue)return <main'));
 assert.ok(main.includes('このタブの記録をJSONで退避'));
 assert.ok(main.includes('保存済みの最新データを読み直す'));
 assert.ok(!main.includes('localStorage.setItem(key,JSON.stringify(progress))'));
 assert.ok(hook.includes("window.addEventListener('storage',onStorage)"));
 assert.ok(hook.includes('guardedProgressSave('));
 assert.ok(css.includes('@media(max-width:400px)'));
 assert.ok(css.includes('.progress-conflict-banner button:focus-visible'));
});
