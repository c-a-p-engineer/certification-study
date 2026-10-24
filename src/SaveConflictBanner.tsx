import React,{useState} from 'react';
import {AlertTriangle,Download,RefreshCw,EyeOff} from 'lucide-react';
import type {SaveBlockReason} from './localSaveGuard.ts';
import './saveConflict.css';
const descriptions:Record<SaveBlockReason,string>={
 'external-write':'別のタブまたはウィンドウで、この端末の学習記録が更新されました。',
 'restore-journal':'バックアップの復元が未完了です。復元記録を守るため通常の保存を停止しています。',
 'storage-unavailable':'このタブでは安全に学習データを保存できません。容量・ブラウザの保存設定を確認してください。'
};
export default function SaveConflictBanner({reason,onReload,onExport}:{reason:SaveBlockReason;onReload:()=>void;onExport:()=>void}){
 const [collapsed,setCollapsed]=useState(false);
 return <aside className="save-conflict-banner" role="alert" aria-labelledby="save-conflict-title">
  <div className="save-conflict-heading"><AlertTriangle size={19}/><strong id="save-conflict-title">学習記録の保存を一時停止しました</strong></div>
  <p>{descriptions[reason]} 既存のXP・復習記録を上書きしないため、**このタブからの自動保存は停止中**です。</p>
  {!collapsed?<><p>操作を続けてもこのタブの新しい回答は保存されません。先に緊急退避し、最新の保存データを読み直すことを推奨します。</p>
   <div className="save-conflict-actions">
    <button type="button" onClick={onExport}><Download size={16}/> 両方の記録を緊急退避</button>
    <button type="button" onClick={onReload}><RefreshCw size={16}/> 最新記録で再読み込み</button>
    <button type="button" onClick={()=>setCollapsed(true)}><EyeOff size={16}/> 操作を中止して閉じる</button>
   </div></>:<button type="button" className="save-conflict-expand" onClick={()=>setCollapsed(false)}>退避・再読み込み操作を表示</button>}
  <small>端末内の競合検知でありクラウド同期ではありません。localStorageには原子的な比較更新機能がないため、完全な同時書き込み防止は保証できません。緊急退避ファイルは通常の復元ファイルではなく、個人情報を含み得るため共有しないでください。</small>
 </aside>;
}
