import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'LottoMind AI | Laboratório de Loterias',description:'Análise estatística auditável de loterias brasileiras. Sem promessas de previsão.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
