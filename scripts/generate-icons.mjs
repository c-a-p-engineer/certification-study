/** Dependency-free PNG fallback icons for installability on Chromium-based Android browsers. */
import {writeFileSync,mkdirSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
const CRC_TABLE=Array.from({length:256},(_,index)=>{
 let n=index;for(let i=0;i<8;i++)n=n&1?(0xedb88320^(n>>>1)):(n>>>1);
 return n>>>0;
});
function crc32(buf){let c=0xffffffff;for(const b of buf)c=CRC_TABLE[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function chunk(type,data){
 const t=Buffer.from(type,'ascii'),size=Buffer.alloc(4),crc=Buffer.alloc(4);
 size.writeUInt32BE(data.length,0);crc.writeUInt32BE(crc32(Buffer.concat([t,data])),0);
 return Buffer.concat([size,t,data,crc]);
}
const bolt=[[286,74],[124,292],[229,292],[207,438],[388,193],[284,193],[317,74]];
function insidePolygon(x,y,points){
 let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[i],b=points[j];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
function icon(n,maskable){
 const pixels=Buffer.alloc((n*4+1)*n);
 const transform=maskable?.78:1;
 for(let y=0;y<n;y++){pixels[y*(n*4+1)]=0;
  for(let x=0;x<n;x++){
   const ox=(x+.5)/n*512,oy=(y+.5)/n*512;
   const xx=(ox-256)/transform+256,yy=(oy-256)/transform+256;
   const dist=Math.hypot(xx-256,yy-256);
   let color=dist<190?[24,43,77,255]:[17,27,54,255];
   if(dist>182&&dist<194)color=[109,229,237,255];
   if(insidePolygon(xx,yy,bolt))color=[124,239,232,255];
   const index=y*(n*4+1)+1+x*4;
   for(let i=0;i<4;i++)pixels[index+i]=color[i];
  }
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(n,0);header.writeUInt32BE(n,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
mkdirSync('dist/icons',{recursive:true});
for(const n of [192,512]){writeFileSync(`dist/icons/overdrive-${n}.png`,icon(n,false))}
writeFileSync('dist/icons/overdrive-maskable-512.png',icon(512,true));
console.log('Rendered Android-friendly PNG app icons (192 / 512 / maskable 512)');
