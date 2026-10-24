/** 6.6 — original offline architectural decisions; not a reproduction of AWS exam questions. */
export type DesignChoice={id:string;label:string;feedback:string};
export type DesignStep={id:string;heading:string;context:string;options:readonly DesignChoice[];correct:string;why:string;reference:string};
export const DESIGN_CASES=[
 {id:'ha-web',title:'Multi-AZ Web Tier',domain:'耐障害性',objective:'単一AZ障害に耐えるWeb層を設計',nodes:['利用者','ALB','AZ-A EC2','AZ-B EC2','共有セッション'],steps:[
  {id:'capacity',heading:'負荷分散の設計',context:'AZ障害が発生してもHTTPリクエストを正常なAZへ流す。運用負担は最小にしたい。',options:[
   {id:'a',label:'2つのAZにEC2を配置しALBのヘルスチェックで分散',feedback:'各AZへ配置し、ALBが正常なターゲットへ転送できる構成。'},
   {id:'b',label:'EC2を一つのAZに集約して大型化',feedback:'AZそのものが停止すれば全台同時に利用不能になる。'},
   {id:'c',label:'DNSだけを設定しEC2の正常性チェックを省略',feedback:'DNSだけでは各インスタンスの異常を適切に除外できない。'}
  ],correct:'a',why:'AZ境界を跨いだ冗長化とターゲット正常性確認の組み合わせ。',reference:'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html'},
  {id:'session',heading:'セッションの保護',context:'ユーザーがEC2障害で別のAZへ振り分けられても、ログイン状態を維持したい。アプリ自体は複数AZへ配備済みだ。',options:[
   {id:'a',label:'セッションをそれぞれのEC2のローカルメモリだけに保存',feedback:'切り替え先に状態がなく再ログインが必要になり得る。'},
   {id:'b',label:'セッションを適切な共有ストアへ外部化',feedback:'個々のEC2を置換してもセッションを取得できる設計。'},
   {id:'c',label:'ALBヘルスチェックを完全に停止',feedback:'異常なターゲットが振り分け対象に残り、利用者が障害ノードに接続するリスクがある。'}
  ],correct:'b',why:'ステートレスなアプリインスタンスと共有セッションストアを組み合わせる。',reference:'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/sticky-sessions.html'},
  {id:'replacement',heading:'異常なEC2の置き換え',context:'障害AZの復旧後、運用者が手作業でEC2を作り直す負担を減らしたい。利用数が変動しても必要な台数を維持する。',options:[
   {id:'a',label:'EBS容量だけを増やす',feedback:'ストレージ容量は計算ホストの自動復旧に関与しない。'},
   {id:'b',label:'ALBログをオフにする',feedback:'ALBログを停止してもEC2の自動復旧能力は増えず、障害分析に必要な監査データを失う。'},
   {id:'c',label:'複数AZ対応のAuto Scaling Groupで望ましい容量を維持',feedback:'グループがヘルスに応じインスタンスを起動・置換する。'}
  ],correct:'c',why:'Auto Scalingは希望容量とAZ分散を維持できる。',reference:'https://docs.aws.amazon.com/autoscaling/ec2/userguide/auto-scaling-benefits.html'}
 ]},
 {id:'private-s3',title:'Private S3 Access',domain:'セキュリティ',objective:'VPC内ワークロードからS3へ安全に接続',nodes:['Private EC2','S3 Gateway Endpoint','S3 Bucket','Policy Guard'],steps:[
  {id:'route',heading:'ネットワーク経路',context:'プライベートサブネットのEC2がS3へ接続する。NAT Gatewayを追加せずプライベート経路を作りたい。',options:[
   {id:'a',label:'すべてのEC2へパブリックIPv4を付ける',feedback:'公開IPv4付与はプライベート経路の要求に反する。'},
   {id:'b',label:'S3ゲートウェイVPCエンドポイントとサブネット経路を設定',feedback:'ゲートウェイエンドポイントでS3へ私設経路を構成できる。'},
   {id:'c',label:'Internet Gatewayだけを追加してルートテーブルを放置',feedback:'プライベートインスタンスのS3向け経路と権限が不足する。'}
  ],correct:'b',why:'S3 Gateway Endpointに関連付けたルートテーブルを介して通信する。',reference:'https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html'},
  {id:'policy',heading:'バケットポリシー',context:'指定したVPCEから来たリクエストだけを許したい。IAM権限は別途付与済みだが、運用担当者のコンソール接続にも注意が必要。',options:[
   {id:'a',label:'aws:SourceVpce条件による明示的Denyを設ける',feedback:'指定外の経路を拒否できるがコンソール利用も影響を受ける。'},
   {id:'b',label:'Refererヘッダーの文字列だけで接続元を判断',feedback:'容易に偽装でき、VPCエンドポイントの接続元確認ではない。'},
   {id:'c',label:'S3を一般公開してHTTPS利用者をすべて許可',feedback:'バケットを一般公開すると社内ワークロードのみに利用を制限する要件を満たせず、漏えいリスクが増す。'}
  ],correct:'a',why:'aws:SourceVpce制約はコンソールを閉め出す可能性があるため復旧手段も設計する。',reference:'https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies-vpc-endpoint.html'},
  {id:'kms',heading:'クロスアカウント暗号鍵',context:'別アカウントの監査ロールがSSE-KMSで保護されたオブジェクトを復号する必要がある。',options:[
   {id:'a',label:'S3を公開してKMSのチェックを省略',feedback:'SSE-KMSの復号はS3へのアクセス許可だけでは成立せず、KMS側のDecryptなどの認可が必要。'},
   {id:'b',label:'aws/s3管理キーを共有許可へ書き換える',feedback:'AWS管理キーの独自クロスアカウントポリシーは変更できない。'},
   {id:'c',label:'顧客管理KMSキーとS3・KMS双方の最小権限を設定',feedback:'暗号化データには対象オブジェクトと暗号鍵の両方の認可が必要。'}
  ],correct:'c',why:'S3のGetObjectだけでなくKMSの復号認可が別途必要。',reference:'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html'}
 ]},
 {id:'rds-choice',title:'Read Scaling & Failover',domain:'パフォーマンス',objective:'RDSの読み取り負荷とフェイルオーバーを区別',nodes:['Web API','RDS Writer','Standby / Replica','Read Pool'],steps:[
  {id:'ha',heading:'スタンバイの役割',context:'既存の単一スタンバイ型RDS Multi-AZ DBインスタンスを利用。別AZ障害で自動フェイルオーバーしたい。',options:[
   {id:'a',label:'Multi-AZ DBインスタンス配置を維持し同期スタンバイを使う',feedback:'高可用性用途であり、単一スタンバイは読み取りを受け付けない。'},
   {id:'b',label:'非同期リードレプリカだけへ置き換え、完全自動フェイルオーバーを保証',feedback:'リードレプリカ単独では同じフェイルオーバー仕様ではない。'},
   {id:'c',label:'日次スナップショットだけを設定',feedback:'定期バックアップは自動フェイルオーバーではない。'}
  ],correct:'a',why:'単一スタンバイのMulti-AZ DBインスタンスはHA用途。',reference:'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html'},
  {id:'read',heading:'参照クエリの増加',context:'同期スタンバイは読めない構成のまま、参照SQLを別の接続先に分離して性能を改善したい。',options:[
   {id:'a',label:'同期スタンバイへ直接SELECTをルーティング',feedback:'従来型単一スタンバイ型では読み取り先にできない。'},
   {id:'b',label:'リードレプリカを追加し参照接続を分離',feedback:'別のリードレプリカへ参照を分散できるが、非同期複製のため最新データとの差を許容できる用途に使う。'},
   {id:'c',label:'自動バックアップを無効にすると読み取り性能が倍増する',feedback:'バックアップ設定だけでは読み取り先の増強にならない。'}
  ],correct:'b',why:'リードレプリカは読み取り負荷分散、Multi-AZのスタンバイはHAという役割分担。',reference:'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html'},
  {id:'cluster',heading:'別構成の見極め',context:'RDS Multi-AZ DBクラスターへ移行する場合、従来型と異なる読み取り機能として正しいものは？',options:[
   {id:'a',label:'Multi-AZのどの構成もスタンバイは読めない',feedback:'Multi-AZ DBクラスターには読み取り可能なスタンバイがある。'},
   {id:'b',label:'Multi-AZ DBクラスターはAZ障害への耐性を持たない',feedback:'Multi-AZ DBクラスターは複数AZでの冗長化に対応する。'},
   {id:'c',label:'2つの読み取り可能なスタンバイを持つDBクラスター構成がある',feedback:'従来型DBインスタンス配置とDBクラスター配置の違い。'}
  ],correct:'c',why:'RDS Multi-AZ DBクラスターのリーダーへ読み取り接続できる。',reference:'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html'}
 ]},
 {id:'pitr-recovery',title:'DynamoDB Recovery',domain:'耐障害性',objective:'データ事故後の安全な比較復旧を設計',nodes:['Live Table','PITR Backup','New Table','Compare & Cutover'],steps:[
  {id:'backup',heading:'事故前の備え',context:'DynamoDBでオペレーターによる大量の誤削除に備え、過去時点のデータ復元が必要。',options:[
   {id:'a',label:'DynamoDB Streamsだけを有効化し永久保存を期待',feedback:'Streamsには保持期間の制約がありPITRの代替ではない。'},
   {id:'b',label:'DynamoDBのPITRを有効化する',feedback:'事前にPITRを有効化すれば、設定された復元可能期間内の指定時点へ新規テーブルとして復元できる。'},
   {id:'c',label:'毎日テーブルの名称を変更',feedback:'テーブル名を変更しても過去時点のデータは生成されず、事故前の内容への復元はできない。'}
  ],correct:'b',why:'PITRは操作ミス前の時点を選んで復元できる。',reference:'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Point-in-time-recovery.html'},
  {id:'restore',heading:'リストア先',context:'稼働中のDynamoDBテーブルへの新規注文書き込みを止めず、事故直前の状態を別テーブルに復元して現在の状態と比較したい。',options:[
   {id:'a',label:'指定した時点のデータを新しいテーブルへリストア',feedback:'稼働中のテーブルを上書きせずに差分を調査できる。'},
   {id:'b',label:'PITR復元で現行テーブルを必ず上書きする',feedback:'DynamoDB PITRの復元先は新しいテーブルとなる。'},
   {id:'c',label:'Global Secondary Indexを追加すれば削除データが復旧する',feedback:'GSIは追加のキーで検索するための仕組みで、削除済みアイテムを過去時点へ戻すことはできない。'}
  ],correct:'a',why:'PITRは新しい独立したDynamoDBテーブルへ復元される。',reference:'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/pointintimerecovery_restores.html'},
  {id:'rollout',heading:'復旧後の切り替え',context:'新しいテーブルに復元した後、データ内容と周辺設定を確かめてからアプリの接続先を切り替えたい。必須の追加作業は何か？',options:[
   {id:'a',label:'復元テーブルはIAM・Streams・TTL・PITRなどすべて自動で継承されるとみなす',feedback:'IAM許可、ストリーム、TTLやPITRの設定などは復元テーブルで再構成が必要な場合がある。'},
   {id:'b',label:'接続先とリソース設定を確認せずに即座に削除',feedback:'直ちに削除すると復元内容の照合やアプリ接続先の検証ができず、二次的なデータ事故を招き得る。'},
   {id:'c',label:'データ差分を確認しIAM、Streams、TTLなど復元後の設定を点検',feedback:'復元後の構成を個別確認し、段階的な切り替えを計画する。'}
  ],correct:'c',why:'復元した新しいテーブルではすべての設定が自動継承されるわけではない。',reference:'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/pointintimerecovery_restores.html'}
 ]}
] as const;
export type DesignCaseId=typeof DESIGN_CASES[number]['id'];
export type DesignProgress={records:Partial<Record<DesignCaseId,{best:number;attempts:number;completedAt:number}>>;emblems:DesignCaseId[]};
export const initialDesignProgress=():DesignProgress=>({records:{},emblems:[]});
const validId=(id:unknown):id is DesignCaseId=>DESIGN_CASES.some(x=>x.id===id);
export function normalizeDesignProgress(value:unknown):DesignProgress{
 if(!value||typeof value!=='object'||Array.isArray(value))return initialDesignProgress();
 const p=value as Partial<DesignProgress>,records:DesignProgress['records']={};
 if(p.records&&typeof p.records==='object'&&!Array.isArray(p.records))for(const c of DESIGN_CASES){
  const r=p.records[c.id];
  if(r&&Number.isSafeInteger(r.best)&&r.best>=0&&r.best<=c.steps.length&&Number.isSafeInteger(r.attempts)&&r.attempts>=0&&r.attempts<=100000&&Number.isFinite(r.completedAt)&&r.completedAt>=0)records[c.id]={...r};
 }
 return {records,emblems:Array.isArray(p.emblems)?[...new Set(p.emblems.filter(validId))].filter(x=>records[x]?.best===DESIGN_CASES.find(c=>c.id===x)?.steps.length):[]};
}
export function evaluateDesignChoice(caseId:DesignCaseId,stepId:string,optionId:string){
 const c=DESIGN_CASES.find(x=>x.id===caseId),step=c?.steps.find(x=>x.id===stepId);
 if(!step)throw Error('Unknown scenario step');
 const choice=step.options.find(x=>x.id===optionId);
 if(!choice)throw Error('Unknown answer option');
 return {correct:step.correct===optionId,feedback:choice.feedback,why:step.why,reference:step.reference};
}
export function recordDesignCompletion(raw:unknown,id:DesignCaseId,correct:number,now=Date.now()){
 const p=normalizeDesignProgress(raw),def=DESIGN_CASES.find(x=>x.id===id);
 if(!def||!Number.isSafeInteger(correct)||correct<0||correct>def.steps.length)return {state:p,firstClear:false,emblemUnlocked:false,bonusXp:0 as const};
 const old=p.records[id],firstClear=!old,emblemUnlocked=correct===def.steps.length&&!p.emblems.includes(id);
 return {state:{records:{...p.records,[id]:{best:Math.max(correct,old?.best??0),attempts:Math.min(100000,(old?.attempts??0)+1),completedAt:old?.completedAt??now}},emblems:emblemUnlocked?[...p.emblems,id]:[...p.emblems]},firstClear,emblemUnlocked,bonusXp:0 as const};
}
