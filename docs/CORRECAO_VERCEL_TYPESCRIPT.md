# Correção 2 — Vercel / TypeScript

## Sintoma

Após corrigir `prisma/schema.prisma`, o `next build` compilou o código, mas falhou no tipo de `scripts/import-history.ts` (linha 10):

`Argument of type 'string' is not assignable to parameter of type '"megasena" | "quina" | ...'`.

## Causa e solução

A expressão `requested ? [requested] : LOTTERY_KEYS` é inferida como uma coleção que pode conter `string` genérica. A função `fetchCaixa` exige um valor do tipo `LotteryKey`.

Foi alterado o import de `lib/rules` para incluir `type LotteryKey` e declarada a lista como `LotteryKey[]`, usando o guarda de tipo `isLottery` na ramificação de seleção. Assim, os elementos do `for ... of` são reconhecidos como modalidades válidas e o script continua rejeitando valores inválidos.

## Aplicação direta no repositório existente

1. Abra <https://github.com/andremarquinicj-hue/sitemega/blob/main/scripts/import-history.ts>.
2. Clique em **Edit this file** (lápis).
3. Substitua o conteúdo pelo `import-history.ts` fornecido separadamente ou localizado em `scripts/import-history.ts` neste ZIP.
4. Clique em **Commit changes** na branch `main`. A Vercel normalmente inicia novo deployment.
5. Se aparecer outro erro de build, consulte o novo log e não desative o TypeScript.

Não é necessário recriar o projeto, modificar as variáveis de ambiente ou o schema do Prisma nesta etapa.

## Verificação feita

- A tipagem do script foi corrigida e verificada com o compilador TypeScript em ambiente isolado e declarações simplificadas para dependências ausentes.
- O arquivo Prisma corrigido anteriormente permanece presente.
- O build de produção com `npm run build` e os testes automatizados ainda não foram executados localmente porque este ambiente não consegue acessar o npm Registry. Portanto, a correção é para o erro identificado e não é garantia de build completo.
