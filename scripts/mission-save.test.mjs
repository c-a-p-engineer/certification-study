import test from 'node:test';
import assert from 'node:assert/strict';
import {isMissionSave,readMissionSave,restoredMissionIsValid} from '../src/missionSave.ts';

const base=()=>{
 return {version:1,ids:['saa-001','saa-002'],index:0,selected:null,
 multiChoices:[],choiceOrder:[3,1,0,2],answers:{},session:{correct:0,total:0},
 combo:0,weak:false,boss:false,due:false,showChoices:true,reflection:'',savedAt:Date.now()};
};
test('valid interrupted mission passes schema and option restore checks',()=>{
 const snapshot=base();
 assert.equal(isMissionSave(snapshot),true);
 assert.equal(restoredMissionIsValid(snapshot,['A','B','C','D']),true);
});
test('answered multi-response restores selected sentinel and option order',()=>{
 const snapshot={...base(),index:1,selected:-2,multiChoices:[1,3],choiceOrder:[2,0,3,1],session:{correct:1,total:1},answers:{'saa-002':[1,3]}};
 assert.equal(isMissionSave(snapshot),true);
 assert.equal(restoredMissionIsValid(snapshot,['A','B','C','D']),true);
});
test('reject corrupted or partial mission state',()=>{
 assert.equal(isMissionSave(null),false);
 assert.equal(isMissionSave({}),false);
 assert.equal(isMissionSave({...base(),index:-1}),false);
 assert.equal(isMissionSave({...base(),index:2}),false);
 assert.equal(isMissionSave({...base(),ids:[]}),false);
 assert.equal(isMissionSave({...base(),selected:99.1}),false);
 assert.equal(isMissionSave({...base(),choiceOrder:'bad'}),false);
});
test('reject option count change or corrupted saved option order',()=>{
 const snapshot=base();
 assert.equal(restoredMissionIsValid(snapshot,['A','B','C','D','E']),false);
 assert.equal(restoredMissionIsValid({...snapshot,choiceOrder:[0,0,2,3]},['A','B','C','D']),false);
 assert.equal(restoredMissionIsValid({...snapshot,multiChoices:[8]},['A','B','C','D']),false);
});
test('snapshot reader is safe in runtimes without browser storage',()=>{
 assert.equal(readMissionSave(),null);
});

test('case-only mission resumes without breaking old v1 snapshots',()=>{
 assert.equal(isMissionSave({...base(),scenario:true}),true);
 assert.equal(isMissionSave({...base(),scenario:false}),true);
 assert.equal(isMissionSave(base()),true);
 assert.equal(isMissionSave({...base(),scenario:'on'}),false);
});

test('OVERDRIVE 4.0 boss and focused training resume via optional fields with v1 compatibility',()=>{
 const prior=base();
 const boss={...prior,boss:true,bossDomain:'セキュリティ'};
 const focus={...prior,focusTopic:'VPC / ネットワーク'};
 assert.equal(isMissionSave(prior),true);
 assert.equal(isMissionSave(boss),true);
 assert.equal(isMissionSave(focus),true);
 assert.equal(restoredMissionIsValid(boss,['A','B','C','D']),true);
 assert.equal(isMissionSave({...boss,bossDomain:{bad:true}}),false);
 assert.equal(isMissionSave({...focus,focusTopic:123}),false);
});
