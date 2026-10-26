import {NextRequest,NextResponse} from 'next/server';
import {fetchCaixa} from '@/lib/caixa';
import {db,upsertDraw,logSync} from '@/lib/db';
import {LOTTERY_KEYS,isLottery} from '@/lib/rules';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=60;
async function handle(req:NextRequest){
  const secret=process.env.CRON_SECRET;
  if(!secret||secret.length<16||req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Não autorizado'},{status:401});
  if(!db())return NextResponse.json({error:'DATABASE_URL não configurada'},{status:503});
  const param=req.nextUrl.searchParams.get('lottery');
  if(param&&!isLottery(param))return NextResponse.json({error:'Modalidade inválida'},{status:400});
  const games=param?[param as typeof LOTTERY_KEYS[number]]:[...LOTTERY_KEYS];
  const output=[];
  for(const game of games){let saved=0,failures=0,err='';
    try{
      const latest=await fetchCaixa(game);
      const last=await db()!.draw.findFirst({where:{lottery:game},orderBy:{contest:'desc'},select:{contest:true}});
      // Limita a carga por chamada e mantém idempotência. Backfill completo: script CLI.
      const missing=last?Math.min(5,Math.max(0,latest.contest-last.contest)):8;
      const ids=Array.from({length:missing},(_,i)=>latest.contest-i-1).filter(n=>n>0);
      await upsertDraw(latest);saved++;
      for(const id of ids){try{await upsertDraw(await fetchCaixa(game,id));saved++;}catch{failures++;}}
      await logSync(game,failures?'partial':'ok',saved,`Último ${latest.contest}; falhas ${failures}`);
    }catch(e){err=e instanceof Error?e.message:String(e);await logSync(game,'error',0,err);}
    output.push({lottery:game,saved,failures,error:err||undefined});
  }
  return NextResponse.json({at:new Date().toISOString(),results:output});
}
export async function GET(req:NextRequest){return handle(req)}
export async function POST(req:NextRequest){return handle(req)}
