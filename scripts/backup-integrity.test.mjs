import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {BACKUP_KEYS,RESTORE_JOURNAL_KEY,createBackup,parseBackup,restoreBackup,inspectRestoreJournal} from '../src/backup.ts';
import {createVerifiedBackup,readPortableBackup,emergencySnapshot} from '../src/backupIntegrity.ts';
const progress={xp:137,best:7,answered:3,correct:2,mistakes:['saa-001'],domains:{},reviews:{},retrievalRewards:{day:'2026-10-24',questionIds:['saa-001']}};
const store=(seed={})=>{const items=new Map(Object.entries(seed));return {items,getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)}};
const origin=()=>store({[BACKUP_KEYS[0]]:JSON.stringify(progress),'cert-overdrive-smart-profile-v1':'review'});
test('v2 portable backup uses deterministic Web Crypto SHA-256 and imports intact XP/rewards',async()=>{
 const original=origin();const v2=await createVerifiedBackup(original,new Date('2026-10-24T00:00:00Z'));
 assert.equal(v2.version,2);assert.equal(v2.integrity.algorithm,'SHA-256');assert.match(v2.integrity.digest,/^[a-f0-9]{64}$/);
 const parsed=await readPortableBackup(JSON.stringify(v2));
 assert.equal(parsed.schemaVersion,2);assert.equal(parsed.integrity,'verified');
 const target=store();restoreBackup(parsed.data,target);
 assert.equal(JSON.parse(target.getItem(BACKUP_KEYS[0])).xp,137);
 assert.deepEqual(JSON.parse(target.getItem(BACKUP_KEYS[0])).retrievalRewards.questionIds,['saa-001']);
 assert.equal(target.getItem('cert-overdrive-smart-profile-v1'),'review');
 const reordered={...v2,items:Object.fromEntries(Object.entries(v2.items).reverse())};
 assert.equal((await readPortableBackup(JSON.stringify(reordered))).integrity,'verified');
});
test('v2 rejects corrupt XP, timestamp and digest before mutating local progress',async()=>{
 const v2=await createVerifiedBackup(origin());
 const old=store({[BACKUP_KEYS[0]]:JSON.stringify({...progress,xp:900})});
 for(const modified of [
  {...v2,items:{...v2.items,[BACKUP_KEYS[0]]:JSON.stringify({...progress,xp:999})}},
  {...v2,createdAt:'2026-10-23T00:00:00Z'},
  {...v2,integrity:{algorithm:'SHA-256',digest:'0'.repeat(64)}}
 ]){
  await assert.rejects(()=>readPortableBackup(JSON.stringify(modified)),/整合性エラー/);
  assert.equal(JSON.parse(old.getItem(BACKUP_KEYS[0])).xp,900);
 }
});
test('old v1 backup imports, but never claims it passed integrity verification',async()=>{
 const v1=createBackup(origin());
 const parsed=await readPortableBackup(JSON.stringify(v1));
 assert.equal(parsed.schemaVersion,1);assert.equal(parsed.integrity,'legacy-unverified');
 assert.equal(parsed.data.version,1);
 assert.equal(parseBackup(JSON.stringify(v1)).items[BACKUP_KEYS[0]],v1.items[BACKUP_KEYS[0]]);
 await assert.rejects(()=>readPortableBackup(JSON.stringify({...v1,version:3})),/未対応/);
});
test('damaged backup structure and malformed daily reward claims fail validation',async()=>{
 const v2=await createVerifiedBackup(origin());
 await assert.rejects(()=>readPortableBackup(JSON.stringify({...v2,items:{...v2.items,unrelated:'secret'}})),/バックアップ項目/);
 const invalid=createBackup(store({[BACKUP_KEYS[0]]:JSON.stringify({...progress,retrievalRewards:{day:'2026-10-24',questionIds:['a','a']}})}));
 assert.throws(()=>parseBackup(JSON.stringify(invalid)),/学習記録/);
});
test('recovery snapshot preserves raw journal for user export without clearing or modifying storage',()=>{
 const previous=Object.fromEntries(BACKUP_KEYS.map(k=>[k,null]));
 previous[BACKUP_KEYS[0]]=JSON.stringify(progress);
 const journal=JSON.stringify({version:1,previous});
 const st=store({[BACKUP_KEYS[0]]:JSON.stringify({...progress,xp:9}),[RESTORE_JOURNAL_KEY]:journal});
 assert.equal(inspectRestoreJournal(st).state,'recoverable');
 const snapshot=emergencySnapshot(st,BACKUP_KEYS,RESTORE_JOURNAL_KEY);
 assert.equal(snapshot.format,'CERT-OVERDRIVE-RECOVERY-SNAPSHOT');
 assert.equal(snapshot.journal,journal);
 assert.equal(JSON.parse(st.getItem(BACKUP_KEYS[0])).xp,9);
 assert.equal(st.getItem(RESTORE_JOURNAL_KEY),journal);
 assert.equal(inspectRestoreJournal(store({[RESTORE_JOURNAL_KEY]:'oops'})).state,'invalid');
 const blocked={getItem:()=>{throw new Error('blocked')},setItem:()=>{},removeItem:()=>{}};
 assert.equal(inspectRestoreJournal(blocked).state,'unavailable');
 assert.equal(inspectRestoreJournal(store()).state,'none');
});
test('backup UI uses verified portable reader and non-destructive recovery guidance',()=>{
 const ui=readFileSync('src/BackupPanel.tsx','utf8');
 assert.ok(ui.includes('createVerifiedBackup(localStorage)'));
 assert.ok(ui.includes('readPortableBackup(await file.text())'));
 assert.ok(ui.includes('緊急退避'));
 assert.ok(ui.includes('SHA-256はファイル破損の検出'));
 assert.ok(ui.includes('window.confirm('));
 assert.ok(!ui.includes('localStorage.clear('));
});
