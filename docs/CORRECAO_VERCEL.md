# Correção de deploy na Vercel — Prisma P1012

O primeiro deploy do repositório `sitemega` falhou na etapa `prisma generate && next build` porque o arquivo `prisma/schema.prisma` continha blocos `generator` e `datasource` escritos em uma só linha. O Prisma ORM 6.19.3 exibiu P1012 e indicou incorretamente cada campo do schema como pertencente ao bloco `generator`.

## Correção implementada

Reescrevemos os blocos `generator client` e `datasource db` com uma propriedade por linha, mantendo os modelos Draw e SyncRun e índices originais.

## Como aplicar ao repositório GitHub já criado

1. Entre em <https://github.com/andremarquinicj-hue/sitemega/blob/main/prisma/schema.prisma>.
2. Clique no ícone de lápis (Edit this file).
3. Substitua todo o conteúdo pelo `schema.prisma` incluído neste pacote.
4. Clique em **Commit changes** e confirme na branch `main`.
5. A Vercel deverá iniciar automaticamente um novo deploy; confira os Build Logs.
6. Garanta que as variáveis `DATABASE_URL` e `CRON_SECRET` estejam cadastradas na Vercel para habilitar persistência e sincronização. Não coloque credenciais no GitHub.

Apenas esta correção resolve o erro de **sintaxe P1012 mostrado nos prints**, mas não demonstra que o build completo ou o banco de dados estão corretamente configurados. Se houver outro erro, consulte o log da nova implantação.

## Verificações disponíveis neste ambiente

- O pacote possui o schema revisado e 24 arquivos TypeScript/TSX sem erros sintáticos de parsing (verificação estática).
- O ambiente de criação não conseguiu alcançar o registro npm; por isso não foi possível executar `prisma validate`, `next build` ou testes end-to-end.

