// Synthetic, deterministic teaching model. Never connects to AWS or writes learner progress.
export const SCENARIOS = Object.freeze({
  ha: {
    title: 'Multi-AZ Web',
    subtitle: 'ALB・2つのAZ・共有セッション',
    prompt: '片方のAZを停止させ、残ったEC2で処理を続けられるか試そう。',
    reference: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html',
  },
  rds: {
    title: 'RDS Failover',
    subtitle: 'Multi-AZ・スタンバイ・リードレプリカ',
    prompt: 'プライマリを故障させ、HAと読み取りスケールの違いを確かめよう。',
    reference: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html',
  },
  s3: {
    title: 'Private S3 Access',
    subtitle: 'ゲートウェイエンドポイント・IAM・VPCE制限',
    prompt: 'プライベートサブネットとコンソールからの接続を比べよう。',
    reference: 'https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html',
  },
});
const DEFAULTS = Object.freeze({
  ha: {alb: true, azA: true, azB: true, session: true, load: 140},
  rds: {multiAZ: true, primaryUp: true, failoverDone: false, readReplica: false},
  s3: {endpoint: true, iam: true, restrictVpce: true, source: 'vpc'},
});
export function createState(scenario = 'ha') {
  if (!(scenario in DEFAULTS)) throw new Error('Unknown scenario');
  return {scenario, ...DEFAULTS[scenario]};
}
export function setControl(state, key, value) {
  const defaults = DEFAULTS[state.scenario];
  if (!defaults || !Object.prototype.hasOwnProperty.call(defaults, key)) return state;
  if (typeof value !== typeof defaults[key]) return state;
  if (key === 'load' && (!Number.isSafeInteger(value) || value < 40 || value > 300 || value % 20 !== 0)) return state;
  if (key === 'source' && !['vpc', 'console'].includes(value)) return state;
  if (key === 'failoverDone' && value && (state.primaryUp || !state.multiAZ)) return state;
  const next = {...state, [key]: value};
  if (state.scenario === 'rds' && (key === 'primaryUp' || key === 'multiAZ')) next.failoverDone = false;
  return next;
}
function metric(label, value) { return {label, value: String(value)}; }
export function evaluate(state) {
  if (state.scenario === 'ha') {
    const healthy = Number(state.azA) + Number(state.azB);
    // Capacity units are invented for this demonstration, not AWS EC2 benchmarks.
    const capacity = healthy * 100;
    const served = state.alb ? Math.min(state.load, capacity) : 0;
    const fraction = Math.round(100 * served / state.load);
    const failed = healthy === 0;
    const headline = !state.alb ? 'ALB停止：入口がありません'
      : failed ? '全ターゲット異常：リクエスト成功 0'
      : fraction < 100 ? '稼働中ですが仮想処理容量が不足' : '現在の仮想負荷は処理可能';
    const detail = !state.alb ? '本モデルではALBが唯一の入口です。代替入口は設定していません。'
      : failed ? 'ALBは全ターゲット異常時にfail-openする場合がありますが、障害EC2が正常に処理できるという意味ではありません。'
      : fraction < 100 ? '生存AZだけでは指定した仮想負荷を処理しきれません。実AWSの容量予測値ではありません。'
      : 'ALBが正常なターゲットへ転送できる単純化モデルです。ヘルスチェックの遅延とDNS動作は省略しています。';
    return {
      tone: fraction === 100 ? 'good' : fraction > 0 ? 'warn' : 'bad',
      headline, detail, 
      metrics: [metric('正常なAZ', healthy + ' / 2'), metric('仮想処理率', fraction + '%'), metric('仮想負荷', state.load + ' units')],
      note: !state.session ? '注意：セッションがEC2のローカルにしかない場合、AZ切替でログイン状態を失う可能性があります。'
        : '共有セッションを想定。アプリ側の共有ストアの可用性・整合性は別途設計が必要です。',
    };
  }
  if (state.scenario === 'rds') {
    const write = state.primaryUp || (state.multiAZ && state.failoverDone);
    const read = write || state.readReplica;
    const pending = !state.primaryUp && state.multiAZ && !state.failoverDone;
    return {
      tone: write ? 'good' : pending ? 'warn' : 'bad',
      headline: state.primaryUp ? 'プライマリ稼働中'
        : state.multiAZ && state.failoverDone ? 'スタンバイへの切替完了（概念上）'
        : pending ? 'フェイルオーバー進行中' : '書き込み先がありません',
      detail: pending ? '実際のRDS Multi-AZ DBインスタンスは障害を検出して自動切替します。このボタンは、その遷移前後を手動で観察する教材上の操作です。'
        : !state.primaryUp && !state.multiAZ ? '読み取りレプリカは、単独では従来型Multi-AZの自動フェイルオーバー先にはなりません。'
        : '従来型Multi-AZ DBインスタンスのスタンバイは読み取りに使えません。読み取りレプリカは別の用途です。',
      metrics: [metric('書き込み', write ? '可能' : '停止'), metric('読み取り', read ? '可能' : '停止'), metric('状態', pending ? '切替待機' : '確定')],
      note: state.readReplica && !write ? 'リードレプリカの読み取りは非同期複製による遅延を伴い得ます。書き込み復旧とは別です。'
        : '切替所要時間、接続の再試行、DNSキャッシュは省略しています。',
    };
  }
  if (state.scenario === 's3') {
    const network = state.source === 'console' || state.endpoint;
    const policy = !state.restrictVpce || (state.source === 'vpc' && state.endpoint);
    const allowed = network && state.iam && policy;
    const reason = !network ? '到達経路がありません。NAT / Internet Gatewayを省略したプライベートサブネットの想定です。'
      : !state.iam ? 'IAMの許可がありません。VPCエンドポイントだけではアクセス権限は付与されません。'
      : !policy ? '指定VPCE経由に限定するバケットポリシーにより、コンソール経由のリクエストが拒否されます。'
      : 'ネットワーク経路・IAM許可・この教材で設定したバケットポリシーの条件を満たします。';
    return {
      tone: allowed ? 'good' : 'bad', headline: allowed ? 'S3へのアクセスを許可' : 'S3へのアクセスを拒否',
      detail: reason,
      metrics: [metric('要求元', state.source === 'vpc' ? 'Private EC2' : 'コンソール'), metric('経路', network ? '存在' : 'なし'), metric('判定', allowed ? 'ALLOW' : 'DENY')],
      note: '「VPCE制限なし」は一般公開を意味しません。S3 Block Public Access、IAM、その他のポリシーは単純化しています。',
    };
  }
  throw new Error('Unknown scenario');
}
