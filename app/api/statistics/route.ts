import {NextRequest,NextResponse} from 'next/server';
import {getAnalysisHistory} from '@/lib/data';
import {buildStatisticalReport} from '@/lib/statistics';
import {isLottery,RULES} from '@/lib/rules';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request:NextRequest){
  const lottery=request.nextUrl.searchParams.get('lottery')||'megasena';
  if(!isLottery(lottery))return NextResponse.json({error:'Modalidade inválida'},{status:400});
  try{
    const result=await getAnalysisHistory(lottery);
    return NextResponse.json({status:result.status,persistent:result.persistent,
      origin:result.origin,completeScan:result.completeScan,error:result.error??null,
      report:buildStatisticalReport(result.draws,RULES[lottery])},
      {headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=600'}});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Falha no relatório histórico'},{status:503});}
}
