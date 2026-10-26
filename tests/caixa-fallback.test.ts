import {describe,it,expect,vi,afterEach} from 'vitest';
import {fetchCaixa,normalizeGuto,normalizeMega} from '../lib/caixa';
const primary={concurso:3074,data:'24/10/2026',dezenas:['02','03','20','25','39','57'],loteria:'megasena',dataProximoConcurso:'26/10/2026',valorEstimadoProximoConcurso:300000000,premiacoes:[{faixa:1,descricao:'6 acertos',ganhadores:0,valorPremio:0}]};
afterEach(()=>vi.unstubAllGlobals());
describe('Fontes alternativas auditáveis',()=>{
 it('normaliza a API alternativa e identifica a fonte',()=>{const d=normalizeGuto(primary,'megasena');expect(d.numbers).toEqual([2,3,20,25,39,57]);expect(d.source).toContain('Guto Alves');expect(d.nextDate).toBe('2026-10-26')});
 it('rejeita resposta com modalidade divergente',()=>expect(()=>normalizeGuto(primary,'quina')).toThrow('divergente'));
 it('rejeita resultado sem o segundo sorteio da Dupla Sena',()=>expect(()=>normalizeGuto({...primary,loteria:'duplasena',dezenas:['01','02','03','04','05','06']},'duplasena')).toThrow('Segundo sorteio'));
 it('normaliza a fonte Mega e seu rateio',()=>{const d=normalizeMega({concurso:3074,data:'2026-10-24',dezenas:[2,3,20,25,39,57],premios:{'6':{ganhadores:0,rateio:0},'5':{ganhadores:175,rateio:30318.56},'4':{ganhadores:11643,rateio:651}},estimativaProximo:300000000});expect(d.payouts[1].value).toBe(30318.56);expect(d.source).toContain('Resultado Mega')});
 it('faz fallback quando a Caixa bloqueia com HTTP 403',async()=>{
   const fetchMock=vi.fn().mockResolvedValueOnce({ok:false,status:403}).mockResolvedValueOnce({ok:true,json:async()=>primary});
   vi.stubGlobal('fetch',fetchMock);
   const d=await fetchCaixa('megasena');
   expect(d.contest).toBe(3074);expect(d.source).toContain('Loterias API');expect(fetchMock).toHaveBeenCalledTimes(2);
 });
});
