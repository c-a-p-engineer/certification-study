import type {EnemyId} from '../enemyCampaign.ts';

/** 3D is a visual prototype; canonical QUEST opponent names, IDs, HP and damage stay intact. */
export type SkeletonVariant='minion'|'warrior'|'mage';
export function questEnemyVariant(enemyId:EnemyId,boss:boolean):SkeletonVariant{
 if(boss||enemyId==='dragon')return 'mage';
 if(enemyId==='armor'||enemyId==='phoenix')return 'minion';
 return 'warrior';
}
export const SKELETON_LABELS:Record<SkeletonVariant,string>={
 minion:'Skeleton Minion',warrior:'Skeleton Warrior',mage:'Skeleton Mage',
};
