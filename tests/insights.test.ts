import {it,expect} from 'vitest';
import {postDrawInsights} from '../lib/insights';
import {RULES,Draw} from '../lib/rules';
it('compara repetição recente na Lotofácil com base aleatória, sem previsão',()=>{
 const draws=Array.from({length:12},(_,i):Draw=>({lottery:'lotofacil',contest:500-i,date:'2026-10-27',nextDate:null,numbers:Array.from({length:15},(_,j)=>((j+i)%25)+1),secondNumbers:null,extra:null,payouts:[],prizeEstimate:null,source:'TESTE',fetchedAt:'2026-10-27T00:00:00Z'}));
 const insight=postDrawInsights(draws,RULES.lotofacil);
 expect(insight.length).toBe(3);expect(insight[0].reference).toContain('9,0');
 expect(insight[0].interpretation).toContain('não altera');
});
