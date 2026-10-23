import React,{useEffect,useState} from 'react';
import {HardDriveDownload,RefreshCw,WifiOff} from 'lucide-react';
import {inspectOffline,type OfflineSnapshot} from './offlineStatus.ts';
import './qualityGrowth.css';
export default function OfflineStatus({activeMission}:{activeMission:boolean}){
 const [info,setInfo]=useState<OfflineSnapshot|null>(null);
 const [message,setMessage]=useState('');
 function refresh(){void inspectOffline().then(setInfo).catch(()=>setMessage('ブラウザのオフライン保存領域を確認できませんでした。'))}
 useEffect(()=>{let mounted=true;const read=()=>{void inspectOffline().then(x=>{if(mounted)setInfo(x)}).catch(()=>{})};read();window.addEventListener('online',read);window.addEventListener('offline',read);return ()=>{mounted=false;window.removeEventListener('online',read);window.removeEventListener('offline',read)}},[]);
 async function checkUpdate(){
  if(activeMission){setMessage('途中のミッションが残っています。先に再開・終了してから更新を確認してください。');return}
  try{const reg=await navigator.serviceWorker?.getRegistration('/certification-study/');if(!reg){setMessage('ブラウザがService Workerを使用できません。');return}
   await reg.update();setMessage('更新を確認しました。新しい版があればホーム画面から適用できます。');refresh();
  }catch{setMessage('更新の確認に失敗しました。接続を確認してください。')}
 }
 return <details className="offline-status">
  <summary><HardDriveDownload size={17}/> OFFLINE STATUS <strong>{info?.status==='ready'?'キャッシュ準備済み':info?.status==='partial'?'一部のみ保存':'未確認'}</strong></summary>
  <div className="offline-meta"><span>オンライン検知：{info?.online?'接続中':'オフライン'}</span><span>Service Worker：{info?.swControlled?'制御中':'未制御'}</span><span>ローカル版：{info?.cacheRevision??'—'}</span><span>保存ファイル：{info?.assetCount??0}件</span></div>
  <div className="offline-actions"><button type="button" onClick={refresh}><RefreshCw size={16}/> 状態を再確認</button><button type="button" onClick={()=>{void checkUpdate()}} disabled={activeMission}><RefreshCw size={16}/> 更新を確認</button></div>
  <p role="status" aria-live="polite">{message}</p>
  <p className="offline-caveat"><WifiOff size={16}/> 初回のオンライン読み込みとキャッシュ保存に成功した後にオフライン学習が可能です。ストレージの消去・ブラウザの自動削除・プライベートモードでは使えないことがあります。表示は保存状況の目安で、実機のネットワーク切断試験の代わりではありません。</p>
 </details>;
}
