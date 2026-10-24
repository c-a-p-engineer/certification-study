import React from 'react';
import {ChevronDown,ExternalLink,Info} from 'lucide-react';

const OFFICIAL_EXAM_URL='https://aws.amazon.com/jp/certification/certified-solutions-architect-associate/';
const OFFICIAL_GUIDE_URL='https://docs.aws.amazon.com/ja_jp/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html';
const OFFICIAL_PRICING_URL='https://aws.amazon.com/certification/policies/before-testing/';
const OFFICIAL_PASS_FAQ_URL='https://aws.amazon.com/certification/faqs/';

/** AWS's exam facts, intentionally separate from the app's uncalibrated practice scores.
 * Source: official AWS SAA-C03 exam page, guide, pricing policy, and scoring FAQ (checked 2026-10-25).
 * These facts may change; users should confirm their booking details with AWS.
 */
export default React.memo(function ExamOfficialGuide(){
 return <details className="exam-official-guide">
  <summary>
   <span className="exam-official-label"><Info size={17} aria-hidden="true"/> 試験情報・公式リンク</span>
   <span className="exam-official-summary-numbers">65問 · 130分 · 合格720点</span>
   <ChevronDown size={18} aria-hidden="true" className="exam-official-chevron"/>
  </summary>
  <div className="exam-official-content">
   <div className="exam-official-stats">
    <div><span>本番の問題数</span><strong>65問</strong><small>採点対象50問＋対象外15問</small></div>
    <div><span>試験時間</span><strong>130分</strong><small>1問あたり平均2分</small></div>
    <div><span>公式合格基準</span><strong>720点</strong><small>100〜1,000点の換算スコア</small></div>
    <div><span>日本での受験料</span><strong>20,000円</strong><small>適用税・最新料金は公式案内で確認</small></div>
   </div>
   <p><strong>何問正解すれば合格？</strong> AWSは必要正解数を公開していません。720点＝72%正解ではなく、試験の難易度を調整した換算スコアです。採点対象外の15問は本番で区別できません。</p>
   <p><strong>このアプリでの自主目標：</strong>65問模擬試験で正答率80%（52問）程度を繰り返し安定して取ること。ただし非公式の学習目安であり、実際の合格を保証するものではありません。</p>
   <p>公式の分野配分：セキュリティ30%・耐障害性26%・パフォーマンス24%・コスト最適化20%。択一選択と複数選択があります。</p>
   <div className="exam-official-links">
    <a href={OFFICIAL_EXAM_URL} target="_blank" rel="noopener noreferrer">AWS公式試験ページ <ExternalLink size={14} aria-hidden="true"/></a>
    <a href={OFFICIAL_GUIDE_URL} target="_blank" rel="noopener noreferrer">SAA-C03公式試験ガイド（日本語） <ExternalLink size={14} aria-hidden="true"/></a>
    <a href={OFFICIAL_PRICING_URL} target="_blank" rel="noopener noreferrer">公式受験料金 <ExternalLink size={14} aria-hidden="true"/></a>
    <a href={OFFICIAL_PASS_FAQ_URL} target="_blank" rel="noopener noreferrer">AWS公式：合格点・正解数のFAQ <ExternalLink size={14} aria-hidden="true"/></a>
   </div>
   <small className="exam-official-disclaimer">2026年10月25日にAWS公式ページで確認。申し込み前には必ず最新の公式条件をご確認ください。この学習アプリはAWSの公式模擬試験ではありません。</small>
  </div>
 </details>;
});
