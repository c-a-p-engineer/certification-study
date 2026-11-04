import {SCENARIOS, createState, setControl, evaluate} from './engine.mjs';
const el = id => document.getElementById(id);
const OPTIONS = {
  ha: [
    {key:'alb',label:'ALBが稼働中',help:'本教材の唯一のHTTP入口'},
    {key:'azA',label:'AZ-AのEC2が正常',help:'AZを停止すると処理容量が減少'},
    {key:'azB',label:'AZ-BのEC2が正常',help:'AZを停止すると処理容量が減少'},
    {key:'session',label:'セッション共有ストアを利用',help:'切替後のログイン状態を検討'},
    {key:'load',label:'仮想リクエスト負荷',help:'1AZあたり100 unitsの仮定（実測ではない）',kind:'range'}
  ],
  rds: [
    {key:'multiAZ',label:'従来型Multi-AZ DBインスタンス',help:'別AZに同期スタンバイを配置'},
    {key:'primaryUp',label:'現在のプライマリが正常',help:'OFFでプライマリ障害を注入'},
    {key:'readReplica',label:'別のリードレプリカを追加',help:'読み取り用途。HAスタンバイとは別'},
    {key:'failoverDone',label:'フェイルオーバー完了',help:'障害後の状態遷移を観察（手動再現）',kind:'failover'},
  ],
  s3: [
    {key:'source',label:'リクエスト元',help:'経路とaws:SourceVpceの違い',kind:'select'},
    {key:'endpoint',label:'S3ゲートウェイVPCEを構成',help:'VPC側のルートテーブル関連付け済みと仮定'},
    {key:'iam',label:'IAMがS3の操作を許可',help:'ネットワーク経路とは別の認可'},
    {key:'restrictVpce',label:'指定VPCE経由だけに制限',help:'コンソールアクセスにも影響する可能性'},
  ],
};
let state = createState();
let logs = ['Multi-AZ Webの実験を開始しました。'];
function prism(x,y,w,h,title,subtitle,tone='good') {
  const body = tone==='good'?'#23584e':tone==='bad'?'#703c49':'#5b5164';
  const top = tone==='good'?'#3e9a83':tone==='bad'?'#bf6b73':'#98819b';
  const text = '#f4feff';
  return '<g transform="translate('+x+' '+y+')">' +
    '<polygon points="0,12 14,0 '+(w+14)+',0 '+w+',12" fill="'+top+'" stroke="#d1e8ed" stroke-opacity=".65"/>' +
    '<rect x="0" y="12" width="'+w+'" height="'+h+'" rx="4" fill="'+body+'" stroke="#a0c6cd"/>' +
    '<polygon points="'+w+',12 '+(w+14)+',0 '+(w+14)+','+(h-1)+' '+w+','+(h+12)+'" fill="'+top+'" fill-opacity=".6"/>' +
    '<text x="'+(w/2)+'" y="'+(h/2+11)+'" fill="'+text+'" text-anchor="middle" font-size="15" font-weight="700">'+title+'</text>' +
    '<text x="'+(w/2)+'" y="'+(h/2+29)+'" fill="#d7e7e8" text-anchor="middle" font-size="12">'+subtitle+'</text></g>';
}
function wire(x1,y1,x2,y2,active=true) {
  return '<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" stroke="'+(active?'#78e9c1':'#e19a9a')+'" stroke-width="3" stroke-dasharray="'+(active?'0':'6 7')+'" stroke-linecap="round" fill="none"/>';
}
function backdrop() {
  return '<defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#679ab1" opacity=".24"/></pattern></defs>' +
    '<rect width="740" height="405" fill="url(#dots)"/>';
}
function diagram() {
  let s = backdrop();
  if(state.scenario==='ha') {
    s += '<text x="28" y="35" fill="#b7e6f5" font-size="14">REGION / VPC · Web Tier</text>';
    s += wire(355,100,355,135,state.alb)+wire(355,221,194,275,state.alb&&state.azA)+wire(355,221,533,275,state.alb&&state.azB);
    s += prism(281,48,146,46,'Users','HTTP request','warn');
    s += prism(260,145,185,70,'ALB',state.alb?'ENTRY ACTIVE':'STOPPED',state.alb?'good':'bad');
    s += '<rect x="36" y="262" width="310" height="116" rx="12" fill="#2f6c7b" fill-opacity=".13" stroke="#6e9aac" stroke-dasharray="7 5"/>' +
      '<rect x="388" y="262" width="310" height="116" rx="12" fill="#2f6c7b" fill-opacity=".13" stroke="#6e9aac" stroke-dasharray="7 5"/>';
    s += prism(92,287,196,58,'AZ-A / EC2',state.azA?'HEALTHY':'FAILED',state.azA?'good':'bad');
    s += prism(440,287,196,58,'AZ-B / EC2',state.azB?'HEALTHY':'FAILED',state.azB?'good':'bad');
    s += '<text x="370" y="398" text-anchor="middle" font-size="12" fill="#b7d0df">Session: '+(state.session?'shared':'local only')+'</text>';
  } else if(state.scenario==='rds') {
    s += '<text x="28" y="35" fill="#b7e6f5" font-size="14">REGION / RDS · Traditional Multi-AZ Instance</text>';
    s += wire(359,112,205,201,state.primaryUp)+wire(359,112,528,201,!state.primaryUp&&state.multiAZ&&state.failoverDone);
    s += prism(283,60,154,50,'Application','read / write','warn');
    s += prism(110,207,190,78,'Primary',state.primaryUp?'ACTIVE':'FAILED',state.primaryUp?'good':'bad');
    s += prism(433,207,190,78,'Standby',state.multiAZ?(state.failoverDone?'PROMOTED':'SYNC HA'):'NOT CONFIGURED',state.multiAZ?'good':'bad');
    s += wire(298,265,433,265,state.multiAZ);
    if(state.readReplica) { s+=wire(220,305,345,333,true); s+=prism(270,323,186,50,'Read Replica','READ ONLY','warn'); }
    s += '<text x="370" y="396" text-anchor="middle" font-size="12" fill="#bdd6e8">Auto failover is represented as a manually stepped state</text>';
  } else {
    s += '<text x="28" y="35" fill="#b7e6f5" font-size="14">VPC / S3 · Simplified request path</text>';
    const fromVpc=state.source==='vpc';
    const verdict=evaluate(state).tone==='good';
    s += wire(245,194,300,194,fromVpc&&state.endpoint)+wire(440,194,489,194,verdict);
    s += prism(48,158,190,72,fromVpc?'Private EC2':'Console',fromVpc?'NO NAT / IGW':'outside VPCE','warn');
    s += prism(298,158,143,72,'Gateway VPCE',state.endpoint?'ROUTED':'NOT SET',state.endpoint?'good':'bad');
    s += prism(499,158,173,72,'Amazon S3',verdict?'ALLOW':'DENY',verdict?'good':'bad');
    s += prism(280,300,177,56,'IAM + Policy',state.iam?'IAM permit':'IAM deny',state.iam?'good':'bad');
    s += '<text x="370" y="396" text-anchor="middle" font-size="12" fill="#bdd6e8">VPCE-only policy: '+(state.restrictVpce?'ON':'OFF')+'</text>';
  }
  return s;
}
function controlMarkup(option) {
  const key=option.key;
  const help='<small>'+option.help+'</small>';
  if(option.kind==='range') return '<label class="control"><span class="control-title">'+option.label+' <output>'+state[key]+' units</output></span>'+help+
    '<input type="range" data-key="'+key+'" min="40" max="300" step="20" value="'+state[key]+'"></label>';
  if(option.kind==='select') return '<label class="control"><span class="control-title">'+option.label+'</span>'+help+
    '<select data-key="'+key+'"><option value="vpc"'+(state[key]==='vpc'?' selected':'')+'>Private EC2</option><option value="console"'+(state[key]==='console'?' selected':'')+'>AWSコンソール</option></select></label>';
  const disabled=option.kind==='failover'&&(state.primaryUp||!state.multiAZ);
  return '<label class="control"><span class="control-title">'+option.label+
    '<input data-key="'+key+'" type="checkbox" '+(state[key]?'checked ':'')+(disabled?'disabled ':'')+'></span>'+help+'</label>';
}
function presets() {
  if(state.scenario==='ha') return [['AZ-A障害','fail-a'],['負荷急増','spike'],['正常化','reset']];
  if(state.scenario==='rds') return [['プライマリ障害','fail-primary'],['切替完了','complete'],['正常化','reset']];
  return [['コンソールから試す','from-console'],['VPCE制限を外す','drop-policy'],['正常化','reset']];
}
function remember(message) {
  logs = [message, ...logs].slice(0,6);
}
function render() {
  const def=SCENARIOS[state.scenario],status=evaluate(state);
  el('scenarios').innerHTML=Object.entries(SCENARIOS).map(([kind,item])=>'<button type="button" role="tab" aria-selected="'+(state.scenario===kind)+'" data-scenario="'+kind+'">'+item.title+'<small>'+item.subtitle+'</small></button>').join('');
  el('prompt').textContent=def.prompt;
  el('diagram').innerHTML=diagram();
  el('diagram').setAttribute('aria-label',def.title+' の概念図。'+status.headline);
  el('controls').innerHTML=OPTIONS[state.scenario].map(controlMarkup).join('');
  el('metrics').innerHTML=status.metrics.map(item=>'<div class="metric"><span>'+item.label+'</span><strong>'+item.value+'</strong></div>').join('');
  el('result').className='result '+status.tone;
  el('result').innerHTML='<strong>'+status.headline+'</strong><p>'+status.detail+'</p><p class="note">'+status.note+'</p>';
  el('reference').href=def.reference;
  el('events').innerHTML=logs.map(entry=>'<li>'+entry+'</li>').join('');
  el('presets').innerHTML=presets().map(([label,id])=>'<button type="button" data-preset="'+id+'"'+(id==='complete'&&(state.primaryUp||!state.multiAZ)?' disabled':'')+'>'+label+'</button>').join('');
}
el('scenarios').addEventListener('click',event=>{
  const button=event.target.closest('button[data-scenario]');
  if(!button)return;
  state=createState(button.dataset.scenario);
  logs=[SCENARIOS[state.scenario].title+'の実験を開始しました。'];
  render();
});
el('controls').addEventListener('change',event=>{
  const target=event.target;
  if(!target.dataset?.key)return;
  const key=target.dataset.key;
  const value=target.type==='checkbox'?target.checked:target.type==='range'?Number(target.value):target.value;
  const next=setControl(state,key,value);
  if(next!==state){state=next;remember(OPTIONS[state.scenario].find(item=>item.key===key).label+' → '+(typeof value==='boolean'?(value?'ON':'OFF'):String(value)));}
  render();
});
function reset() {
  state=createState(state.scenario);
  remember('初期構成にリセットしました。');
  render();
}
el('reset').addEventListener('click',reset);
el('presets').addEventListener('click',event=>{
  const button=event.target.closest('button[data-preset]');
  if(!button || button.disabled)return;
  const id=button.dataset.preset;
  if(id==='reset'){reset();return;}
  const variants={
    'fail-a':['azA',false],spike:['load',300],
    'fail-primary':['primaryUp',false],complete:['failoverDone',true],
    'from-console':['source','console'],'drop-policy':['restrictVpce',false],
  };
  const choice=variants[id];
  if(!choice)return;
  const next=setControl(state,choice[0],choice[1]);
  if(next!==state){state=next;remember(button.textContent+'を実行しました。');}
  render();
});
render();
