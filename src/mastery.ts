// Heuristic topic categories used only for learning navigation, never official exam scoring.
export const TOPICS=[
 {name:'IAM / 認証',tokens:['IAM','Identity Center','AssumeRole','STS','MFA','Cognito','SCP','Organizations']},
 {name:'VPC / ネットワーク',tokens:['VPC','NAT Gateway','Direct Connect','Transit Gateway','PrivateLink','NACL','CIDR']},
 {name:'S3 / ストレージ',tokens:['S3','EBS','EFS','FSx','Glacier','Storage Lens']},
 {name:'データベース',tokens:['RDS','Aurora','DynamoDB','DAX','ElastiCache','Redshift']},
 {name:'サーバーレス',tokens:['Lambda','API Gateway','Step Functions','Fargate','EventBridge']},
 {name:'可用性 / DR',tokens:['Multi-AZ','RPO','RTO','フェイルオーバー','障害復旧','ウォームスタンバイ']},
 {name:'監視 / セキュリティ',tokens:['CloudWatch','CloudTrail','GuardDuty','WAF','KMS','Security Hub','Inspector']},
 {name:'配信 / 負荷分散',tokens:['CloudFront','ALB','NLB','Global Accelerator','Route 53']},
 {name:'コスト最適化',tokens:['Savings Plans','Cost Explorer','Budgets','Spot','RI','価格','料金','コスト']}
] as const;
export type TopicName=typeof TOPICS[number]['name'];
export function topicFor(question:{question:string;choices:string[];explanation:string;tags?:string[]}):TopicName{
 const text=[question.question,...question.choices,question.explanation,...(question.tags||[])].join(' ').toLowerCase();
 let best:TopicName=TOPICS[0].name,highest=0;
 for(const topic of TOPICS){let score=0;for(const token of topic.tokens)if(text.includes(token.toLowerCase()))score+=1;if(score>highest){highest=score;best=topic.name}}
 return highest===0?'可用性 / DR':best;
}
export type MasteryEntry={seen:number;due:number;retained:number;lapses:number};
export function masteryByTopic(questions:ReadonlyArray<{id:string;question:string;choices:string[];explanation:string;tags?:string[]}>,reviews:Record<string,{streak:number;lapses:number;dueAt:number}>,now=Date.now()):Record<TopicName,MasteryEntry>{
 const totals=Object.fromEntries(TOPICS.map(t=>[t.name,{seen:0,due:0,retained:0,lapses:0}])) as Record<TopicName,MasteryEntry>;
 for(const q of questions){const r=reviews[q.id];if(!r)continue;const x=totals[topicFor(q)];x.seen++;if(r.dueAt<=now)x.due++;if(r.streak>=3)x.retained++;x.lapses+=r.lapses}
 return totals;
}
