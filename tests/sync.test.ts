import {describe,it,expect} from 'vitest';
import {NextRequest} from 'next/server';
import {GET} from '../app/api/sync/route';
describe('Proteção do cron',()=>{it('não permite acesso sem credenciais',async()=>{const req=new NextRequest('https://test.local/api/sync');const result=await GET(req);expect(result.status).toBe(401)})});
