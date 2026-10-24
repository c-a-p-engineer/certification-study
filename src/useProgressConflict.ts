import {useEffect,useRef,useState} from 'react';
import {PROGRESS_SAVE_KEY,guardedProgressSave,generateTabWriterId,progressStorageChanged,progressConflictSnapshot,type SaveResult} from './progressSync.ts';

/** Read-only fail-safe. Avoids any automatic merge of two inconsistent XP/review histories. */
export function useProgressConflict<T>(progress:T,initialRestoreBlocked=false){
 const [issue,setIssue]=useState<Exclude<SaveResult,{status:'saved'}>|null>(null);
 const [snapshotMessage,setSnapshotMessage]=useState('');
 const paused=useRef(initialRestoreBlocked);
 const expectedRaw=useRef<string|null>((()=>{try{return localStorage.getItem(PROGRESS_SAVE_KEY)}catch{return null}})());
 const writerId=useRef(generateTabWriterId());
 const queue=useRef<Promise<void>>(Promise.resolve());
 const didMount=useRef(false);
 useEffect(()=>{
  if(!didMount.current){didMount.current=true;return}
  if(paused.current)return;
  queue.current=queue.current.then(async()=>{
   if(paused.current)return;
   const result=await guardedProgressSave(localStorage,expectedRaw.current,progress,writerId.current);
   if(result.status==='saved'){expectedRaw.current=result.serialized;return}
   paused.current=true;setIssue(result);
  }).catch(()=>{
   paused.current=true;setIssue({status:'unavailable',message:'学習履歴の保存結果を確認できません。古い記録からの上書きを防ぐため保存を停止しました。',atomic:false});
  });
 },[progress]);
 useEffect(()=>{
  if(initialRestoreBlocked){paused.current=true;return}
  const onStorage=(event:StorageEvent)=>{
   if(event.storageArea!==localStorage||paused.current)return;
   if(progressStorageChanged(expectedRaw.current,event)){
    paused.current=true;setIssue({status:'conflict',message:'別のタブまたは復元処理が記録を書き換えたため、このタブの保存を停止しました。',atomic:false});
   }
  };
  window.addEventListener('storage',onStorage);
  return()=>window.removeEventListener('storage',onStorage);
 },[initialRestoreBlocked]);
 const saveEmergency=()=>{
  try{
   const current=localStorage.getItem(PROGRESS_SAVE_KEY);
   const snapshot=JSON.stringify(progressConflictSnapshot(progress,expectedRaw.current,current),null,2);
   const blob=new Blob([snapshot],{type:'application/json'}),url=URL.createObjectURL(blob);
   const link=document.createElement('a');
   link.href=url;link.download='overdrive-tab-recovery-'+new Date().toISOString().slice(0,10)+'.json';
   document.body.appendChild(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),30000);
   setSnapshotMessage('このタブの状態を退避しました。通常の学習バックアップとして直接インポートできない確認用JSONです。');
  }catch{setSnapshotMessage('退避ファイルを保存できませんでした。ブラウザの保存権限と空き容量を確認してください。')}
 };
 return {issue,readonlyRef:paused,saveEmergency,snapshotMessage};
}
