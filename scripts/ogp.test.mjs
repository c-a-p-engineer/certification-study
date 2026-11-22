import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const html=readFileSync('index.html','utf8');
const url='https://c-a-p-engineer.github.io/certification-study/';
const img=url+'ogp.png';
test('static index embeds complete crawler-visible OGP and large X card without JS',()=>{
 for(const tag of [
  'rel="canonical" href="'+url+'"',
  'property="og:type" content="website"',
  'property="og:locale" content="ja_JP"',
  'property="og:title"',
  'property="og:description"',
  'property="og:url" content="'+url+'"',
  'property="og:image" content="'+img+'"',
  'property="og:image:secure_url" content="'+img+'"',
  'property="og:image:type" content="image/png"',
  'property="og:image:width" content="1200"',
  'property="og:image:height" content="630"',
  'property="og:image:alt"',
  'name="twitter:card" content="summary_large_image"',
  'name="twitter:title"',
  'name="twitter:description"',
  'name="twitter:image" content="'+img+'"',
  'name="twitter:image:alt"',
  'rel="manifest" href="/certification-study/manifest.webmanifest"'
 ])assert.ok(html.includes(tag),tag);
 assert.match(html,/非公式学習ゲーム/);
 assert.match(html,/QUEST RUN・BLITZ・DAILY CODE/);
 assert.doesNotMatch(html,/src="\/ogp|content="\/ogp\.png"/);
 const og=html.match(/property="og:description" content="([^"]+)"/);
 const tw=html.match(/name="twitter:description" content="([^"]+)"/);
 assert.ok(og&&tw);assert.equal(og[1],tw[1]);
});
test('generated OGP is an actual reasonably-sized 1200x630 PNG',()=>{
 const png=readFileSync('dist/ogp.png');
 assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(png.toString('ascii',12,16),'IHDR');
 assert.equal(png.readUInt32BE(16),1200);
 assert.equal(png.readUInt32BE(20),630);
 assert.equal(png[24],8);
 assert.equal(png[25],6);
 assert.ok(statSync('dist/ogp.png').size>25000,'nonempty visual');
 assert.ok(statSync('dist/ogp.png').size<500000,'suitable social preview payload');
});
