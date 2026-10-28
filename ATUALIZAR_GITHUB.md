# Atualização do LottoMind AI para v1.3 — Radar Diário

## Antes de enviar

- Guarde uma cópia do repositório atual.
- Faça o download do ZIP completo e **extraia** seu conteúdo.
- Não envie o arquivo ZIP fechado para a raiz do GitHub.

## Atualizar seu repositório `sitemega`

1. Abra o GitHub e navegue até a raiz do repositório.
2. Para atualizar uma versão existente, use GitHub Desktop, o Git local ou
   **Add file → Upload files**, selecionando o conteúdo extraído e mantendo
   a mesma hierarquia (`app`, `components`, `lib`, `tests`, `docs`, `prisma`).
3. Substitua os arquivos existentes quando solicitado. Cuidado: o envio pelo site
   nem sempre exclui arquivos antigos. Não mantenha cópias de `.ts` na raiz
   quando a versão correta pertence a `scripts`, `lib` ou outra pasta.
4. Confirme `Commit changes` na branch conectada à Vercel.
5. Na Vercel, acompanhe o novo deploy e abra **Radar diário**.

## Alterações desta versão

- `lib/advisor.ts` (novo): estatísticas + comparações sem olhar concursos futuros.
- `app/api/advisor/route.ts` (novo): API para dados e recomendações do Radar.
- `components/DailyRadar.tsx` (novo): interface responsiva de tendências,
  orçamento, testes e botões de estratégias.
- `components/Dashboard.tsx`: menu e atalhos do Radar.
- `app/globals.css`: estilos responsivos adicionais.
- `tests/advisor.test.ts` e `tests/advisor-run.ts` (novos): verificações.
- `docs/RADAR_DIARIO_1_3.md`, `README.md`, `package.json` (documentação/versão).

## Ambiente Vercel

A rotina de sincronização do banco continua dependendo de `DATABASE_URL` e
`CRON_SECRET`. O Radar funciona com o último histórico disponível. Para um backtest
de qualidade, faça a importação histórica descrita no `README.md`.

A nova API `/api/advisor` não tem segredo embutido e não precisa de uma variável
ambiente adicional; apenas consulta os resultados já existentes.

## Validação e transparência

O núcleo matemático foi checado por TypeScript rigoroso e testes isolados com
concursos sintéticos (identificados nos testes). Não foi possível executar
`npm install`, `npm test` e o build completo neste ambiente. Use os logs de
Vercel para confirmar a publicação. Não anuncie lucros ou chances especiais
baseadas em frequências passadas.
