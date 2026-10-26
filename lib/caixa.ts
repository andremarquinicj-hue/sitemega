import {Draw, LotteryKey, RULES, months} from './rules';

const OFFICIAL_BASE = process.env.CAIXA_API_BASE || 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
const FALLBACK_BASE = 'https://loteriascaixa-api.herokuapp.com/api';
const MEGA_BASE = 'https://resultadomega.com.br/api';

type Raw = {
  numero?: unknown; dataApuracao?: unknown; dataProximoConcurso?: unknown;
  listaDezenas?: unknown; listaDezenasSegundoSorteio?: unknown;
  nomeTimeCoracaoMesSorte?: unknown; valorEstimadoProximoConcurso?: unknown;
  listaRateioPremio?: unknown;
};
function parseBRDate(value:unknown):string|null {
  if(typeof value !== 'string')return null;
  const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if(!m)return null;
  const d=Number(m[1]),month=Number(m[2]),year=Number(m[3]);
  const dt=new Date(Date.UTC(year,month-1,d));
  if(dt.getUTCDate()!==d||dt.getUTCMonth()!==month-1||year<1990||year>2100)return null;
  return dt.toISOString().slice(0,10);
}
function parseISODate(value:unknown):string|null {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const [year,month,day]=value.split('-').map(Number);
  const dt=new Date(Date.UTC(year,month-1,day));
  if(year<1990||year>2100||dt.getUTCFullYear()!==year||dt.getUTCMonth()!==month-1||dt.getUTCDate()!==day)return null;
  return value;
}
function numberList(value:unknown):number[]|null {
  return Array.isArray(value) && value.every(v=>typeof v==='number'?Number.isInteger(v):typeof v==='string'&&/^\d{1,2}$/.test(v)) ? value.map(Number) : null;
}
function verifyDraw(draw:Draw):Draw {
  const rule=RULES[draw.lottery],nums=draw.numbers;
  if(!Number.isSafeInteger(draw.contest)||draw.contest<1||!parseISODate(draw.date)||nums.length!==rule.draw||nums.some(x=>!Number.isInteger(x)||x<rule.min||x>rule.max))throw Error(`Números, data ou concurso inconsistentes (${draw.lottery})`);
  if(rule.extra!=='columns'&&new Set(nums).size!==nums.length)throw Error('Dezenas duplicadas no mesmo sorteio');
  if(draw.lottery==='duplasena'&&(!draw.secondNumbers||draw.secondNumbers.length!==6||new Set(draw.secondNumbers).size!==6||draw.secondNumbers.some(x=>!Number.isInteger(x)||x<1||x>50)))throw Error('Segundo sorteio incompleto');
  return draw;
}
export function normalize(raw:unknown,lottery:LotteryKey):Draw {
  if(!raw||typeof raw!=='object')throw Error('Resposta da Caixa inválida');
  const v=raw as Raw,contest=Number(v.numero),date=parseBRDate(v.dataApuracao);
  const nums=numberList(v.listaDezenas),second=numberList(v.listaDezenasSegundoSorteio);
  if(!date||!nums)throw Error(`Números, data ou concurso inconsistentes (${lottery})`);
  const extraRaw=typeof v.nomeTimeCoracaoMesSorte==='string'?v.nomeTimeCoracaoMesSorte.replace(/\0/g,'').trim():null;
  const extra=lottery==='diadesorte'?months.find(m=>m.toLowerCase()===extraRaw?.toLowerCase())??null:lottery==='timemania'?extraRaw:null;
  const payouts=Array.isArray(v.listaRateioPremio)?v.listaRateioPremio.map(p=>{
    const r=p as {faixa?:unknown;descricaoFaixa?:unknown;numeroDeGanhadores?:unknown;valorPremio?:unknown};
    return {tier:Number(r.faixa)||0,description:String(r.descricaoFaixa||''),winners:Number(r.numeroDeGanhadores)||0,value:Number(r.valorPremio)||0};
  }):[];
  const est=v.valorEstimadoProximoConcurso===null||v.valorEstimadoProximoConcurso===undefined?null:Number(v.valorEstimadoProximoConcurso);
  return verifyDraw({lottery,contest,date,nextDate:parseBRDate(v.dataProximoConcurso),numbers:nums,secondNumbers:second,extra,prizeEstimate:est!==null&&Number.isFinite(est)&&est>=0?est:null,payouts,source:'CAIXA — Portal de Loterias (API pública não documentada)',fetchedAt:new Date().toISOString()});
}

export function normalizeGuto(raw:unknown,lottery:LotteryKey):Draw {
  if(!raw||typeof raw!=='object')throw Error('Resposta da fonte alternativa inválida');
  const v=raw as Record<string,unknown>;
  if(v.loteria!==lottery)throw Error('Modalidade divergente na fonte alternativa');
  const date=parseBRDate(v.data),nums=numberList(v.dezenas);
  if(!date||!nums)throw Error('Data ou dezenas inválidas na fonte alternativa');
  // A Dupla Sena exige o segundo sorteio. Nunca invente ou omita esse resultado.
  const second=numberList(v.dezenasSegundoSorteio??v.segundoSorteio??v.segundasDezenas);
  const extraRaw=lottery==='diadesorte'?v.mesSorte:lottery==='timemania'?v.timeCoracao:null;
  const extra=typeof extraRaw==='string'?extraRaw.trim():null;
  const payouts=Array.isArray(v.premiacoes)?v.premiacoes.map(p=>{
    const r=p as Record<string,unknown>;
    return {tier:Number(r.faixa)||0,description:String(r.descricao||''),winners:Number(r.ganhadores)||0,value:Number(r.valorPremio)||0};
  }):[];
  const value=v.valorEstimadoProximoConcurso===undefined||v.valorEstimadoProximoConcurso===null?null:Number(v.valorEstimadoProximoConcurso);
  return verifyDraw({lottery,contest:Number(v.concurso),date,nextDate:parseBRDate(v.dataProximoConcurso),numbers:nums,secondNumbers:second,extra,prizeEstimate:value!==null&&Number.isFinite(value)&&value>=0?value:null,payouts,source:'Fonte alternativa: Guto Alves / Loterias API (dados públicos da Caixa; verifique data)',fetchedAt:new Date().toISOString()});
}

export function normalizeMega(raw:unknown):Draw {
  if(!raw||typeof raw!=='object')throw Error('Fonte alternativa Mega-Sena inválida');
  const v=raw as Record<string,unknown>;
  const date=parseISODate(v.data),nums=numberList(v.dezenas);
  if(!date||!nums)throw Error('Data ou dezenas inválidas na fonte Mega-Sena');
  const prizes=v.premios&&typeof v.premios==='object'?v.premios as Record<string,unknown>:{};
  const payouts=[6,5,4].map((hits,i)=>{
    const r=prizes[String(hits)]&&typeof prizes[String(hits)]==='object'?prizes[String(hits)] as Record<string,unknown>:{};
    return {tier:i+1,description:`${hits} acertos`,winners:Number(r.ganhadores)||0,value:Number(r.rateio)||0};
  });
  const value=v.estimativaProximo===undefined||v.estimativaProximo===null?null:Number(v.estimativaProximo);
  return verifyDraw({lottery:'megasena',contest:Number(v.concurso),date,nextDate:null,numbers:nums,secondNumbers:null,extra:null,prizeEstimate:value!==null&&Number.isFinite(value)&&value>=0?value:null,payouts,source:'Fonte alternativa: Resultado Mega (resultadomega.com.br; dados públicos da Caixa)',fetchedAt:new Date().toISOString()});
}

async function getJson(url:string):Promise<unknown> {
  const response=await fetch(url,{
    headers:{Accept:'application/json','User-Agent':'LottoMindAI/1.1 (consulta de resultados publicos)'},
    signal:AbortSignal.timeout(8500),...({next:{revalidate:600}} as {next:{revalidate:number}})
  });
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  return await response.json() as unknown;
}

/** Cada origem é explicitada em Draw.source. Não existe promessa de SLA ou atualização em tempo real. */
export async function fetchCaixa(lottery:LotteryKey,contest?:number):Promise<Draw> {
  if(contest!==undefined&&(!Number.isInteger(contest)||contest<1))throw Error('Concurso inválido');
  const notes:string[]=[];
  try{
    const path=`${lottery}${contest!==undefined?`/${contest}`:''}`;
    return normalize(await getJson(`${OFFICIAL_BASE.replace(/\/$/,'')}/${path}`),lottery);
  }catch(e){notes.push(`Caixa: ${e instanceof Error?e.message:String(e)}`)}
  try{
    const path=`${lottery}/${contest===undefined?'latest':contest}`;
    return normalizeGuto(await getJson(`${FALLBACK_BASE}/${path}`),lottery);
  }catch(e){notes.push(`Loterias API: ${e instanceof Error?e.message:String(e)}`)}
  if(lottery==='megasena'&&contest===undefined){
    try{return normalizeMega(await getJson(`${MEGA_BASE}/ultimo.json`));}
    catch(e){notes.push(`Resultado Mega: ${e instanceof Error?e.message:String(e)}`)}
  }
  throw Error(`Nenhuma fonte disponível para ${lottery}. ${notes.join('; ')}`);
}

/** Fonte alternativa compacta para os sorteios históricos da Mega-Sena. Sem valores de premiação. */
export async function fetchMegaHistory(limit:number):Promise<Draw[]> {
  const raw=await getJson(`${MEGA_BASE}/concursos.json`);
  if(!Array.isArray(raw))throw Error('Histórico alternativo inválido');
  const result:Draw[]=[];
  for(const row of raw.slice(-Math.max(0,Math.min(limit,500))).reverse()){
    if(!Array.isArray(row)||row.length<3)continue;
    const [contest,rawDate,rawNumbers]=row;
    const date=parseISODate(rawDate),numbers=numberList(rawNumbers);
    if(!date||!numbers)continue;
    try{
      result.push(verifyDraw({lottery:'megasena',contest:Number(contest),date,nextDate:null,numbers,secondNumbers:null,extra:null,prizeEstimate:null,payouts:[],source:'Fonte alternativa: Resultado Mega (histórico, sem rateios)',fetchedAt:new Date().toISOString()}));
    }catch{/* Ignora exclusivamente registros inválidos */}
  }
  return result;
}
