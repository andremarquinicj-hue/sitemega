import {NextRequest,NextResponse} from 'next/server';
import {getResults} from '@/lib/data';import {backtest} from '@/lib/math';import {isLottery,RULES,STRATEGIES,Strategy} from '@/lib/rules';
export const runtime='nodejs';export const maxDuration=60;
export async function POST(req:NextRequest){
  try{
    const payload:unknown=await req.json();if(!payload||typeof payload!=='object')return NextResponse.json({error:'JSON inválido'},{status:400});
    const v=payload as Record<string,unknown>,game=v.lottery,strategy=v.strategy,count=v.count;
    if(typeof game!=='string'||!isLottery(game)||typeof strategy!=='string'||!STRATEGIES.some(s=>s.id===strategy)||typeof count!=='number'||!Number.isInteger(count)||count<1||count>300)return NextResponse.json({error:'Parâmetros inválidos'},{status:400});
    const {draws}=await getResults(game,Math.min(500,count+60));
    return NextResponse.json(backtest(RULES[game],draws,strategy as Strategy,count));
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro desconhecido'},{status:400});}
}
