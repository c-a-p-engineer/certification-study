import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const source='certifications/aws-saa/questions/bank.jsonl';
const lines=readFileSync(source,'utf8').split(/\r?\n/).filter(x=>x.trim());
const ids=new Set(); const stems=new Set(); const questions=[];
for(let i=0;i<lines.length;i++){
 let q; try{q=JSON.parse(lines[i])}catch(e){throw new Error('Invalid JSONL at line '+(i+1)+': '+e.message)}
 if(typeof q.id!=='string'||ids.has(q.id))throw new Error('Missing or duplicate ID at line '+(i+1));
 if(!['セキュリティ','耐障害性','パフォーマンス','コスト最適化'].includes(q.domain))throw new Error('Invalid domain '+q.id);
 if(typeof q.question!=='string'||q.question.length<12)throw new Error('Invalid question '+q.id);
 if(!Array.isArray(q.choices)||(q.choices.length<4||q.choices.length>8)||q.choices.some(c=>typeof c!=='string'||!c.trim())||new Set(q.choices).size!==q.choices.length)throw new Error('Invalid choices '+q.id);
 const hasMulti=Array.isArray(q.answers);
 if(hasMulti){
   if(q.answer!==undefined)throw new Error('Both answer and answers defined '+q.id);
   if(q.answers.length<2||q.answers.length>3||q.answers.some(a=>!Number.isInteger(a)||a<0||a>=q.choices.length)||new Set(q.answers).size!==q.answers.length)throw new Error('Invalid multiple answers '+q.id);
 }else if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.choices.length)throw new Error('Invalid answer '+q.id);
 if(typeof q.explanation!=='string'||q.explanation.length<15)throw new Error('Missing explanation '+q.id);
 if(typeof q.reference!=='string'||!q.reference.startsWith('https://docs.aws.amazon.com/'))throw new Error('Missing official reference '+q.id);
 const normalizedStem=q.question.normalize('NFKC').replace(/\s+/g,'');
 if(stems.has(normalizedStem))throw new Error('Duplicate question stem '+q.id);
 if(q.difficulty!==undefined&&(!Number.isInteger(q.difficulty)||q.difficulty<1||q.difficulty>3))throw new Error('Invalid difficulty '+q.id);
 if(q.distractorReasons!==undefined&&(!Array.isArray(q.distractorReasons)||q.distractorReasons.length!==q.choices.length||q.distractorReasons.some(x=>typeof x!=='string'||x.trim().length<15)))throw new Error('Invalid distractor reasoning '+q.id);
 if(q.reviewedAt!==undefined&&(!/^\d{4}-\d{2}-\d{2}$/.test(q.reviewedAt)))throw new Error('Invalid review date '+q.id);
 if(q.tags!==undefined&&(!Array.isArray(q.tags)||q.tags.some(t=>typeof t!=='string'||!t.trim())))throw new Error('Invalid tags '+q.id);
 ids.add(q.id);stems.add(normalizedStem);questions.push(q);
}
for(const [domain,min] of Object.entries({'セキュリティ':20,'耐障害性':17,'パフォーマンス':15,'コスト最適化':13})){if(questions.filter(q=>q.domain===domain).length<min)throw new Error('Too few questions in '+domain)}
mkdirSync('src/generated',{recursive:true});
writeFileSync('src/generated/questions.json',JSON.stringify(questions,null,2)+'\n');
console.log('Validated '+questions.length+' questions; generated src/generated/questions.json');
