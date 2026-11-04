import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {SCENARIOS, createState, setControl, evaluate} from '../public/labs/architecture/engine.mjs';

test('three self-contained, documented sandbox scenarios exist', () => {
  assert.deepEqual(Object.keys(SCENARIOS), ['ha','rds','s3']);
  for (const s of Object.values(SCENARIOS)) {
    assert.equal(new URL(s.reference).hostname,'docs.aws.amazon.com');
    assert.ok(s.title && s.prompt);
  }
  for (const path of ['index.html','app.mjs','engine.mjs','lab.css']) {
    assert.equal(existsSync('public/labs/architecture/'+path), true);
  }
});
test('HA derives capacity and fail-open caveat from one canonical state', () => {
  const start=createState('ha');
  assert.deepEqual(evaluate(start).metrics[0],{label:'正常なAZ',value:'2 / 2'});
  assert.equal(evaluate(start).metrics[1].value,'100%');
  const a=setControl(start,'azA',false);
  assert.equal(evaluate(a).metrics[1].value,'71%');
  const outage=setControl(a,'azB',false);
  assert.equal(evaluate(outage).tone,'bad');
  assert.match(evaluate(outage).detail,/fail-open/);
  assert.equal(evaluate(setControl(outage,'alb',false)).metrics[1].value,'0%');
  assert.match(evaluate(setControl(a,'session',false)).note,/セッション/);
});
test('RDS standby restores writes only after HA failover transition',()=>{
  const start=createState('rds');
  const failed=setControl(start,'primaryUp',false);
  assert.equal(evaluate(failed).metrics[0].value,'停止');
  assert.equal(evaluate(failed).tone,'warn');
  const promoted=setControl(failed,'failoverDone',true);
  assert.equal(evaluate(promoted).metrics[0].value,'可能');
  assert.equal(setControl(start,'failoverDone',true),start);
  const single=setControl(failed,'multiAZ',false);
  assert.equal(single.failoverDone,false);
  assert.equal(setControl(single,'failoverDone',true),single);
  const replica=setControl(single,'readReplica',true);
  assert.equal(evaluate(replica).metrics[0].value,'停止');
  assert.equal(evaluate(replica).metrics[1].value,'可能');
});
test('S3 access uses both network path and IAM and VPCE policy',()=>{
  const start=createState('s3');
  assert.equal(evaluate(start).tone,'good');
  assert.equal(evaluate(setControl(start,'endpoint',false)).tone,'bad');
  assert.match(evaluate(setControl(start,'iam',false)).detail,/IAM/);
  const consoleAccess=setControl(start,'source','console');
  assert.equal(evaluate(consoleAccess).tone,'bad');
  assert.match(evaluate(consoleAccess).detail,/コンソール/);
  assert.equal(evaluate(setControl(consoleAccess,'restrictVpce',false)).tone,'good');
  assert.equal(setControl(start,'source','unknown'),start);
  assert.equal(setControl(start,'__proto__',true),start);
});
test('sandbox is isolated from progress and exposes required navigation',()=>{
  const home=readFileSync('src/HomeSecondaryPanels.tsx','utf8');
  const html=readFileSync('public/labs/architecture/index.html','utf8');
  const app=readFileSync('public/labs/architecture/app.mjs','utf8');
  assert.match(home,/\/certification-study\/labs\/architecture\//);
  assert.match(html,/href="\.\.\/\.\.\/"/);
  assert.match(html,/role="status"/);
  assert.match(app,/aria-selected/);
  assert.match(app,/data-key/);
  for(const text of [html,app,readFileSync('public/labs/architecture/engine.mjs','utf8')]){
    assert.doesNotMatch(text,/localStorage|fetch\(|sendBeacon|sessionStorage|applyStudyAttempt|recordDesignCompletion/);
  }
});
