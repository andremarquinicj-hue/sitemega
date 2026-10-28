import {buildRadar,budgetCoverage} from '../lib/advisor';
import {RULES,Draw,LotteryRule,LOTTERY_KEYS} from '../lib/rules';
import {uniformSample,seeded,choose} from '../lib/math';
import assert from 'node:assert/strict';
function fixture(rule:LotteryRule, count:number):Draw[]{
  const rng=seeded(20261028),universe=Array.from({length:rule.max-rule.min+1},(_,i)=>i+rule.min);
  return Array.from({length:count},(_,i)=>({lottery:rule.id,contest:i+1,date:'2026-10-28',nextDate:null,numbers:rule.extra==='columns'?Array.from({length:7},()=>Math.floor(rng()*10)):uniformSample(universe,rule.draw,rng),secondNumbers:null,extra:null,payouts:[],prizeEstimate:null,fetchedAt:new Date(0).toISOString(),source:'fixture'}));
}
for(const lottery of LOTTERY_KEYS){
  const rule=RULES[lottery],draws=fixture(rule,65),report=buildRadar(draws,rule);
  assert.equal(report.analyzedContest,65);
  assert.equal(report.observations,65);
  assert.equal(report.frequencyWindow,30);
  assert(report.hot.length>0 && report.cold.length>0);
  assert.equal(report.recommendation,'diversity');
  if(rule.extra!=='columns'){
    assert.equal(report.strategyEvidence.length,6);
    assert(report.strategyEvidence.every(x=>x.evaluated===35));
  }
  console.log(`${rule.label}: ${report.testedDraws} backtests; hot ${report.hot.map(v=>v.number).join(',')}`);
}
assert.equal(budgetCoverage(RULES.megasena,50).games,8);
assert.equal(budgetCoverage(RULES.lotofacil,50).games,14);
assert.equal(budgetCoverage(RULES.megasena,50).jackpotChance,8/choose(60,6));
console.log('RADAR TESTS OK');
