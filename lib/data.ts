import {fetchCaixa} from './caixa';
import {db,readDb,upsertDraw} from './db';
import {Draw,LotteryKey} from './rules';
async function fetchRecent(lottery:LotteryKey,last:number,count:number):Promise<Draw[]>{
  const ids=Array.from({length:Math.min(count,last)},(_,i)=>last-i).filter(x=>x>0);
  const results:Draw[]=[];
  for(let start=0;start<ids.length;start+=5){
    const chunk=await Promise.allSettled(ids.slice(start,start+5).map(id=>fetchCaixa(lottery,id)));
    for(const res of chunk)if(res.status==='fulfilled')results.push(res.value);
  }
  return results;
}
export async function getResults(lottery:LotteryKey,limit=60):Promise<{draws:Draw[];status:'online'|'cached'|'unavailable';error?:string;persistent:boolean;lastSync?:string}>{
  let cached:Draw[]=[];let dbError='';
  try{cached=await readDb(lottery,limit);}catch(e){dbError=e instanceof Error?e.message:String(e);}
  let latest:Draw|null=null,error='';
  try{latest=await fetchCaixa(lottery); if(db()) await upsertDraw(latest).catch(e=>console.error('Persistência falhou',e));}
  catch(e){error=e instanceof Error?e.message:'Erro na fonte';}
  let draws=[...cached];
  if(latest){
    draws=[latest,...cached.filter(d=>d.contest!==latest!.contest)];
    if(cached.length<Math.min(limit,20)){
      // Modo sem DB ou instalação recém-iniciada: busca recente em lotes, sem inventar resultados.
      const remote=await fetchRecent(lottery,latest.contest,Math.min(limit,30));
      const map=new Map(draws.concat(remote).map(d=>[d.contest,d]));
      draws=[...map.values()].sort((a,b)=>b.contest-a.contest);
      if(db()) for(const d of remote)await upsertDraw(d).catch(()=>{});
    }
  }
  draws.sort((a,b)=>b.contest-a.contest);
  return {draws:draws.slice(0,limit),status:latest?'online':draws.length?'cached':'unavailable',error:error||dbError||undefined,persistent:!!db()&&!dbError,lastSync:draws.length?draws[0].fetchedAt:undefined};
}
