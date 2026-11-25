import type {Draw,LotteryKey,Strategy,Ticket} from './rules';
import {checkTickets} from './prizes';

/** Um palpite é registrado ANTES do resultado. Não implica aposta paga. */
export type PredictionSnapshot={
  id:string;lottery:LotteryKey;targetContest:number;basedOnContest:number;createdAt:string;
  strategy:Strategy;methodology:string;tickets:Ticket[];purchased:boolean;label:string;
};
export type PredictionOutcome={status:'pending'|'checked';contest:number;maxHits:number|null;hits:number[];awards:number;amount:number|null;amountAvailable:boolean;note:string};
export function snapshotOutcome(snapshot:PredictionSnapshot,draws:Draw[]):PredictionOutcome{
  const draw=draws.find(d=>d.lottery===snapshot.lottery&&d.contest===snapshot.targetContest);
  if(!draw)return {status:'pending',contest:snapshot.targetContest,maxHits:null,hits:[],awards:0,amount:null,amountAvailable:false,note:'Resultado ainda não disponível no histórico consultado. Não foi marcado como erro nem acerto.'};
  const chunks:ReturnType<typeof checkTickets>[]=[];
  for(let start=0;start<snapshot.tickets.length;start+=100)chunks.push(checkTickets(draw,snapshot.tickets.slice(start,start+100)));
  const entries=chunks.flatMap(c=>c.entries);
  const pending=chunks.some(c=>c.pending);
  const total=pending?null:Math.round(chunks.reduce((sum,c)=>sum+(c.confirmedTotal||0),0)*100)/100;
  return {status:'checked',contest:draw.contest,maxHits:entries.length?Math.max(...entries.map(e=>e.hits)):null,hits:entries.map(e=>e.hits),awards:chunks.reduce((a,c)=>a+c.paidTickets,0),
    amount:total,amountAvailable:!pending,
    note:snapshot.purchased?'Jogos marcados como apostados pelo usuário. Confira o bilhete oficial.':'Simulação registrada: não representa dinheiro ganho ou prêmio a receber.'};
}
