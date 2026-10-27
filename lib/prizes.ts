/** Auditoria de acertos e rateios publicados. Não autentica compra de bilhetes. */
import {Draw,LotteryKey,LotteryRule,RULES,Ticket,months} from './rules';

export type Award = {label:string; hits:number|string; quantity:number; unitValue:number|null; subtotal:number|null; secondDraw?:boolean};
export type CheckedTicket = {index:number; hits:number; secondHits:number|null; selected:number[]; matched:number[]; secondMatched:number[]; awards:Award[]; amount:number|null; pendingPayout:boolean};
export type CheckReport = {lottery:LotteryKey; contest:number; date:string; source:string; checked:number; paidTickets:number; pending:boolean; confirmedTotal:number|null; entries:CheckedTicket[]; note:string};

const bands:Record<LotteryKey,number[]> = {
  megasena:[6,5,4], quina:[5,4,3,2], lotofacil:[15,14,13,12,11],
  diadesorte:[7,6,5,4], duplasena:[6,5,4,3], lotomania:[20,19,18,17,16,15,0],
  timemania:[7,6,5,4,3],supersete:[7,6,5,4,3]
};
const extras:Partial<Record<LotteryKey,{name:string;tier:number}>>={diadesorte:{name:'Mês da Sorte',tier:5},timemania:{name:'Time do Coração',tier:6}};
function combination(n:number,k:number):number{
  if(k<0||k>n||!Number.isInteger(n)||!Number.isInteger(k))return 0;
  const p=Math.min(k,n-k);let out=1;
  for(let i=1;i<=p;i++)out=out*(n-i+1)/i;
  return Math.round(out);
}
function normalizeExtra(s:string|undefined|null){return (s||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
export function validTicket(ticket:Ticket,rule:LotteryRule):string|null{
  const nums=ticket.numbers;
  if(!Array.isArray(nums)||nums.length<rule.pick||nums.length>rule.maxPick||nums.some(n=>!Number.isInteger(n)||n<rule.min||n>rule.max))return `É preciso informar ${rule.pick} a ${rule.maxPick} seleções válidas (${rule.min}–${rule.max}).`;
  if(rule.extra==='columns'){
    if(nums.length!==7)return 'O Super Sete exige sete algarismos em ordem, um por coluna.';
    return null;
  }
  if(new Set(nums).size!==nums.length)return 'Dezenas repetidas no mesmo jogo.';
  return null;
}
export function parseManualTickets(text:string,lottery:LotteryKey,extra?:string):Ticket[]{
  const rule=RULES[lottery], lines=text.trim().split(/\r?\n/).filter(Boolean);
  if(!lines.length||lines.length>100)throw Error('Informe de 1 a 100 jogos, um por linha.');
  return lines.map((line,index)=>{
    // Apenas separadores explícitos; não aceita texto ou valores misturados.
    const pieces=line.trim().split(/[\s,;\-]+/).filter(Boolean);
    if(pieces.some(x=>!/^\d{1,2}$/.test(x)))throw Error(`Jogo ${index+1}: use apenas números separados por espaço, vírgula ou ponto e vírgula.`);
    const numbers=pieces.map(Number);const ticket:Ticket={numbers, ...(extra?{extra}:{}), ...(lottery==='supersete'?{columns:numbers.map(n=>[n])}:{})};
    const problem=validTicket(ticket,rule);if(problem)throw Error(`Jogo ${index+1}: ${problem}`);
    return ticket;
  });
}
function payable(draw:Draw,tier:number):number|null{
  const payout=draw.payouts.find(p=>p.tier===tier);
  // Ausência de rateio, ganhadores zerados ou valor inconsistente não significam prêmio de R$ 0.
  if(!payout||!Number.isFinite(payout.value)||payout.value<=0||payout.winners<1)return null;
  return payout.value;
}
function categoryLabel(lottery:LotteryKey,hits:number){
  if(lottery==='megasena')return hits===6?'Sena':hits===5?'Quina':'Quadra';
  if(lottery==='quina')return hits===5?'Quina':hits===4?'Quadra':hits===3?'Terno':'Duque';
  return `${hits} acertos`;
}
function extraAward(awards:Award[],draw:Draw,lottery:LotteryKey,ticket:Ticket){
  const rule=extras[lottery];
  if(rule&&ticket.extra&&draw.extra&&normalizeExtra(ticket.extra)===normalizeExtra(draw.extra)){
    const unitValue=payable(draw,rule.tier);
    awards.push({label:rule.name,hits:rule.name,quantity:1,unitValue,subtotal:unitValue});
  }
}
function doDraw(awards:Award[],rule:LotteryRule,ticket:Ticket,result:number[],draw:Draw,second=false){
  const isColumns=rule.id==='supersete';
  const matches=isColumns
    ?ticket.numbers.reduce((a,n,i)=>a+Number(n===result[i]),0)
    :ticket.numbers.filter(n=>result.includes(n)).length;
  const categoryHits=bands[rule.id];
  categoryHits.forEach((hit,idx)=>{
    const quantity=rule.id==='lotomania'||rule.id==='timemania'||isColumns
      ? Number(matches===hit)
      : combination(matches,hit)*combination(ticket.numbers.length-matches,rule.pick-hit);
    if(!quantity)return;
    const tier=(second?4:0)+idx+1;
    const unitValue=payable(draw,tier);
    awards.push({label:`${second?'2º sorteio · ':''}${categoryLabel(rule.id,hit)}`,hits:hit,quantity,unitValue,subtotal:unitValue===null?null:Math.round(quantity*unitValue*100)/100,secondDraw:second});
  });
  return matches;
}
/** Faz verificação por concurso específico, sem inferir pagamento quando a fonte não trouxe rateios. */
export function checkTickets(draw:Draw,tickets:Ticket[]):CheckReport{
  const rule=RULES[draw.lottery];
  if(!tickets.length||tickets.length>100)throw Error('Informe entre 1 e 100 jogos.');
  if(draw.numbers.length!==rule.draw)throw Error('Resultado incompleto: quantidade de dezenas inválida.');
  if(rule.id==='duplasena'&&(!draw.secondNumbers||draw.secondNumbers.length!==rule.draw))throw Error('Resultado da Dupla Sena sem os dois sorteios.');
  const entries=tickets.map((ticket,i):CheckedTicket=>{
    const problem=validTicket(ticket,rule);if(problem)throw Error(`Jogo ${i+1}: ${problem}`);
    const awards:Award[]=[];
    const hits=doDraw(awards,rule,ticket,draw.numbers,draw);
    const secondHits=draw.secondNumbers?doDraw(awards,rule,ticket,draw.secondNumbers,draw,true):null;
    extraAward(awards,draw,draw.lottery,ticket);
    return {index:i+1,hits,secondHits,selected:ticket.numbers,
      matched:rule.extra==='columns'?ticket.numbers.filter((n,i)=>n===draw.numbers[i]):ticket.numbers.filter(n=>draw.numbers.includes(n)),
      secondMatched:draw.secondNumbers?ticket.numbers.filter(n=>draw.secondNumbers!.includes(n)):[],
      awards,amount:awards.some(a=>a.subtotal===null)?null:Math.round(awards.reduce((a,b)=>a+(b.subtotal||0),0)*100)/100,
      pendingPayout:awards.some(a=>a.subtotal===null)};
  });
  const pending=entries.some(e=>e.pendingPayout);
  const confirmedTotal=pending?null:Math.round(entries.reduce((sum,e)=>sum+(e.amount||0),0)*100)/100;
  return {lottery:draw.lottery,contest:draw.contest,date:draw.date,source:draw.source,checked:entries.length,paidTickets:entries.filter(e=>e.awards.length>0).length,
    pending,confirmedTotal,entries,
    note:pending?'Há faixa premiada sem rateio válido na fonte. Acertos confirmados pela comparação, mas valor a receber ainda não pode ser calculado. Confirme a premiação na Caixa.':'Valores calculados com rateios do concurso informado pela fonte. O resultado não comprova a aquisição ou a validade de bilhetes.'};
}
/** Método recreativo para comparar somente números digitados quando a API estiver indisponível. */
export function manualDraw(lottery:LotteryKey,contest:number,numbers:number[],extra?:string,secondNumbers?:number[]):Draw{
  const rule=RULES[lottery];
  if(!Number.isSafeInteger(contest)||contest<1||numbers.length!==rule.draw||numbers.some(n=>!Number.isInteger(n)||n<rule.min||n>rule.max))throw Error('Dados do resultado manual inválidos.');
  if(rule.extra!=='columns'&&new Set(numbers).size!==numbers.length)throw Error('Resultado com dezenas repetidas.');
  if(lottery==='duplasena'&&(!secondNumbers||secondNumbers.length!==6||new Set(secondNumbers).size!==6))throw Error('Informe também o segundo sorteio da Dupla Sena.');
  return {lottery,contest,date:new Date().toISOString().slice(0,10),nextDate:null,numbers,secondNumbers:secondNumbers||null,extra:extra||null,prizeEstimate:null,payouts:[],source:'Resultado digitado manualmente (não verificado)',fetchedAt:new Date().toISOString()};
}
export function validateManualResult(text:string,lottery:LotteryKey):number[]{
  const rule=RULES[lottery];const tokens=text.trim().split(/[\s,;\-]+/).filter(Boolean);
  if(tokens.some(t=>!/^\d{1,2}$/.test(t)))throw Error('O resultado deve conter apenas dezenas separadas por espaço.');
  const nums=tokens.map(Number);
  if(nums.length!==rule.draw||nums.some(n=>n<rule.min||n>rule.max)||rule.extra!=='columns'&&new Set(nums).size!==nums.length)throw Error(`Digite ${rule.draw} dezenas válidas do resultado da ${rule.label}.`);
  return nums;
}
export {months};
