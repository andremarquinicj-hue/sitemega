'use client';
import {useEffect} from 'react';
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error('Erro de interface LottoMind:',error)},[error]);
  return <main className="min-h-screen flex items-center justify-center p-6 bg-[#080f20] text-slate-100"><div className="glass card max-w-lg text-center"><h1 className="text-2xl font-extrabold mb-3">Não foi possível abrir esta página</h1><p className="muted mb-5">Ocorreu uma falha inesperada na interface. Seus jogos salvos localmente não foram apagados.</p><button className="btn btn-primary" onClick={reset}>Tentar novamente</button></div></main>;
}
