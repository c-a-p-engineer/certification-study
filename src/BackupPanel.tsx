import React,{useState} from 'react';
import {Download,FileCheck2,ShieldAlert,Upload} from 'lucide-react';
import {createBackup,restoreBackup,backupPreview,inspectRestoreJournal,recoverInterruptedRestore,BACKUP_KEYS,RESTORE_JOURNAL_KEY,MAX_BACKUP_BYTES,type BackupData} from './backup.ts';
import {createVerifiedBackup,readPortableBackup,emergencySnapshot,type PortableRead} from './backupIntegrity.ts';
import './backup.css';
function saveFile(content:string,filename:string){
 const file=new Blob([content],{type:'application/json'});
 const url=URL.createObjectURL(file);
 const a=document.createElement('a');a.href=url;a.download=filename;
 document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export default function BackupPanel(){
 const [incoming,setIncoming]=useState<BackupData|null>(null);
 const [integrity,setIntegrity]=useState<PortableRead['integrity']|null>(null);
 const [status,setStatus]=useState('');
 async function download(){
  try{
   const content=JSON.stringify(await createVerifiedBackup(localStorage),null,2);
   saveFile(content,'overdrive-study-'+new Date().toISOString().slice(0,10)+'.json');
   setStatus('SHA-256で内容の整合性を記録したv2バックアップを保存しました。外部送信はしていません。');
  }catch(e){setStatus('保存できませんでした：'+(e instanceof Error?e.message:'ブラウザの権限を確認してください'))}
 }
 async function inspect(file:File|undefined){
  setIncoming(null);setIntegrity(null);setStatus('');
  if(!file)return;
  if(file.size>MAX_BACKUP_BYTES){setStatus('ファイルが大きすぎます（最大8MB）');return}
  try{const parsed=await readPortableBackup(await file.text());setIncoming(parsed.data);setIntegrity(parsed.integrity);setStatus(parsed.integrity==='verified'?'SHA-256の整合性を検証しました。':'v1形式を読み込みました。署名・ハッシュ検証がない従来のバックアップです。')}
  catch(e){setStatus('読み込みを中止：'+(e instanceof Error?e.message:'不正なファイルです'))}
 }
 function restore(){
  if(!incoming)return;
  const info=backupPreview(incoming);
  if(!window.confirm('現在の学習記録・XP・敵HP・設定をバックアップの内容で置き換えます。\n復元前に現在のデータを保存しましたか？\n\n復元する記録：'+info.answered+'回答 / '+info.xp+' XP'))return;
  try{restoreBackup(incoming,localStorage);window.location.reload()}
  catch(e){setStatus('復元できませんでした。元の記録の復旧を試みました：'+(e instanceof Error?e.message:'ブラウザの保存領域を確認してください'))}
 }
 function saveEmergency(){
  try{
   const raw=JSON.stringify(emergencySnapshot(localStorage,BACKUP_KEYS,RESTORE_JOURNAL_KEY),null,2);
   saveFile(raw,'overdrive-emergency-'+new Date().toISOString().slice(0,10)+'.json');
   setStatus('緊急退避JSONを保存しました。通常の復元ファイルとしては読み込めません。');
  }catch(e){setStatus('緊急退避できませんでした：'+(e instanceof Error?e.message:'保存領域を確認してください'))}
 }
 function retryRecovery(){
  if(!window.confirm('未完了の復元を、記録済みの元データへ戻しますか？事前に緊急退避JSONを保存してください。'))return;
  try{if(recoverInterruptedRestore(localStorage)){window.location.reload();return}
   setStatus('未完了の復元記録はありません。')
  }catch(e){setStatus('復旧を中断しました。緊急退避してから確認してください：'+(e instanceof Error?e.message:'原因不明'))}
 }
 const journal=(()=>{try{return inspectRestoreJournal(localStorage)}catch{return {state:'unavailable' as const,message:'保存領域の状態を確認できません。'}}})();
 const summary=incoming?backupPreview(incoming):null;
 const current=(()=>{try{return backupPreview(createBackup(localStorage))}catch{return null}})();
 return <section className="backup-panel" aria-labelledby="backup-heading">
  <h4 className="gm-section-title" id="backup-heading"><FileCheck2 size={19}/> STUDY BACKUP</h4>
  <p>回答履歴、XP、称号、敵HP、途中のミッション、設定をJSONで保存できます。サーバーへの送信はありません。</p>
  <button type="button" className="backup-save" onClick={()=>{void download()}}><Download size={18}/> バックアップをダウンロード</button>
  <label className="backup-picker"><Upload size={18}/> JSONファイルを選択<input type="file" accept=".json,application/json" onChange={e=>{void inspect(e.currentTarget.files?.[0])}}/></label>
  <div className="backup-recovery" aria-label="復元の安全性確認">
   <strong>RESTORE SAFETY · {journal.state==='none'?'通常':journal.state==='recoverable'?'復旧可能':journal.state==='invalid'?'要確認':'ストレージ利用不可'}</strong>
   <p>{journal.message}</p>
   <details className="recovery-guide"><summary>復元トラブル時の手順を見る</summary>
    <ol>
     <li>最初に「現在の保存領域を緊急退避」を押し、ファイルを自分だけがアクセスできる場所に保管します。</li>
     <li>ハッシュ不一致が表示された場合、ファイルを変更せず別のバックアップを選びます。v2ファイルは変更を検出して復元を拒否します。</li>
     <li>「復旧可能」なら、退避後に元の内容への復旧を再試行します。破損・アクセス不可の状態でブラウザのサイトデータを削除しないでください。</li>
     <li>保存容量不足やプライベートモードでは、新しいデータを書けない場合があります。ストレージ空き容量と通常ブラウザでの起動を確認します。</li>
     <li>緊急退避ファイルは通常のバックアップとして直接インポートできません。記録を保持したまま調査するための原本です。</li>
    </ol>
   </details>
   <button type="button" onClick={saveEmergency}>現在の保存領域を緊急退避</button>
   {journal.state==='recoverable'&&<button type="button" onClick={retryRecovery}>元の保存内容へ復旧を試す</button>}
   <small>緊急退避には学習履歴や設定、復旧記録が含まれます。第三者に共有しないでください。内容はこの端末内で生成されます。</small>
  </div>
  {summary&&<div className="backup-preview" role="group" aria-label="復元するバックアップ"><strong>復元予定のデータ</strong><span className="backup-integrity">{integrity==='verified'?'SHA-256整合性チェック成功 · v2': '旧形式v1 · 整合性チェック対象外'}</span><span>保存日：{new Date(summary.date).toLocaleString('ja-JP')}</span><span>復元ファイル：回答 {summary.answered}問・XP {summary.xp.toLocaleString()}</span>{current&&<span>現在の記録：回答 {current.answered}問・XP {current.xp.toLocaleString()}</span>}{current&&(summary.answered<current.answered||summary.xp<current.xp)&&<strong>注意：現在より古い記録に戻る可能性があります。先にバックアップを保存してください。</strong>}<span>敵：ステージ {summary.stage}　項目：{summary.savedKeys}</span><button type="button" onClick={restore}><ShieldAlert size={17}/> 確認して復元する</button></div>}
  <p className="backup-message" role="status" aria-live="polite">{status}</p>
  <p className="gm-caveat">SHA-256はファイル破損の検出に使用し、作成者の真正性や悪意ある改ざん防止は保証しません。旧v1バックアップも読み込めます。復元は現在の保存データを置き換えます。端末やブラウザ間で自動同期はされません。機密情報を含む可能性があるためJSONの共有先に注意してください。</p>
 </section>;
}
