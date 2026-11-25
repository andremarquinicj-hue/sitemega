import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {buildRadar} from '@/lib/advisor';
import {getAnalysisHistory} from '@/lib/data';
import {generate} from '@/lib/math';
import {megaBatch} from '@/lib/v2-generator';
import {analyzeMegaPortfolio,budgetScenario} from '@/lib/v2-coverage';
import {RULES,isLottery} from '@/lib/rules';
export const runtime='nodejs';
export const maxDuration=60;
export const dynamic='force-dynamic';
const payload=z.object({lottery:z.literal('megasena'),budget:z.number().finite().min(6).max(1000000),
  participants:z.number().int().min(1).max(1000),strategy:z.enum(['random','balanced','frequency','delay','diversity','fibonacci','numerology']),
  goal:z.enum(['sena','quadra','quina']).default('quadra')});
export async function GET(request:NextRequest){
  const lottery=request.nextUrl.searchParams.get('lottery')||'megasena';
  if(!isLottery(lottery))return NextResponse.json({error:'Modalidade inválida'},{status:400});
  try{
    const result=await getAnalysisHistory(lottery);
    const radar=buildRadar(result.draws,RULES[lottery]);
    const contests=[...result.draws].sort((a,b)=>a.contest-b.contest);
    const missing=contests.reduce((n,d,i)=>n+(i&&d.contest-contests[i-1].contest>1?d.contest-contests[i-1].contest-1:0),0);
    return NextResponse.json({status:result.status,persistent:result.persistent,error:result.error??null,radar,
      draws:result.draws.slice(0,500),history:{count:contests.length,first:contests[0]?.contest??null,last:contests.at(-1)?.contest??null,missing,
        displayed:Math.min(result.draws.length,500),origin:result.origin,completeScan:result.completeScan},
      lastFetchedAt:result.lastSync??null},{headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=300'}});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Falha no radar'},{status:503})}
}
export async function POST(request:NextRequest){
  let body:unknown;
  try{body=await request.json()}catch{return NextResponse.json({error:'JSON inválido'},{status:400})}
  const parsed=payload.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:'Dados inválidos',details:parsed.error.flatten()},{status:400});
  try{
    const {budget,participants,strategy,goal,lottery}=parsed.data;
    const plan=budgetScenario(budget,participants);
    if(plan.games>500||(plan.games>100&&!(['random','diversity'] as string[]).includes(strategy)))return NextResponse.json({plan,coverage:null,tickets:[],
      limitation:'Acima de 500 jogos, ou acima de 100 em estratégias experimentais, o simulador mostra a chance exata da Sena e limites matemáticos para quadra/quina. A análise exata das faixas secundárias exige o conjunto completo das apostas; esta tela não gera automaticamente milhares de bilhetes.'});
    const usesHistory=strategy==='frequency'||strategy==='delay'||strategy==='balanced';
    const recent=usesHistory?await getAnalysisHistory(lottery):null;
    if(usesHistory&&(!recent||recent.draws.length<30))return NextResponse.json({error:'Estratégia histórica exige pelo menos 30 concursos válidos. Use Aleatório ou Máxima Diversidade até sincronizar o histórico.'},{status:422});
    const tickets=plan.games>100?megaBatch(plan.games,goal,strategy as 'random'|'diversity'):generate({rule:RULES[lottery],strategy,count:plan.games,pick:6,budget,history:recent?.draws??[],diversityGoal:goal}).tickets;
    const coverage=analyzeMegaPortfolio(tickets);
    return NextResponse.json({plan,coverage,tickets,
      sourceContest:recent?.draws[0]?.contest??null,
      sourceStatus:recent?.status??'não consultado para esta estratégia',sourceCount:recent?.draws.length??0,
      methodology:'Jogo gerado por heurística escolhida; cálculo combinatório não afirma que dezenas históricas sejam mais prováveis.'});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro no simulador'},{status:422})}
}
