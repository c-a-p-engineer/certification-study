export type Term = {abbr:string;full:string;meaning:string;note:string};
export const GLOSSARY:readonly Term[]=[
 {abbr:'RTO',full:'Recovery Time Objective',meaning:'目標復旧時間',note:'障害発生後、業務・サービスを何時間以内に復旧させるかという目標。'},
 {abbr:'RPO',full:'Recovery Point Objective',meaning:'目標復旧時点',note:'障害時に何分・何時間前までのデータ損失を許容できるかという目標。'},
 {abbr:'MTBF',full:'Mean Time Between Failures',meaning:'平均故障間隔',note:'修理可能なシステムで、故障から次の故障までの平均稼働時間。'},
 {abbr:'MTTR',full:'Mean Time To Repair',meaning:'平均修復時間',note:'故障発生後、修理して稼働状態に戻すまでの平均時間。'},
 {abbr:'SLO',full:'Service Level Objective',meaning:'サービスレベル目標',note:'可用性や応答時間などのサービス品質に関する具体的な目標。'},
 {abbr:'SLI',full:'Service Level Indicator',meaning:'サービスレベル指標',note:'可用性や応答時間など、SLOの達成度を計測する指標。'},
 {abbr:'SLA',full:'Service Level Agreement',meaning:'サービスレベル合意',note:'サービスの提供者と利用者の間で合意する品質・責任などの条件。'},
 {abbr:'AZ',full:'Availability Zone',meaning:'アベイラビリティーゾーン',note:'AWSリージョン内の独立した障害ドメイン。'},
 {abbr:'IAM',full:'Identity and Access Management',meaning:'IDおよびアクセス管理',note:'AWSリソースへのアクセス認証・認可を管理する仕組み。'},
 {abbr:'VPC',full:'Virtual Private Cloud',meaning:'仮想プライベートクラウド',note:'AWS上に構築する論理的に分離された仮想ネットワーク。'},
 {abbr:'ALB',full:'Application Load Balancer',meaning:'アプリケーションロードバランサー',note:'HTTP/HTTPSのリクエストをルールに応じて分散するロードバランサー。'},
 {abbr:'NLB',full:'Network Load Balancer',meaning:'ネットワークロードバランサー',note:'主にトランスポート層の接続を分散するロードバランサー。'},
 {abbr:'NACL',full:'Network Access Control List',meaning:'ネットワークアクセスコントロールリスト',note:'サブネット境界に適用するステートレスな通信制御。'},
 {abbr:'WAF',full:'Web Application Firewall',meaning:'Webアプリケーションファイアウォール',note:'HTTPリクエストをルールで検査・制御する仕組み。'},
 {abbr:'KMS',full:'Key Management Service',meaning:'鍵管理サービス',note:'暗号鍵の作成・管理と暗号化操作を支援するAWSサービス。'},
 {abbr:'STS',full:'Security Token Service',meaning:'セキュリティトークンサービス',note:'一時的な認証情報を発行するサービス。'},
 {abbr:'SCP',full:'Service Control Policy',meaning:'サービスコントロールポリシー',note:'AWS Organizations内のアカウントに対するアクセス許可の上限を定める。'},
 {abbr:'TTL',full:'Time To Live',meaning:'有効期間',note:'キャッシュやDNSレコードなどの情報を保持する時間。'},
 {abbr:'DLQ',full:'Dead-Letter Queue',meaning:'デッドレターキュー',note:'処理に失敗したメッセージを隔離・調査するためのキュー。'},
 {abbr:'IOPS',full:'Input/Output Operations Per Second',meaning:'1秒あたりの入出力操作数',note:'ストレージが1秒間に処理できるI/O操作の数。'},
 {abbr:'DAX',full:'DynamoDB Accelerator',meaning:'DynamoDB向けキャッシュ',note:'DynamoDB互換のインメモリキャッシュサービス。'},
 {abbr:'OAC',full:'Origin Access Control',meaning:'オリジンアクセスコントロール',note:'CloudFrontからS3などのオリジンへのアクセスを制限する仕組み。'}
];
export function findTerms(...texts:string[]):Term[]{
 const haystack=texts.join(' ');
 return GLOSSARY.filter(term=>new RegExp('(^|[^A-Za-z0-9])'+term.abbr+'(?=$|[^A-Za-z0-9])').test(haystack));
}
