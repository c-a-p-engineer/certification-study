import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const source='certifications/aws-saa/questions/bank.jsonl';
const lines=readFileSync(source,'utf8').split(/\r?\n/).filter(x=>x.trim());
const ids=new Set(); const questions=[];
for(let i=0;i<lines.length;i++){
 let q; try{q=JSON.parse(lines[i])}catch(e){throw new Error('Invalid JSONL at line '+(i+1)+': '+e.message)}
 if(typeof q.id!=='string'||ids.has(q.id))throw new Error('Missing or duplicate ID at line '+(i+1));
 if(!['セキュリティ','耐障害性','パフォーマンス','コスト最適化'].includes(q.domain))throw new Error('Invalid domain '+q.id);
 if(typeof q.question!=='string'||q.question.length<12)throw new Error('Invalid question '+q.id);
 if(!Array.isArray(q.choices)||q.choices.length!==4||q.choices.some(c=>typeof c!=='string'||!c.trim())||new Set(q.choices).size!==4)throw new Error('Invalid choices '+q.id);
 if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=4)throw new Error('Invalid answer '+q.id);
 if(typeof q.explanation!=='string'||q.explanation.length<15)throw new Error('Missing explanation '+q.id);
 if(typeof q.reference!=='string'||!q.reference.startsWith('https://docs.aws.amazon.com/'))throw new Error('Missing official reference '+q.id);
 ids.add(q.id);questions.push(q);
}
mkdirSync('src/generated',{recursive:true});
writeFileSync('src/generated/questions.json',JSON.stringify(questions,null,2)+'\n');
console.log('Validated '+questions.length+' questions; generated src/generated/questions.json');
