import {Draw, LotteryRule} from './rules';
import {distribution,pairs,stats,NumberStat} from './math';

export type WindowKey='10'|'30'|'50'|'100'|'200'|'500'|'all';
export type StatisticalWindow={label:string;observed:number;requested:number|null;rows:NumberStat[];
  pairs:{numbers:number[];count:number}[];distribution:{label:string;value:number}[]};
export type StatisticalReport={lottery:string;historicalDraws:number;firstContest:number|null;
  lastContest:number|null;missingWithinRange:number;coveragePct:number|null;
  windows:Record<WindowKey,StatisticalWindow>;methodology:string};

export function validDraws(draws:Draw[],rule:LotteryRule):Draw[]{
  const unique=new Map<number,Draw>();
  for(const d of draws){
    if(d.lottery!==rule.id||!Number.isSafeInteger(d.contest)||d.contest<1||
      !Array.isArray(d.numbers)||d.numbers.length!==rule.draw||
      d.numbers.some(n=>!Number.isInteger(n)||n<rule.min||n>rule.max)||
      (rule.extra!=='columns'&&new Set(d.numbers).size!==rule.draw))continue;
    if(!unique.has(d.contest))unique.set(d.contest,d);
  }
  return [...unique.values()].sort((a,b)=>b.contest-a.contest);
}

/** Full-history statistics are calculated on the server. Every observation
 * window is labeled with its actual sample size; missing historical contests
 * never get silently substituted with invented results.
 */
export function buildStatisticalReport(draws:Draw[],rule:LotteryRule):StatisticalReport{
  const history=validDraws(draws,rule);
  const requested:{key:WindowKey;count:number|null;label:string}[]=[
    {key:'10',count:10,label:'Últimos 10'},
    {key:'30',count:30,label:'Últimos 30'},
    {key:'50',count:50,label:'Últimos 50'},
    {key:'100',count:100,label:'Últimos 100'},
    {key:'200',count:200,label:'Últimos 200'},
    {key:'500',count:500,label:'Últimos 500'},
    {key:'all',count:null,label:'Todo histórico disponível'}
  ];
  const windows={} as Record<WindowKey,StatisticalWindow>;
  for(const w of requested){
    const sample=w.count===null?history:history.slice(0,w.count);
    windows[w.key]={label:w.label,requested:w.count,observed:sample.length,
      rows:stats(sample,rule,sample.length),pairs:pairs(sample),distribution:distribution(sample,rule)};
  }
  const last=history[0]?.contest??null;
  const first=history.at(-1)?.contest??null;
  const span=first!==null&&last!==null?last-first+1:0;
  return {lottery:rule.id,historicalDraws:history.length,firstContest:first,lastContest:last,
    missingWithinRange:Math.max(0,span-history.length),coveragePct:span?+(100*history.length/span).toFixed(2):null,
    windows,methodology:'Frequências, atrasos e coocorrências calculados no servidor a partir de concursos únicos e válidos. Histórico incompleto e janelas curtas são identificados. Padrões passados não alteram as chances de um sorteio equilibrado.'};
}
