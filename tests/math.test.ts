import {describe,it,expect} from 'vitest';
import {RULES,months,Draw} from '../lib/rules';
import {choose,hitDistribution,jackpotProbability,price,uniformSample,checkTicket,generate,countHits,stats,backtest} from '../lib/math';
describe('Probabilidade e preços oficiais de referência',()=>{
  it('combinatória é exata para volumes usuais',()=>{expect(choose(60,6)).toBe(50063860);expect(choose(80,5)).toBe(24040016);expect(choose(25,15)).toBe(3268760);expect(choose(31,7)).toBe(2629575);expect(choose(50,6)).toBe(15890700)});
  it('probabilidades da aposta simples principal',()=>{
    for(const [id,odds] of [['megasena',50063860],['quina',24040016],['lotofacil',3268760],['diadesorte',2629575],['duplasena',15890700],['supersete',10000000]] as const){expect(Math.round(1/jackpotProbability(RULES[id]))).toBe(odds)}
    expect(Math.round(1/jackpotProbability(RULES.timemania))).toBe(26472637);
  });
  it('todas as probabilidades da distribuição somam 1',()=>{for(const rule of Object.values(RULES)){const sum=hitDistribution(rule).reduce((a,r)=>a+r.probability,0);expect(sum).toBeCloseTo(1,8)}});
  it('apostas ampliadas utilizam C(m,k)',()=>{expect(price(RULES.megasena,7)).toBe(42);expect(price(RULES.quina,6)).toBe(18);expect(price(RULES.lotofacil,16)).toBe(56);expect(price(RULES.diadesorte,8)).toBe(20);expect(price(RULES.duplasena,7)).toBe(21);expect(price(RULES.lotomania,50)).toBe(3)})
});
describe('Validação por modalidade e geração',()=>{
 it('amostragem uniforme sem repetições',()=>{for(let i=0;i<30;i++){const ns=uniformSample(Array.from({length:60},(_,j)=>j+1),6);expect(new Set(ns).size).toBe(6);expect(ns.every(n=>n>=1&&n<=60)).toBe(true)}});
 it('Super Sete aceita dígitos repetidos em diferentes colunas, não em uma coluna',()=>{expect(checkTicket(RULES.supersete,{numbers:[1,1,1,1,1,1,1],columns:Array.from({length:7},()=>[1])})).toBe(true);expect(checkTicket(RULES.supersete,{numbers:[1,1,1,1,1,1,1],columns:[[1,2],[1],[1],[1],[1],[1],[1]]})).toBe(false)})
 it('Dia de Sorte exige mês e Timemania exige time escolhido',()=>{expect(checkTicket(RULES.diadesorte,{numbers:[1,2,3,4,5,6,7]})).toBe(false);expect(checkTicket(RULES.diadesorte,{numbers:[1,2,3,4,5,6,7],extra:months[2]})).toBe(true);expect(checkTicket(RULES.timemania,{numbers:[1,2,3,4,5,6,7,8,9,10]})).toBe(false)})
 it('Lotomania aceita 00 e exige 50 dezenas',()=>{expect(checkTicket(RULES.lotomania,{numbers:Array.from({length:50},(_,i)=>i)})).toBe(true);expect(checkTicket(RULES.lotomania,{numbers:Array.from({length:49},(_,i)=>i)})).toBe(false)});
 it('gerador obedece orçamento e restrições',()=>{const result=generate({rule:RULES.megasena,count:10,pick:6,budget:30,strategy:'diversity',history:[],required:[12],excluded:[13],seed:471});expect(result.tickets).toHaveLength(5);expect(result.spent).toBe(30);expect(new Set(result.tickets.map(t=>t.numbers.join(','))).size).toBe(5);expect(result.tickets.every(t=>t.numbers.includes(12)&&!t.numbers.includes(13))).toBe(true)});
 it('fechamento completo de 7 em 6 usa 7 apostas com garantia condicionada',()=>{const result=generate({rule:RULES.megasena,count:10,pick:6,poolSize:7,budget:42,strategy:'closure',history:[],seed:4});expect(result.tickets).toHaveLength(7);const pool=new Set(result.tickets.flatMap(t=>t.numbers));expect(pool.size).toBe(7);for(const missing of pool){const draw=[...pool].filter(n=>n!==missing);expect(result.tickets.some(t=>countHits(RULES.megasena,t,draw)===6)).toBe(true)}});
 it('bloqueia ultrapassar orçamento na modalidade Super Sete',()=>{expect(()=>generate({rule:RULES.supersete,count:4,pick:7,budget:2,strategy:'random',history:[]})).toThrow('Orçamento insuficiente')});
});
function history(n:number):Draw[]{return Array.from({length:n},(_,i)=>({lottery:'megasena',contest:i+1,date:`2026-01-${String(1+i%28).padStart(2,'0')}`,nextDate:null,numbers:Array.from({length:6},(_,j)=>1+((i*7+j*3)%60)).sort((a,b)=>a-b),secondNumbers:null,extra:null,prizeEstimate:null,payouts:[],source:'FICÇÃO PARA TESTE UNITÁRIO',fetchedAt:'2026-01-01T00:00:00.000Z'}));}
describe('Walk-forward',()=>{
 it('usa somente concursos anteriores e é determinístico',()=>{
   const draws=history(45),result=backtest(RULES.megasena,draws,'frequency',12);expect(result.rows).toHaveLength(12);
   expect(result.rows[0].contest).toBe(34);
   expect(backtest(RULES.megasena,draws,'frequency',12).rows).toEqual(result.rows);
 });
 it('atraso de número nunca visto equivale ao tamanho do histórico',()=>{
   const r=stats(history(20),RULES.megasena);const absent=r.find(x=>x.total===0);if(absent)expect(absent.delay).toBe(20);
 });
});
