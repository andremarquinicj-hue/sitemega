# Atualizar `sitemega` para LottoMind AI 2.0.1 — Histórico completo

1. Faça backup do seu projeto atual. **Não exclua o banco Neon nem o repositório.**
2. Baixe `LottoMind_AI_2_0_1_Historico_Completo.zip` (projeto inteiro) ou `LottoMind_AI_2_0_1_Somente_Atualizacao.zip` (arquivos modificados).
3. No GitHub [`andremarquinicj-hue/sitemega`](https://github.com/andremarquinicj-hue/sitemega), de preferência crie uma branch para testar. Envie os **arquivos extraídos**, mantendo os caminhos `app/`, `lib/`, `components/`, `scripts/`, `tests/` e `docs/`. Não carregue somente o ZIP.
4. **Não envie seu `.env`, senhas nem `node_modules`.** A variável `DATABASE_URL` do Neon já está na Vercel; preserve o valor e `CRON_SECRET`. Não precisa recriar o banco, nem aplicar migrações nesta atualização.
5. O pacote completo já inclui o `scripts/import-history.ts` resiliente usado na correção de P1017/P1001. Se sua cópia local tiver personalizações adicionais, compare antes de substituir esse arquivo.
6. Execute localmente, ou confirme nos logs de build da Vercel:

   ```powershell
   npm.cmd install
   npx.cmd prisma generate
   npm.cmd run lint
   npm.cmd test
   npm.cmd run build
   ```

   Se o PowerShell bloquear `npm.ps1`, use `npm.cmd` como acima. **Não use `npm audit fix --force`** sem avaliar as mudanças incompatíveis; faça auditoria de dependências antes de abrir ao público.
7. Faça commit das alterações, espere um novo deploy e teste os endpoints (sem expor segredos):

   - `/api/statistics?lottery=megasena` → `report.historicalDraws`, `windows.all.observed`, `windows["500"].observed`.
   - `/api/statistics?lottery=lotofacil` → mesma verificação.
   - `/api/advisor?lottery=megasena` → `radar.observations` e `radar.testedDraws`.
   - `/api/lab?lottery=megasena` → `history.count` é o total disponível; `draws` retorna **até 500** para a interface.
8. Na aba **Análise estatística**, escolha `Todo histórico`. Confira primeiro e último concurso, lacunas e origem `PostgreSQL Neon`. Na aba **Backtesting**, pode testar até 500 concursos. Se aparecer `limited-fallback`, o banco não estava acessível; não interprete a amostra como completa.

**Observação importante:** o código já utiliza o histórico depois da atualização; isso **não significa que o site publicado esteja atualizado antes de fazer deploy**. A aplicação não tem capacidade de prever um sorteio justo: estratégias históricas são heurísticas sem vantagem demonstrada.

**Reversão:** caso falhe a compilação, volte ao commit anterior do GitHub/Vercel e preserve os dados do banco. Consulte `docs/ANALISE_HISTORICO_COMPLETO_2_0_1.md`.
