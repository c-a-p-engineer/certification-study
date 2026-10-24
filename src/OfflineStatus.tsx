import React,{useEffect,useState} from 'react';
import {HardDriveDownload,RefreshCw,WifiOff} from 'lucide-react';
import {inspectOffline,inspectStorageQuota,type StorageEstimate,type OfflineSnapshot} from './offlineStatus.ts';
import './qualityGrowth.css';
export default function OfflineStatus({activeMission}:{activeMission:boolean}){
 const [info,setInfo]=useState<OfflineSnapshot|null>(null);
 const [message,setMessage]=useState('');
 const [quota,setQuota]=useState<StorageEstimate|null>(null);
 function refresh(){void inspectOffline().then(setInfo).catch(()=>setMessage('ブラウザのオフライン保存領域を確認できませんでした。'));void inspectStorageQuota().then(setQuota).catch(()=>{})}
 useEffect(()=>{let mounted=true;const read=()=>{void inspectOffline().then(x=>{if(mounted)setInfo(x)}).catch(()=>{});void inspectStorageQuota().then(x=>{if(mounted)setQuota(x)}).catch(()=>{})};read();window.addEventListener('online',read);window.addEventListener('offline',read);return ()=>{mounted=false;window.removeEventListener('online',read);window.removeEventListener('offline',read)}},[]);
 async function checkUpdate(){
  if(activeMission){setMessage('途中のミッションが残っています。先に再開・終了してから更新を確認してください。');return}
  try{const reg=await navigator.serviceWorker?.getRegistration('/certification-study/');if(!reg){setMessage('ブラウザがService Workerを使用できません。');return}
   await reg.update();setMessage('更新を確認しました。新しい版があればホーム画面から適用できます。');refresh();
  }catch{setMessage('更新の確認に失敗しました。接続を確認してください。')}
 }
 return <details className="offline-status">
  <summary><HardDriveDownload size={17}/> OFFLINE STATUS <strong>{info?.status==='ready'?'キャッシュ準備済み':info?.status==='partial'?'一部のみ保存':'未確認'}</strong></summary>
  <div className="offline-meta"><span>オンライン検知：{info?.online?'接続中':'オフライン'}</span><span>Service Worker：{info?.swControlled?'制御中':'未制御'}</span><span>ローカル版：{info?.cacheRevision??'—'}</span><span>保存ファイル：{info?.assetCount??0}件</span><span>ストレージ推定使用量：{quota?Math.round(quota.usageBytes/1048576*10)/10+' MB':'—'}</span><span>利用可能容量の目安：{quota?.percent===null||quota?.percent===undefined?'—':quota.percent+'% 使用'}</span><span>永続保存：{quota?.persistent===true?'許可済み':quota?.persistent===false?'未許可':'不明'}</span></div>
  <div className="offline-actions"><button type="button" onClick={refresh}><RefreshCw size={16}/> 状態を再確認</button><button type="button" onClick={()=>{void checkUpdate()}} disabled={activeMission}><RefreshCw size={16}/> 更新を確認</button></div>
  <p role="status" aria-live="polite">{message}</p>
  <details className="offline-help"><summary>Android・Braveでオフライン学習する手順</summary><ol>
   <li>通信中にこのページを最後まで読み込み、Service Workerが制御中でキャッシュが準備済みか確認します。</li>
   <li>必要に応じてブラウザのメニューから「ホーム画面に追加」などを選びます。提供されるメニューやPWAの対応はブラウザの設定で変わります。</li>
   <li>通信を切った状態で再度ページを開き、問題バンクと保存記録を確認してください。AWSの外部ドキュメントへのリンクはオフラインでは開けません。</li>
   <li>更新や復元の前に、設定メニューからJSONバックアップを端末へ保存することを推奨します。</li>
  </ol></details>
  <p className="offline-caveat"><WifiOff size={16}/> 初回のオンライン読み込みとキャッシュ保存に成功した後にオフライン学習が可能です。ストレージの消去・ブラウザの自動削除・プライベートモードでは使えないことがあります。容量はブラウザによる推定値であり保証値ではありません。外部AWSドキュメントやGitHubリンクはオフラインでは開けません。表示は保存状況の目安で、実機のネットワーク切断試験の代わりではありません。</p>
 </details>;
}
