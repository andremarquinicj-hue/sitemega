import { PrismaClient } from '@prisma/client';
import {Draw,LotteryKey} from './rules';
const globalPrisma=globalThis as unknown as {lottoDb?:PrismaClient};
export function db():PrismaClient|null {
  if(!process.env.DATABASE_URL)return null;
  if(!globalPrisma.lottoDb)globalPrisma.lottoDb=new PrismaClient();
  return globalPrisma.lottoDb;
}
export async function upsertDraw(d:Draw){
  const client=db();if(!client)return false;
  const data={lottery:d.lottery,contest:d.contest,date:new Date(`${d.date}T12:00:00Z`),nextDate:d.nextDate?new Date(`${d.nextDate}T12:00:00Z`):null,numbers:d.numbers,secondNumbers:d.secondNumbers??undefined,extra:d.extra,prizeEstimate:d.prizeEstimate,payouts:d.payouts,source:d.source,fetchedAt:new Date(d.fetchedAt)};
  await client.draw.upsert({where:{id:`${d.lottery}-${d.contest}`},create:{id:`${d.lottery}-${d.contest}`,...data},update:data});return true;
}
export async function readDb(lottery:LotteryKey,limit:number):Promise<Draw[]>{
  const client=db();if(!client)return [];
  const rows=await client.draw.findMany({where:{lottery},orderBy:{contest:'desc'},take:limit});
  return rows.map(r=>({lottery,contest:r.contest,date:r.date.toISOString().slice(0,10),nextDate:r.nextDate?.toISOString().slice(0,10)||null,numbers:r.numbers as number[],secondNumbers:r.secondNumbers as number[]|null,extra:r.extra,prizeEstimate:r.prizeEstimate,payouts:(r.payouts||[]) as Draw['payouts'],source:r.source,fetchedAt:r.fetchedAt.toISOString()}));
}
export async function logSync(lottery:LotteryKey,status:string,count:number,details:string){
  try{await db()?.syncRun.create({data:{lottery,status,count,details:details.slice(0,1500)}});}catch(err){console.error('Erro logSync:',err)}
}
