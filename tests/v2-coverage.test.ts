import {describe,it,expect} from 'vitest';
import {analyzeMegaPortfolio,budgetScenario,MEGA_SPACE,megaSingleRates} from '../lib/v2-coverage';
import {megaBatch} from '../lib/v2-generator';

const ticket=(...numbers:number[])=>({numbers});
const close=(a:number,b:number)=>expect(Math.abs(a-b)).toBeLessThan(1e-14);

describe('LottoMind AI 2.0 — cálculos de cobertura',()=>{
  it('Mega tem C(60,6) resultados e preço atualizado',()=>{
    expect(MEGA_SPACE).toBe(50063860);
    expect(budgetScenario(48,1)).toMatchObject({games:8,cost:48,remainder:0});
  });
  it('1 jogo tem 21.790 sorteios para 4+, 325 para 5+ e 1 para Sena',()=>{
    const r=analyzeMegaPortfolio([ticket(1,2,3,4,5,6)]);
    close(r.quadraOrBetter.probability!,21790/MEGA_SPACE);
    close(r.quinaOrBetter.probability!,325/MEGA_SPACE);
    close(r.sena.probability!,1/MEGA_SPACE);
  });
  it('oito jogos sem dezenas comuns têm eventos de 4+ e 5+ disjuntos',()=>{
    const bets=Array.from({length:8},(_,i)=>ticket(...Array.from({length:6},(_,j)=>i*6+j+1)));
    const r=analyzeMegaPortfolio(bets);
    close(r.quadraOrBetter.probability!,8*21790/MEGA_SPACE);
    close(r.quinaOrBetter.probability!,8*325/MEGA_SPACE);
    close(r.sena.probability!,8/MEGA_SPACE);
  });
  it('duas apostas com 4 dezenas em comum não recebem probabilidade somada indevidamente',()=>{
    const r=analyzeMegaPortfolio([ticket(1,2,3,4,5,6),ticket(1,2,3,4,7,8)]);
    expect(r.quadraOrBetter.probability!).toBeLessThan(2*21790/MEGA_SPACE);
    expect(r.quinaOrBetter.probability!).toBeLessThan(2*325/MEGA_SPACE);
    close(r.sena.probability!,2/MEGA_SPACE);
  });
  it('jogos duplicados são rejeitados',()=>expect(()=>analyzeMegaPortfolio([ticket(1,2,3,4,5,6),ticket(6,5,4,3,2,1)])).toThrow(/duplicadas/));
  it('oito jogos de máxima diversidade usam 48 dezenas',()=>{
    const r=megaBatch(8,'quadra','diversity',123);
    expect(analyzeMegaPortfolio(r).numberCount).toBe(48);
  });
  it('500 jogos têm probabilidade da Sena exatamente 500 / C(60,6)',()=>{
    const r=analyzeMegaPortfolio(megaBatch(500,'quadra','diversity',123));
    close(r.sena.probability!,500/MEGA_SPACE);
    expect(r.quadraOrBetter.method).toBe('exact');
  });
  it('orçamento elevado informa limites, nunca apresenta teto como certeza de acerto',()=>{
    const r=budgetScenario(6000,10);
    expect(r.games).toBe(1000); expect(r.costPerPerson).toBe(600);
    expect(r.quadraUpper).toBeGreaterThanOrEqual(0);
    close(r.sextetChance,1000/MEGA_SPACE);
    expect(r.explanation).toMatch(/LIMITES/);
  });
});
