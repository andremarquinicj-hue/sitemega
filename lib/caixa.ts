import {Draw, LotteryKey, RULES, months} from './rules';
const BASE=process.env.CAIXA_API_BASE||'https://servicebus2.caixa.gov.br/portaldeloterias/api';
type Raw={numero?:unknown;dataApuracao?:unknown;dataProximoConcurso?:unknown;listaDezenas?:unknown;listaDezenasSegundoSorteio?:unknown;nomeTimeCoracaoMesSorte?:unknown;valorEstimadoProximoConcurso?:unknown;listaRateioPremio?:unknown};
function parseBRDate(value:unknown):string|null{
  if(typeof value!=='string')return null;
  const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);if(!m)return null;
  const d=Number(m[1]),month=Number(m[2]),year=Number(m[3]);
  const dt=new Date(Date.UTC(year,month-1,d));
  if(dt.getUTCDate()!==d||dt.getUTCMonth()!==month-1||year<1990||year>2100)return null;
  return dt.toISOString().slice(0,10);
}
export function normalize(raw:unknown,lottery:LotteryKey):Draw{
  if(!raw||typeof raw!=='object')throw Error('Resposta da Caixa inválida');
  const v=raw as Raw,rule=RULES[lottery],contest=Number(v.numero);
  const date=parseBRDate(v.dataApuracao);
  const list=(input:unknown):number[]|null=>Array.isArray(input)&&input.every(x=>typeof x==='number'||(typeof x==='string'&&/^\d{1,2}$/.test(x)))?input.map(Number):null;
  const nums=list(v.listaDezenas),second=v.listaDezenasSegundoSorteio?list(v.listaDezenasSegundoSorteio):null;
  if(!Number.isSafeInteger(contest)||contest<1||!date||!nums||nums.length!==rule.draw||nums.some(x=>!Number.isInteger(x)||x<rule.min||x>rule.max))throw Error(`Números, data ou concurso inconsistentes (${lottery})`);
  if(rule.extra!=='columns'&&new Set(nums).size!==nums.length)throw Error('Dezenas duplicadas no mesmo sorteio');
  if(lottery==='duplasena'&&(!second||second.length!==rule.draw||new Set(second).size!==second.length||second.some(x=>x<rule.min||x>rule.max)))throw Error('Segundo sorteio incompleto');
  const extraRaw=typeof v.nomeTimeCoracaoMesSorte==='string'?v.nomeTimeCoracaoMesSorte.replace(/\0/g,'').trim():null;
  const extra=lottery==='diadesorte'?months.find(m=>m.toLowerCase()===extraRaw?.toLowerCase())??null:lottery==='timemania'?extraRaw:null;
  const payouts=Array.isArray(v.listaRateioPremio)?v.listaRateioPremio.map(p=>{
    const r=p as {faixa?:unknown;descricaoFaixa?:unknown;numeroDeGanhadores?:unknown;valorPremio?:unknown};
    return {tier:Number(r.faixa)||0,description:String(r.descricaoFaixa||''),winners:Number(r.numeroDeGanhadores)||0,value:Number(r.valorPremio)||0};
  }):[];
  const est=Number(v.valorEstimadoProximoConcurso);
  return {lottery,contest,date,nextDate:parseBRDate(v.dataProximoConcurso),numbers:nums,secondNumbers:second,extra,prizeEstimate:Number.isFinite(est)&&est>=0?est:null,payouts,source:'CAIXA — Portal Loterias (API pública não documentada)',fetchedAt:new Date().toISOString()};
}
export async function fetchCaixa(lottery:LotteryKey,contest?:number):Promise<Draw>{
  if(contest!==undefined&&(!Number.isInteger(contest)||contest<=0))throw Error('Concurso inválido');
  const url=`${BASE.replace(/\/$/,'')}/${lottery}${contest?`/${contest}`:''}`;
  let last:unknown;
  for(let attempt=0;attempt<2;attempt++){
    try{
      const response=await fetch(url,{headers:{Accept:'application/json','User-Agent':'LottoMindAI/1.0 (resultados publicos)'},signal:AbortSignal.timeout(10000),...({next:{revalidate:900}} as {next:{revalidate:number}})});
      if(!response.ok)throw Error(`Caixa retornou HTTP ${response.status}`);
      const raw:unknown=await response.json();return normalize(raw,lottery);
    }catch(err){last=err;}
  }
  throw new Error(`Fonte oficial indisponível para ${lottery}: ${last instanceof Error?last.message:'erro desconhecido'}`);
}
