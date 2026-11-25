# LottoMind AI 2.0 — Simulador de Bolão, Auditoria Exata e Sugestões Monitoradas

## Escopo entregue

- Novo menu **Laboratório 2.0** no computador e na barra inferior do celular.
- Orçamento simulável de R$ 6 até R$ 1.000.000, participantes entre 1 e 1.000 e custo por pessoa.
- Chance **exata** de acertar a Sena com N apostas simples **distintas**: N / C(60,6).
- Chances **exatas** de **pelo menos uma quadra ou melhor** (>=4) e **pelo menos uma quina ou melhor** (>=5) na Mega-Sena para conjuntos completos de até **500 apostas simples**, por enumeração e deduplicação de resultados favoráveis. O algoritmo considera a sobreposição dos eventos de premiação entre apostas.
- Para orçamentos superiores a 500 apostas simples, a tela apresenta a chance exata da Sena e **apenas limites superiores** de quadra e quina até que o conjunto completo seja efetivamente calculado.
- Estratégias aleatória e máxima diversidade podem produzir até 500 apostas por solicitação; as heurísticas baseadas no histórico geram até 100 jogos e exigem amostra adequada. A tela pode comparar dois conjuntos de mesmo orçamento e mostrar as diferenças combinatórias exatas. O foco quadra/quina é organização combinatória, não previsão.
- Dicas descritivas de dezenas **quentes** e **frias**, além de ranking retrospectivo temporal. O app não as trata como números mais/menos prováveis no próximo concurso.
- Armazenamento local de um **registro antes do concurso** (`PredictionSnapshot`), com estratégia, lista exata dos jogos, data, último concurso conhecido e concurso-alvo; o usuário escolhe **somente sugestão** ou **marcado como apostado**.
- Conferência automática dessas previsões sempre que o concurso-alvo aparece no histórico consultado. Sem resultado não marca falha; sem rateio não inventa valores. Sugestões não compradas não viram ganhos financeiros.
- Exportação CSV das sugestões geradas.
- Informação sobre lacunas e volume real dos concursos recebidos.

## Lógica matemática: por que a união é necessária

Uma aposta simples de seis números tem:

- 50.063.860 resultados igualmente possíveis (60 escolher 6);
- 21.790 resultados que dariam quatro ou mais acertos;
- 325 resultados que dariam cinco ou mais acertos;
- 1 resultado que daria Sena.

Para um conjunto real de jogos, o aplicativo representa os resultados como posições em um bitmap combinado de 50.063.860 bits. Para cada aposta, enumera os resultados com exatamente 4, exatamente 5 e exatamente 6 números em comum com a aposta. Marca os resultados favoráveis para cada faixa. Como cada sorteio entra apenas uma vez no bitmap, a união fornece uma probabilidade exata sem afirmar independência incorreta entre apostas.

Acima de 500 apostas, mostra limites por desigualdade da união (`P(uniao) <= min(1, N*P(evento simples))`) até ser implementada auditoria escalonada. Os limites **não** são rotulados como chances exatas.

**Importante:** o objetivo é a probabilidade de ganhar **pelo menos uma** premiação de uma faixa ou melhor. Não é o mesmo que a expectativa de quantos prêmios serão pagos ou o valor de retorno financeiro.

## Atualização e aprendizagem: o que existe versus não existe

### Existe

- Rotina administrativa `/api/sync`, autenticada por `CRON_SECRET`, para buscar novas apurações e gravá-las no PostgreSQL (`DATABASE_URL`). `vercel.json` agenda uma execução diária às **03:30 UTC (00:30 em Brasília)**; o horário exato pode variar conforme o plano Vercel.
- Consulta de resultados ao abrir o site e atualização automática da interface aproximadamente a cada 20 minutos enquanto estiver aberta, sujeita a cache e disponibilidade da fonte.
- Cálculo do Radar baseado em resultados existentes na base, com estatísticas e comparação walk-forward de várias estratégias quando há observações suficientes.
- `npm run import:history -- --game=megasena --limit=10000` importa o histórico oficialmente/alternativamente disponível ao serviço, em lotes e com relatório de falhas. Isso deve ser executado fora das funções breves da Vercel, com banco configurado; não se deve afirmar que todos os concursos estejam presentes antes de confirmar a importação.

### Não existe

- Modelo de machine learning incremental treinado e validado automaticamente após cada concurso. **Recalcular o Radar não é treinar uma IA.**
- Evidência de que atraso, frequência, Fibonacci ou padrões recentes predizem um sorteio aleatório.
- Garantia de lucro, premiações, nem “orçamento ideal” com vantagem estatística comprovada.
- Login e sincronização dos palpites entre computadores/celulares: os registros ficam apenas no localStorage do navegador utilizado.
- Registro ou compra de cotas de bolão na Caixa. O orçamento por pessoa é uma simulação; as cotas oficiais estão sujeitas a regras, limites e possível tarifa.
- Auditoria exata de faixas secundárias da Lotofácil no novo simulador: o módulo de simulação exata de quadra/quina/Sena é da Mega-Sena. O Radar histórico também opera para outras modalidades.

## Recomendações científicas

A seleção retrospectiva da estratégia com maior média de acertos pode estar enviesada por múltiplos testes, mudanças nas regras e sobreajuste. Somente testes prospectivos, registrados antes do concurso, podem avaliar se existe uma diferença estável fora da amostra. Exibir ganhos hipotéticos em previsões que não foram apostadas **não** deve ser interpretado como retorno financeiro de fato.

## Implantação

1. Atualize os arquivos no GitHub preservando os diretórios, sem introduzir a pasta ZIP como nível adicional.
2. Importe o repositório na Vercel e configure as variáveis `DATABASE_URL` e `CRON_SECRET` conforme `.env.example`.
3. Rode migrações no banco quando necessário (`npm run db:migrate`), depois configure a importação inicial de histórico na sua máquina/servidor administrativo.
4. Confirme em Vercel > Functions/Cron as execuções e em `/api/lab?lottery=megasena` o status e quantidade de concursos retornados.
5. Verifique os cálculos com `npm test` e valide `npm run build`. Os testes isolados executados no ambiente de desenvolvimento não substituem o build real com dependências npm.

## Limitações e segurança

- Os custos dos jogos vêm do catálogo `lib/rules.ts` e **não são atualizados automaticamente**, portanto devem ser confirmados no site da Caixa antes de apostar.
- O acesso ao serviço da Caixa pode retornar 403 e a fonte alternativa pode falhar. A interface deve informar quando está usando dados em cache e nunca inventar concursos.
- Se o banco não estiver configurado, o histórico disponível pode se restringir aos sorteios mais recentes, e a rotina diária não consegue persistir dados.
- Para bolões reais, utilize os procedimentos e recibos oficiais da Caixa para comprovar cotas e distribuição de prêmios.
- Privacidade: previsões registradas ficam no navegador local; apagar os dados do navegador elimina esses registros. Esses registros locais são editáveis e não servem como prova independente de que um palpite tenha sido registrado antes do sorteio; auditoria prospectiva rigorosa exigiria registro assinado em servidor com timestamp confiável.
