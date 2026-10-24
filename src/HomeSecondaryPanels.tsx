import React from 'react';
import {BookOpen,ChevronDown} from 'lucide-react';
import EnemyCampaignPanel from './EnemyCampaignPanel';
import ExpeditionBoard from './ExpeditionBoard';
import DesignSimulator from './DesignSimulator';
import RetentionQuestBoard from './RetentionQuestBoard';
import SmartQuestBoard from './SmartQuestBoard';
import BossBoard from './BossBoard';
import ActivityTimeline from './ActivityTimeline';
import GrowthDashboard from './GrowthDashboard';
import LearningInsights from './LearningInsights';
import SkillTreeBoard from './SkillTreeBoard';
import RelicVault from './RelicVault';
import HomeMasteryCoverage from './HomeMasteryCoverage';

/** Pure display composition of the four optional home sections.
 * Session starts, saves, progression, equipment, and review changes stay in App.
 */
export type HomeSecondaryPanelsProps={
 campaign:React.ComponentProps<typeof EnemyCampaignPanel>;
 expedition:React.ComponentProps<typeof ExpeditionBoard>;
 design:React.ComponentProps<typeof DesignSimulator>;
 retention:React.ComponentProps<typeof RetentionQuestBoard>;
 smart:React.ComponentProps<typeof SmartQuestBoard>;
 boss:React.ComponentProps<typeof BossBoard>;
 timeline:React.ComponentProps<typeof ActivityTimeline>;
 growth:React.ComponentProps<typeof GrowthDashboard>;
 insights:React.ComponentProps<typeof LearningInsights>;
 skills:React.ComponentProps<typeof SkillTreeBoard>;
 relic:React.ComponentProps<typeof RelicVault>;
 mastery:React.ComponentProps<typeof HomeMasteryCoverage>;
};
export default function HomeSecondaryPanels({campaign,expedition,design,retention,smart,boss,timeline,growth,insights,skills,relic,mastery}:HomeSecondaryPanelsProps){
 return <>
  <details className="home-hub-drawer" data-section="adventure"><summary><span className="home-drawer-title">冒険・設計チャレンジ</span><span className="home-drawer-description">モンスター討伐・遠征・AWS設計演習</span><ChevronDown size={20}/></summary><div className="home-drawer-content"><EnemyCampaignPanel {...campaign}/>
  <ExpeditionBoard {...expedition}/>
  <DesignSimulator {...design}/>
  </div></details><details className="home-hub-drawer" data-section="review"><summary><span className="home-drawer-title">もっと学習する</span><span className="home-drawer-description">期限が来た復習・おすすめ問題・ボス戦</span><ChevronDown size={20}/></summary><div className="home-drawer-content"><RetentionQuestBoard {...retention}/>
   <SmartQuestBoard {...smart}/>
  <BossBoard {...boss}/>
  </div></details>
  <details className="home-hub-drawer" data-section="insights"><summary><span className="home-drawer-title">学習記録・成長分析</span><span className="home-drawer-description">学習日数・回答推移・復習の成果</span><ChevronDown size={20}/></summary><div className="home-drawer-content"><ActivityTimeline {...timeline}/>
   <GrowthDashboard {...growth}/>
  <LearningInsights {...insights}/>
  </div></details><details className="home-hub-drawer" data-section="collection"><summary><span className="home-drawer-title">スキル・コレクション</span><span className="home-drawer-description">習熟度・レリック・問題の進捗</span><ChevronDown size={20}/></summary><div className="home-drawer-content"><SkillTreeBoard {...skills}/>
  <RelicVault {...relic}/>
  <HomeMasteryCoverage {...mastery}/></div></details><div className="footnote"><BookOpen size={15}/> Original practice content · Unofficial learning project · Not affiliated with AWS</div>
 </>;
}
