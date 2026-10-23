import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root='dist',base='/certification-study/';
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(join(dir,item.name)):[join(dir,item.name)]);
const assets=walk(root).map(file=>relative(root,file).replaceAll('\\','/')).filter(x=>x!=='sw.js'&&!x.endsWith('.map'));
// Avoid huge/mutable caches: only files emitted from our build (JS, CSS, HTML, manifest, icons).
const allowed=assets.filter(x=>/^(?:index\.html|manifest\.webmanifest|assets\/.*\.(?:js|css)|icons\/.*\.svg)$/.test(x));
if(!allowed.includes('index.html')||!allowed.some(x=>x.endsWith('.js'))||!allowed.some(x=>x.endsWith('.css'))||!allowed.includes('manifest.webmanifest'))throw new Error('Missing required offline app shell');
const precache=allowed.map(x=>base+x);
const version=createHash('sha256').update(allowed.map(x=>x+':'+createHash('sha256').update(readFileSync(join(root,x))).digest('hex')).join('|')).digest('hex').slice(0,16);
const code=readFileSync('scripts/sw-template.js','utf8').replace('__VERSION__',version).replace('__PRECACHE__',JSON.stringify(precache));
writeFileSync(join(root,'sw.js'),code);
console.log('Offline PWA cache '+version+' with '+precache.length+' build assets');
