'use client';
import {useEffect,useMemo,useState} from 'react';
import {Activity,AlertTriangle,ArrowRight,CalendarDays,Flame,Info,RefreshCw,ShieldCheck,Snowflake,Target,Wallet} from 'lucide-react';
import {budgetCoverage,RadarReport} from '@/lib/advisor';
import {LotteryKey,RULES,Strategy,STRATEGIES} from '@/lib/rules';

type Payload={radar:RadarReport;status:'online'|'cached'|'unavailable';error:string|null;persistent:boolean};
const brl=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const f=(value:number,digits=2)=>value.toLocaleString('pt-BR',{maximumFractionDigits:digits});
function NumChip({value}:{value:number}){return <span className="numberball tiny" title={`Dezena ${value}`}>{String(value).padStart(2,'0')}</span>}
export default function DailyRadar({lottery,refresh,onUseStrategy}:{lottery:LotteryKey;refresh:number;onUseStrategy:(strategy:Strategy)=>void}){
  const [payload,setPayload]=useState<Payload|null>(null);
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState('');
  const [budget,setBudget]=useState(50);
  const rule=RULES[lottery];
  const coverage=useMemo(()=>budgetCoverage(rule,budget),[rule,budget]);
  useEffect(()=>{
    let active=true;setBusy(true);setError('');setPayload(null);
    fetch(`/api/advisor?lottery=${lottery}&v=${refresh}`)
      .then(async response=>{const json=await response.json();if(!response.ok)throw Error(json.error||'Falha ao analisar resultados');return json as Payload})
      .then(data=>{if(active)setPayload(data)})
      .catch(e=>{if(active)setError(e instanceof Error?e.message:'Fonte indisponível')})
      .finally(()=>{if(active)setBusy(false)});
    return ()=>{active=false};
  },[lottery,refresh]);
  const radar=payload?.radar;
  return <section className="space-y-5" aria-label="Radar diário de estratégias">
    <div className="glass card radar-hero">
      <div className="flex gap-3 items-start justify-between flex-wrap">
        <div className="flex items-start gap-3"><span className="p-3 rounded-xl bg-emerald-400/15 text-emerald-300"><Activity size={24}/></span><div><div className="eyebrow text-amber-200">RADAR DIÁRIO · LOTTO MIND AI</div><h2 className="page-title gradient-text mt-1">Estratégias e tendências observadas</h2><p className="muted text-sm mt-2 max-w-2xl">Nova leitura a cada concurso validado, com teste temporal das estratégias e recomendações baseadas em cobertura — não em previsões sem evidências.</p></div></div>
        {busy?<span className="rounded-full text-xs bg-amber-300/10 text-amber-200 px-3 py-2 flex gap-2 items-center"><RefreshCw size={13} className="animate-spin"/> Analisando...</span>:<span className={`rounded-full text-xs px-3 py-2 ${payload?.status==='online'?'bg-emerald-400/10 text-emerald-300':'bg-amber-400/10 text-amber-200'}`}>{payload?.status==='online'?'Fonte consultada':payload?.status==='cached'?'Histórico em cache':'Dados não disponíveis'}</span>}
      </div>
      {radar?.analyzedContest&&<div className="flex gap-2 flex-wrap mt-5 text-xs"><span className="radar-meta"><CalendarDays size={14}/> Último concurso analisado: #{radar.analyzedContest}</span><span className="radar-meta">Data: {radar.contestDate}</span><span className="radar-meta">Concursos válidos: {radar.observations}</span><span className="radar-meta">Fonte: {radar.latestSource||'Não identificada'}</span></div>}
      {payload?.error&&<p className="warning-note note mt-4">A fonte apresentou problema: {payload.error}. A análise foi baseada apenas nos resultados disponíveis.</p>}
    </div>
    {error&&<div className="note warning-note flex items-start gap-2"><AlertTriangle size={18} className="shrink-0"/>{error}. Verifique a conexão e a sincronização do histórico.</div>}
    {!busy&&!radar&&!error&&<div className="note">Ainda não existe histórico válido para esta modalidade.</div>}
    {radar&&<>
      {radar.sampleStatus==='unavailable'?<div className="note warning-note">Nenhum concurso validado. A recomendação é conservadora e não depende de números fictícios.</div>:<>
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4">
          <div className="glass card radar-recommendation"><div className="eyebrow text-amber-200">MELHOR ESCOLHA POR CRITÉRIO MATEMÁTICO</div><h3 className="text-xl font-extrabold mt-2 flex items-center gap-2"><ShieldCheck className="text-emerald-300" size={22}/>{radar.recommendationTitle}</h3><p className="text-sm leading-relaxed text-emerald-50/85 mt-3">{radar.recommendationReason}</p><div className="rounded-lg border border-emerald-400/20 px-3 py-2 text-xs text-emerald-200/80 mt-4">A recomendação vale para organização e cobertura do conjunto. As dezenas não se tornam mais prováveis por terem saído recentemente.</div><button className="btn btn-primary mt-4 w-full sm:w-auto flex gap-2 justify-center items-center" onClick={()=>onUseStrategy(radar.recommendation)}>Abrir gerador com esta estratégia <ArrowRight size={16}/></button></div>
          <div className="glass card"><div className="eyebrow">SITUAÇÃO DA AMOSTRA</div><h3 className="text-lg font-bold mt-2">{radar.sampleStatus==='adequate'?'Histórico suficiente para análise exploratória':'Histórico limitado'}</h3><p className="muted mt-3 text-sm">{radar.observations} concursos disponíveis; {radar.testedDraws} concursos fora do treino. O backtest usa apenas concursos anteriores a cada aposta simulada.</p>{radar.repeatLast!==null&&<div className="mt-4 pt-3 border-t border-emerald-700/30"><div className="text-sm font-bold">Repetição no último sorteio</div><p className="text-sm muted mt-1">{radar.repeatLast} dezena(s) repetidas · referência aleatória média: {f(radar.expectedRepeats??0)}</p></div>}<div className="flex gap-2 items-start mt-4 text-amber-100 text-xs"><Info size={15} className="shrink-0"/> Repetição, Fibonacci ou atraso não dão vantagem automática no próximo concurso.</div></div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="glass card"><div className="flex items-center gap-2"><Flame size={20} className="text-orange-300"/><h3 className="text-lg font-bold">Dezenas quentes</h3></div><p className="muted text-sm mt-2 mb-4">Maior frequência observada nos últimos {radar.frequencyWindow} concursos. <b>Não são mais prováveis no próximo sorteio.</b></p><div className="flex gap-2 flex-wrap">{radar.hot.map(n=><div key={n.number} className="radar-number-card"><NumChip value={n.number}/><span className="text-[11px] text-center mt-1">{n.appearances}×</span><span className="text-[10px] muted">esp. {f(n.expected,1)}</span></div>)}</div></div>
          <div className="glass card"><div className="flex items-center gap-2"><Snowflake size={20} className="text-sky-300"/><h3 className="text-lg font-bold">Dezenas frias</h3></div><p className="muted text-sm mt-2 mb-4">Menor frequência observada na mesma janela. <b>Não são menos prováveis no próximo sorteio.</b></p><div className="flex gap-2 flex-wrap">{radar.cold.map(n=><div key={n.number} className="radar-number-card"><NumChip value={n.number}/><span className="text-[11px] text-center mt-1">{n.appearances}×</span><span className="text-[10px] muted">esp. {f(n.expected,1)}</span></div>)}</div></div>
        </div>
        <div className="glass card"><div className="eyebrow">DESEMPENHO WALK-FORWARD · 1 APOSTA SIMPLES POR CONCURSO</div><h3 className="text-xl font-bold mt-2">Qual estratégia acertou mais no passado?</h3><p className="muted text-sm mt-2 mb-4">O algoritmo gera um jogo usando somente o histórico anterior ao concurso testado. A comparação é com a média teórica aleatória, de mesmo custo. O primeiro lugar é apenas um resultado histórico, não a melhor previsão.</p>
        {radar.strategyEvidence.length?<div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Estratégia</th><th>Concursos</th><th>Média de acertos</th><th>Referência do acaso</th><th>Diferença</th><th>Leitura</th></tr></thead><tbody>{radar.strategyEvidence.map(s=><tr key={s.strategy}><td><div className="font-semibold">{s.label}</div><span className="muted text-[10px]">{s.category}</span></td><td>{s.evaluated}</td><td>{f(s.meanHits,3)}</td><td>{f(s.expectedHits,3)}</td><td className={s.difference>=0?'text-emerald-200':'text-amber-200'}>{s.difference>=0?'+':''}{f(s.difference,3)}</td><td className="text-xs muted max-w-[240px] whitespace-normal">{s.interpretation}</td></tr>)}</tbody></table></div>:<div className="note warning-note">Histórico insuficiente para testar temporalmente as estratégias. São necessários pelo menos 31 concursos válidos e 30 concursos iniciais de treinamento. Não mostramos ranking inventado.</div>}
        <div className="mt-4 flex flex-wrap gap-2 items-center"><span className="muted text-xs mr-2">Experimentar no gerador:</span><button className="btn btn-secondary text-xs" onClick={()=>onUseStrategy('frequency')}>Frequências quentes</button><button className="btn btn-secondary text-xs" onClick={()=>onUseStrategy('delay')}>Dezenas atrasadas</button><button className="btn btn-secondary text-xs" onClick={()=>onUseStrategy('fibonacci')}>Fibonacci</button>{radar.hindsightLeader&&<button className="btn btn-secondary text-xs" onClick={()=>onUseStrategy(radar.hindsightLeader!)}>Líder histórico: {STRATEGIES.find(s=>s.id===radar.hindsightLeader)?.label}</button>}</div><p className="muted text-xs mt-3">Esses botões selecionam filtros experimentais, não geram automaticamente apostas pagas. Não exclua dezenas frias acreditando que tenham menos chance futura.</p>
        <p className="muted text-xs mt-4">Margem teórica de 95% para a média sob sorteio justo: ±{f(radar.strategyEvidence[0]?.uncertainty95??0,3)} acertos por jogo, quando há teste. Foram comparadas até 6 metodologias; resultados escolhidos retrospectivamente estão sujeitos a múltiplas comparações.</p></div>
      </>}
      <div className="glass card"><div className="flex items-start gap-3"><Wallet size={22} className="text-amber-200 shrink-0"/><div><h3 className="text-xl font-bold">Se eu investir este valor, o que muda?</h3><p className="muted text-sm mt-1">Cálculo teórico para jogos simples distintos; não altera a chance individual das dezenas.</p></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] gap-4 items-end mt-5"><label className="text-sm">Orçamento máximo (R$)<input className="field mt-2 w-full" aria-label="Orçamento máximo em reais" type="number" min="0" max="1000000" step="1" value={budget} onChange={e=>setBudget(Math.max(0,Math.min(1000000,Number(e.target.value)||0)))}/></label><div className="radar-kpi"><span className="muted text-xs">Apostas simples possíveis</span><strong className="text-xl">{f(coverage.games,0)}</strong></div><div className="radar-kpi"><span className="muted text-xs">Custo total estimado</span><strong className="text-xl">{brl(coverage.cost)}</strong></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4"><div className="radar-kpi"><span className="muted text-xs">Probabilidade de prêmio principal (conjunto)</span><strong className="text-base">{coverage.oneIn?`1 em ${f(Math.round(coverage.oneIn),0)}`:'Não calculada nesta modalidade'}</strong></div><div className="radar-kpi"><span className="muted text-xs">Saldo não utilizado</span><strong className="text-base">{brl(coverage.change)}</strong></div></div>
        <div className="note mt-4">{coverage.note} Os preços configurados devem ser verificados junto à Caixa antes de apostar. A plataforma não recomenda aumentar gastos para recuperar perdas.</div>
      </div>
      <div className="note flex gap-3 items-start"><Target size={20} className="shrink-0 mt-0.5 text-amber-200"/><div><b>Conclusão científica:</b> números quentes, frios e padrões de Fibonacci são observações recreativas. Num sorteio íntegro, cada combinação tem a mesma probabilidade. O Radar recomenda reduzir redundância entre os jogos, não tentar prever o próximo resultado. {radar.sampleStatus==='limited'?'A base atual é pequena para conclusões robustas.':''}</div></div>
    </>}
  </section>;
}
