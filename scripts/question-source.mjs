import {readFileSync} from 'node:fs';
export const QUESTION_SOURCES=[
 'certifications/aws-saa/questions/bank.jsonl',
 'certifications/aws-saa/questions/scenarios-2026.jsonl'
];
export function loadSourceLines(){
 return QUESTION_SOURCES.flatMap(path=>readFileSync(path,'utf8').split(/\r?\n/).filter(line=>line.trim()));
}
export function loadQuestions(){return loadSourceLines().map(JSON.parse)}
