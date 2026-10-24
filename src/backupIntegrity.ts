/** 6.3 — Portable v2 backup with browser-native SHA-256 integrity checking.
 * SHA-256 detects accidental changes; NOT a signature or anti-forgery guarantee.
 * v1 backups remain readable and restorable through the existing validated importer.
 */
import {createBackup,parseBackup,MAX_BACKUP_BYTES,type BackupData} from './backup.ts';

export const VERIFIED_BACKUP_SCHEMA=2;
export type VerifiedBackup={format:'CERT-OVERDRIVE-BACKUP';version:2;createdAt:string;items:Record<string,string>;integrity:{algorithm:'SHA-256';digest:string}};
export type PortableRead={data:BackupData;schemaVersion:1|2;integrity:'verified'|'legacy-unverified'};

const isObject=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const ordered=(items:Record<string,string>)=>Object.fromEntries(Object.entries(items).sort(([a],[b])=>a.localeCompare(b,'en')));
const payload=(x:{createdAt:string;items:Record<string,string>})=>JSON.stringify({format:'CERT-OVERDRIVE-BACKUP',version:2,createdAt:x.createdAt,items:ordered(x.items)});
async function digest(content:string):Promise<string>{
 const subtle=globalThis.crypto?.subtle;
 if(!subtle)throw new Error('このブラウザではSHA-256確認を利用できません。HTTPSでお試しください。');
 const bytes=await subtle.digest('SHA-256',new TextEncoder().encode(content));
 return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function createVerifiedBackup(store:Pick<Storage,'getItem'|'setItem'|'removeItem'>,now=new Date()):Promise<VerifiedBackup>{
 const old=parseBackup(JSON.stringify(createBackup(store,now)));
 const bare={format:old.format,version:2 as const,createdAt:old.createdAt,items:old.items};
 const integrity={algorithm:'SHA-256' as const,digest:await digest(payload(bare))};
 const value={...bare,integrity};
 if(new TextEncoder().encode(JSON.stringify(value)).length>MAX_BACKUP_BYTES)throw new Error('バックアップサイズが8MBを超えています。');
 return value;
}
export async function readPortableBackup(input:string):Promise<PortableRead>{
 if(new TextEncoder().encode(input).length>MAX_BACKUP_BYTES)throw new Error('ファイルが大きすぎます（最大8MB）');
 let x:unknown;
 try{x=JSON.parse(input)}catch{throw new Error('JSONを読み取れません')}
 if(!isObject(x))throw new Error('不正なバックアップです。');
 if(x.version===1)return {data:parseBackup(input),schemaVersion:1,integrity:'legacy-unverified'};
 if(x.version!==2||x.format!=='CERT-OVERDRIVE-BACKUP'||typeof x.createdAt!=='string'||!isObject(x.items)||!isObject(x.integrity)||
  Object.keys(x).sort().join(',')!=='createdAt,format,integrity,items,version'||Object.keys(x.integrity).sort().join(',')!=='algorithm,digest'||
  x.integrity.algorithm!=='SHA-256'||typeof x.integrity.digest!=='string'||!/^[a-f0-9]{64}$/.test(x.integrity.digest))throw new Error('未対応または不正なバックアップ形式です。');
 const v1=parseBackup(JSON.stringify({format:x.format,version:1,createdAt:x.createdAt,items:x.items}));
 const calculated=await digest(payload(v1));
 if(calculated!==x.integrity.digest)throw new Error('整合性エラー：バックアップが破損または変更されています。復元していません。');
 return {data:v1,schemaVersion:2,integrity:'verified'};
}
/** Emergency snapshot is intentionally NOT a standard restorable backup. Never modify storage. */
export function emergencySnapshot(store:Pick<Storage,'getItem'>,keys:readonly string[],journalKey:string,now=new Date()){
 const items:Record<string,string|null>=Object.create(null);
 for(const key of keys)items[key]=store.getItem(key);
 return {format:'CERT-OVERDRIVE-RECOVERY-SNAPSHOT',version:1,createdAt:now.toISOString(),items,journal:store.getItem(journalKey),
  warning:'Emergency raw snapshot only. Do not import as a normal study backup or share publicly. Includes potentially sensitive local preferences.'};
}
