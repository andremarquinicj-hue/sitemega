# Como atualizar seu repositório `sitemega` para LottoMind AI 2.0

1. Baixe e **extraia** o ZIP completo no computador.
2. Abra `https://github.com/andremarquinicj-hue/sitemega` e, de preferência, crie uma nova branch para poder reverter a atualização.
3. Envie ou substitua o **conteúdo** do projeto extraído, preservando `app/`, `components/`, `lib/`, `tests/`, `docs/`, `prisma/` e os arquivos da raiz. Não envie uma única cópia do ZIP ao repositório.
4. Garanta que `scripts/import-history.ts` exista **apenas em `scripts/`**. Se existir `import-history.ts` na raiz, remova essa cópia antiga.
5. Confirme as alterações (`Commit changes`) e veja o novo deployment na Vercel.
6. Configure `DATABASE_URL` e `CRON_SECRET` (mínimo 16 caracteres) nas variáveis da Vercel, sem colocar segredos no GitHub. A rotina de atualização não grava dados sem banco PostgreSQL.
7. Acompanhe o build. Depois teste a aba **Laboratório 2.0** no computador e no celular. Para confirmar atualização automática, verifique os logs do cron e quantidade de concursos no Radar.
8. Para importar todo o histórico disponível: no ambiente administrativo, rode `npm run import:history -- --game=megasena --limit=10000` com `DATABASE_URL` configurada. Pode demorar e alguns concursos podem exigir nova tentativa caso a fonte os bloqueie.

**Não exclua o seu repositório atual.** Atualize os arquivos com seus caminhos corretos. O código usa dados reais das fontes consultadas, não bilhetes ou resultados fictícios no dashboard.

**Reversão:** se ocorrer falha de build, volte ao commit anterior na Vercel/GitHub e envie o log do primeiro erro. O pacote não garante que a infraestrutura externa (Caixa, banco ou Vercel) esteja disponível.

**Observação:** a simulação de bolão não é uma compra de apostas; cada participante deve receber comprovante de cota registrado nos canais oficiais da Caixa quando for apostar de verdade.
