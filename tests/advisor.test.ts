import {describe,it,expect} from 'vitest';
import {buildRadar,budgetCoverage} from '../lib/advisor';
import {RULES,Draw,LotteryRule} from '../lib/rules';
import {seeded,uniformSample,choose} from '../lib/math';

function makeDraws(rule:LotteryRule,count:number,seed=405):Draw[]{
  const rng=seeded(seed);
  const pool=Array.from({length:rule.max-rule.min+1},(_,i)=>i+rule.min);
  return Array.from({length:count},(_,i)=>({
    lottery:rule.id,contest:i+1,date:'2026-01-01',nextDate:null,
    numbers:rule.extra==='columns'?Array.from({length:7},()=>Math.floor(rng()*10)):uniformSample(pool,rule.draw,rng),
    secondNumbers:null,extra:null,prizeEstimate:null,payouts:[],fetchedAt:'2026-01-01T00:00:00.000Z',source:'dados-teste'
  }));
}

describe('Radar Diário de estratégias',()=>{
  it('não inventa concursos nem lista dezenas sem histórico',()=>{
    const r=buildRadar([],RULES.megasena);
    expect(r.analyzedContest).toBeNull();expect(r.observations).toBe(0);
    expect(r.hot).toEqual([]);expect(r.strategyEvidence).toEqual([]);
    expect(r.sampleStatus).toBe('unavailable');
  });
  it('identifica quentes/frias como CONTAGENS retrospectivas e compara à expectativa',()=>{
    const rule=RULES.megasena;
    const ds=makeDraws(rule,40).map(d=>({...d,numbers:d.numbers.includes(1)?d.numbers:[1,...d.numbers.filter(n=>n!==1).slice(0,5)].sort((a,b)=>a-b)}));
    const r=buildRadar(ds,rule);
    expect(r.frequencyWindow).toBe(30);
    expect(r.hot[0].number).toBe(1);
    expect(r.hot[0].appearances).toBe(30);
    expect(r.hot[0].expected).toBe(3);
    expect(r.testedDraws).toBe(10);
  });
  it('usa walk-forward e avalia somente concursos com pelo menos 30 antecedentes',()=>{
    const r=buildRadar(makeDraws(RULES.lotofacil,90),RULES.lotofacil);
    expect(r.strategyEvidence).toHaveLength(6);
    expect(r.strategyEvidence.every(x=>x.evaluated===60)).toBe(true);
    expect(r.strategyEvidence.every(x=>x.expectedHits===9)).toBe(true);
    expect(r.recommendation).toBe('diversity');
  });
  it('não trata Super Sete como sorteio comum de números sem reposição',()=>{
    const r=buildRadar(makeDraws(RULES.supersete,80),RULES.supersete);
    expect(r.hot).toHaveLength(5);
    expect(r.hot[0].expected).toBe(21);
    expect(r.strategyEvidence).toEqual([]);
  });
  it('ignora concursos duplicados e inválidos',()=>{
    const ds=makeDraws(RULES.megasena,40);
    const bad={...ds[0],contest:100,numbers:[0,0,0,0,0,0]};
    const r=buildRadar([...ds,ds[0],bad],RULES.megasena);
    expect(r.observations).toBe(40);
    expect(r.analyzedContest).toBe(40);
  });
});

describe('Orçamento e chances matemáticas',()=>{
  it('R$ 50 permitem 8 jogos distintos da Mega-Sena, se gerados sem duplicação',()=>{
    const a=budgetCoverage(RULES.megasena,50);
    expect(a.games).toBe(8);expect(a.cost).toBe(48);expect(a.change).toBe(2);
    expect(a.jackpotChance).toBeCloseTo(8/choose(60,6),14);
  });
  it('R$ 50 permitem 14 jogos da Lotofácil',()=>{
    const a=budgetCoverage(RULES.lotofacil,50);
    expect(a.games).toBe(14);expect(a.cost).toBe(49);
    expect(a.jackpotChance).toBeCloseTo(14/choose(25,15),13);
  });
  it('não fornece probabilidade agregada enganosa para Timemania',()=>{
    expect(budgetCoverage(RULES.timemania,50).jackpotChance).toBeNull();
  });
  it('lida com orçamento zero e limites sem divisões por zero',()=>{
    const a=budgetCoverage(RULES.megasena,0);
    expect(a.games).toBe(0);expect(a.oneIn).toBeNull();
  });
});
