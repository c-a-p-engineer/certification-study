/** 7.3: original offline architecture decision cases with AWS official references; not independent human sign-off. */
export const EXTRA_DESIGN_CASES = [
  {
    "id": "regional-dr",
    "title": "Cross-Region Disaster Recovery",
    "domain": "耐障害性",
    "objective": "RTOとRPOを区別し復旧方法を設計",
    "nodes": [
      "Primary Region",
      "DR Region",
      "Copy Policy",
      "Runbook"
    ],
    "steps": [
      {
        "id": "rto",
        "heading": "復旧目標",
        "context": "ECサイトで主リージョン全体が停止した場合、停止30分以内、データ欠損5分以内という業務要求がある。復旧方式を決める前に何を固定するか。",
        "options": [
          {
            "id": "a",
            "label": "RTO30分とRPO5分を別々の目標として定義",
            "feedback": "要件に沿った選択。RTOは復旧の許容時間、RPOは許容データ欠損の期間を表し、個別に計画する。"
          },
          {
            "id": "b",
            "label": "RTOもRPOも30分で同一とする",
            "feedback": "この方法では要件を満たせません。RTOもRPOも30分で同一とするという判断は復旧目標の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "c",
            "label": "SLAだけを確認しRPOを決めない",
            "feedback": "この方法では要件を満たせません。SLAだけを確認しRPOを決めないという判断は復旧目標の制約と整合しないため、代替案とAWS公式資料を比較します。"
          }
        ],
        "correct": "a",
        "why": "RTOは復旧の許容時間、RPOは許容データ欠損の期間を表し、個別に計画する。",
        "reference": "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html"
      },
      {
        "id": "strategy",
        "heading": "復旧構成の比較",
        "context": "日次バックアップだけではRPO5分を満たせない。別リージョンに最低限の復旧環境を維持し、複製遅延と待機費用を測りたい。",
        "options": [
          {
            "id": "a",
            "label": "日次バックアップのみを使ってRPO5分を保証",
            "feedback": "この方法では要件を満たせません。日次バックアップのみを使ってRPO5分を保証という判断は復旧構成の比較の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "b",
            "label": "パイロットライトとウォームスタンバイを費用・RTO・RPOで比較",
            "feedback": "要件に沿った選択。DR構成は目標復旧時間・複製遅延・待機コストを比較して選び、机上値を保証値と扱わない。"
          },
          {
            "id": "c",
            "label": "主リージョンにだけEC2を増やす",
            "feedback": "この方法では要件を満たせません。主リージョンにだけEC2を増やすという判断は復旧構成の比較の制約と整合しないため、代替案とAWS公式資料を比較します。"
          }
        ],
        "correct": "b",
        "why": "DR構成は目標復旧時間・複製遅延・待機コストを比較して選び、机上値を保証値と扱わない。",
        "reference": "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/plan-for-disaster-recovery-dr.html"
      },
      {
        "id": "practice",
        "heading": "復旧演習",
        "context": "復旧先にデータを複製しているがアプリの設定が古いかもしれない。リージョン切替と切戻しで書込み競合を防ぐ必要もある。",
        "options": [
          {
            "id": "a",
            "label": "手順書を作れば復旧時間の測定は不要",
            "feedback": "この方法では要件を満たせません。手順書を作れば復旧時間の測定は不要という判断は復旧演習の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "b",
            "label": "実障害が起きるまで初回の復旧演習を延期",
            "feedback": "この方法では要件を満たせません。実障害が起きるまで初回の復旧演習を延期という判断は復旧演習の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "c",
            "label": "定期演習で復旧時間と整合性・設定差分を検証",
            "feedback": "要件に沿った選択。リハーサルと構成ドリフト検証がなければ復旧目標の実現性は確認できない。"
          }
        ],
        "correct": "c",
        "why": "リハーサルと構成ドリフト検証がなければ復旧目標の実現性は確認できない。",
        "reference": "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/plan-for-disaster-recovery-dr.html"
      }
    ]
  },
  {
    "id": "s3-cost-choice",
    "title": "S3 Storage Class Trade-offs",
    "domain": "コスト最適化",
    "objective": "アクセス変動とオブジェクトサイズの料金判断",
    "nodes": [
      "S3 Bucket",
      "Access Trends",
      "Tier Decision",
      "Lifecycle"
    ],
    "steps": [
      {
        "id": "dynamic",
        "heading": "アクセス頻度の変動",
        "context": "数か月以上保存する画像について、閲覧頻度は季節的に変わり予測困難。ミリ秒アクセスを保ちつつ保管料金を下げたい。",
        "options": [
          {
            "id": "a",
            "label": "S3 Intelligent-Tieringの監視費用とアクセス階層を比較",
            "feedback": "要件に沿った選択。アクセスパターンが予測不能なら自動階層化を候補にし、監視料金や復元特性を確認する。"
          },
          {
            "id": "b",
            "label": "保存直後から全画像をDeep Archiveへ固定",
            "feedback": "この方法では要件を満たせません。保存直後から全画像をDeep Archiveへ固定という判断はアクセス頻度の変動の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "c",
            "label": "S3 Standardが必ず最安だと仮定",
            "feedback": "この方法では要件を満たせません。S3 Standardが必ず最安だと仮定という判断はアクセス頻度の変動の制約と整合しないため、代替案とAWS公式資料を比較します。"
          }
        ],
        "correct": "a",
        "why": "アクセスパターンが予測不能なら自動階層化を候補にし、監視料金や復元特性を確認する。",
        "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering.html"
      },
      {
        "id": "scheduled",
        "heading": "規則的な保存期間",
        "context": "監査ログは最初の30日だけ頻繁に参照し、その後は年単位で低頻度アクセスとなる。保管期間の義務もある。",
        "options": [
          {
            "id": "a",
            "label": "保管期限があるが最初の1日で削除",
            "feedback": "この方法では要件を満たせません。保管期限があるが最初の1日で削除という判断は規則的な保存期間の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "b",
            "label": "Lifecycle移行と最小保存期間・取出し費用を比較",
            "feedback": "要件に沿った選択。予測可能な移行時期にはLifecycleポリシーが有用だが保存日数と取出し要件の確認が必要。"
          },
          {
            "id": "c",
            "label": "ログ名だけを変えて低料金になると仮定",
            "feedback": "この方法では要件を満たせません。ログ名だけを変えて低料金になると仮定という判断は規則的な保存期間の制約と整合しないため、代替案とAWS公式資料を比較します。"
          }
        ],
        "correct": "b",
        "why": "予測可能な移行時期にはLifecycleポリシーが有用だが保存日数と取出し要件の確認が必要。",
        "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html"
      },
      {
        "id": "tiny",
        "heading": "小さいオブジェクト",
        "context": "1件40KBのログを大量に保存している。Lifecycleで別ストレージクラスへ移せば必ず節約できるという提案を評価したい。",
        "options": [
          {
            "id": "a",
            "label": "すべてのサイズのオブジェクト移行は無料と考える",
            "feedback": "この方法では要件を満たせません。すべてのサイズのオブジェクト移行は無料と考えるという判断は小さいオブジェクトの制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "b",
            "label": "サイズに関係なく同じ移行料金で最安と断言",
            "feedback": "この方法では要件を満たせません。サイズに関係なく同じ移行料金で最安と断言という判断は小さいオブジェクトの制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "c",
            "label": "128KB未満の既定移行制限と要求課金を調査する",
            "feedback": "要件に沿った選択。小オブジェクトは移行要求課金が節約額を上回り得るため、既定のサイズ制限とフィルターを確認する。"
          }
        ],
        "correct": "c",
        "why": "小オブジェクトは移行要求課金が節約額を上回り得るため、既定のサイズ制限とフィルターを確認する。",
        "reference": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-considerations.html"
      }
    ]
  },
  {
    "id": "org-policy",
    "title": "Organizations IAM Guardrails",
    "domain": "セキュリティ",
    "objective": "SCPの上限とIAMでの権限付与を区別",
    "nodes": [
      "Organization",
      "Development OU",
      "SCP Limits",
      "Role IAM"
    ],
    "steps": [
      {
        "id": "ou",
        "heading": "組織の制限",
        "context": "開発部門のメンバーアカウントで許可リージョンを限定し、運用担当には個別のIAMロールで必要な権限を付与する。",
        "options": [
          {
            "id": "a",
            "label": "管理アカウントだけにSCPを適用する",
            "feedback": "この方法では要件を満たせません。管理アカウントだけにSCPを適用するという判断は組織の制限の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "b",
            "label": "開発OUへのSCP適用範囲と許可上限を管理する",
            "feedback": "要件に沿った選択。SCPは組織メンバーの最大権限を制限するガードレールでありIAMへの許可付与ではない。"
          },
          {
            "id": "c",
            "label": "SCP Allowで全員に直接IAM権限を付与する",
            "feedback": "この方法では要件を満たせません。SCP Allowで全員に直接IAM権限を付与するという判断は組織の制限の制約と整合しないため、代替案とAWS公式資料を比較します。"
          }
        ],
        "correct": "b",
        "why": "SCPは組織メンバーの最大権限を制限するガードレールでありIAMへの許可付与ではない。",
        "reference": "https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html"
      },
      {
        "id": "role",
        "heading": "最小権限",
        "context": "SCPがS3利用を許している環境で、新しい監査ロールに特定バケットの読み取りだけをさせる。",
        "options": [
          {
            "id": "a",
            "label": "IAMロールと必要なリソース許可を最小限に設定",
            "feedback": "要件に沿った選択。SCPの上限とIAMやリソースポリシーのAllowは別に評価される。"
          },
          {
            "id": "b",
            "label": "IAMポリシーなしでもSCP Allowだけで読み取れる",
            "feedback": "この方法では要件を満たせません。IAMポリシーなしでもSCP Allowだけで読み取れるという判断は最小権限の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "c",
            "label": "SCPを削除すれば自動で特定バケットだけ読める",
            "feedback": "この方法では要件を満たせません。SCPを削除すれば自動で特定バケットだけ読めるという判断は最小権限の制約と整合しないため、代替案とAWS公式資料を比較します。"
          }
        ],
        "correct": "a",
        "why": "SCPの上限とIAMやリソースポリシーのAllowは別に評価される。",
        "reference": "https://docs.aws.amazon.com/IAM/latest/UserGuide/intro-structure.html"
      },
      {
        "id": "deny",
        "heading": "明示的な拒否",
        "context": "IAMロールにS3操作をAllowしているが、上位OUのSCPには同じ操作の明示的Denyがある。アクションの可否を判断する。",
        "options": [
          {
            "id": "a",
            "label": "IAM Allowが必ずSCP Denyより優先する",
            "feedback": "この方法では要件を満たせません。IAM Allowが必ずSCP Denyより優先するという判断は明示的な拒否の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "b",
            "label": "別のアクセスキーを作れば同じロールで回避できる",
            "feedback": "この方法では要件を満たせません。別のアクセスキーを作れば同じロールで回避できるという判断は明示的な拒否の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "c",
            "label": "SCPの明示的Denyが優先して拒否される",
            "feedback": "要件に沿った選択。明示的拒否は許可より優先するため組織の上限をIAMのAllowだけでは突破できない。"
          }
        ],
        "correct": "c",
        "why": "明示的拒否は許可より優先するため組織の上限をIAMのAllowだけでは突破できない。",
        "reference": "https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html"
      }
    ]
  },
  {
    "id": "sqs-lambda-flow",
    "title": "SQS Lambda Reliability",
    "domain": "耐障害性",
    "objective": "可視性タイムアウトと失敗・再配送を設計",
    "nodes": [
      "SQS Queue",
      "Lambda",
      "Failure IDs",
      "Dead-letter Queue"
    ],
    "steps": [
      {
        "id": "timeout",
        "heading": "可視性タイムアウト",
        "context": "SQSからLambdaへイベントを配信し、関数タイムアウトは60秒。スロットリングがあるため再試行の余裕が必要となる。",
        "options": [
          {
            "id": "a",
            "label": "可視性タイムアウトを10秒に短縮する",
            "feedback": "この方法では要件を満たせません。可視性タイムアウトを10秒に短縮するという判断は可視性タイムアウトの制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "b",
            "label": "SQSとLambdaを異なるリージョンへ離す",
            "feedback": "この方法では要件を満たせません。SQSとLambdaを異なるリージョンへ離すという判断は可視性タイムアウトの制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "c",
            "label": "Lambdaタイムアウトの6倍以上を目安に調整",
            "feedback": "要件に沿った選択。AWSはSQSイベントソースの可視性タイムアウトをLambda設定の6倍以上とすることを推奨する。"
          }
        ],
        "correct": "c",
        "why": "AWSはSQSイベントソースの可視性タイムアウトをLambda設定の6倍以上とすることを推奨する。",
        "reference": "https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html"
      },
      {
        "id": "batch",
        "heading": "部分失敗の報告",
        "context": "SQSから取得した5件のメッセージのうち1件だけ処理に失敗。成功した4件の不要な再実行を抑えたい。",
        "options": [
          {
            "id": "a",
            "label": "ReportBatchItemFailuresを使い失敗IDだけ返す",
            "feedback": "要件に沿った選択。部分バッチレスポンスを使い、成功レコードの再配信を減らす。処理は重複に耐える必要がある。"
          },
          {
            "id": "b",
            "label": "例外を投げれば成功済4件は必ず削除される",
            "feedback": "この方法では要件を満たせません。例外を投げれば成功済4件は必ず削除されるという判断は部分失敗の報告の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "c",
            "label": "重複配信は起きないので冪等処理を省略する",
            "feedback": "この方法では要件を満たせません。重複配信は起きないので冪等処理を省略するという判断は部分失敗の報告の制約と整合しないため、代替案とAWS公式資料を比較します。"
          }
        ],
        "correct": "a",
        "why": "部分バッチレスポンスを使い、成功レコードの再配信を減らす。処理は重複に耐える必要がある。",
        "reference": "https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html"
      },
      {
        "id": "deadletter",
        "heading": "繰り返し失敗",
        "context": "不正なメッセージが繰り返し失敗し、正常メッセージの処理を妨げている。原因調査して修正後に再投入したい。",
        "options": [
          {
            "id": "a",
            "label": "再試行せず失敗レコードを無条件に廃棄",
            "feedback": "この方法では要件を満たせません。再試行せず失敗レコードを無条件に廃棄という判断は繰り返し失敗の制約と整合しないため、代替案とAWS公式資料を比較します。"
          },
          {
            "id": "b",
            "label": "DLQと適切なmaxReceiveCount、アラート・redriveを設計",
            "feedback": "要件に沿った選択。SQS DLQへ毒メッセージを隔離し、最大受信回数や再投入手順を明示する。"
          },
          {
            "id": "c",
            "label": "Lambda並列数だけを増やせば不正データも成功する",
            "feedback": "この方法では要件を満たせません。Lambda並列数だけを増やせば不正データも成功するという判断は繰り返し失敗の制約と整合しないため、代替案とAWS公式資料を比較します。"
          }
        ],
        "correct": "b",
        "why": "SQS DLQへ毒メッセージを隔離し、最大受信回数や再投入手順を明示する。",
        "reference": "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html"
      }
    ]
  }
] as const;
