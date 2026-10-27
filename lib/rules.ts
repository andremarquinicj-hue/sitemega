export const LOTTERY_KEYS = ['megasena','quina','lotofacil','diadesorte','duplasena','lotomania','timemania','supersete'] as const;
export type LotteryKey = typeof LOTTERY_KEYS[number];
export type LotteryRule = { id: LotteryKey; label: string; min: number; max: number; pick: number; draw: number; maxPick: number; basePrice: number; color: string; tiers: number[]; extra?: 'month'|'team'|'columns'; source: string; };
export const RULES: Record<LotteryKey,LotteryRule> = {
  megasena: { id:'megasena', label:'Mega-Sena',min:1,max:60,pick:6,draw:6,maxPick:20,basePrice:6,color:'#22c79f',tiers:[4,5,6],source:'https://loterias.caixa.gov.br/Paginas/Mega-Sena.aspx' },
  quina: { id:'quina',label:'Quina',min:1,max:80,pick:5,draw:5,maxPick:15,basePrice:3,color:'#5379ff',tiers:[2,3,4,5],source:'https://loterias.caixa.gov.br/Paginas/Quina.aspx' },
  lotofacil: { id:'lotofacil',label:'Lotofácil',min:1,max:25,pick:15,draw:15,maxPick:20,basePrice:3.5,color:'#e576cc',tiers:[11,12,13,14,15],source:'https://loterias.caixa.gov.br/Paginas/Lotofacil.aspx' },
  diadesorte: { id:'diadesorte',label:'Dia de Sorte',min:1,max:31,pick:7,draw:7,maxPick:15,basePrice:2.5,color:'#f4ba65',tiers:[4,5,6,7],extra:'month',source:'https://loterias.caixa.gov.br/Paginas/Dia-de-Sorte.aspx' },
  duplasena: { id:'duplasena',label:'Dupla Sena',min:1,max:50,pick:6,draw:6,maxPick:15,basePrice:3,color:'#c98bff',tiers:[3,4,5,6],source:'https://loterias.caixa.gov.br/Paginas/Dupla-sena.aspx' },
  lotomania: { id:'lotomania',label:'Lotomania',min:0,max:99,pick:50,draw:20,maxPick:50,basePrice:3,color:'#f5a363',tiers:[0,15,16,17,18,19,20],source:'https://loterias.caixa.gov.br/Paginas/Lotomania.aspx' },
  timemania: { id:'timemania',label:'Timemania',min:1,max:80,pick:10,draw:7,maxPick:10,basePrice:3.5,color:'#70bdff',tiers:[3,4,5,6,7],extra:'team',source:'https://loterias.caixa.gov.br/Paginas/Timemania.aspx' },
  supersete: { id:'supersete',label:'Super Sete',min:0,max:9,pick:7,draw:7,maxPick:7,basePrice:3,color:'#fb8b98',tiers:[3,4,5,6,7],extra:'columns',source:'https://loterias.caixa.gov.br/Paginas/Super-Sete.aspx' }
};
export const isLottery = (s: string): s is LotteryKey => LOTTERY_KEYS.includes(s as LotteryKey);
export const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export type Draw = { lottery: LotteryKey; contest:number; date:string; nextDate:string|null; numbers:number[]; secondNumbers:number[]|null; extra:string|null; prizeEstimate:number|null; payouts: {tier:number;description:string;winners:number;value:number}[]; fetchedAt:string; source:string; };
export type Ticket = { numbers: number[]; extra?:string; columns?:number[][] };
export type DiversityGoal = 'sena'|'quadra'|'quina';
export type Strategy = 'random'|'balanced'|'frequency'|'delay'|'diversity'|'fibonacci'|'numerology'|'closure';
export const STRATEGIES: {id:Strategy;label:string;category:string;description:string}[] = [
{id:'random',label:'Aleatório uniforme',category:'Estatístico',description:'Todos os conjuntos válidos possuem a mesma chance.'},
{id:'balanced',label:'Distribuição equilibrada',category:'Heurística',description:'Filtra somas e paridade, sem melhorar probabilidade individual.'},
{id:'frequency',label:'Frequências',category:'Heurística',description:'Prioriza frequência histórica, sem capacidade preditiva demonstrada.'},
{id:'delay',label:'Atrasos',category:'Heurística',description:'Prioriza dezenas ausentes há mais tempo; atrasos não aumentam chances.'},
{id:'diversity',label:'Máxima diversidade',category:'Otimização',description:'Otimiza a cobertura e evita repetições desnecessárias. Aposta individual não fica mais provável.'},
{id:'fibonacci',label:'Fibonacci',category:'Experimental',description:'Padrão matemático recreativo, sem evidência preditiva.'},
{id:'numerology',label:'Numerologia',category:'Recreativo',description:'Reduções pitagóricas como filtro lúdico.'},
{id:'closure',label:'Fechamento completo',category:'Combinatório',description:'Todas as combinações de um conjunto compacto; garantia apenas se o sorteio estiver contido nesse conjunto.'}
];
