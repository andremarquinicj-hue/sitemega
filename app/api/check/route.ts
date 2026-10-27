import {NextRequest,NextResponse} from 'next/server';
import {fetchCaixa} from '@/lib/caixa';
import {readDb} from '@/lib/db';
import {isLottery} from '@/lib/rules';
export const runtime='nodejs';export const maxDuration=60;
export async function GET(req:NextRequest){
  const game=req.nextUrl.searchParams.get('lottery')||'';
  const id=req.nextUrl.searchParams.get('contest')||'';
  if(!isLottery(game)||!/^\d{1,6}$/.test(id)||Number(id)<1)return NextResponse.json({error:'Modalidade ou concurso inválido'},{status:400});
  const contest=Number(id);
  try{
    const draw=await fetchCaixa(game,contest);
    if(draw.contest!==contest)return NextResponse.json({error:'A fonte retornou outro concurso'},{status:502});
    return NextResponse.json({draw},{headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=600'}});
  }catch(e){
    const sourceError=e instanceof Error?e.message:'Fonte indisponível';
    try{
      const cached=(await readDb(game,500)).find(x=>x.contest===contest);
      if(cached)return NextResponse.json({draw:cached,cached:true,error:sourceError},{headers:{'Cache-Control':'private, no-cache'}});
    }catch{/* Banco também pode estar indisponível */}
    return NextResponse.json({error:`Não foi possível obter o resultado ${contest} por uma fonte confiável. ${sourceError}`},{status:503});
  }
}
