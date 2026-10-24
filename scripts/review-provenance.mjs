/** OVERDRIVE 6.1 — content-addressed human review record validation.
 *
 * A web link or an AI-written rationale never qualifies as independently signed off.
 * This validator only checks record completeness; humans must independently check
 * reviewer attribution and evidence in a code-review PR.
 */
import {createHash} from 'node:crypto';
import {qualitySignals,nearDuplicateCandidates} from './quality-metrics.mjs';

export const REVIEW_SCHEMA_VERSION=1;
export const DOMAIN_ORDER=['セキュリティ','耐障害性','パフォーマンス','コスト最適化'];
export const REPOSITORY='c-a-p-engineer/certification-study';

const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
const doc=x=>{
 if(typeof x!=='string')return false;
 try{const u=new URL(x);return u.protocol==='https:'&&u.hostname==='docs.aws.amazon.com'}catch{return false}
};
const gitPull=x=>{
 if(typeof x!=='string')return false;
 try{const u=new URL(x);return u.protocol==='https:'&&u.hostname==='github.com'&&
  /^\/c-a-p-engineer\/certification-study\/pull\/[1-9]\d*$/.test(u.pathname)}catch{return false}
};
export function questionFingerprint(q){
 const payload={id:q.id,domain:q.domain,question:q.question,choices:q.choices,answers:q.answers??[q.answer],explanation:q.explanation,distractorReasons:q.distractorReasons??null,reference:q.reference};
 return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
export function validateReviewLedger(ledger,bank){
 if(!object(ledger)||ledger.schemaVersion!==REVIEW_SCHEMA_VERSION||!Array.isArray(ledger.decisions)||ledger.decisions.length>bank.length)throw new Error('Invalid review decision ledger schema');
 const byId=new Map(bank.map(q=>[q.id,q])),seen=new Set();
 const valid=[];
 for(const x of ledger.decisions){
  if(!object(x)||!byId.has(x.questionId)||seen.has(x.questionId))throw new Error('Unknown or repeated signed review ID '+String(x?.questionId));
  seen.add(x.questionId);
  if(!['approved','needs_changes','rejected'].includes(x.decision))throw new Error('Invalid reviewer decision: '+x.questionId);
  if(x.reviewerType!=='human'||typeof x.reviewerGithub!=='string'||!/^[a-z\d](?:[a-z\d-]{0,37})$/i.test(x.reviewerGithub)||
     x.reviewerGithub.toLowerCase()==='chatgpt'||x.reviewerGithub.toLowerCase()==='ai')throw new Error('Human reviewer attribution required: '+x.questionId);
  if(!date(x.reviewedOn)||!gitPull(x.reviewPullRequest))throw new Error('Date and review PR required: '+x.questionId);
  if(typeof x.questionFingerprint!=='string'||x.questionFingerprint!==questionFingerprint(byId.get(x.questionId)))throw new Error('Review is stale or answer changed: '+x.questionId);
  if(!Array.isArray(x.evidence)||x.evidence.length<1||x.evidence.length>16||
   x.evidence.some(e=>!object(e)||!doc(e.url)||!date(e.accessedOn)||typeof e.claim!=='string'||e.claim.trim().length<25))throw new Error('Claim-level AWS official evidence required: '+x.questionId);
  if(!object(x.checks)||['stem','correctAnswer','everyDistractor','serviceCaveats','examScope'].some(key=>x.checks[key]!==true))throw new Error('Complete independent claim checks required: '+x.questionId);
  if(typeof x.summary!=='string'||x.summary.trim().length<70)throw new Error('Substantive review notes required: '+x.questionId);
  valid.push(x);
 }
 return valid;
}
export function reviewerStatus(ledger,bank){
 const decisions=validateReviewLedger(ledger,bank);
 return {total:bank.length,approved:decisions.filter(x=>x.decision==='approved').length,
  needsChanges:decisions.filter(x=>x.decision==='needs_changes').length,
  rejected:decisions.filter(x=>x.decision==='rejected').length,
  independentReviewPending:bank.length-decisions.length,
  limitation:'CI validates evidence schema and question fingerprint. It cannot establish reviewer identity or factual accuracy; human PR review is mandatory.'};
}
export function prioritizeForIndependentReview(bank,spotChecked=new Set(),count=40){
 const pairs=nearDuplicateCandidates(bank),overlaps=new Map();
 for(const p of pairs){overlaps.set(p.a,(overlaps.get(p.a)??0)+1);overlaps.set(p.b,(overlaps.get(p.b)??0)+1)}
 const scored=bank.map(q=>{
  const s=qualitySignals(q,{duplicateCount:overlaps.get(q.id)??0,spotChecked:spotChecked.has(q.id)});
  return {id:q.id,domain:q.domain,priorityScore:s.score,signals:s.reasons,reference:q.reference,
   questionFingerprint:questionFingerprint(q),humanSignoff:'pending'};
 }).sort((a,b)=>b.priorityScore-a.priorityScore||a.id.localeCompare(b.id));
 const limit=Math.max(0,Math.min(Number.isInteger(count)?count:40,bank.length));
 const quotas=DOMAIN_ORDER.map((_,i)=>Math.floor(limit/DOMAIN_ORDER.length)+(i<limit%DOMAIN_ORDER.length?1:0));
 const chosen=[],used=new Set();
 for(let i=0;i<DOMAIN_ORDER.length;i++){
  for(const item of scored.filter(x=>x.domain===DOMAIN_ORDER[i]).slice(0,quotas[i])){chosen.push(item);used.add(item.id)}
 }
 if(chosen.length<limit)for(const item of scored){if(chosen.length>=limit)break;if(!used.has(item.id)){chosen.push(item);used.add(item.id)}}
 return chosen;
}
