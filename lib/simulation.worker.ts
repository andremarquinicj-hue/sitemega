/// <reference lib="webworker" />
import {RULES,LotteryKey,Ticket} from './rules';
import {countHits} from './math';
type Req={lottery:LotteryKey;tickets:Ticket[];iterations:number};
self.onmessage=(event:MessageEvent<Req>)=>{
  const {lottery,tickets,iterations}=event.data,rule=RULES[lottery];
  if(!rule||!Array.isArray(tickets)||tickets.length<1||tickets.length>100||![10000,100000,1000000].includes(iterations)){
    self.postMessage({error:'Parâmetros de simulação inválidos'});return;
  }
  const counts=Array.from({length:rule.draw+1},()=>0), examples:number[][]=[];
  let tierCount=0;
  const universe=Array.from({length:rule.max-rule.min+1},(_,i)=>i+rule.min);
  for(let step=0;step<iterations;step++){
    let winning:number[];
    if(rule.extra==='columns')winning=Array.from({length:7},()=>Math.floor(Math.random()*10));
    else{
      const taken=new Map<number,number>();winning=[];
      for(let i=0;i<rule.draw;i++){
        const j=i+Math.floor(Math.random()*(universe.length-i));
        const vj=taken.get(j)??j;const vi=taken.get(i)??i;
        taken.set(j,vi);winning.push(universe[vj]);
      }
    }
    let highest=0;
    for(const t of tickets)highest=Math.max(highest,countHits(rule,t,winning));
    // Para Dupla Sena contamos 2 sorteios, com o melhor resultado em cada concurso.
    if(rule.id==='duplasena'){
      const rest=universe.slice();for(let i=0;i<rule.draw;i++){const j=i+Math.floor(Math.random()*(rest.length-i));[rest[i],rest[j]]=[rest[j],rest[i]];}
      const next=rest.slice(0,rule.draw);for(const t of tickets)highest=Math.max(highest,countHits(rule,t,next));
    }
    counts[highest]++;
    if(rule.tiers.includes(highest))tierCount++;
    if(step%25000===0&&step>0)self.postMessage({progress:step/iterations});
  }
  self.postMessage({done:true,counts,iterations,paidRate:tierCount/iterations});
};
export {};
