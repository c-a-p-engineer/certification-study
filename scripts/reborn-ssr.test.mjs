import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

test('rebuilt default homepage server-renders with the first learning action visible',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {default:RebornApp}=await server.ssrLoadModule('/src/reborn/RebornApp.tsx');
  const html=renderToStaticMarkup(React.createElement(RebornApp));
  for(const text of ['OVERDRIVE','今日のクエスト','学習を始める','苦手を攻略する','ランダム演習','65問の模擬試験','ホーム','成長','設定']){
   assert.ok(html.includes(text),text);
  }
  assert.ok(html.includes('aria-label="メインナビ"'));
  assert.ok(html.includes('role="alert"'),'corrupt/unknown storage must fail closed during SSR');
  assert.ok(!html.includes('WHY IT WORKS'),'answer must never be leaked into home HTML');
 }finally{await server.close()}
});

test('compact glossary shows scannable Japanese meanings and hides verbose details by default',async()=>{
 const server=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'error'});
 try{
  const {TermsPanel}=await server.ssrLoadModule('/src/StudyQuestionIntro.tsx');
  const question={id:'saa-090',domain:'セキュリティ',question:'EC2とIAMでSSH接続を管理したい。',choices:['Systems Manager Session Manager','Route 53','Amazon CloudWatch','IAM'],explanation:'EC2の22番ポートを閉じる。'};
  const html=renderToStaticMarkup(React.createElement(TermsPanel,{question,compact:true}));
  assert.match(html,/class="rb-terms"/);
  assert.match(html,/用語を確認/);
  assert.match(html,/rb-term-list/);
  assert.match(html,/rb-term-meaning/);
  assert.match(html,/仮想サーバー/);
  assert.match(html,/正式名称/);
  assert.match(html,/読み方/);
  assert.doesNotMatch(html,/class="term-card"/);
  assert.doesNotMatch(html,/class="rb-terms" open/);
  const regular=renderToStaticMarkup(React.createElement(TermsPanel,{question}));
  assert.match(regular,/class="term-panel study-terms-panel"/);
 }finally{await server.close()}
});
