# LottoMind AI — Radar Diário v1.3

## Objetivo

Após cada concurso sincronizado, analisar o histórico validado e oferecer ao usuário
um painel compreensível sobre frequência recente, atrasos, estratégias de geração e
capacidade de cobertura do orçamento — sem inventar probabilidades preditivas.

## Como funciona

1. O processo de sincronização existente (`/api/sync`) obtém novos resultados e os
   persiste em PostgreSQL quando configurado. A implantação exige `DATABASE_URL`
   e `CRON_SECRET` (mínimo de 16 caracteres). A Vercel agenda o job via `vercel.json`,
   sujeito às restrições de plano e disponibilidade da fonte.
2. A rota pública **somente de leitura** `/api/advisor?lottery=lotofacil` ou
   `/api/advisor?lottery=megasena` consulta a base de resultados, remove concursos
   inválidos e repetidos e recalcula o Radar. Cabeçalhos de cache limitam o volume
   de solicitações (15 minutos + stale revalidate).
3. O cliente recarrega o painel ao trocar de modalidade ou solicitar atualização.
   O histórico padrão da tela principal também é revisitado periodicamente.
4. A análise é atualizada quando um concurso novo é confirmado. Não há
   dados ou previsões de preenchimento se a fonte não puder ser consultada.

## Estatísticas diárias

- Universo `N`, quantidade sorteada `d`, janela `w = min(30, concursos disponíveis)`.
- Para modalidade com dezenas sem reposição, probabilidade teórica de uma dezena
  aparecer num sorteio: `p=d/N`. Frequência esperada no período: `w*p`.
- Para Super Sete, dígito em cada coluna tem `p=0,1` e há `7*w` posições na janela.
- 'Quentes' e 'frias' são as maiores/menores **diferenças observadas** entre a
  contagem real e a contagem esperada. Isso NÃO é uma distribuição de chances futuras.
- Maior/menor frequência não altera a chance de sorteios futuros íntegros.

## Comparação dos métodos

São avaliadas seis estratégias: aleatório, equilibrado, frequência histórica,
atraso de dezenas, Fibonacci e numerologia. Com 31+ sorteios:

- Reserva os primeiros 30 sorteios para a etapa inicial de treinamento histórico.
- Avalia até 60 sorteios finais; cada simulação usa **somente os concursos anteriores**.
- Gera 1 jogo simples por concurso e estratégia, com sementes reproduzíveis,
  usando o motor de geração principal. O jogo testado tem o mesmo custo entre métodos.
- Apresenta média de acertos (primeiro sorteio na Dupla Sena), expectativa exata
  de acertos de um jogo contra sorteio uniforme e faixa teórica de 95% para média.
- Estratégia líder do passado é **apenas descritiva**. O teste faz seleção de
  hipóteses múltiplas e não é evidência conclusiva de habilidade preditiva.
- Super Sete mantém análise de dígitos e orçamento, mas não compara estratégias
  no backtest de dezenas comum: o volante usa colunas independentes.

A recomendação fixa de **Máxima diversidade** se refere à cobertura de bilhetes
combinatoriamente diferentes, para mais de um jogo, dentro de um gasto máximo.
Com apenas uma aposta, aleatório uniforme é igualmente adequado. A recomendação
não afirma que uma estratégia mudou a distribuição de sorteios futuros.

## Orçamento

O sistema usa os preços atualmente configurados em `lib/rules.ts` (não são
atualizados automaticamente). Para jogos simples distintos cuja seleção equivale
exatamente à combinação vencedora de uma extração, exibe `jogos/C(N,d)`.
Para modalidades com complementos especiais, duas extrações, apostas que permitem
muitos acertos num único volante, ou cálculos não implementados, omite a probabilidade
agregada em vez de exibir números incorretos.

## Limitações operacionais

- Com o banco desconfigurado, a API tenta buscar histórico recente e pode oferecer
  menos de 31 concursos. Nessa situação o ranking temporal não aparece.
- A análise pode ficar desatualizada se a Caixa ou os provedores alternativos
  bloquearem consultas; o painel informa a origem e estado cache/online.
- Não há modelo de machine learning treinado, identificação de vulnerabilidade
  do equipamento de sorteio, previsão garantida ou pontuação de 'certeza'.
- Os gastos são voluntários e devem permanecer dentro do orçamento estabelecido.

## Testes

- `npm run test:advisor:smoke`: smoke test reproduzível com concursos **sintéticos**
  apenas no ambiente de testes, nunca exibidos como dados de produção.
- `npm test -- tests/advisor.test.ts`: testes de casos sem histórico, frequência,
  atraso, regra de colunas, walk-forward, 8 apostas da Mega-Sena e 14 da Lotofácil.
- `npm run lint` e `npm run build` para validar TypeScript e Next.js em ambiente
  com dependências instaladas.

O teste isolado do núcleo `tsc` pode passar sem garantir que todas as integrações
Web/Prisma funcionem em produção. Verifique o deploy na Vercel antes de anunciar o recurso.
