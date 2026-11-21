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
