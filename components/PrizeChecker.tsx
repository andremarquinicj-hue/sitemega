'use client';
import {useEffect,useMemo,useState} from 'react';
import {AlertTriangle,ChevronRight,ClipboardCheck,ShieldCheck,TicketCheck,Trophy} from 'lucide-react';
import {Draw,LotteryKey,LOTTERY_KEYS,RULES,Ticket} from '@/lib/rules';
import {checkTickets,CheckReport,manualDraw,parseManualTickets,validateManualResult} from '@/lib/prizes';
export type SavedGameSet={id:string;name:string;lottery:LotteryKey;tickets:Ticket[];purchased:boolean;targetContest?:number;spent:number};
type ResultSync={draws:Draw[];status:string}|null;
type Props={saved:SavedGameSet[];lottery:LotteryKey;sync:ResultSync;onLotteryChange:(key:LotteryKey)=>void};
const brl=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const pad=(n:number)=>String(n).padStart(2,'0');
export default function PrizeChecker({saved,lottery,sync,onLotteryChange}:Props){
  const [setId,setSetId]=useState('manual');const [typed,setTyped]=useState('');const [manualExtra,setManualExtra]=useState('');
  const [contest,setContest]=useState('');const [manualNumbers,setManualNumbers]=useState('');const [manualSecond,setManualSecond]=useState('');const [manualDrawMode,setManualDrawMode]=useState(false);
  const [resultExtra,setResultExtra]=useState('');const [report,setReport]=useState<CheckReport|null>(null);const [result,setResult]=useState<Draw|null>(null);
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [stale,setStale]=useState(false);
  const gameSet=saved.find(s=>s.id===setId);
  const rule=RULES[lottery];
  const latest=sync?.draws?.[0];
  useEffect(()=>{setContest(latest?String(latest.contest):'');setResult(null);setReport(null);setMessage('');setStale(false)},[lottery,latest?.contest]);
  const knownSets=useMemo(()=>saved.filter(s=>s.lottery===lottery),[saved,lottery]);
  const selectSaved=(value:string)=>{setSetId(value);setReport(null);setResult(null);setMessage('');setStale(false);const s=saved.find(x=>x.id===value);if(s){onLotteryChange(s.lottery);setContest(s.targetContest?String(s.targetContest):'')}else if(latest)setContest(String(latest.contest));};
  const run=async()=>{
    setMessage('');setBusy(true);setReport(null);setResult(null);setStale(false);
    try{
      const tickets=gameSet?.tickets||parseManualTickets(typed,lottery,manualExtra);
      if(!tickets.length)throw Error('Você precisa informar pelo menos um jogo.');
      const id=Number(contest);
      if(!Number.isSafeInteger(id)||id<1)throw Error('Informe o número do concurso impresso no bilhete.');
      let draw:Draw,cache=false;
      if(manualDrawMode){
        const nums=validateManualResult(manualNumbers,lottery);
        const second=lottery==='duplasena'?validateManualResult(manualSecond,lottery):undefined;
        draw=manualDraw(lottery,id,nums,resultExtra,second);
      }else if(latest?.contest===id&&latest.lottery===lottery){
        draw=latest;cache=sync?.status==='cached';
      }else{
        const response=await fetch(`/api/check?lottery=${lottery}&contest=${id}`,{cache:'no-store'});
        const body=await response.json() as {draw?:Draw;error?:string;cached?:boolean};
        if(!response.ok||!body.draw)throw Error(body.error||'Resultado indisponível');
        draw=body.draw;cache=!!body.cached;
      }
      if(draw.contest!==id||draw.lottery!==lottery)throw Error('Resultado incompatível com o concurso solicitado.');
      const checked=checkTickets(draw,tickets);
      setReport(checked);setResult(draw);setStale(cache);
    }catch(e){setMessage(e instanceof Error?e.message:'Erro na conferência.');}
    finally{setBusy(false)}
  };
  return <div className="space-y-5">
    <div className="glass card checker-hero"><div className="flex items-start justify-between gap-4"><div className="max-w-xl"><div className="eyebrow gold-text">CONFERÊNCIA INTELIGENTE</div><h2 className="page-title mt-2">Seus números. Seu resultado.</h2><p className="muted text-sm mt-2">Compare bilhetes salvos ou dezenas digitadas, identifique as faixas premiadas e veja o rateio exato quando publicado. Sem adivinhação de valores.</p></div><Trophy size={40} className="text-amber-300 shrink-0 hidden sm:block"/></div></div>
    <div className="grid grid-cols-1 xl:grid-cols-[.92fr_1.08fr] gap-5">
      <section className="glass card space-y-4">
        <div className="flex gap-2 items-center font-bold"><TicketCheck size={18} className="gold-text"/> Configurar conferência</div>
        <div><label className="field-label">Loteria</label><select className="field" value={lottery} onChange={e=>{onLotteryChange(e.target.value as LotteryKey);setSetId('manual')}}>{LOTTERY_KEYS.map(k=><option key={k} value={k}>{RULES[k].label}</option>)}</select></div>
        <div><label className="field-label">Jogos para conferir</label><select className="field" value={setId} onChange={e=>selectSaved(e.target.value)}><option value="manual">Digitar os números dos meus jogos</option>{knownSets.map(s=><option key={s.id} value={s.id}>{s.name} ({s.tickets.length} jogos{s.purchased?', registrado':''})</option>)}</select></div>
        {gameSet?<div className="note text-sm"><strong>{gameSet.tickets.length} jogos salvos</strong> · {brl(gameSet.spent)} planejados.<br/>{gameSet.purchased?'Marcado pelo usuário como apostado.':'Não está marcado como apostado. A conferência não comprova compra.'} {gameSet.targetContest?`Concurso associado: ${gameSet.targetContest} (confirme no comprovante).`:''}</div>:<div><label className="field-label">Digite um jogo por linha</label><textarea className="field prize-textarea" rows={5} spellCheck={false} value={typed} onChange={e=>setTyped(e.target.value)} placeholder={lottery==='lotofacil'?'01 02 03 04 05 06 07 08 09 10 11 12 13 14 15\n02 03 04 05 06 07 08 09 10 11 12 13 14 15 16':'03 08 13 26 39 55\n14 20 22 30 31 34'}/><p className="muted text-xs mt-1.5">Números separados por espaço, vírgula ou ponto e vírgula. Até 100 jogos por conferência.</p>{rule.extra==='month'||rule.extra==='team'?<div className="mt-3"><label className="field-label">{rule.extra==='month'?'Mês escolhido':'Time do Coração'} (opcional)</label><input className="field" value={manualExtra} onChange={e=>setManualExtra(e.target.value)} placeholder={rule.extra==='month'?'Janeiro':'Clube selecionado'}/></div>:null}</div>}
        <div><label className="field-label">Número do concurso a conferir</label><input className="field" type="number" min="1" step="1" value={contest} onChange={e=>setContest(e.target.value)} placeholder="Ex: 3076"/></div>
        <label className="flex items-start gap-3 note cursor-pointer"><input className="mt-1 accent-emerald-400" type="checkbox" checked={manualDrawMode} onChange={e=>setManualDrawMode(e.target.checked)}/><span className="text-sm"><strong>Informar resultado manualmente</strong><span className="muted block text-xs mt-1">Use se a Caixa estiver indisponível. Mostra acertos, mas não declara premiação em reais sem rateio verificado.</span></span></label>
        {manualDrawMode&&<div className="space-y-3"><div><label className="field-label">Dezenas sorteadas (na ordem das colunas para Super Sete)</label><textarea className="field prize-textarea" rows={2} value={manualNumbers} onChange={e=>setManualNumbers(e.target.value)} placeholder="Dezenas do resultado do concurso"/></div>{lottery==='duplasena'&&<div><label className="field-label">Segundo sorteio</label><input className="field" value={manualSecond} onChange={e=>setManualSecond(e.target.value)}/></div>}{['diadesorte','timemania'].includes(lottery)&&<div><label className="field-label">Complemento do resultado (opcional)</label><input className="field" value={resultExtra} onChange={e=>setResultExtra(e.target.value)}/></div>}</div>}
        {message&&<div role="alert" className="note warning-note"><AlertTriangle size={17} className="inline mr-2"/>{message}</div>}
        <button type="button" disabled={busy} onClick={run} className="btn btn-primary w-full flex justify-center items-center gap-2"><ClipboardCheck size={18}/>{busy?'Conferindo concurso...':'Conferir meus jogos'}<ChevronRight size={17}/></button>
      </section>
      <section className="glass card">
        <div className="flex items-center justify-between gap-3 mb-4"><h3 className="font-bold text-lg">Resultado da conferência</h3>{report&&<span className="text-xs muted">Concurso {report.contest}</span>}</div>
        {!report?<div className="h-full min-h-[240px] flex flex-col justify-center text-center items-center gap-3"><ShieldCheck size={39} className="text-emerald-400/60"/><h3 className="font-bold">Pronto para conferir</h3><p className="muted max-w-sm text-sm">Selecione seus jogos e o concurso. Os acertos e valores só aparecem após receber ou informar o resultado.</p></div>:<div aria-live="polite" className="space-y-4">
          <div className="rounded-xl prize-summary p-4"><div className="eyebrow gold-text">{report.paidTickets>0?'FAIXAS DE ACERTO IDENTIFICADAS':'CONFERÊNCIA CONCLUÍDA'}</div><div className="text-3xl font-black mt-2">{report.confirmedTotal===null?'Valor indisponível':brl(report.confirmedTotal)}</div><p className="text-sm mt-1 muted">{report.paidTickets} de {report.checked} jogos atingiram alguma faixa · {report.contest}</p><p className="text-xs mt-2 muted">{result?.source}{stale?' · Resultado recuperado do cache':''}</p></div>
          <div className="rounded-xl p-3 bg-black/20"><div className="eyebrow mb-2">DEZENAS DO CONCURSO</div><div className="flex flex-wrap gap-1.5">{result?.numbers.map((n,i)=><span className="result-ball" key={i}>{pad(n)}</span>)}</div>{result?.secondNumbers&&<div className="mt-3"><div className="eyebrow mb-2">SEGUNDO SORTEIO</div><div className="flex flex-wrap gap-1.5">{result.secondNumbers.map((n,i)=><span className="result-ball" key={i}>{pad(n)}</span>)}</div></div>}</div>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">{report.entries.map(e=><div key={e.index} className="rounded-xl border border-white/10 bg-black/10 p-3"><div className="flex justify-between items-start gap-2"><div className="font-bold text-sm">Jogo {String(e.index).padStart(2,'0')} <span className="muted font-normal">· {e.hits} acertos{e.secondHits!==null?` / ${e.secondHits} no 2º sorteio`:''}</span></div><span className={`text-xs font-bold ${e.awards.length?'text-amber-300':'muted'}`}>{e.awards.length?(e.pendingPayout?'Prêmio a confirmar':brl(e.amount||0)):'Sem faixa premiada'}</span></div><div className="flex flex-wrap gap-1.5 mt-2">{e.selected.map((n,i)=><span key={i} className={`numberball tiny ${result?.lottery==='supersete'?n===result.numbers[i]?'lit':'':e.matched.includes(n)?'lit':''}`}>{pad(n)}</span>)}</div>{e.awards.length>0&&<div className="mt-2 text-xs text-emerald-100/85">{e.awards.map((a,i)=><div key={i}>{a.quantity} × {a.label} — {a.subtotal===null?'rateio indisponível':brl(a.subtotal)}</div>)}</div>}</div>)}</div>
          <div className="note text-xs">{report.note} {report.source.includes('manualmente')?'Confira as dezenas e o número do concurso no resultado oficial antes de considerar o jogo premiado.':'O valor mostrado é estimativa de conferência com base no rateio publicado, sujeita à validação do bilhete original pela Caixa.'}</div>
        </div>}
      </section>
    </div>
    <div className="note text-xs flex gap-2"><ShieldCheck size={19} className="shrink-0"/><span>O LottoMind AI não realiza apostas, não autentica bilhetes e não efetua pagamento. Premiação de concursos históricos só é mostrada quando existe rateio publicado para o concurso específico. Apostas simples e múltiplas são conferidas conforme as faixas disponíveis na modalidade.</span></div>
  </div>;
}
