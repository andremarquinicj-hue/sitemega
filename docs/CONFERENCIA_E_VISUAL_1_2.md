# LottoMind AI v1.2 — Motor de prêmios, mobile e análise pós-sorteio

## Operação

A nova seção **Conferir prêmios** recebe conjuntos existentes no armazenamento local ou de 1 a 100 apostas digitadas, uma por linha. O usuário informa a modalidade e **o concurso ao qual a aposta pertence**. `GET /api/check?lottery=...&contest=...` consulta esse concurso e devolve a origem declarada, tentando cache PostgreSQL se os provedores externos falharem. A aplicação rejeita o recebimento de concurso diferente do solicitado. Em caso de total indisponibilidade da fonte, o usuário pode introduzir dezenas sorteadas manualmente, mas **não recebe valor em reais** sem um rateio publicado.

## Categorias

- Mega-Sena: Sena (6), Quina (5), Quadra (4). Apostas de 7 a 20 dezenas são desdobradas matematicamente em categorias de seis números.
- Lotofácil: 15, 14, 13, 12, 11 acertos, com desdobramento de apostas de 16 a 20 números.
- Quina, Dia de Sorte e Dupla Sena: prêmios por quantidade de acertos, desdobrando apostas múltiplas; a Dupla Sena usa as faixas de primeiro e segundo sorteios individualmente.
- Dia de Sorte e Timemania: complemento especial somente se o usuário fornecer o mês/time e o resultado tiver complemento. Sem essas informações, essa premiação não pode ser avaliada.
- Lotomania: 20, 19, 18, 17, 16, 15 ou 0 acertos; não há desdobramento de uma aposta simples.
- Super Sete: compara dígitos por coluna, na ordem, sem tentar eliminar valores repetidos entre colunas.

## Premiação

Cada faixa válida requer valor `> 0`, pelo menos um ganhador e identificação de faixa no resultado retornado. Dados faltantes, premiações especiais não suportadas e divergências na fonte geram **valor indisponível** em vez de `R$ 0,00` estimado. O total somente é calculado quando todos os prêmios identificados possuem valores. A conferência não valida a existência de compra, autenticidade de comprovante, retenções, responsabilidade da Caixa ou direito a prêmio.

Conjuntos salvos antes desta versão não têm `targetContest`; o usuário deve informar o concurso manualmente. Novos conjuntos guardam como *sugestão* o concurso seguinte ao último conhecido; o usuário deve confirmar o concurso do recibo. Não há sincronização entre navegadores.

## Interface

Paleta verde-escuro, esmeralda e dourado sem reproduzir símbolos ou marcas exclusivas da Caixa. Interface responsiva e navegação inferior móvel. O manifesto PWA permite adicionar atalho à tela inicial, mas **não oferece cache offline**. O sistema não instala apps nativos.

## Pós-sorteio

`lib/insights.ts` calcula repetição entre concursos consecutivos, média recente de dezenas pares e referências de amostragem aleatória (incluindo expectativa 9 repetições por sorteio na Lotofácil). Não oferece probabilidades futuras condicionadas a padrões passados, pois em sorteios independentes e equilibrados elas não mudam.

## Testes

`tests/prizes.test.ts` e `tests/insights.test.ts` incluem exemplos sintéticos não reais para validar somas e avisos de rateio. O motor `lib/prizes.ts` e `lib/insights.ts` passaram em TypeScript estrito isolado e em verificações de execução Node. O build completo Next/Vercel não foi testado neste ambiente devido à indisponibilidade das dependências npm; executar `npm ci` (quando houver lockfile) ou `npm install`, `npm run lint`, `npm test` e `npm run build` com acesso à Internet.
