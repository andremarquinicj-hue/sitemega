# Plano de testes e evidências disponíveis

## Testes automatizados incluídos

- `tests/math.test.ts`: identidade das combinações, probabilidades exatas, soma das distribuições, precificação de apostas ampliadas, regras especiais, integridade do gerador, orçamento, filtros, fechamento completo e backtesting reproduzível.
- `tests/caixa.test.ts`: exemplos estáticos de payload da fonte Caixa (não requer rede); validação de concursos, data e segundo sorteio.
- `tests/api.test.ts`: status HTTP e validação de parâmetros de resultados, gerador e backtest.
- `tests/sync.test.ts`: cron negado sem credenciais.

## Evidências realmente executadas no ambiente de desenvolvimento

- `tsc --module commonjs --target es2022 --strict --skipLibCheck --noEmit lib/math.ts lib/rules.ts` — **concluiu sem erros**, compilação tipada isolada de probabilidades, regras, gerador e backtest.
- Compilação para CommonJS (`tsc ... --outDir /tmp/lottomind-compiled`) e execução com Node 22 — **concluiu**. Verificação de probabilidades e distribuições produzidas:

| Modalidade | 1 em (faixa principal da aposta mínima) | Soma das probabilidades |
|---|---:|---:|
| Mega-Sena | 50.063.860 | 1,000000 |
| Quina | 24.040.016 | 1,000000 |
| Lotofácil | 3.268.760 | ~1,000000 |
| Dia de Sorte | 2.629.575 | ~1,000000 |
| Dupla Sena (1 sorteio) | 15.890.700 | 1,000000 |
| Lotomania | 11.372.636 (arredondado) | 1,000000 |
| Timemania (7 números) | 26.472.637 | 1,000000 |
| Super Sete | 10.000.000 | ~1,000000 |

- Fechamento completo de 7 dezenas na Mega-Sena: **7 apostas produzidas**.
- Foram executadas **56 gerações de conjuntos**: 7 estratégias × 8 modalidades, com 5 apostas por conjunto, validação de integridade e de orçamento, todas com êxito.
- Walk-forward com dados artificiais **somente para teste**: rotina executou 10 concursos em cada uma das 8 modalidades (80 avaliações), sem erros. Esses dados jamais alimentam a interface em produção.
- O Web Worker Monte Carlo foi compilado isoladamente e executado em Node com 10.000 sorteios reais de simulação: resultado final `done:true` e soma das frequências igual a 10.000.
- A normalização de payload realista da Caixa e a rejeição de duplicidade foram executadas com Node: **aprovadas**.
- Arquivos TypeScript/TSX submetidos ao `typescript.transpileModule` para diagnóstico sintático: **22 arquivos verificados sem erros** no momento da execução (antes da adição do `app/error.tsx` e `app/loading.tsx`, que também foram verificados depois).

## Testes ainda não executados

**O registro npm estava indisponível (`EAI_AGAIN registry.npmjs.org`).** Não foi possível instalar Next.js, React, Prisma, Vitest, Recharts e demais dependências para executar `npm test`, `npm run lint`, `npm run build` ou abrir o sistema no navegador nesta sessão. Portanto, **nenhum teste end-to-end, build de produção ou deploy foi aprovado**. É possível que ajustes de build e tipos ainda sejam necessários após instalação das dependências.

## Validação obrigatória após extrair

1. `npm install` (com internet funcionando).
2. `npx prisma generate`.
3. `npm run lint` — corrigir qualquer erro restante no aplicativo completo.
4. `npm test` — todos os testes devem passar; verificar mocks para cron e API.
5. `npm run build` — deve compilar sem erros.
6. `npm run dev` — navegar por 8 modalidades no celular e computador; conferir dados reais, sem valores inventados.
7. Configurar PostgreSQL e `npm run db:migrate`; executar `npm run import:history -- --game=megasena --limit=50`, executar novamente e conferir ausência de duplicatas.
8. Temporariamente interromper acesso à Caixa e verificar que o último resultado salvo é exibido como cache, não como "online".
9. Chamar `/api/sync` sem autorização e conferir HTTP 401; com `CRON_SECRET` válido conferir gravação e logs.
10. Gerar jogos acima e abaixo do orçamento, rejeitar entradas inválidas, salvar, atualizar página, conferir apostas e apagar todos os conjuntos, confirmar armazenamento atualizado.
11. Executar 10k / 100k / 1M no Web Worker, testar responsividade e cancelamento/encerramento ao sair da página.
12. Rodar o backtest de estratégias distintas e comparar o número de concursos, investimento e dados ausentes.
