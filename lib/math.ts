import {Draw, LotteryRule, RULES, Strategy, Ticket, months, LotteryKey} from './rules';
export function choose(n:number,k:number):number {
  if (!Number.isInteger(n)||!Number.isInteger(k)||k<0||k>n) return 0;
  let r=1; for(let j=1;j<=Math.min(k,n-k);j++) r=r*(n-j+1)/j; return Math.round(r);
}
export function price(rule:LotteryRule,pick:number):number {
  if (rule.extra==='columns'||rule.id==='lotomania'||rule.id==='timemania') return rule.basePrice;
  return +(rule.basePrice*choose(pick,rule.pick)).toFixed(2);
}
export function jackpotProbability(rule:LotteryRule,pick=rule.pick):number {
  if(rule.extra==='columns') return 1/1e7;
  return choose(pick,rule.draw)/choose(rule.max-rule.min+1,rule.draw);
}
export function hitDistribution(rule:LotteryRule,pick=rule.pick):{hits:number;probability:number}[]{
  if(rule.extra==='columns') return Array.from({length:8},(_,hits)=>({hits,probability:choose(7,hits)*Math.pow(.1,hits)*Math.pow(.9,7-hits)}));
  const n=rule.max-rule.min+1, d=rule.draw;
  return Array.from({length:d+1},(_,hits)=>({hits,probability:choose(pick,hits)*choose(n-pick,d-hits)/choose(n,d)}));
}
export function range(rule:LotteryRule){return Array.from({length:rule.max-rule.min+1},(_,i)=>i+rule.min)}
export function sortedUnique(values:number[]){return [...new Set(values)].sort((a,b)=>a-b)}
export function checkTicket(rule:LotteryRule,t:Ticket):boolean {
  if(rule.extra==='columns') return !!t.columns && t.columns.length===7 && t.columns.every(c=>c.length===1&&Number.isInteger(c[0])&&c[0]>=0&&c[0]<=9);
  const m=t.numbers.length;
  if(m<rule.pick||m>rule.maxPick||sortedUnique(t.numbers).length!==m||t.numbers.some(n=>!Number.isInteger(n)||n<rule.min||n>rule.max)) return false;
  if(rule.extra==='month') return !!t.extra&&months.includes(t.extra);
  if(rule.extra==='team') return !!t.extra&&t.extra.trim().length>0;
  return true;
}
export function countHits(rule:LotteryRule, ticket:Ticket,draw:number[]):number {
  if(rule.extra==='columns') return ticket.columns?.reduce((hits,col,i)=>hits+(col.includes(draw[i])?1:0),0) ?? 0;
  const s=new Set(draw);return ticket.numbers.filter(n=>s.has(n)).length;
}
export type NumberStat={number:number;total:number;recent:number;expected:number;z:number;delay:number;maxGap:number;frequency:number};
export function stats(draws:Draw[],rule:LotteryRule,window=100):NumberStat[]{
  const ordered=[...draws].sort((a,b)=>b.contest-a.contest); const recent=ordered.slice(0,window);
  const universe=range(rule);const prob=rule.extra==='columns'?0.1:rule.draw/universe.length;
  return universe.map(n=>{
    const count=(ds:Draw[])=>ds.reduce((sum,d)=>sum+(d.numbers.includes(n)?1:0),0);
    // Colunas do Super Sete são independentes: frequência do dígito como contagem por posição.
    const full=rule.extra==='columns'?ordered.reduce((s,d)=>s+d.numbers.filter(x=>x===n).length,0):count(ordered);
    const short=rule.extra==='columns'?recent.reduce((s,d)=>s+d.numbers.filter(x=>x===n).length,0):count(recent);
    const observations=rule.extra==='columns'?ordered.length*7:ordered.length;
    const expected=observations*prob;
    let delay=0,maxGap=0,current=0;
    for(const d of ordered){if(d.numbers.includes(n)){maxGap=Math.max(maxGap,current);current=0;}else current++;}
    maxGap=Math.max(maxGap,current);
    // Atraso contado a partir do último concurso, independente da frequência total.
    delay=0;for(const d of ordered){if(d.numbers.includes(n))break; delay++;}
    return {number:n,total:full,recent:short,expected,z:observations? (full-expected)/Math.sqrt(Math.max(1e-12,observations*prob*(1-prob))):0,delay,maxGap,frequency:observations?full/observations:0};
  });
}
export function distribution(draws:Draw[],rule:LotteryRule){
  const tallies=new Map<string,number>();
  for(const d of draws){const even=d.numbers.filter(x=>x%2===0).length;tallies.set(`${even} pares`,1+(tallies.get(`${even} pares`)||0));}
  return [...tallies].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
}
export function features(nums:number[]){
  const sorted=[...nums].sort((a,b)=>a-b),sum=nums.reduce((a,b)=>a+b,0);
  return {sum,even:nums.filter(x=>x%2===0).length,odd:nums.filter(x=>x%2!==0).length,span:sorted.at(-1)!-sorted[0],consecutive:sorted.slice(1).filter((n,i)=>n-sorted[i]===1).length,prime:nums.filter(n=>n>1&&Array.from({length:Math.floor(Math.sqrt(n))-1},(_,i)=>i+2).every(x=>n%x!==0)).length};
}
export function pairs(draws:Draw[],size=2):{numbers:number[];count:number}[]{
  if(size<2||size>3)return [];
  const m=new Map<string,number>();for(const draw of draws){const ns=sortedUnique(draw.numbers);for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){
    if(size===2){const key=`${ns[i]},${ns[j]}`;m.set(key,(m.get(key)||0)+1);}
    else for(let k=j+1;k<ns.length;k++){const key=`${ns[i]},${ns[j]},${ns[k]}`;m.set(key,(m.get(key)||0)+1);}
  }}
  return [...m].map(([key,count])=>({numbers:key.split(',').map(Number),count})).sort((a,b)=>b.count-a.count).slice(0,12);
}
export function randomIndex(max:number,rng:()=>number=Math.random){return Math.min(max-1,Math.floor(rng()*max));}
export function uniformSample(items:number[],n:number,rng:()=>number=Math.random):number[]{
  const a=items.slice();for(let i=0;i<n;i++){const j=i+randomIndex(a.length-i,rng);[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,n).sort((x,y)=>x-y);
}
export function seeded(seed:number):()=>number {let s=seed|0;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
export type GenerateArgs={rule:LotteryRule;count:number;pick:number;budget:number;strategy:Strategy; history:Draw[]; required?:number[];excluded?:number[];extra?:string;seed?:number;poolSize?:number};
export function generate(args:GenerateArgs):{tickets:Ticket[];spent:number;remainder:number;note:string}{
  const {rule,strategy}=args;const pick=rule.extra==='columns'?7:args.pick;
  if(!Number.isInteger(args.count)||args.count<1||args.count>100||!Number.isFinite(args.budget)||args.budget<0||args.budget>1000000)throw Error('Quantidade ou orçamento inválido.');
  if(!Number.isInteger(pick)||pick<rule.pick||pick>rule.maxPick)throw Error('Quantidade de dezenas inválida.');
  const unit=price(rule,pick),limit=Math.min(args.count,Math.floor((args.budget+1e-8)/unit));if(!limit)throw Error(`Orçamento insuficiente. Valor mínimo: R$ ${unit.toFixed(2)}.`);
  if(rule.extra==='month'&&!months.includes(args.extra||'')) throw Error('Escolha o Mês da Sorte.');
  if(rule.extra==='team'&&!args.extra?.trim())throw Error('Informe seu Time do Coração.');
  const rng=args.seed===undefined?Math.random:seeded(args.seed);
  const req=sortedUnique(args.required||[]), excluded=sortedUnique(args.excluded||[]);
  if(req.some(n=>excluded.includes(n)))throw Error('Uma dezena não pode ser obrigatória e excluída.');
  if(rule.extra==='columns'&&(req.length||excluded.length))throw Error('Filtros de dezenas não se aplicam às colunas do Super Sete.');
  const candidates=range(rule).filter(n=>!excluded.includes(n));
  if(req.length>pick||candidates.length<pick||req.some(n=>!candidates.includes(n)))throw Error('Restrições impossíveis para esta modalidade.');
  const selectedPool=candidates.filter(n=>!req.includes(n));
  const historyStats=stats(args.history,rule,Math.min(100,args.history.length));
  const score=new Map(historyStats.map(x=>[x.number,strategy==='delay'?x.delay:x.frequency]));
  const used=new Set<string>(),tickets:Ticket[]=[];
  const fingerprint=(t:Ticket)=>rule.extra==='columns'?JSON.stringify(t.columns):t.numbers.join(',');
  if(strategy==='closure'){
    if(rule.extra==='columns'||rule.extra==='team'||rule.id==='lotomania')throw Error('Fechamento completo indisponível nesta modalidade.');
    const poolSize=args.poolSize??Math.min(pick+1,candidates.length),nCombinations=choose(poolSize,pick);
    if(poolSize<pick||poolSize>pick+3||poolSize>candidates.length||nCombinations>100||limit<nCombinations)throw Error(`Fechamento completo requer ${nCombinations} bilhetes (R$ ${(nCombinations*unit).toFixed(2)}); aumente a quantidade de jogos e o orçamento ou reduza o universo.`);
    const pool=sortedUnique([...req,...uniformSample(selectedPool,poolSize-req.length,rng)]);
    const visit=(start:number,a:number[])=>{if(a.length===pick){tickets.push({numbers:a.slice(),extra:args.extra});return;}for(let i=start;i<=pool.length-(pick-a.length);i++)visit(i+1,[...a,pool[i]]);};visit(0,[]);
    return {tickets,spent:+(tickets.length*unit).toFixed(2),remainder:+(args.budget-tickets.length*unit).toFixed(2),note:`Fechamento completo de ${poolSize} dezenas: cobre todas as ${tickets.length} combinações simples deste grupo. Prêmio máximo só é assegurado se TODOS os ${rule.draw} números sorteados estiverem entre as dezenas do grupo (e demais condições da modalidade).`};
  }
  for(let i=0;i<limit;i++){
    let best:Ticket|null=null,bestScore=-Infinity;
    for(let attempt=0;attempt<(strategy==='diversity'?55:16);attempt++){
      let t:Ticket;
      if(rule.extra==='columns'){const cols=Array.from({length:7},()=>[randomIndex(10,rng)]);t={numbers:cols.flat(),columns:cols};}
      else {
        let available=selectedPool.slice();
        if(strategy==='frequency'||strategy==='delay'){
          // Amostragem ponderada sem reposição, nunca interpretação de chance preditiva.
          available=available.map(n=>({n,w:1+Math.max(0,score.get(n)||0)*(strategy==='delay'?.2:10),key:0})).map(o=>({...o,key:-Math.log(Math.max(1e-12,rng()))/o.w})).sort((a,b)=>a.key-b.key).map(o=>o.n);
          available=available.slice(0,pick-req.length);
        } else if(strategy==='fibonacci'){
          const fib=new Set([0,1]);let a=1,b=1;while(b<=rule.max){fib.add(b);[a,b]=[b,a+b];}
          available=available.map(n=>({n,w:fib.has(n)?4:1})).map(o=>({...o,key:-Math.log(Math.max(1e-12,rng()))/o.w})).sort((a,b)=>a.key-b.key).slice(0,pick-req.length).map(o=>o.n);
        } else if(strategy==='numerology'){
          const digit=(n:number):number=>n<10?n:digit(Math.floor(n/10)+n%10);
          available=available.map(n=>({n,w:[3,6,9].includes(digit(n))?4:1})).map(o=>({...o,key:-Math.log(Math.max(1e-12,rng()))/o.w})).sort((a,b)=>a.key-b.key).slice(0,pick-req.length).map(o=>o.n);
        } else available=uniformSample(available,pick-req.length,rng);
        t={numbers:sortedUnique([...req,...available.slice(0,pick-req.length)]),extra:args.extra};
      }
      if(!checkTicket(rule,t))continue;
      const key=fingerprint(t);if(used.has(key))continue;
      const feats=features(t.numbers);
      const evenDeviation=Math.abs(feats.even-t.numbers.length/2);
      const centre=(rule.min+rule.max)*t.numbers.length/2;
      const balance=-(evenDeviation*4+Math.abs(feats.sum-centre)/Math.max(1,rule.max)*2);
      const overlap=tickets.reduce((sum,old)=>sum+countHits(rule,t,old.numbers),0);
      const metric=strategy==='diversity'?-overlap+ rng()*.01:strategy==='balanced'?balance: rng();
      if(metric>bestScore){bestScore=metric;best=t;}
    }
    if(!best)break;
    tickets.push(best);used.add(fingerprint(best));
  }
  return {tickets,spent:+(tickets.length*unit).toFixed(2),remainder:+(args.budget-tickets.length*unit).toFixed(2),note:strategy==='frequency'||strategy==='delay'?'Heurística histórica sem evidência de maior probabilidade futura.':strategy==='numerology'||strategy==='fibonacci'?'Padrão recreativo sem validação preditiva.':'Todas as combinações simples válidas têm a mesma probabilidade individual.'};
}
export type BacktestRow={contest:number;date:string;hits:number;extraHit:boolean;cost:number;prize:number|null;baselineHits:number};
export function backtest(rule:LotteryRule,draws:Draw[],strategy:Strategy,count=50):{rows:BacktestRow[];games:number;investment:number;knownReturn:number|null;compared:number;avgHits:number;baselineAvg:number;note:string}{
  if(strategy==='closure')throw Error('Backtesting de fechamento completo não disponível.');
  const ordered=[...draws].sort((a,b)=>a.contest-b.contest); const start=Math.max(15,ordered.length-count);
  if(ordered.length-start<1)throw Error('Histórico insuficiente: são necessários pelo menos 16 concursos.');
  let totalCost=0,known=0,unknown=0,mean=0,base=0;const rows:BacktestRow[]=[];
  for(let i=start;i<ordered.length;i++){
    const hist=ordered.slice(0,i),d=ordered[i];
    const extra=rule.extra==='month'?months[0]:rule.extra==='team'?'SEM TIME':'',seed=14093+i*17;
    const current=generate({rule,strategy,count:1,pick:rule.pick,budget:rule.basePrice,history:hist,extra,seed}).tickets[0];
    const baseline=generate({rule,strategy:'random',count:1,pick:rule.pick,budget:rule.basePrice,history:hist,extra,seed:seed+991}).tickets[0];
    const hit=countHits(rule,current,d.numbers);
    const bHit=countHits(rule,baseline,d.numbers);
    // Dupla Sena: total de faixas por sorteio; a métrica principal compara o melhor resultado por concurso.
    const second=d.secondNumbers?countHits(rule,current,d.secondNumbers):null;
    const valueFor=(hits:number,secondDraw:boolean)=>{
      const p=d.payouts.find(p=>p.description.toLowerCase().includes(`${hits} acerto`) && (!d.secondNumbers||p.description.toLowerCase().includes(secondDraw?'2º':'1º')));
      return p?.value ?? null;
    };
    let prize=rule.tiers.includes(hit)?valueFor(hit,false):0;
    if(second!==null&&rule.tiers.includes(second)){const v=valueFor(second,true);prize=prize===null||v===null?null:prize+v;}
    if(prize===null)unknown++;else known+=prize;
    totalCost+=rule.basePrice;mean+=Math.max(hit,second??0);base+=Math.max(bHit,d.secondNumbers?countHits(rule,baseline,d.secondNumbers):0);
    rows.push({contest:d.contest,date:d.date,hits:Math.max(hit,second??0),extraHit:rule.extra==='month'?d.extra===extra:false,cost:rule.basePrice,prize,baselineHits:Math.max(bHit,d.secondNumbers?countHits(rule,baseline,d.secondNumbers):0)});
  }
  return {rows,games:rows.length,investment:+totalCost.toFixed(2),knownReturn:unknown?null:+known.toFixed(2),compared:rows.length,avgHits:mean/rows.length,baselineAvg:base/rows.length,note:`Teste walk-forward: cada aposta usa somente concursos anteriores. Referência aleatória de mesmo custo e semente reproduzível. ${unknown?'Alguns rateios históricos não estão disponíveis; retorno total omitido.':''} Retorno por mês/time ou apostas múltiplas não é computado neste MVP.`};
}
