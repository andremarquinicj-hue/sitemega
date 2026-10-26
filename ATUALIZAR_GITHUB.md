# Atualizar o repositório sitemega (GitHub)

Este ZIP contém **o conteúdo da raiz do projeto**, não uma pasta `lotto-mind-ai` adicional.

## Envio pelo navegador

1. Faça um backup ou preserve um commit anterior do repositório existente.
2. Extraia este ZIP no computador.
3. Abra https://github.com/andremarquinicj-hue/sitemega e selecione a branch `main`.
4. Escolha **Add file > Upload files**. Arraste **todo o conteúdo extraído** (pastas `app`, `components`, `docs`, `lib`, `prisma`, `scripts`, `tests`, arquivos `package.json`, `tsconfig.json`, etc.) preservando os diretórios. **Não carregue o ZIP sozinho**.
5. Confirme o **Commit changes**. Arquivos existentes nos mesmos caminhos deverão ser substituídos pelo conteúdo enviado.
6. Caso exista um `import-history.ts` na RAIZ do repositório, apague-o separadamente: o importador correto é `scripts/import-history.ts`. Não apague o arquivo da pasta `scripts`.
7. Acompanhe o novo deployment na Vercel. Se o GitHub rejeitar pastas arrastadas, use GitHub Desktop ou Git na sua máquina (com os comandos abaixo).

## Alternativa com Git (mais confiável para substituir pastas)

```bash
git clone https://github.com/andremarquinicj-hue/sitemega.git
cd sitemega
# Copie todo o conteúdo extraído do ZIP para esta pasta, sobrescrevendo arquivos equivalentes.
# Caso exista na raiz um antigo import-history.ts solto, exclua-o.
git add -A
git commit -m "Corrige Prisma e tipagem TypeScript do LottoMind AI"
git push origin main
```

## Correções deste pacote

- `prisma/schema.prisma`: blocos `generator` e `datasource` formatados corretamente para Prisma 6.
- `scripts/import-history.ts`: `games` tipado como `LotteryKey[]`, removendo o erro de passagem de `string` para `fetchCaixa`.
- `app/api/sync/route.ts`: tipo explícito dos resultados acumulados, evitando possível inferência incorreta para array vazio.

## Validações e limites

Verificação sintática de 24 arquivos TS/TSX; checagem TypeScript `strict` dos módulos principais com declarações temporárias para dependências indisponíveis; verificação estrutural com declarações temporárias dos tipos de bibliotecas; e 56 cenários de geração e orçamento nas 8 modalidades. **Ainda não houve `npm install`/`npm run build` completo ou testes Vitest neste ambiente** por indisponibilidade do registro npm. Uma build bem-sucedida na Vercel é a próxima validação real.

Depois de publicar, configure na Vercel `DATABASE_URL` para persistência e `CRON_SECRET` para o cron. Não envie senhas ou `.env` ao GitHub.
