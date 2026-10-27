import {describe,it,expect} from 'vitest';
import {checkTickets,manualDraw,parseManualTickets,validateManualResult} from '../lib/prizes';
import {Draw} from '../lib/rules';
function fixture(id:Draw['lottery'],numbers:number[],payouts:Draw['payouts'],secondNumbers:number[]|null=null,extra:string|null=null):Draw{
 return {lottery:id,contest:9999,date:'2026-10-27',nextDate:null,numbers,secondNumbers,extra,prizeEstimate:null,payouts,fetchedAt:'2026-10-27T23:00:00.000Z',source:'TESTE — não é sorteio real'};
}
describe('Conferidor LottoMind v1.2',()=>{
 it('identifica quadra e rateio divulgado, preservando a modalidade',()=>{
  const draw=fixture('megasena',[7,10,14,27,36,55],[{tier:1,description:'Sena',value:0,winners:0},{tier:2,description:'Quina',value:1000,winners:3},{tier:3,description:'Quadra',value:458.57,winners:99}]);
  const report=checkTickets(draw,[{numbers:[10,14,27,34,55,59]}]);
  expect(report.entries[0].hits).toBe(4);
  expect(report.confirmedTotal).toBe(458.57);
  expect(report.entries[0].awards[0].label).toBe('Quadra');
 });
 it('não inventa rateio quando resultado manual não contém premiação',()=>{
  const draw=manualDraw('megasena',9999,[7,10,14,27,36,55]);
  const report=checkTickets(draw,[{numbers:[10,14,27,34,55,59]}]);
  expect(report.paidTickets).toBe(1);expect(report.pending).toBe(true);expect(report.confirmedTotal).toBeNull();
 });
 it('7 dezenas na Mega com 4 acertos geram 3 quadras pagáveis',()=>{
  const draw=fixture('megasena',[1,2,3,4,5,6],[{tier:3,description:'Quadra',value:200,winners:50}]);
  const r=checkTickets(draw,[{numbers:[1,2,3,4,50,51,52]}]);
  expect(r.entries[0].awards[0].quantity).toBe(3);expect(r.confirmedTotal).toBe(600);
 });
 it('15 números lotofácil com 11 acertos identificam a 5ª faixa',()=>{
  const draw=fixture('lotofacil',Array.from({length:15},(_,i)=>i+1),[{tier:5,description:'11 acertos',winners:1234,value:7}]);
  const r=checkTickets(draw,[{numbers:[...Array.from({length:11},(_,i)=>i+1),16,17,18,19]}]);
  expect(r.entries[0].hits).toBe(11);expect(r.entries[0].awards[0].label).toBe('11 acertos');expect(r.confirmedTotal).toBe(7);
 });
 it('bilhete de 16 números na Lotofácil tem múltiplas combinações pagas',()=>{
  const draw=fixture('lotofacil',Array.from({length:15},(_,i)=>i+1),[
    {tier:1,description:'15 acertos',winners:1,value:10000},
    {tier:2,description:'14 acertos',winners:10,value:100},
  ]);
  const r=checkTickets(draw,[{numbers:[...Array.from({length:15},(_,i)=>i+1),16]}]);
  expect(r.entries[0].awards.find(a=>a.hits===15)?.quantity).toBe(1);
  expect(r.entries[0].awards.find(a=>a.hits===14)?.quantity).toBe(15);
  expect(r.confirmedTotal).toBe(11500);
 });
 it('Dupla Sena avalia as duas tabelas de rateio separadamente',()=>{
  const d=fixture('duplasena',[1,2,3,4,5,6],[{tier:1,description:'sena 1',winners:1,value:1000},{tier:8,description:'terno 2',winners:100,value:20}],[1,2,3,40,41,42]);
  const r=checkTickets(d,[{numbers:[1,2,3,4,5,6]}]);
  expect(r.entries[0].hits).toBe(6);expect(r.entries[0].secondHits).toBe(3);expect(r.confirmedTotal).toBe(1020);
 });
 it('Dia de Sorte considera Mês da Sorte, quando informado',()=>{
  const d=fixture('diadesorte',[1,2,3,4,5,6,7],[{tier:5,description:'Mês',winners:100,value:2} ],null,'Janeiro');
  const r=checkTickets(d,[{numbers:[8,9,10,11,12,13,14],extra:'JANEIRO'}]);
  expect(r.confirmedTotal).toBe(2);
 });
 it('Super Sete compara posição de cada coluna',()=>{
  const d=fixture('supersete',[1,2,3,4,5,6,7],[{tier:5,description:'3 acertos',winners:40,value:8}]);
  const r=checkTickets(d,[{numbers:[1,2,3,1,2,3,4],columns:[[1],[2],[3],[1],[2],[3],[4]]}]);
  expect(r.entries[0].hits).toBe(3);expect(r.confirmedTotal).toBe(8);
 });
 it('contesta bilhetes com dezenas repetidas ou regras inválidas',()=>{
  expect(()=>parseManualTickets('10 10 14 27 36 55','megasena')).toThrow();
  expect(()=>validateManualResult('01 02 03','lotofacil')).toThrow();
 });
 it('não inventa 0 reais quando a faixa não tem ganhadores ou rateio',()=>{
  const d=fixture('megasena',[1,2,3,4,5,6],[{tier:3,description:'Quadra',winners:0,value:0}]);
  const r=checkTickets(d,[{numbers:[1,2,3,4,10,11]}]);expect(r.confirmedTotal).toBeNull();
 });
});
