import React,{useState} from 'react';
import {AlertTriangle,Download,RefreshCw,ShieldCheck} from 'lucide-react';
import type {ConflictReason} from './progressConcurrency.ts';
import './saveConflict.css';
const messages:Record<ConflictReason,string>={
 'external-change':'別のタブ・ウィンドウで同じ学習データが更新されました。現在のタブからの自動保存を停止し、新しい進捗を保護しています。',
 'invalid-saved-state':'ローカル保存データに不正な同期情報が見つかりました。安全のため自動保存を停止しました。',
 'storage-error':'ブラウザの保存領域へ正常にアクセスできません。保存失敗により現在のタブの自動保存を停止しました。'
};
export default function SaveConflictBanner({reason,onReload,onExport}:{reason:ConflictReason;onReload:()=>void;onExport:()=>void}){
 const [collapsed,setCollapsed]=useState(false);
 return <aside className="save-conflict" role="alert" aria-live="assertive" aria-label="学習データの保存が停止しています">
  <div className="save-conflict-top"><AlertTriangle size={19}/><strong>進捗の保存を一時停止しています</strong>
   {collapsed&&<button type="button" className="save-conflict-details" onClick={()=>setCollapsed(false)}>詳細を表示</button>}
  </div>
  {!collapsed&&<>
   <p>{messages[reason]}</p>
   <p>学習結果を失わないために、先にこのタブのデータを緊急退避してください。その後、最新の保存内容を読み込みます。</p>
   <div className="save-conflict-actions">
    <button type="button" onClick={onExport}><Download size={17}/> このタブを緊急退避</button>
    <button type="button" onClick={onReload}><RefreshCw size={17}/> 最新の進捗を読み込む</button>
    <button type="button" onClick={()=>setCollapsed(true)}>今は閉じる（保存停止は継続）</button>
   </div>
   <small><ShieldCheck size={14}/> 複数タブのデータは自動統合しません。緊急退避は通常のバックアップ形式ではありません。ブラウザ単体では完全な同時書き込みの排他制御を保証できません。</small>
  </>}
 </aside>;
}
