import {describe,it,expect,vi} from 'vitest';
import {NextRequest} from 'next/server';
vi.mock('@/lib/data',()=>({getResults:vi.fn().mockResolvedValue({draws:[],status:'unavailable',persistent:false})}));
import {GET as getResultsApi} from '../app/api/results/route';
import {POST as generateApi} from '../app/api/generate/route';
import {POST as backtestApi} from '../app/api/backtest/route';
describe('Validação de rotas de API',()=>{
 it('rejeita loteria inválida',async()=>{const res=await getResultsApi(new NextRequest('https://test.local/api/results?lottery=inexistente'));expect(res.status).toBe(400)});
 it('aceita configuração de lista vazia',async()=>{const res=await getResultsApi(new NextRequest('https://test.local/api/results?lottery=megasena'));expect(res.status).toBe(200)});
 it('rejeita estratégia não conhecida',async()=>{const res=await generateApi(new NextRequest('https://test.local/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lottery:'megasena',strategy:'ganhar-sempre'})}));expect(res.status).toBe(400)});
 it('rejeita backtest sem amostra válida',async()=>{const res=await backtestApi(new NextRequest('https://test.local/api/backtest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lottery:'quina',strategy:'random',count:999})}));expect(res.status).toBe(400)});
});
