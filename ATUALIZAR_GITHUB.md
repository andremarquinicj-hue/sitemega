# Atualizar o LottoMind AI para versão 1.2

Este ZIP contém o **projeto completo**, e não apenas trechos de código.

1. Faça uma cópia do repositório existente `sitemega` antes de substituir arquivos.
2. Extraia o ZIP no computador. No GitHub, envie **o conteúdo extraído**, sem criar uma pasta adicional na raiz do projeto.
3. Preserve os caminhos e pastas (`app/`, `components/`, `lib/`, `tests/`, `prisma/`, `docs/`). Substitua os arquivos homônimos nos mesmos caminhos.
4. Não compartilhe no GitHub arquivos `.env` com senhas. Use somente `.env.example`; as variáveis reais continuam na Vercel.
5. Remova um eventual `import-history.ts` antigo da raiz. O arquivo correto é `scripts/import-history.ts`.
6. Faça **Commit changes** no ramo conectado à Vercel; a plataforma deverá iniciar novo deploy.
7. Acesse `/api/health`. No dashboard, confira a opção **Conferir prêmios** e a barra inferior no celular.
8. Teste com resultado de concurso antigo e rateio conhecido; se o serviço de resultados retornar erro, marque **Informar resultado manualmente** para verificar acertos, sem exibir um valor fictício.

## Onde usar os recursos novos

- **Conferir prêmios:** escolha modalidade, conjunto salvo ou digite um jogo por linha e informe o **número correto do concurso**. Para obter premiação em reais, a API deve fornecer as faixas/rateios específicos. Em apostas múltiplas, calcula o número de combinações premiadas por faixa.
- **Conferir automaticamente:** no menu **Meus jogos**, marque o conjunto como apostado. Ao salvar um conjunto novo, fica associado um **concurso sugerido** (último concurso conhecido + 1); confirme se corresponde à aposta efetivamente feita. Quando o resultado desse concurso estiver disponível e a modalidade estiver selecionada, um aviso aparece no dashboard.
- **Lotofácil e outras modalidades:** a visão geral apresenta as tendências recentes *descritivas* e a comparação com valores aleatórios esperados; não se trata de previsão.
- **Celular:** abra a URL da Vercel. Navegação inferior: Início, Gerar, Prêmios e Salvos. O menu hambúrguer dá acesso às demais abas.

## Verificações efetuadas e limites

- 30 arquivos TS/TSX tiveram sintaxe verificada com o compilador TypeScript.
- Motor de premiações e padrões passou no `tsc --strict` isolado; cenários de teste executados para quadra, Lotofácil, apostas múltiplas, Dupla Sena, Dia de Sorte e Super Sete.
- **Não foi possível executar `npm install`, `npm test` (Vitest) nem `next build` completos neste ambiente.** Portanto, após subir ao GitHub, é indispensável acompanhar o build e conferir visualmente em aparelhos móveis.
- Acesso à Caixa por endpoints não documentados e fontes alternativas pode gerar HTTP 403. Em indisponibilidade, o sistema não inventa resultado nem valor de prêmio. O modo manual só comprova coincidência entre listas digitadas.
- Não há autenticação, armazenamento compartilhado dos bilhetes ou notificações push fora do navegador.
