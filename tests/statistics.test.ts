import {describe,it,expect} from 'vitest';
import {RULES, type Draw} from '../lib/rules';
import {buildStatisticalReport, validDraws} from '../lib/statistics';
import {buildRadar} from '../lib/advisor';
import {uniformSample,seeded} from '../lib/math';

function history(lottery:'megasena'|'lotofacil', count:number):Draw[]{
  const rule=RULES[lottery], universe=Array.from({length:rule.max-rule.min+1},(_,i)=>rule.min+i);
  return Array.from({length:count},(_,i)=>({
    lottery,contest:i+1,date:'2026-01-01',nextDate:null,
    numbers:uniformSample(universe,rule.draw,seeded(i*331+11)),secondNumbers:null,
    extra:null,prizeEstimate:null,payouts:[],source:'TESTE',fetchedAt:'2026-01-01T00:00:00Z'
  }));
}

describe('Relatório do histórico completo (servidor)',()=>{
  it('contempla os 1266 concursos da Mega-Sena sem reduzir a 500',()=>{
    const r=buildStatisticalReport(history('megasena',1266),RULES.megasena);
    expect(r.historicalDraws).toBe(1266);
    expect(r.windows['10'].observed).toBe(10);
    expect(r.windows['30'].observed).toBe(30);
    expect(r.windows['50'].observed).toBe(50);
    expect(r.windows['100'].observed).toBe(100);
    expect(r.windows['200'].observed).toBe(200);
    expect(r.windows['500'].observed).toBe(500);
    expect(r.windows.all.observed).toBe(1266);
    expect(r.windows.all.rows.reduce((sum,row)=>sum+row.total,0)).toBe(1266*6);
    expect(r.windows.all.rows.every(row=>row.expected===126.6)).toBe(true);
    expect(r.missingWithinRange).toBe(0);
  });
  it('usa as 956 observações da Lotofácil no relatório completo',()=>{
    const r=buildStatisticalReport(history('lotofacil',956),RULES.lotofacil);
    expect(r.historicalDraws).toBe(956);
    expect(r.windows.all.rows.reduce((sum,row)=>sum+row.total,0)).toBe(956*15);
    expect(r.windows['500'].observed).toBe(500);
  });
  it('não inventa concursos ausentes e elimina duplicados',()=>{
    const d=history('megasena',42).filter(x=>x.contest!==11);
    const bad={...d[0],contest:800,numbers:[99,99,99,99,99,99]};
    const report=buildStatisticalReport([...d,d[0],bad],RULES.megasena);
    expect(report.historicalDraws).toBe(41);
    expect(report.missingWithinRange).toBe(1);
    expect(validDraws([...d,bad],RULES.megasena)).toHaveLength(41);
  });
  it('Radar avalia centenas de resultados reservando o início do treino',()=>{
    const radar=buildRadar(history('megasena',460),RULES.megasena);
    expect(radar.observations).toBe(460);
    expect(radar.testedDraws).toBe(300);
    expect(radar.minimumTraining).toBe(90);
    expect(radar.strategyEvidence).toHaveLength(6);
    expect(radar.strategyEvidence.every(s=>s.evaluated===300)).toBe(true);
    expect(radar.strategyEvidence.every(s=>s.baselineMeanHits>=0)).toBe(true);
  });
});
