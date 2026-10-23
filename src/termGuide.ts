import {GLOSSARY} from './glossary.ts';
import {CONCEPT_READINGS,ABBREVIATION_READINGS} from './termReadings.ts';

export type StudyTerm={id:string;title:string;reading:string;english?:string;meaning:string;note:string;category:'略語'|'AWSサービス'|'技術用語'};
type Concept=StudyTerm&{aliases:readonly string[]};

const concept=(id:string,title:string,english:string,meaning:string,note:string,aliases:string[]=[title]):Concept=>({
 id,title,reading:CONCEPT_READINGS[id]||title,english,meaning,note,aliases,category:'AWSサービス'
});
const idea=(id:string,title:string,meaning:string,note:string,aliases:string[]=[title]):Concept=>({
 id,title,reading:CONCEPT_READINGS[id]||title,meaning,note,aliases,category:'技術用語'
});

/** Curated definitions for SAA-C03. Match actual words in each question, not fabricated AI summaries. */
export const CONCEPTS:readonly Concept[]=[
 concept('s3','Amazon S3','Amazon Simple Storage Service','オブジェクトストレージ','ファイルなどのオブジェクトをバケットに保存する。EBSのようなEC2用ブロックストレージではない。',['S3','Amazon S3','S3バケット']),
 concept('ec2','Amazon EC2','Amazon Elastic Compute Cloud','仮想サーバー','CPU・メモリ・OSなどを選んで仮想マシンを実行する。インスタンス停止中もEBSなどには費用が発生する。',['EC2','Amazon EC2']),
 concept('rds','Amazon RDS','Amazon Relational Database Service','マネージドRDB','MySQL・PostgreSQLなどのDB運用を支援する。Multi-AZは高可用性、リードレプリカは主に読み取り分散。',['RDS','Amazon RDS']),
 concept('aurora','Amazon Aurora','Amazon Aurora','AWSのマネージドリレーショナルDB','MySQL/PostgreSQL互換のDB。レプリカ、ストレージの分散設計、リーダーエンドポイントなどが重要。',['Aurora','Amazon Aurora']),
 concept('dynamodb','Amazon DynamoDB','Amazon DynamoDB','サーバーレスNoSQLデータベース','キーに基づく低遅延アクセス向け。パーティションキーの偏りや読み取り整合性を考慮する。',['DynamoDB','Amazon DynamoDB']),
 concept('lambda','AWS Lambda','AWS Lambda','イベント駆動のサーバーレス実行','サーバー管理を減らしイベントに応じて処理する。実行時間・同時実行数・メモリによるCPU量を考慮する。',['Lambda','AWS Lambda']),
 concept('sqs','Amazon SQS','Amazon Simple Queue Service','メッセージキュー','送信側と処理側を疎結合にする。標準キューは重複受信に備えて冪等処理を設計する。',['SQS','Amazon SQS']),
 concept('sns','Amazon SNS','Amazon Simple Notification Service','通知・ファンアウト','トピックの購読先へイベントを配信する。SNS→複数SQSキューで受信者ごとの独立処理ができる。',['SNS','Amazon SNS']),
 concept('cloudfront','Amazon CloudFront','Amazon CloudFront','CDN・エッジ配信','利用者に近い拠点からキャッシュを配信する。キャッシュキーとTTLの設計が性能・鮮度を左右する。',['CloudFront','Amazon CloudFront']),
 concept('route53','Amazon Route 53','Amazon Route 53','DNS・ヘルスチェック','ドメイン名と接続先を管理し、フェイルオーバーなどのDNSルーティングを提供する。DNSキャッシュで切替に遅延が生じうる。',['Route 53','Route53']),
 concept('cloudwatch','Amazon CloudWatch','Amazon CloudWatch','メトリクス・ログ・監視','メトリクスとログを収集し、アラームや可視化に使う。CloudTrailは主にAWS API操作の監査。',['CloudWatch','Amazon CloudWatch']),
 concept('cloudtrail','AWS CloudTrail','AWS CloudTrail','AWS API操作の監査ログ','誰が、いつ、どのAWS APIを呼んだかを追跡する。システム負荷を監視するCloudWatchとは役割が異なる。',['CloudTrail','AWS CloudTrail']),
 concept('config','AWS Config','AWS Config','構成変更・コンプライアンス評価','AWSリソースの構成履歴や設定ルールへの準拠を確認する。CloudTrailのAPI監査とは目的が異なる。',['AWS Config']),
 concept('secrets','AWS Secrets Manager','AWS Secrets Manager','秘密情報の管理・ローテーション','DBパスワードやAPIキーなどを保管し、アクセス制御やローテーションと組み合わせる。',['Secrets Manager','AWS Secrets Manager']),
 concept('waf','AWS WAF','AWS Web Application Firewall','HTTPリクエストの防御','Web ACLルールでSQLインジェクションなどのパターンを検査する。DDoS保護に主眼を置くShieldとは異なる。',['AWS WAF']),
 concept('guardduty','Amazon GuardDuty','Amazon GuardDuty','脅威検出','AWS内のログ・シグナルを分析して不審な活動を検出する。WAFのように個々のHTTP要求を直接遮断するものではない。',['GuardDuty','Amazon GuardDuty']),
 concept('inspector','Amazon Inspector','Amazon Inspector','脆弱性管理','EC2やサポート対象のコンテナイメージなどのソフトウェア脆弱性を継続検出する。',['Amazon Inspector']),
 concept('macie','Amazon Macie','Amazon Macie','S3の機密データ検出','S3バケットに保存された個人情報などの機密データを検出し、露出リスクの把握を支援する。',['Macie','Amazon Macie']),
 concept('organizations','AWS Organizations','AWS Organizations','複数AWSアカウントの組織管理','組織単位で請求やSCPなどのガードレールを管理できる。SCPは個々の許可を付与しない。',['Organizations','AWS Organizations']),
 concept('identitycenter','IAM Identity Center','AWS IAM Identity Center','AWSアカウントへの一元サインイン','複数アカウントへの認証・許可セットをまとめて扱う。長期IAMユーザーの複製を避けられる。',['Identity Center','IAM Identity Center']),
 concept('nat','NAT Gateway','NAT Gateway','プライベートサブネットからの外向き通信','プライベート側から外部へ接続する仕組み。S3などにはVPCエンドポイントでNAT経由を減らせる場合がある。',['NAT Gateway']),
 concept('privatelink','AWS PrivateLink','AWS PrivateLink','AWSサービスへのプライベート接続','インターフェイスVPCエンドポイントなどを通して、インターネットを経由せず対応サービスへ接続する。',['PrivateLink','AWS PrivateLink']),
 concept('api-gateway','Amazon API Gateway','Amazon API Gateway','API公開・認証・リクエスト制御','HTTP・RESTなどのAPI入口を管理し、Lambda等と組み合わせて利用できる。',['API Gateway']),
 concept('eventbridge','Amazon EventBridge','Amazon EventBridge','イベントの振り分け','ルールに従ってイベントをターゲットへ配送する。キューで仕事を蓄積するSQSとは用途が異なる。',['EventBridge']),
 concept('stepfunctions','AWS Step Functions','AWS Step Functions','ワークフロー制御','ステートマシンで順序・分岐・リトライ・エラー処理を組み立てる。',['Step Functions']),
 concept('fargate','AWS Fargate','AWS Fargate','コンテナ向けサーバーレス実行基盤','ECSやEKSで利用でき、EC2ホストの容量管理を直接行わずコンテナを実行できる。',['Fargate']),
 concept('ecs','Amazon ECS','Amazon Elastic Container Service','AWSのコンテナオーケストレーション','コンテナタスクやサービスを管理する。起動方式としてEC2またはFargateを選ぶ。',['ECS','Amazon ECS']),
 concept('eks','Amazon EKS','Amazon Elastic Kubernetes Service','マネージドKubernetes','Kubernetesクラスタのコントロールプレーン運用をAWSが担う。PodのIAMアクセス制御も重要。',['EKS','Amazon EKS']),
 concept('efs','Amazon EFS','Amazon Elastic File System','Linux向け共有ファイルストレージ','複数EC2からNFSで共有できる。EBSは主にEC2にアタッチするブロックストレージ。',['EFS','Amazon EFS']),
 concept('ebs','Amazon EBS','Amazon Elastic Block Store','EC2向けブロックストレージ','インスタンスからディスクのように利用する。IOPS、スループット、スナップショットの設計が重要。',['EBS','Amazon EBS']),
 concept('athena','Amazon Athena','Amazon Athena','S3のデータをSQLで分析','S3上のデータをサーバーレスで分析できる。データ形式やスキャン量は性能・料金に影響する。',['Athena','Amazon Athena']),
 concept('datasync','AWS DataSync','AWS DataSync','ファイル・オブジェクト転送','オンプレミスとAWSストレージ間などでデータ転送や検証を自動化する。',['DataSync','AWS DataSync']),
 concept('backup','AWS Backup','AWS Backup','バックアップの集中管理','対応するAWSサービスのバックアップ計画、保持、コピーなどを共通ポリシーで管理する。',['AWS Backup']),
 concept('savingsplans','Savings Plans','AWS Savings Plans','計算サービスの利用額コミット割引','一定の時間あたり利用額にコミットして割引を受ける。需要変動や契約期間のリスクを確認する。',['Savings Plans']),
 concept('costexplorer','AWS Cost Explorer','AWS Cost Explorer','AWS費用の可視化・分析','サービス別・タグ別の利用料金や傾向を調べる。予算通知はAWS Budgetsの役割。',['Cost Explorer']),
 concept('budgets','AWS Budgets','AWS Budgets','AWS予算と通知','予算の実績・予測超過を通知できる。費用の分析そのものはCost Explorerと使い分ける。',['Budgets','AWS Budgets']),
 concept('dax','DynamoDB Accelerator (DAX)','DynamoDB Accelerator','DynamoDB向けインメモリキャッシュ','繰り返し読み取られるデータへのアクセスを速くできる。強い読み取り整合性の要件には注意。',['DAX']),
 idea('multi-az','Multi-AZ','複数アベイラビリティーゾーン配置','単一AZの障害に備えて分散する構成。RDSではDBインスタンス型と読み取り可能なDBクラスター型を区別する。',['Multi-AZ','マルチAZ']),
 idea('failover','フェイルオーバー','障害時の切り替え','稼働系が故障した際、待機系や別リージョンの構成へ処理を切り替えること。DNS切替には伝播・キャッシュ遅延がある。',['フェイルオーバー','フェイル オーバー']),
 idea('read-replica','リードレプリカ','読み取り用のDB複製','読み取りクエリを別DBへ分散する。高可用性専用のスタンバイと混同しない。',['リードレプリカ','読み取りレプリカ']),
 idea('idempotency','冪等性','処理を何度実行しても同じ結果になる性質','メッセージの再配送やリトライが起きても注文の二重請求などを防ぐ設計に使う。',['冪等','冪等性']),
 idea('latency','レイテンシー','処理・通信の遅延時間','リクエストから応答までの待ち時間。高スループットでもレイテンシーが短いとは限らない。',['レイテンシー','低遅延']),
 idea('throughput','スループット','単位時間あたりの処理量','秒間リクエスト数や転送量など。レイテンシーは1件あたりの待ち時間。',['スループット','高スループット']),
 idea('cache','キャッシュ','繰り返す読み取りを高速化する仕組み','元データを再取得せず近くに保持する。TTLや無効化で古いデータとの整合性を管理する。',['キャッシュ','キャッシング']),
 idea('least-privilege','最小権限','必要な操作だけを許可する原則','IAMなどで必要な対象・アクションに限定する。AdministratorAccessの一律付与は避ける。',['最小権限']),
 idea('stateless','ステートレス','処理担当ノードが利用者状態に依存しない設計','セッションなどを共有ストアに分離するとスケールや故障時の入れ替えが容易になる。',['ステートレス']),
 idea('async','非同期処理','処理の完了を待たずに次へ進む方式','キューと組み合わせると急増する負荷の緩衝や再試行に向く。',['非同期']),
 idea('partitionkey','パーティションキー','データの分散先を決めるキー','DynamoDBではアクセスが偏るホットパーティションを避けるようキー分布を設計する。',['パーティションキー','ホットパーティション']),
 idea('warm-standby','ウォームスタンバイ','縮小構成を常時稼働する災害復旧方式','別リージョン等に最低限のサービスを動かし、障害時にスケールアップして切り替える。',['ウォームスタンバイ']),
 idea('pilot-light','パイロットライト','中核となる最小構成だけ待機する災害復旧方式','データや必要な基盤を維持し、本格復旧時にアプリ層などを増設して稼働させる。',['パイロットライト']),
 idea('interface-endpoint','インターフェイスVPCエンドポイント','PrivateLink経由のプライベート接続','対応サービスにプライベートIPで接続する。ENIやセキュリティグループを利用する。',['Interface Endpoint','Interface VPC Endpoint','インターフェイスエンドポイント']),
 idea('gateway-endpoint','ゲートウェイVPCエンドポイント','S3/DynamoDB向けのVPCルート接続','ルートテーブルを使って対応サービスへ到達する。インターフェイスエンドポイントとは課金・構成が異なる。',['Gateway Endpoint','Gateway VPC Endpoint','ゲートウェイエンドポイント']),
 idea('autoscaling','Auto Scaling','必要な容量を自動調整する仕組み','メトリクスや予定に応じて台数を増減する。マルチAZやロードバランサーと組み合わせる。',['Auto Scaling','オートスケーリング']),
 idea('spot','スポットインスタンス','余剰EC2容量の割引利用','中断される可能性があるため、再試行可能なバッチなどに向く。',['Spot','スポットインスタンス']),
 idea('on-demand','オンデマンド','使用した分だけ支払う購入形態','長期コミットをせず必要な期間だけ利用する方式。一定負荷ではSavings Plans等も比較する。',['On-Demand','オンデマンド']),
 idea('envelope','エンベロープ暗号化','データキーを別の鍵で保護する暗号方式','データ本体はデータキーで暗号化し、データキーをKMS鍵で保護する。',['エンベロープ暗号化']),
 idea('multi-region','マルチリージョン','複数AWSリージョンに配置する設計','リージョン全体の障害に備えられる一方、データ複製・コスト・切替の複雑さが増す。',['マルチリージョン','複数リージョン']),
 idea('retrypolicy','指数バックオフ','失敗するたび再試行の間隔を延ばす方式','同時アクセスの集中を避けるため、ランダムなジッターと併用することがある。',['指数バックオフ','ジッター'])
];

const matched=(text:string,term:string)=>{
 if(!term)return false;
 const escaped=term.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');
 const latin=/^[A-Za-z0-9][A-Za-z0-9 .\-()]*$/.test(term);
 return new RegExp(latin?'(^|[^A-Za-z0-9])'+escaped+'(?=$|[^A-Za-z0-9])':escaped,'i').test(text);
};
const score=(parts:readonly string[],aliases:readonly string[])=>{
 let best=0;
 for(const alias of aliases){
  if(matched(parts[0],alias))best=Math.max(best,60);
  if(matched(parts[1],alias))best=Math.max(best,40);
  if(matched(parts[2],alias))best=Math.max(best,15);
 }
 return best;
};
export function findStudyTerms(question:{question:string;choices:string[];explanation:string;distractorReasons?:string[]},limit=8):StudyTerm[]{
 const segments=[question.question,question.explanation,question.choices.join(' ')+(question.distractorReasons||[]).join(' ')];
 const acronyms=GLOSSARY;
 const found:{term:StudyTerm;weight:number}[]=[];
 for(const c of CONCEPTS){
  const weight=score(segments,c.aliases);
  if(weight)found.push({term:{id:c.id,title:c.title,reading:c.reading,english:c.english,meaning:c.meaning,note:c.note,category:c.category},weight});
 }
 for(const acronym of acronyms){
  const weight=score(segments,[acronym.abbr]);
  if(!weight)continue;
  // Prefer a richer AWS service definition when it explains the same abbreviation.
  const duplicate=found.some(x=>x.term.category==='AWSサービス'&&matched(x.term.title,acronym.abbr));
  if(!duplicate)found.push({term:{id:'abbr-'+acronym.abbr,title:acronym.abbr,reading:ABBREVIATION_READINGS[acronym.abbr]||acronym.abbr,english:acronym.full,meaning:acronym.meaning,note:acronym.note,category:'略語'},weight:weight+5});
 }
 return found.sort((a,b)=>b.weight-a.weight||a.term.title.localeCompare(b.term.title,'ja')).slice(0,Math.max(0,limit)).map(x=>x.term);
}
