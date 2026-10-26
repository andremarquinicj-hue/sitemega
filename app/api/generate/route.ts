import {NextRequest,NextResponse} from 'next/server';
import {getResults} from '@/lib/data';import {generate} from '@/lib/math';import {isLottery,RULES,STRATEGIES,Strategy} from '@/lib/rules';
export const runtime='nodejs';export const maxDuration=60;
export async function POST(req:NextRequest){
  try{
    const payload:unknown=await req.json();
    if(!payload||typeof payload!=='object')return NextResponse.json({error:'JSON inválido'},{status:400});
    const v=payload as Record<string,unknown>;
    const game=v.lottery,strategy=v.strategy;
    if(typeof game!=='string'||!isLottery(game)||typeof strategy!=='string'||!STRATEGIES.some(s=>s.id===strategy))return NextResponse.json({error:'Modalidade/estratégia inválida'},{status:400});
    if(!Array.isArray(v.required)||!Array.isArray(v.excluded)||v.required.length>100||v.excluded.length>100||![...v.required,...v.excluded].every((n:unknown)=>Number.isSafeInteger(n)))return NextResponse.json({error:'Filtros inválidos'},{status:400});
    const {draws}=await getResults(game,100);
    const result=generate({rule:RULES[game],strategy:strategy as Strategy,history:draws,count:Number(v.count),pick:Number(v.pick),budget:Number(v.budget),required:v.required as number[],excluded:v.excluded as number[],extra:typeof v.extra==='string'?v.extra:undefined,poolSize:v.poolSize===undefined?undefined:Number(v.poolSize)});
    return NextResponse.json({...result,historicalDraws:draws.length});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro desconhecido'},{status:400});}
}
