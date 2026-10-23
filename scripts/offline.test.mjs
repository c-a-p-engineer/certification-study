import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const template=readFileSync('scripts/sw-template.js','utf8');
const builder=readFileSync('scripts/build-offline.mjs','utf8');
const manifest=JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));
const html=readFileSync('index.html','utf8');
const main=readFileSync('src/main.tsx','utf8');
test('PWA is scoped to our Pages repository, and manifest has valid install settings',()=>{
 assert.equal(manifest.start_url,'/certification-study/');
 assert.equal(manifest.scope,'/certification-study/');
 assert.equal(manifest.display,'standalone');
 assert.ok(manifest.icons.some(x=>x.purpose==='maskable'));
 assert.ok(html.includes('rel="manifest"'));
 assert.ok(main.includes('registerOffline()'));
});
test('offline shell preloads only built app assets and never caches another origin',()=>{
 assert.ok(template.includes("request.method!=='GET'"));
 assert.ok(template.includes('self.location.origin'));
 assert.ok(template.includes("url.pathname.startsWith(BASE)"));
 assert.ok(template.includes("request.mode==='navigate'"));
 assert.ok(template.includes('caches.match(BASE+\'index.html\')'));
 assert.ok(!template.includes('skipWaiting()'));
 assert.ok(builder.includes("createHash('sha256')"));
 assert.ok(builder.includes('precache=allowed.map'));
 assert.ok(builder.includes("endsWith('.js')"));
});
