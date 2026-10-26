import {NextRequest,NextResponse} from 'next/server';
import {getResults} from '@/lib/data';
import {isLottery} from '@/lib/rules';
export const runtime='nodejs'; export const maxDuration=60;
export async function GET(request:NextRequest){
  const game=request.nextUrl.searchParams.get('lottery')||'megasena', raw=Number(request.nextUrl.searchParams.get('limit')||60);
  if(!isLottery(game)||!Number.isInteger(raw)||raw<1||raw>500)return NextResponse.json({error:'Parâmetros inválidos'},{status:400});
  try{return NextResponse.json(await getResults(game,raw),{headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=600'}})}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Falha de consulta'},{status:502});}
}
