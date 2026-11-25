import {seeded,uniformSample} from './math';
import type {DiversityGoal,Ticket} from './rules';

/** Amostragem para lotes grandes, com penalidade de repetição de pares.
 * Não infere números futuros. Máxima diversidade é heurística, não ótimo provado.
 */
export function megaBatch(count:number,goal:DiversityGoal,mode:'random'|'diversity'='diversity',seed=(Date.now()^Math.floor(Math.random()*4294967296))|0):Ticket[]{
  if(!Number.isInteger(count)||count<1||count>500)throw Error('O gerador de lotes admite de 1 a 500 jogos.');
  const rng=seeded(seed),universe=Array.from({length:60},(_,i)=>i+1),appearances=new Uint16Array(61),pairs=new Uint16Array(61*61);
  const existing=new Set<string>(),tickets:Ticket[]=[];
  const score=(nums:number[])=>{
    let total=0;
    for(const n of nums)total+=appearances[n]*16;
    if(mode==='diversity'&&goal!=='sena'){
      for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){
        const old=pairs[nums[i]*61+nums[j]];
        total+=(goal==='quadra'?30:15)*old*old;
      }
    }
    return total;
  };
  for(let i=0;i<count;i++){
    let best:number[]|null=null,bestScore=Infinity;
    const attempts=mode==='random'?1:36;
    for(let tryNo=0;tryNo<attempts;tryNo++){
      let nums:number[];
      if(mode==='diversity'&&i<10){
        // Reserva dezenas ainda não utilizadas nos dez primeiros jogos.
        const unused=universe.filter(n=>appearances[n]===0);
        nums=unused.length>=6?uniformSample(unused,6,rng):uniformSample(universe,6,rng);
      }else nums=uniformSample(universe,6,rng);
      const key=nums.join(',');if(existing.has(key))continue;
      const value=score(nums)+rng()*0.5;
      if(value<bestScore){best=nums;bestScore=value;}
    }
    if(!best){for(let retry=0;retry<100&&!best;retry++){const nums=uniformSample(universe,6,rng);if(!existing.has(nums.join(',')))best=nums;}}
    if(!best)throw Error('Não foi possível construir jogos distintos.');
    tickets.push({numbers:best});existing.add(best.join(','));
    for(const n of best)appearances[n]++;
    for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)pairs[best[a]*61+best[b]]++;
  }
  return tickets;
}
