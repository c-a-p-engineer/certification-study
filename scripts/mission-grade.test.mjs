import test from 'node:test';
import assert from 'node:assert/strict';
import {missionGrade,comboMilestone} from '../src/missionGrade.ts';
test('S–D grade follows transparent practice accuracy thresholds',()=>{
 assert.equal(missionGrade(0,0).letter,'—');
 assert.equal(missionGrade(1,1).letter,'A');
 assert.equal(missionGrade(10,10).letter,'S');
 assert.equal(missionGrade(19,20).letter,'S');
 assert.equal(missionGrade(17,20).letter,'A');
 assert.equal(missionGrade(14,20).letter,'B');
 assert.equal(missionGrade(10,20).letter,'C');
 assert.equal(missionGrade(9,20).letter,'D');
 assert.equal(missionGrade(-4,20).percent,0);
 assert.equal(missionGrade(900,20).percent,100);
});
test('combo milestone events only occur at meaningful checkpoints',()=>{
 assert.deepEqual(Array.from({length:22},(_,i)=>i).filter(comboMilestone),[3,5,10,20]);
 assert.equal(comboMilestone(-1),false);
 assert.equal(comboMilestone(3.5),false);
});
