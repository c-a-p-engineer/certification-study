export type Term = {abbr:string;full:string;meaning:string;note:string};
export const GLOSSARY:readonly Term[]=[
 {abbr:'RTO',full:'Recovery Time Objective',meaning:'目標復旧時間',note:'障害発生からサービスを再開するまでの許容時間。例：RTO 2時間なら2時間以内の復旧を目指す。RPOはデータ損失の許容範囲。'},
 {abbr:'RPO',full:'Recovery Point Objective',meaning:'目標復旧時点',note:'障害時に許容するデータ損失の時間幅。例：RPO 15分なら失うデータを最大15分相当に抑える設計目標。RTOは復旧までの時間。'},
 {abbr:'MTBF',full:'Mean Time Between Failures',meaning:'平均故障間隔',note:'修理可能なシステムで、ある故障から次の故障までの平均稼働時間。復旧時間の目標であるRTOとは異なる。'},
 {abbr:'MTTR',full:'Mean Time To Repair',meaning:'平均修復時間',note:'故障発生後、修理して稼働状態に戻すまでの平均時間。'},
 {abbr:'SLO',full:'Service Level Objective',meaning:'サービスレベル目標',note:'可用性99.9%や応答時間など、サービス品質の測定可能な目標。障害復旧に限定したRTOとは用途が異なる。'},
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
 {abbr:'MFA',full:'Multi-Factor Authentication',meaning:'多要素認証',note:'パスワードとは異なる追加の認証要素を組み合わせて本人確認を強化する方法。'},
 {abbr:'SSO',full:'Single Sign-On',meaning:'シングルサインオン',note:'一度のサインインで複数の対象アプリやサービスへアクセスする方式。'},
 {abbr:'CDN',full:'Content Delivery Network',meaning:'コンテンツ配信ネットワーク',note:'利用者に近い拠点からキャッシュしたコンテンツを提供して配信遅延を減らす。'},
 {abbr:'DR',full:'Disaster Recovery',meaning:'災害復旧',note:'大規模障害後にシステムとデータを復旧するための計画・構成・手順。'},
 {abbr:'PITR',full:'Point-In-Time Recovery',meaning:'特定時点への復元',note:'バックアップとログを利用して、指定時刻に近いデータ状態を復元する仕組み。'},
 {abbr:'GSI',full:'Global Secondary Index',meaning:'グローバルセカンダリインデックス',note:'DynamoDBの基本キーとは異なるキーを使ってクエリを実行するためのインデックス。'},
 {abbr:'KPI',full:'Key Performance Indicator',meaning:'重要業績評価指標',note:'目標の達成状況を継続的に確認するために使う主要な測定指標。'},
 {abbr:'RDS',full:'Relational Database Service',meaning:'リレーショナルデータベースサービス',note:'AWSのマネージドリレーショナルデータベース。'},
 {abbr:'API',full:'Application Programming Interface',meaning:'アプリケーションプログラミングインターフェイス',note:'ソフトウェア間で機能やデータをやり取りするための呼び出し規約。'},
 {abbr:'CIDR',full:'Classless Inter-Domain Routing',meaning:'クラスレスアドレス指定',note:'IPアドレス範囲をプレフィックス長で表す方法。例：10.0.0.0/16。'}
];
export function findTerms(...texts:string[]):Term[]{
 const haystack=texts.join(' ');
 return GLOSSARY.filter(term=>new RegExp('(^|[^A-Za-z0-9])'+term.abbr+'(?=$|[^A-Za-z0-9])').test(haystack));
}
