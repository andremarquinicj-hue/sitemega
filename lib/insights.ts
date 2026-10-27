import {Draw,LotteryRule} from './rules';
/** Observações recentes: relatório descritivo, não gerador de sinais preditivos. */
export type PostDrawInsight={title:string;recent:string;reference:string;interpretation:string};
export function postDrawInsights(history:Draw[],rule:LotteryRule):PostDrawInsight[]{
  const valid=[...history].sort((a,b)=>b.contest-a.contest).filter(x=>x.numbers.length===rule.draw);
  if(valid.length<5||rule.extra==='columns')return [];
  const recent=valid.slice(0,Math.min(10,valid.length));
  const total=rule.max-rule.min+1;
  const repeats=recent.slice(0,-1).map((d,i)=>d.numbers.filter(n=>recent[i+1].numbers.includes(n)).length);
  const repeatAvg=repeats.reduce((a,b)=>a+b,0)/Math.max(1,repeats.length);
  const evenAvg=recent.reduce((a,d)=>a+d.numbers.filter(n=>n%2===0).length,0)/recent.length;
  const today=valid[0],past=valid[1];
  const currentRepeat=today.numbers.filter(n=>past.numbers.includes(n)).length;
  const expectedRepeat=rule.draw*rule.draw/total;
  const expectedEven=Array.from({length:total},(_,i)=>i+rule.min).filter(n=>n%2===0).length*rule.draw/total;
  return [
    {title:'Dezenas repetidas entre concursos',recent:`Último concurso: ${currentRepeat}; média recente: ${repeatAvg.toFixed(1).replace('.',',')}`,reference:`Referência aleatória por sorteio: ${expectedRepeat.toFixed(1).replace('.',',')} repetidas`,interpretation:'Repetições podem ocorrer normalmente. A média histórica não altera a chance de uma dezena no próximo concurso.'},
    {title:'Pares e ímpares',recent:`Média de pares nos últimos ${recent.length} sorteios: ${evenAvg.toFixed(1).replace('.',',')}`,reference:`Referência aleatória: ${expectedEven.toFixed(1).replace('.',',')} pares`,interpretation:'Um desvio em janela curta não prova mudança no mecanismo dos sorteios.'},
    {title:'Volume da amostra',recent:`${recent.length} sorteios na janela recente`,reference:`${valid.length} concursos disponíveis para a modalidade`,interpretation:'Relatório atualizado após receber um novo concurso; insuficiente para sugerir ganho preditivo sem validação independente.'}
  ];
}
