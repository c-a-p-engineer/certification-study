/** Dependency-free deterministic social card: 1200x630 PNG at dist/ogp.png.
 * Run after Vite, before offline service worker generation. No external API/fonts.
 */
import {mkdirSync,writeFileSync,statSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
const W=1200,H=630,P=Buffer.alloc(W*H*4);
const clamp=n=>Math.min(255,Math.max(0,Math.round(n)));
function point(x,y,color,alpha=1){x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=W||y>=H)return;const i=4*(y*W+x),q=Math.min(1,Math.max(0,alpha));for(let c=0;c<3;c++)P[i+c]=clamp(P[i+c]*(1-q)+color[c]*q);P[i+3]=255}
function circle(cx,cy,r,color,a=1){const x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(W-1,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(H-1,Math.ceil(cy+r));const rr=r*r;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const d=(x-cx)**2+(y-cy)**2;if(d<=rr)point(x,y,color,a*(d>rr-r*2?Math.max(0,(rr-d)/(r*2)):.999))}}
function glow(cx,cy,r,color,a=.6){const x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(W-1,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(H-1,Math.ceil(cy+r));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const q=Math.hypot(x-cx,y-cy)/r;if(q<1)point(x,y,color,a*(1-q)**2)}}
function poly(coords,color,alpha=1){const ys=coords.map(p=>p[1]),y0=Math.max(0,Math.floor(Math.min(...ys))),y1=Math.min(H-1,Math.ceil(Math.max(...ys)));for(let y=y0;y<=y1;y++){const at=y+.5,intersections=[];for(let i=0;i<coords.length;i++){const [ax,ay]=coords[i],[bx,by]=coords[(i+1)%coords.length];if((ay<=at&&by>at)||(by<=at&&ay>at))intersections.push(ax+(at-ay)*(bx-ax)/(by-ay))}intersections.sort((a,b)=>a-b);for(let j=0;j+1<intersections.length;j+=2){const xa=Math.max(0,Math.ceil(intersections[j])),xb=Math.min(W-1,Math.floor(intersections[j+1]));for(let x=xa;x<=xb;x++)point(x,y,color,alpha)}}}
function line(ax,ay,bx,by,width,color,alpha=1){const minX=Math.max(0,Math.floor(Math.min(ax,bx)-width)),maxX=Math.min(W-1,Math.ceil(Math.max(ax,bx)+width)),minY=Math.max(0,Math.floor(Math.min(ay,by)-width)),maxY=Math.min(H-1,Math.ceil(Math.max(ay,by)+width));const dx=bx-ax,dy=by-ay,d2=dx*dx+dy*dy;for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const t=d2?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/d2)):0,d=Math.hypot(x-ax-t*dx,y-ay-t*dy),cover=Math.min(1,Math.max(0,width/2+.75-d));if(cover)point(x,y,color,alpha*cover)}}
function arc(cx,cy,rx,ry,start,end,color,width=2,alpha=1){let last=null;for(let i=0;i<=220;i++){const t=start+(end-start)*i/220,pt=[cx+Math.cos(t)*rx,cy+Math.sin(t)*ry];if(last)line(last[0],last[1],pt[0],pt[1],width,color,alpha);last=pt}}
const font={
'A':['01110','10001','10001','11111','10001','10001','10001'],
'B':['11110','10001','10001','11110','10001','10001','11110'],
'C':['01111','10000','10000','10000','10000','10000','01111'],
'D':['11110','10001','10001','10001','10001','10001','11110'],
'E':['11111','10000','10000','11110','10000','10000','11111'],
'F':['11111','10000','10000','11110','10000','10000','10000'],
'G':['01111','10000','10000','10111','10001','10001','01111'],
'H':['10001','10001','10001','11111','10001','10001','10001'],
'I':['11111','00100','00100','00100','00100','00100','11111'],
'J':['00111','00010','00010','00010','10010','10010','01100'],
'K':['10001','10010','10100','11000','10100','10010','10001'],
'L':['10000','10000','10000','10000','10000','10000','11111'],
'M':['10001','11011','10101','10101','10001','10001','10001'],
'N':['10001','11001','10101','10011','10001','10001','10001'],
'O':['01110','10001','10001','10001','10001','10001','01110'],
'P':['11110','10001','10001','11110','10000','10000','10000'],
'Q':['01110','10001','10001','10001','10101','10010','01101'],
'R':['11110','10001','10001','11110','10100','10010','10001'],
'S':['01111','10000','10000','01110','00001','00001','11110'],
'T':['11111','00100','00100','00100','00100','00100','00100'],
'U':['10001','10001','10001','10001','10001','10001','01110'],
'V':['10001','10001','10001','10001','10001','01010','00100'],
'W':['10001','10001','10001','10101','10101','10101','01010'],
'X':['10001','10001','01010','00100','01010','10001','10001'],
'Y':['10001','10001','01010','00100','00100','00100','00100'],
'Z':['11111','00001','00010','00100','01000','10000','11111'],
'0':['01110','10011','10101','10101','11001','10001','01110'],
'1':['00100','01100','00100','00100','00100','00100','01110'],
'2':['01110','10001','00001','00010','00100','01000','11111'],
'3':['11110','00001','00001','01110','00001','00001','11110'],
'4':['00010','00110','01010','10010','11111','00010','00010'],
'5':['11111','10000','10000','11110','00001','00001','11110'],
'6':['01110','10000','10000','11110','10001','10001','01110'],
'7':['11111','00001','00010','00100','01000','01000','01000'],
'8':['01110','10001','10001','01110','10001','10001','01110'],
'9':['01110','10001','10001','01111','00001','00001','01110'],
'/':['00001','00001','00010','00100','01000','10000','10000'],
'.':['00000','00000','00000','00000','00000','01100','01100'],
'-':['00000','00000','00000','11111','00000','00000','00000'],
'+':['00000','00100','00100','11111','00100','00100','00000'],
':':['00000','01100','01100','00000','01100','01100','00000'],
'!':['00100','00100','00100','00100','00100','00000','00100'],
' ':['00000','00000','00000','00000','00000','00000','00000'],
};
function text(s,x,y,k,color,spacing=1,alpha=1){for(const ch of s.toUpperCase()){const rows=font[ch]||font[' '];for(let yy=0;yy<7;yy++)for(let xx=0;xx<5;xx++)if(rows[yy][xx]==='1'){const bx=Math.floor(x+xx*k),by=Math.floor(y+yy*k);for(let j=0;j<k;j++)for(let i=0;i<k;i++)point(bx+i,by+j,color,alpha)}x+=(5+spacing)*k}}
const colors={navy:[9,15,34],cyan:[120,245,255],teal:[40,197,225],amber:[255,194,98],orange:[255,92,43],purple:[112,89,210],white:[238,249,255]};
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const d=Math.hypot((x-975)/1.2,(y-305));const q=Math.max(0,1-d/660);const i=(y*W+x)*4;
 P[i]=clamp(7+14*q+8*x/W);P[i+1]=clamp(12+23*q+5*y/H);P[i+2]=clamp(29+40*q+8*x/W);P[i+3]=255;
}
glow(901,303,355,[235,68,38],.34);glow(715,165,285,[62,89,245],.28);glow(1028,468,220,[255,143,51],.26);
for(let x=14;x<1200;x+=60)line(x,0,x,H,.8,[56,110,168],.09);
for(let y=20;y<630;y+=60)line(0,y,W,y,.8,[56,110,168],.09);
line(36,0,283,630,2,colors.teal,.14);line(925,0,1170,630,1.5,colors.amber,.14);
poly([[0,0],[1092,0],[1065,18],[0,18]],[22,42,64],.6);
poly([[0,603],[1200,603],[1200,630],[0,630]],[13,30,52],1);
line(40,50,40,575,4,colors.cyan,.68);line(50,45,550,45,2,colors.cyan,.45);
line(55,580,583,580,3,colors.amber,.72);
arc(917,306,244,238,-2.72,2.72,colors.cyan,3,.42);
arc(923,309,215,215,-2.68,2.68,colors.amber,2,.48);
arc(930,307,168,167,-2.65,2.65,colors.orange,1.5,.3);
for(let i=0;i<9;i++){const t=(-2.35+i*.56),a=[922+Math.cos(t)*247,308+Math.sin(t)*240],b=[922+Math.cos(t)*263,308+Math.sin(t)*257];line(...a,...b,4,i%2?colors.orange:colors.cyan,.58)}
const flame=[[813,332],[739,259],[673,163],[688,231],[644,197],[673,287],[628,279],[686,361],[769,391],[846,361]];
const right=[[969,332],[1045,252],[1144,154],[1112,239],[1178,194],[1143,288],[1190,281],[1118,361],[1036,394],[957,365]];
poly(flame,[117,36,66],.87);poly(right,[130,44,43],.9);
poly([[824,327],[748,249],[694,196],[718,282],[683,266],[736,356],[824,376]],[239,86,44],.96);
poly([[962,327],[1037,248],[1127,188],[1099,278],[1143,258],[1091,350],[965,378]],[252,94,45],.98);
poly([[830,342],[774,269],[736,237],[758,299],[720,295],[775,354],[839,371]],[255,194,80],.94);
poly([[963,342],[1021,266],[1088,231],[1062,308],[1101,290],[1044,359],[953,374]],[255,194,80],.97);
poly([[838,348],[793,297],[777,291],[804,336],[834,370]],[255,239,135],.94);
poly([[949,344],[1000,296],[1023,290],[993,343],[957,369]],[255,239,135],.93);
poly([[835,300],[861,238],[913,204],[959,225],[994,293],[979,380],[928,430],[868,391]],[80,35,78],1);
poly([[863,302],[877,252],[918,227],[961,264],[970,343],[928,393],[874,354]],[233,64,40],.99);
poly([[892,309],[899,270],[925,258],[950,279],[952,347],[924,373],[900,341]],[255,174,69],1);
poly([[912,298],[924,289],[938,302],[937,347],[922,358],[913,341]],[255,234,136],.99);
poly([[886,257],[883,222],[899,177],[898,203],[926,159],[917,212],[948,190],[936,235],[955,247],[925,274]],[255,114,50],1);
poly([[916,223],[934,201],[951,228],[963,259],[938,284],[908,258]],[255,204,90],1);
poly([[952,245],[1006,253],[970,273]],[255,226,147],1);
circle(943,240,9,[18,25,49],1);circle(946,237,3,colors.cyan,1);
glow(946,238,18,colors.cyan,.75);
poly([[878,387],[903,415],[886,476],[850,546],[882,509],[913,466],[913,424]],[249,78,43],.96);
poly([[915,400],[940,427],[955,486],[922,562],[934,488],[911,458]],[255,173,62],.94);
poly([[959,385],[967,428],[1025,491],[993,565],[995,504],[955,462],[939,428]],[230,65,43],.96);
for(let i=0;i<15;i++){
 const a=i*.73,r=80+i*8,cx=935+Math.cos(a)*r,cy=330+Math.sin(a)*r*.78;
 line(cx-4,cy+9,cx+3,cy-9,1.6,i%3===0?colors.cyan:colors.amber,.35);
}
poly([[592,509],[758,112],[740,183],[625,509]],[63,229,243],.23);
line(633,504,760,144,4,colors.cyan,.55);
text('CERTIFICATION',79,82,4,colors.cyan,1,.9);
text('CERT //',75,153,10,colors.white);
text('OVERDRIVE',73,257,10,colors.amber);
line(80,364,602,364,4,colors.cyan,.9);
text('STUDY. STRIKE. LEVEL UP.',79,385,3,[221,235,255],1,.95);
text('AWS SAA-C03  //  3D RPG QUIZ',79,439,3,[141,216,234],1,.92);
const modes=[{x:80,w:165,text:'QUEST RUN'},{x:252,w:127,text:'BLITZ'},{x:386,w:188,text:'DAILY CODE'}];
for(const [i,m] of modes.entries()){
 poly([[m.x,494],[m.x+m.w,494],[m.x+m.w,548],[m.x,548]],[21,48,70],.95);
 line(m.x,494,m.x+m.w,494,2,i===0?colors.amber:colors.cyan,.85);
 line(m.x,548,m.x+m.w,548,1,i===0?colors.amber:colors.cyan,.55);
 text(m.text,m.x+12,511,2.45,i===0?colors.amber:colors.white);
}
text('INDEPENDENT AWS STUDY GAME',67,605,2,[136,164,192],1,.9);
text('PLAY FREE  /  NO LOGIN',831,604,2,[141,203,215],1,.92);
// Compact standards-compliant RGBA8 PNG encoder.
const crcTable=Array.from({length:256},(_,i)=>{for(let k=0;k<8;k++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0});
function crc(buffer){let c=0xffffffff;for(const b of buffer)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function chunk(name,data){const nameBuf=Buffer.from(name,'ascii'),size=Buffer.alloc(4),check=Buffer.alloc(4);size.writeUInt32BE(data.length);check.writeUInt32BE(crc(Buffer.concat([nameBuf,data])));return Buffer.concat([size,nameBuf,data,check])}
const scan=Buffer.alloc(H*(W*4+1));for(let y=0;y<H;y++)P.copy(scan,y*(W*4+1)+1,y*W*4,(y+1)*W*4);
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
const output=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(scan,{level:9})),chunk('IEND',Buffer.alloc(0))]);
mkdirSync('dist',{recursive:true});writeFileSync('dist/ogp.png',output);
console.log('Generated social preview: 1200x630, '+(statSync('dist/ogp.png').size/1024).toFixed(1)+' KiB');
