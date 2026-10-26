import {NextResponse} from 'next/server';
export async function GET(){return NextResponse.json({ok:true,service:'LottoMind AI',timestamp:new Date().toISOString()});}
