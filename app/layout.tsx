import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'LottoMind AI | Inteligência em Loterias',description:'Análise estatística e conferência de loterias brasileiras, com prêmios auditáveis e sem promessas de previsão.',applicationName:'LottoMind AI',appleWebApp:{capable:true,title:'LottoMind AI',statusBarStyle:'black-translucent'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#0d3925'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
