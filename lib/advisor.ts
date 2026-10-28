import {Draw, LotteryRule, Strategy, STRATEGIES, months} from './rules';
import {choose, countHits, generate, price} from './math';

/**
 * Radar estatístico auditável. "Quente"/"frio" descreve contagens passadas,
 * NUNCA probabilidades futuras. Todas as previsões são avaliadas walk-forward.
 */
export type TemperatureRow = {
  number:number; appearances:number; expected:number; deviation:number; z:number; delay:number;
};
export type StrategyEvidence = {
  strategy:Strategy; label:string; category:string; evaluated:number;
  meanHits:number; expectedHits:number; difference:number;
  uncertainty95:number; z:number; interpretation:string;
};
export type RadarReport = {
  lottery:string; analyzedContest:number|null; contestDate:string|null;
  latestSource:string|null; sourceFetchedAt:string|null; observations:number;
  frequencyWindow:number; hot:TemperatureRow[]; cold:TemperatureRow[];
  strategyEvidence:StrategyEvidence[]; hindsightLeader:Strategy|null;
  recommendation:Strategy; recommendationTitle:string; recommendationReason:string;
  sampleStatus:'unavailable'|'limited'|'adequate';
  repeatLast:number|null; expectedRepeats:number|null;
  testedDraws:number; minimumTraining:number;
  cautions:string[];
};

function validHistory(draws:Draw[],rule:LotteryRule):Draw[]{
  const unique=new Map<number,Draw>();
  for(const d of draws){
    if(d.lottery!==rule.id||!Number.isInteger(d.contest)||d.contest<1||
      !Array.isArray(d.numbers)||d.numbers.length!==rule.draw||
      d.numbers.some(n=>!Number.isInteger(n)||n<rule.min||n>rule.max)||
      (rule.extra!=='columns'&&new Set(d.numbers).size!==rule.draw))continue;
    if(!unique.has(d.contest))unique.set(d.contest,d);
  }
  return [...unique.values()].sort((a,b)=>a.contest-b.contest);
}

function numberRanking(history:Draw[],rule:LotteryRule){
  const window=Math.min(30,history.length);
  if(!window)return {window,hot:[],cold:[]};
  const recent=history.slice(-window);
  const universe=rule.max-rule.min+1;
  const trials=rule.extra==='columns'?window*7:window;
  const chance=rule.extra==='columns'?0.1:rule.draw/universe;
  const expected=trials*chance;
  const deviationScale=Math.sqrt(Math.max(1e-9,trials*chance*(1-chance)));
  const rows:TemperatureRow[]=Array.from({length:universe},(_,i)=>{
    const number=rule.min+i;
    const appearances=recent.reduce((s,d)=>s+(rule.extra==='columns'?d.numbers.filter(n=>n===number).length:Number(d.numbers.includes(number))),0);
    const delay=[...history].reverse().findIndex(d=>d.numbers.includes(number));
    const deviation=appearances-expected;
    return {number,appearances,expected:+expected.toFixed(2),deviation:+deviation.toFixed(2),z:+(deviation/deviationScale).toFixed(2),delay:delay<0?history.length:delay};
  });
  const hot=[...rows].sort((a,b)=>b.deviation-a.deviation||a.number-b.number).slice(0,Math.min(8,Math.floor(universe/2)));
  const cold=[...rows].sort((a,b)=>a.deviation-b.deviation||a.number-b.number).slice(0,Math.min(8,Math.floor(universe/2)));
  return {window,hot,cold};
}

/** Each held-out draw is predicted with earlier contests only. One simple
 * ticket per strategy, so every strategy is tested at equal spending.
 * The comparison uses the EXACT expectation for a uniformly sampled draw.
 * Multiple strategy searches and short samples can produce false positives.
 */
function evaluate(history:Draw[],rule:LotteryRule):StrategyEvidence[]{
  if(history.length<31||rule.extra==='columns')return [];
  const first=Math.max(30,history.length-60);
  const n=history.length-first;
  if(n<1)return [];
  const universe=rule.max-rule.min+1;
  const expectedHits=rule.pick*rule.draw/universe;
  const p=rule.draw/universe;
  const variance=rule.pick*p*(1-p)*(universe-rule.pick)/(universe-1);
  const uncertainty95=1.96*Math.sqrt(variance/n);
  const strategies:Strategy[]=['random','balanced','frequency','delay','fibonacci','numerology'];
  const results:StrategyEvidence[]=[];
  for(let s=0;s<strategies.length;s++){
    const strategy=strategies[s];let sum=0,success=0;
    for(let i=first;i<history.length;i++){
      const draw=history[i];
      const past=history.slice(0,i);
      const extra=rule.extra==='month'?months[0]:rule.extra==='team'?'TIME EXPERIMENTAL':undefined;
      try{
        const generated=generate({rule,strategy,count:1,pick:rule.pick,budget:price(rule,rule.pick),history:past,extra,seed:12341+draw.contest*17+s*1229});
        if(generated.tickets.length!==1)continue;
        sum+=countHits(rule,generated.tickets[0],draw.numbers);
        success++;
      }catch{ /* Estratégia sem suporte: não inventar média. */ }
    }
    if(success!==n)continue;
    const meanHits=sum/n;
    const difference=meanHits-expectedHits;
    const z=difference/Math.sqrt(variance/n);
    const metadata=STRATEGIES.find(v=>v.id===strategy)!;
    results.push({strategy,label:metadata.label,category:metadata.category,evaluated:n,
      meanHits:+meanHits.toFixed(3),expectedHits:+expectedHits.toFixed(3),
      difference:+difference.toFixed(3),uncertainty95:+uncertainty95.toFixed(3),z:+z.toFixed(2),
      interpretation:n<50?'Amostra curta; diferença inconclusiva.':Math.abs(z)<2.64?'Compatível com flutuações aleatórias nesta comparação.':'Desvio exploratório; não é prova de vantagem futura.'});
  }
  return results.sort((a,b)=>b.meanHits-a.meanHits);
}

export function buildRadar(draws:Draw[],rule:LotteryRule):RadarReport{
  const history=validHistory(draws,rule);
  const last=history.at(-1);
  const {window,hot,cold}=numberRanking(history,rule);
  const evidence=evaluate(history,rule);
  const comparisons=history.length>1?history.at(-2):null;
  const repeatLast=last&&comparisons&&rule.extra!=='columns'?last.numbers.filter(n=>comparisons.numbers.includes(n)).length:null;
  const expectedRepeats=rule.extra==='columns'?null:rule.draw*rule.draw/(rule.max-rule.min+1);
  const limited=history.length<90||evidence.length===0;
  const recommendation:Strategy='diversity';
  return {
    lottery:rule.id,analyzedContest:last?.contest??null,contestDate:last?.date??null,
    latestSource:last?.source??null,sourceFetchedAt:last?.fetchedAt??null,
    observations:history.length,frequencyWindow:window,hot,cold,
    strategyEvidence:evidence,hindsightLeader:evidence[0]?.strategy??null,
    recommendation,recommendationTitle:'Máxima diversidade (para vários jogos)',
    recommendationReason:'Para um orçamento fixo, prioriza combinações distintas e reduz sobreposições; não depende de supostos números mais prováveis. Para apenas uma aposta, Aleatório uniforme é igualmente adequado.',
    sampleStatus:history.length===0?'unavailable':limited?'limited':'adequate',
    repeatLast,expectedRepeats:expectedRepeats===null?null:+expectedRepeats.toFixed(2),
    testedDraws:evidence[0]?.evaluated??0,minimumTraining:30,
    cautions:[
      'Dezenas quentes/frias são classificadas por frequência nos resultados PASSADOS; cada dezena conserva a probabilidade teórica no próximo sorteio equilibrado.',
      'O ranking de acertos no backtest não significa vantagem preditiva. Comparar muitas estratégias eleva o risco de encontrar padrões por acaso.',
      'Um concurso novo só altera a análise depois de validado e sincronizado. Dados indisponíveis nunca são substituídos por resultados inventados.',
      'Aumentar o orçamento amplia a quantidade de combinações distintas compradas, mas aumenta proporcionalmente o gasto e não garante retorno.'
    ]
  };
}

export function budgetCoverage(rule:LotteryRule,budget:number):{games:number;cost:number;change:number;jackpotChance:number|null;oneIn:number|null;note:string}{
  const safeBudget=Number.isFinite(budget)?Math.max(0,Math.min(1000000,budget)):0;
  const unit=price(rule,rule.pick);
  const games=Math.min(10000,Math.floor((safeBudget+1e-9)/unit));
  const cost=+(games*unit).toFixed(2);
  const oneDrawUnique=rule.pick===rule.draw && rule.extra!=='columns' && rule.id!=='duplasena';
  const singleSpace=oneDrawUnique?choose(rule.max-rule.min+1,rule.draw):0;
  const jackpotChance=oneDrawUnique?Math.min(1,games/singleSpace):null;
  return {games,cost,change:+(safeBudget-cost).toFixed(2),jackpotChance,
    oneIn:jackpotChance?1/jackpotChance:null,
    note:oneDrawUnique?'Probabilidade exata apenas para jogos simples distintos cobrindo combinações de prêmio principal em UM sorteio.':'Para esta modalidade, o prêmio principal depende de regras adicionais: não exibimos probabilidade agregada simplificada.'};
}
