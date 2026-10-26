import {describe,it,expect} from 'vitest';import {normalize} from '../lib/caixa';
const raw={numero:3074,dataApuracao:'24/10/2026',dataProximoConcurso:'26/10/2026',listaDezenas:['02','03','20','25','39','57'],listaDezenasSegundoSorteio:null,valorEstimadoProximoConcurso:300000000,listaRateioPremio:[{faixa:1,descricaoFaixa:'6 acertos',valorPremio:0,numeroDeGanhadores:0}]};
describe('Normalização da fonte Caixa',()=>{
 it('converte payload e datas do calendário sem ambiguidade de fuso',()=>{const d=normalize(raw,'megasena');expect(d.contest).toBe(3074);expect(d.date).toBe('2026-10-24');expect(d.nextDate).toBe('2026-10-26');expect(d.numbers).toEqual([2,3,20,25,39,57])});
 it('bloqueia dezenas repetidas',()=>{expect(()=>normalize({...raw,listaDezenas:['02','02','20','25','39','57']},'megasena')).toThrow('duplicadas')});
 it('bloqueia datas impossíveis',()=>{expect(()=>normalize({...raw,dataApuracao:'31/02/2026'},'megasena')).toThrow('inconsistentes')});
 it('valida segundo sorteio da Dupla Sena',()=>{const duplex={...raw,listaDezenas:['02','03','20','25','39','47'],listaDezenasSegundoSorteio:['01','05','07','11','13','17']};expect(normalize(duplex,'duplasena').secondNumbers).toHaveLength(6);expect(()=>normalize({...duplex,listaDezenasSegundoSorteio:null},'duplasena')).toThrow('Segundo sorteio')});
 it('permite dígitos idênticos em colunas do Super Sete',()=>{const r=normalize({...raw,numero:920,listaDezenas:['1','1','1','1','1','1','1']},'supersete');expect(r.numbers).toEqual([1,1,1,1,1,1,1])});
});
