import {choose} from './math';
import type {Ticket} from './rules';

/** Cobertura de UM concurso da Mega-Sena. Não calcula retorno financeiro. */
export const MEGA_SPACE=choose(60,6);
export const MEGA_PRICE=6;
export const MAX_EXACT_TICKETS=500;
const SINGLE_4=choose(6,4)*choose(54,2)+choose(6,5)*choose(54,1)+1;
const SINGLE_5=choose(6,5)*choose(54,1)+1;

export type ProbabilityBand={probability:number|null;lower:number;upper:number;method:'exact'|'limits';};
export type PortfolioCoverage={count:number;unique:number;selections:number;cost:number;quadraOrBetter:ProbabilityBand;quinaOrBetter:ProbabilityBand;sena:ProbabilityBand;numberCount:number;note:string};
export type BudgetScenario={budget:number;participants:number;games:number;cost:number;remainder:number;costPerPerson:number;sextetChance:number;quadraUpper:number;quinaUpper:number;explanation:string};

export function budgetScenario(budget:number,participants=1):BudgetScenario{
  if(!Number.isFinite(budget)||budget<0||budget>1000000)throw Error('Orçamento deve ficar entre R$ 0 e R$ 1.000.000.');
  if(!Number.isInteger(participants)||participants<1||participants>1000)throw Error('Quantidade de participantes inválida.');
  const games=Math.min(MEGA_SPACE,Math.floor((budget+1e-8)/MEGA_PRICE));
  const cost=games*MEGA_PRICE;
  return {budget,participants,games,cost,remainder:+(budget-cost).toFixed(2),costPerPerson:+(cost/participants).toFixed(2),
    sextetChance:games/MEGA_SPACE,quadraUpper:Math.min(1,games*SINGLE_4/MEGA_SPACE),quinaUpper:Math.min(1,games*SINGLE_5/MEGA_SPACE),
    explanation:'Sena: chance EXATA para combinações simples distintas; quadra+/quina+: apenas LIMITES SUPERIORES antes de gerar e auditar todas as apostas, pois pode haver sobreposição de resultados premiados. Participantes dividem o prêmio do bolão, não multiplicam a chance individual.'};
}
function validMegaTicket(ticket:Ticket):number[]{
  if(!ticket||!Array.isArray(ticket.numbers)||ticket.numbers.length!==6)throw Error('Todos os jogos devem ter seis dezenas.');
  const nums=[...ticket.numbers].sort((a,b)=>a-b);
  if(nums.some(n=>!Number.isInteger(n)||n<1||n>60)||new Set(nums).size!==6)throw Error('Jogo com dezenas inválidas ou repetidas.');
  return nums;
}
const C:number[][]=Array.from({length:61},()=>Array(7).fill(0));
for(let n=0;n<=60;n++)for(let k=0;k<=6;k++)C[n][k]=choose(n,k);
function colexRank6(sorted:number[]):number{
  return C[sorted[0]-1][1]+C[sorted[1]-1][2]+C[sorted[2]-1][3]+C[sorted[3]-1][4]+C[sorted[4]-1][5]+C[sorted[5]-1][6];
}
function mark(bits:Uint8Array,numbers:number[]):number{
  numbers.sort((a,b)=>a-b);
  const rank=colexRank6(numbers),byte=rank>>>3,bit=1<<(rank&7);
  if(bits[byte]&bit)return 0;
  bits[byte]|=bit;
  return 1;
}
function exactMegaCounts(tickets:number[][]):{quadra:number;quina:number}{
  const size=Math.ceil(MEGA_SPACE/8);
  const q4Bits=new Uint8Array(size),q5Bits=new Uint8Array(size);
  let quadra=0,quina=0;
  for(const ticket of tickets){
    const chosen=new Set(ticket);
    const outside:number[]=[];
    for(let n=1;n<=60;n++)if(!chosen.has(n))outside.push(n);
    // Exatamente quatro dezenas do bilhete e duas fora dele.
    for(let a=0;a<6;a++)for(let b=a+1;b<6;b++){
      const four=ticket.filter((_,i)=>i!==a&&i!==b);
      for(let i=0;i<outside.length;i++)for(let j=i+1;j<outside.length;j++){
        quadra+=mark(q4Bits,[...four,outside[i],outside[j]]);
      }
    }
    // Exatamente cinco dezenas do bilhete, uma fora.
    for(let skip=0;skip<6;skip++){
      const five=ticket.filter((_,i)=>i!==skip);
      for(const other of outside){
        const outcome=[...five,other];
        quina+=mark(q5Bits,outcome.slice());
        quadra+=mark(q4Bits,outcome);
      }
    }
    // Seis acertos; também contabiliza nas faixas >=4 e >=5.
    quina+=mark(q5Bits,ticket.slice());
    quadra+=mark(q4Bits,ticket.slice());
  }
  return {quadra,quina};
}
function exact(p:number):ProbabilityBand{return {probability:p,lower:p,upper:p,method:'exact'};}
function limits(n:number,one:number):ProbabilityBand{return {probability:null,lower:one,upper:Math.min(1,n*one),method:'limits'};}
/** Probabilidade da UNIÃO das faixas. Para até 500 apostas, enumera todos os sorteios
 * que acertariam >=4 ou >=5 com um bitmap de resultados possíveis; não assume
 * independência entre bilhetes. Acima do limite, não inventa precisão.
 */
export function analyzeMegaPortfolio(raw:Ticket[]):PortfolioCoverage{
  if(!Array.isArray(raw)||raw.length<1||raw.length>20000)throw Error('Informe entre 1 e 20.000 apostas para auditoria.');
  const tickets=raw.map(validMegaTicket),ids=tickets.map(n=>n.join(','));
  const unique=new Set(ids);
  if(unique.size!==ids.length)throw Error('Existem apostas duplicadas. Remova os jogos repetidos para uma análise de combinações distintas.');
  const n=tickets.length;
  let quadraOrBetter:ProbabilityBand,quinaOrBetter:ProbabilityBand;
  if(n<=MAX_EXACT_TICKETS){
    const favorable=exactMegaCounts(tickets);
    quadraOrBetter=exact(favorable.quadra/MEGA_SPACE);
    quinaOrBetter=exact(favorable.quina/MEGA_SPACE);
  }else{
    quadraOrBetter=limits(n,SINGLE_4/MEGA_SPACE);
    quinaOrBetter=limits(n,SINGLE_5/MEGA_SPACE);
  }
  return {count:n,unique:unique.size,selections:n*6,cost:n*MEGA_PRICE,quadraOrBetter,quinaOrBetter,
    sena:exact(n/MEGA_SPACE),numberCount:new Set(tickets.flat()).size,
    note:n<=MAX_EXACT_TICKETS?'Probabilidades conjuntas EXATAS, calculadas pela união dos resultados premiados do conjunto (incluindo sobreposições).':'Acima de 500 apostas, são exibidos apenas limites matemáticos para quadra+/quina+. Sena permanece exata para apostas distintas.'};
}
export function megaSingleRates(){return {quadraOrBetter:SINGLE_4/MEGA_SPACE,quinaOrBetter:SINGLE_5/MEGA_SPACE,sena:1/MEGA_SPACE};}
