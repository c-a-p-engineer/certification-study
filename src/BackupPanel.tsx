import React,{useState} from 'react';
import {Download,FileCheck2,ShieldAlert,Upload} from 'lucide-react';
import {createBackup,parseBackup,restoreBackup,backupPreview,MAX_BACKUP_BYTES,type BackupData} from './backup.ts';
import './backup.css';
export default function BackupPanel(){
 const [incoming,setIncoming]=useState<BackupData|null>(null);
 const [status,setStatus]=useState('');
 function download(){
  try{
   const content=JSON.stringify(createBackup(localStorage),null,2);
   const file=new Blob([content],{type:'application/json'});
   const url=URL.createObjectURL(file);
   const a=document.createElement('a');a.href=url;a.download='overdrive-study-'+new Date().toISOString().slice(0,10)+'.json';
   document.body.appendChild(a);a.click();a.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),30000);
   setStatus('バックアップファイルを保存しました。このファイルは外部へ送信されません。');
  }catch(e){setStatus('保存できませんでした：'+(e instanceof Error?e.message:'ブラウザの権限を確認してください'))}
 }
 async function inspect(file:File|undefined){
  setIncoming(null);setStatus('');
  if(!file)return;
  if(file.size>MAX_BACKUP_BYTES){setStatus('ファイルが大きすぎます（最大8MB）');return}
  try{const parsed=parseBackup(await file.text());setIncoming(parsed);setStatus('内容を検証しました。現在の記録を置き換える前に内容を確認してください。')}
  catch(e){setStatus('読み込みを中止：'+(e instanceof Error?e.message:'不正なファイルです'))}
 }
 function restore(){
  if(!incoming)return;
  const info=backupPreview(incoming);
  if(!window.confirm('現在の学習記録・XP・敵HP・設定をバックアップの内容で置き換えます。\n復元前に現在のデータを保存しましたか？\n\n復元する記録：'+info.answered+'回答 / '+info.xp+' XP'))return;
  try{restoreBackup(incoming,localStorage);window.location.reload()}
  catch(e){setStatus('復元できませんでした。元の記録の復旧を試みました：'+(e instanceof Error?e.message:'ブラウザの保存領域を確認してください'))}
 }
 const summary=incoming?backupPreview(incoming):null;
 return <section className="backup-panel" aria-labelledby="backup-heading">
  <h4 className="gm-section-title" id="backup-heading"><FileCheck2 size={19}/> STUDY BACKUP</h4>
  <p>回答履歴、XP、称号、敵HP、途中のミッション、設定をJSONで保存できます。サーバーへの送信はありません。</p>
  <button type="button" className="backup-save" onClick={download}><Download size={18}/> バックアップをダウンロード</button>
  <label className="backup-picker"><Upload size={18}/> JSONファイルを選択<input type="file" accept=".json,application/json" onChange={e=>{void inspect(e.currentTarget.files?.[0])}}/></label>
  {summary&&<div className="backup-preview" role="group" aria-label="復元するバックアップ"><strong>復元予定のデータ</strong><span>保存日：{new Date(summary.date).toLocaleString('ja-JP')}</span><span>回答：{summary.answered}問　XP：{summary.xp.toLocaleString()}</span><span>敵：ステージ {summary.stage}　項目：{summary.savedKeys}</span><button type="button" onClick={restore}><ShieldAlert size={17}/> 確認して復元する</button></div>}
  <p className="backup-message" role="status" aria-live="polite">{status}</p>
  <p className="gm-caveat">復元は現在の保存データを置き換えます。端末やブラウザ間で自動同期はされません。機密情報を含む可能性があるためJSONの共有先に注意してください。</p>
 </section>;
}
