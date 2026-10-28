import {NextRequest,NextResponse} from 'next/server';
import {getResults} from '@/lib/data';
import {buildRadar} from '@/lib/advisor';
import {isLottery,RULES} from '@/lib/rules';
export const runtime='nodejs';export const maxDuration=60;
export async function GET(request:NextRequest){
  const game=request.nextUrl.searchParams.get('lottery')||'megasena';
  if(!isLottery(game))return NextResponse.json({error:'Modalidade inválida'},{status:400});
  try{
    const data=await getResults(game,220);
    const radar=buildRadar(data.draws,RULES[game]);
    return NextResponse.json({radar,status:data.status,error:data.error??null,persistent:data.persistent},
      {headers:{'Cache-Control':'public, s-maxage=900, stale-while-revalidate=900'}});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Falha na análise'},{status:503});}
}
