export type PracticeQuestion = { id:string; domain:string; question:string; choices:string[]; answer:number; explanation:string; reference:string };
export const additionalQuestions: PracticeQuestion[] = [
  {
    "id": "saa-009",
    "domain": "セキュリティ",
    "question": "S3バケット内の機密オブジェクトをKMSキーで暗号化したい。適切な方式は？",
    "choices": [
      "SSE-S3のみ",
      "SSE-KMS",
      "暗号化なしの公開バケット",
      "HTTPでの転送"
    ],
    "answer": 1,
    "explanation": "SSE-KMSはAWS KMSキーを利用するサーバー側暗号化です。",
    "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingKMSEncryption.html"
  },
  {
    "id": "saa-010",
    "domain": "セキュリティ",
    "question": "VPC内のEC2からインターネットを経由せずS3へアクセスするには？",
    "choices": [
      "NAT Gatewayのみ",
      "Internet Gateway",
      "S3ゲートウェイエンドポイント",
      "Elastic IP"
    ],
    "answer": 2,
    "explanation": "S3ゲートウェイVPCエンドポイントを利用すると、対応するルートテーブル経由でS3へプライベート接続できます。",
    "reference": "https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html"
  },
  {
    "id": "saa-011",
    "domain": "セキュリティ",
    "question": "Webアプリへの一般的なSQLインジェクション攻撃を緩和したい。適切なサービスは？",
    "choices": [
      "AWS WAF",
      "Amazon EBS",
      "AWS Snowball",
      "Amazon Route 53 Resolver"
    ],
    "answer": 0,
    "explanation": "AWS WAFのWeb ACLとマネージドルールで一般的なWeb攻撃パターンを検査できます。",
    "reference": "https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html"
  },
  {
    "id": "saa-012",
    "domain": "セキュリティ",
    "question": "複数AWSアカウントの権限を組織単位で制限するガードレールは？",
    "choices": [
      "セキュリティグループ",
      "SCP（サービスコントロールポリシー）",
      "IAMユーザーのパスワードポリシーのみ",
      "CloudFrontキャッシュポリシー"
    ],
    "answer": 1,
    "explanation": "AWS OrganizationsのSCPは組織アカウントに許可される権限の上限を制御します。",
    "reference": "https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html"
  },
  {
    "id": "saa-013",
    "domain": "セキュリティ",
    "question": "RDSのデータベース認証情報を安全に保管しローテーションしたい。適切なのは？",
    "choices": [
      "Secrets Manager",
      "S3の公開オブジェクト",
      "EC2ユーザーデータに平文保存",
      "CloudTrailイベント名"
    ],
    "answer": 0,
    "explanation": "AWS Secrets Managerはシークレットの保存とローテーションをサポートします。",
    "reference": "https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html"
  },
  {
    "id": "saa-014",
    "domain": "セキュリティ",
    "question": "EC2のセキュリティグループについて正しい説明は？",
    "choices": [
      "ステートレスである",
      "許可ルールのみを定義するステートフルなファイアウォール",
      "サブネット単位でのみ適用される",
      "明示的な拒否ルールを設定できる"
    ],
    "answer": 1,
    "explanation": "セキュリティグループはリソースレベルのステートフルな許可ルールを扱います。",
    "reference": "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html"
  },
  {
    "id": "saa-015",
    "domain": "耐障害性",
    "question": "EC2インスタンスの台数を需要に応じて自動増減させたい。利用するのは？",
    "choices": [
      "EC2 Auto Scaling",
      "AWS CloudTrail",
      "Amazon Macie",
      "AWS Artifact"
    ],
    "answer": 0,
    "explanation": "EC2 Auto Scalingは定義したポリシーや需要に応じてインスタンス数を調整します。",
    "reference": "https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html"
  },
  {
    "id": "saa-016",
    "domain": "耐障害性",
    "question": "複数リージョンでの障害対策に関して正しい説明は？",
    "choices": [
      "Multi-AZとMulti-Regionは常に同義",
      "リージョン障害への対策には別リージョンの構成が必要になる",
      "EBSボリュームは自動で全リージョンに複製される",
      "単一AZの構成でリージョン障害を回避できる"
    ],
    "answer": 1,
    "explanation": "AZを跨ぐ設計とリージョンを跨ぐDR設計は異なります。リージョン障害を想定するなら別リージョンでの復旧戦略を検討します。",
    "reference": "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html"
  },
  {
    "id": "saa-017",
    "domain": "耐障害性",
    "question": "疎結合な非同期処理でメッセージをバッファリングするサービスは？",
    "choices": [
      "Amazon SQS",
      "Amazon EBS",
      "AWS IAM",
      "Amazon VPC"
    ],
    "answer": 0,
    "explanation": "Amazon SQSはコンポーネント間のメッセージをキューに蓄積して疎結合化します。",
    "reference": "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html"
  },
  {
    "id": "saa-018",
    "domain": "耐障害性",
    "question": "DNSレベルでエンドポイントの正常性に応じてトラフィックを切り替えたい。候補は？",
    "choices": [
      "Route 53フェイルオーバールーティング",
      "Amazon ECR",
      "AWS KMS",
      "Amazon Inspector"
    ],
    "answer": 0,
    "explanation": "Route 53はヘルスチェックを組み合わせたフェイルオーバールーティングをサポートします。",
    "reference": "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-failover.html"
  },
  {
    "id": "saa-019",
    "domain": "耐障害性",
    "question": "オブジェクトの誤削除に備えて以前の状態を保持したい。S3の機能は？",
    "choices": [
      "S3 Versioning",
      "S3 Transfer Accelerationのみ",
      "S3静的ウェブサイトホスティング",
      "S3イベント通知のみ"
    ],
    "answer": 0,
    "explanation": "S3バージョニングは同じキーの複数バージョンを保持して誤上書き・削除からの復旧を助けます。",
    "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html"
  },
  {
    "id": "saa-020",
    "domain": "耐障害性",
    "question": "サーバーレス関数の呼び出しをイベント駆動で処理するサービスは？",
    "choices": [
      "AWS Lambda",
      "Amazon EBS",
      "AWS Direct Connect",
      "Amazon FSx"
    ],
    "answer": 0,
    "explanation": "AWS Lambdaはイベントに応じてコードを実行するサーバーレスコンピューティングサービスです。",
    "reference": "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html"
  },
  {
    "id": "saa-021",
    "domain": "パフォーマンス",
    "question": "頻繁に読み込まれるデータをインメモリキャッシュで高速化したい。適切なサービスは？",
    "choices": [
      "Amazon ElastiCache",
      "AWS CloudTrail",
      "Amazon Glacier Deep Archive",
      "AWS Organizations"
    ],
    "answer": 0,
    "explanation": "ElastiCacheはキャッシュをメモリ上で提供し、繰り返し読み取りのレイテンシーを減らせます。",
    "reference": "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html"
  },
  {
    "id": "saa-022",
    "domain": "パフォーマンス",
    "question": "大量のイベントデータをリアルタイムにストリーミング取り込みしたい。候補は？",
    "choices": [
      "Amazon Kinesis Data Streams",
      "Amazon Route 53",
      "AWS IAM Identity Center",
      "Amazon EBS"
    ],
    "answer": 0,
    "explanation": "Kinesis Data Streamsは継続的なデータストリームの取り込みと処理に利用します。",
    "reference": "https://docs.aws.amazon.com/streams/latest/dev/introduction.html"
  },
  {
    "id": "saa-023",
    "domain": "パフォーマンス",
    "question": "複数のEC2インスタンスから同じファイルシステムをマウントしたい。Linux向けのマネージドサービスは？",
    "choices": [
      "Amazon EFS",
      "Amazon EBS単一ボリュームを任意AZへ同時接続",
      "EC2インスタンスストア",
      "AWS KMS"
    ],
    "answer": 0,
    "explanation": "Amazon EFSは複数クライアントからアクセスできるマネージドな共有ファイルシステムです。",
    "reference": "https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html"
  },
  {
    "id": "saa-024",
    "domain": "パフォーマンス",
    "question": "ミリ秒単位のレイテンシーが必要なキーバリュー型アプリに適したフルマネージドNoSQLは？",
    "choices": [
      "Amazon DynamoDB",
      "Amazon Athena",
      "AWS CloudTrail",
      "Amazon S3 Glacier Deep Archive"
    ],
    "answer": 0,
    "explanation": "DynamoDBは低レイテンシーのキーバリュー・ドキュメントアクセスを提供するNoSQLデータベースです。",
    "reference": "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html"
  },
  {
    "id": "saa-025",
    "domain": "パフォーマンス",
    "question": "大規模データレイクのS3データをSQLで直接分析したい。サーバーレスサービスは？",
    "choices": [
      "Amazon Athena",
      "Amazon Route 53",
      "AWS KMS",
      "Amazon CloudFront"
    ],
    "answer": 0,
    "explanation": "AthenaはS3上のデータに対してSQLクエリを実行できるサーバーレス分析サービスです。",
    "reference": "https://docs.aws.amazon.com/athena/latest/ug/what-is.html"
  },
  {
    "id": "saa-026",
    "domain": "パフォーマンス",
    "question": "TCP/UDPトラフィックを低レイテンシーで分散したい。候補となるロードバランサーは？",
    "choices": [
      "Network Load Balancer",
      "Application Load Balancerのみ",
      "Amazon CloudTrail",
      "Amazon SQS"
    ],
    "answer": 0,
    "explanation": "NLBはL4でTCP/UDPなどの接続を処理するロードバランサーです。",
    "reference": "https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html"
  },
  {
    "id": "saa-027",
    "domain": "コスト最適化",
    "question": "長期間使用する安定したEC2ワークロードのコストを最適化する購入方法の候補は？",
    "choices": [
      "Savings Plans",
      "常にオンデマンドのみ",
      "常にDedicated Hosts",
      "毎回手動でインスタンスを作り直す"
    ],
    "answer": 0,
    "explanation": "Savings Plansは対象コンピューティング使用量への一定のコミットメントと引き換えに割引を提供します。",
    "reference": "https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html"
  },
  {
    "id": "saa-028",
    "domain": "コスト最適化",
    "question": "S3オブジェクトを利用状況に応じて適切なストレージクラスへ移行したい。使う機能は？",
    "choices": [
      "S3 Lifecycle",
      "CloudTrail Lake",
      "AWS WAF",
      "Amazon VPC Flow Logs"
    ],
    "answer": 0,
    "explanation": "S3 Lifecycleルールでオブジェクトの経過日数等に基づく移行・失効を自動化できます。",
    "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html"
  },
  {
    "id": "saa-029",
    "domain": "コスト最適化",
    "question": "AWSのサービス別コストの推移を可視化して分析したい。適切なサービスは？",
    "choices": [
      "AWS Cost Explorer",
      "AWS Shield",
      "Amazon Route 53",
      "Amazon Inspector"
    ],
    "answer": 0,
    "explanation": "Cost ExplorerはAWSコストと使用量の分析・可視化に利用できます。",
    "reference": "https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html"
  },
  {
    "id": "saa-030",
    "domain": "コスト最適化",
    "question": "予算超過の見込みを検知して通知したい。適切なサービスは？",
    "choices": [
      "AWS Budgets",
      "Amazon EBS",
      "AWS CloudTrailのみ",
      "Amazon ECR"
    ],
    "answer": 0,
    "explanation": "AWS Budgetsはコストや使用量の予算を設定し、しきい値に基づくアラートを提供します。",
    "reference": "https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html"
  },
  {
    "id": "saa-031",
    "domain": "コスト最適化",
    "question": "利用頻度が予測できないS3オブジェクトのストレージコストを自動最適化したい。候補は？",
    "choices": [
      "S3 Intelligent-Tiering",
      "S3 One Zone-IAのみ",
      "EBS io2",
      "Amazon EFSのみ"
    ],
    "answer": 0,
    "explanation": "S3 Intelligent-Tieringはアクセスパターンに応じて対象のアクセス階層を自動移動します。",
    "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering-overview.html"
  },
  {
    "id": "saa-032",
    "domain": "コスト最適化",
    "question": "サーバー管理を減らし、呼び出し量に応じて実行課金されるイベント処理をしたい。候補は？",
    "choices": [
      "AWS Lambda",
      "常時起動のEC2のみ",
      "Dedicated Hostのみ",
      "オンプレミス専用サーバー"
    ],
    "answer": 0,
    "explanation": "Lambdaは実行回数と実行時間等に応じた料金体系で、常時起動のサーバー管理を不要にできます。",
    "reference": "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html"
  }
];
