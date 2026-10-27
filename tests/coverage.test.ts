import {describe,it,expect} from 'vitest';
import {RULES} from '../lib/rules';
import {generate,coverageAudit,checkTicket,choose} from '../lib/math';
const mega=RULES.megasena;
const sample=(count:number,goal:'sena'|'quadra'|'quina'='quadra')=>generate({
  rule:mega,history:[],strategy:'diversity',diversityGoal:goal,count,pick:6,budget:count*6,seed:270102
});
describe('Cobertura combinatória Mega-Sena',()=>{
  it.each(['sena','quadra','quina'] as const)('8 jogos foco %s: 48 dezenas distintas e nenhuma repetição',goal=>{
    const result=sample(8,goal);
    expect(result.tickets).toHaveLength(8);
    expect(result.tickets.every(t=>checkTicket(mega,t))).toBe(true);
    expect(result.coverage?.uniqueNumbers).toBe(48);
    expect(result.coverage?.repeatedSelections).toBe(0);
    expect(result.coverage?.maxPairOverlap).toBe(0);
    expect(result.coverage?.distinctQuartets).toBe(8*choose(6,4));
    expect(result.coverage?.distinctQuintets).toBe(8*choose(6,5));
    expect(result.coverage?.distinctSextets).toBe(8);
    expect(result.spent).toBe(48);
    expect(result.remainder).toBe(0);
  });
  it('10 jogos sem filtros cobrem todas as 60 dezenas',()=>{
    expect(sample(10).coverage?.uniqueNumbers).toBe(60);
  });
  it('15 jogos são únicos e reutilizam dezenas somente quando necessário',()=>{
    const r=sample(15);
    expect(r.tickets).toHaveLength(15);
    expect(r.coverage?.uniqueNumbers).toBe(60);
    expect(r.coverage?.uniqueTickets).toBe(15);
  });
  it('probabilidades exatas de ao menos quadra/quina quando eventos disjuntos',()=>{
    const r=sample(8);
    const p4=(choose(6,4)*choose(54,2)+choose(6,5)*choose(54,1)+1)/choose(60,6);
    const p5=(choose(6,5)*choose(54,1)+1)/choose(60,6);
    expect(r.coverage?.atLeastQuadraChance).toBeCloseTo(8*p4,14);
    expect(r.coverage?.atLeastQuinaChance).toBeCloseTo(8*p5,14);
    expect(r.coverage?.jackpotChance).toBeCloseTo(8/choose(60,6),14);
  });
  it('não afirma probabilidade combinada exata com eventos que se sobrepõem',()=>{
    const r=generate({rule:mega,strategy:'diversity',diversityGoal:'quadra',count:8,pick:6,budget:48,history:[],required:[10,14],seed:4});
    expect(r.tickets.every(t=>t.numbers.includes(10)&&t.numbers.includes(14))).toBe(true);
    expect(r.coverage?.pairsSharingTwoOrMore).toBeGreaterThan(0);
    expect(r.coverage?.atLeastQuadraChance).toBeNull();
  });
  it('respeita exclusões e obrigatórias e rejeita conjunto impossível',()=>{
    const r=generate({rule:mega,strategy:'diversity',count:8,pick:6,budget:48,history:[],excluded:[1,2,3],required:[8],seed:17});
    expect(r.tickets.every(t=>t.numbers.includes(8)&&![1,2,3].some(n=>t.numbers.includes(n)))).toBe(true);
    expect(()=>generate({rule:mega,strategy:'diversity',count:4,pick:6,budget:24,history:[],required:[1,2,3,4,5],excluded:Array.from({length:54},(_,i)=>i+7),seed:1})).toThrow();
  });
  it('mantém auditoria honesta dos oito jogos originais informados pelo usuário',()=>{
    const original=[[3,8,13,26,39,55],[14,20,22,30,31,34],[15,16,40,44,46,54],[5,7,11,17,18,19],[1,6,42,48,50,56],[12,23,29,32,43,58],[10,25,35,36,37,44],[2,35,36,45,51,53]];
    const audit=coverageAudit(mega,original.map(numbers=>({numbers})));
    expect(audit.uniqueNumbers).toBe(45);
    expect(audit.maxPairOverlap).toBe(2);
    expect(audit.atLeastQuadraChance).toBeNull();
    expect(audit.distinctSextets).toBe(8);
  });
});
