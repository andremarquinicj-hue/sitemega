import {LOTTERY_KEYS,isLottery,type LotteryKey} from '../lib/rules';
import {fetchCaixa} from '../lib/caixa';import {db,upsertDraw,logSync} from '../lib/db';
async function main(){
  if(!db())throw Error('Configure DATABASE_URL antes de importar o histórico.');
  const requested=process.argv.find(x=>x.startsWith('--game='))?.split('=')[1];
  const rawLimit=Number(process.argv.find(x=>x.startsWith('--limit='))?.split('=')[1]||200);
  if(!Number.isInteger(rawLimit)||rawLimit<1||rawLimit>10000)throw Error('Use --limit=1..10000');
  if(requested&&!isLottery(requested))throw Error('Modalidade inválida');
  // Preserve o tipo da modalidade em ambas as ramificações: evita string genérica no fetchCaixa.
  const games: LotteryKey[] = requested && isLottery(requested)
    ? [requested]
    : [...LOTTERY_KEYS];
  for(const game of games){const latest=await fetchCaixa(game);let count=0,fail=0;
    for(let high=latest.contest;high>0&&count<rawLimit;high-=4){
      const ids=Array.from({length:4},(_,i)=>high-i).filter(id=>id>0&&latest.contest-id<rawLimit);
      const jobs=await Promise.allSettled(ids.map(id=>fetchCaixa(game,id)));
      for(const res of jobs){if(res.status==='fulfilled'){await upsertDraw(res.value);count++;}else fail++;}
      await new Promise(resolve=>setTimeout(resolve,250));
      if((count+fail)%100===0)console.log(game,'processados:',count+fail,'falhas:',fail);
    }
    await logSync(game,fail?'partial':'ok',count,`Importação histórica ${count} concursos; falhas ${fail}`);
    console.log(game,'finalizado',count,'salvos;',fail,'falhas');
  }
  await db()!.$disconnect();
}
main().catch(e=>{console.error(e);process.exitCode=1});
