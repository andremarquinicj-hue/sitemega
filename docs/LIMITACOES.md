# Limitações conhecidas e próximos incrementos

1. **Sem previsão de dezenas**: não há probabilidade aumentada para dezenas “quentes” ou “atrasadas” sob sorteios independentes; não é um modelo de previsão validado.
2. **Sem machine learning supervisionado**: Random Forest, regressão, redes neurais e comparação inferencial formal com baselines não estão implementados. Não exibir rótulo de “IA preditiva” para o gerador atual; o nome é identidade de produto.
3. **Histórico**: um banco novo começa vazio. O frontend busca até 30 concursos recentes para inicialização, sem prometer histórico completo. Importe séries longas com o script CLI. Lacunas no histórico influenciam análise de atrasos; confira cobertura antes de interpretar resultados.
4. **Fonte Caixa não contratual**: endpoint público não documentado formalmente, sem garantia de disponibilidade; nenhum segundo provedor automático implementado.
5. **Timemania**: campo de Time do Coração é livre e não possui validação contra os clubes ativos. O cálculo do prêmio do time e seu backtest não estão implementados.
6. **Dia de Sorte**: o mês é aceito e mostrado, mas a premiação de Mês da Sorte não é incluída no cálculo financeiro do backtesting.
7. **Super Sete**: apenas um número por coluna, apostas múltiplas por coluna ainda não suportadas; a estatística dos dígitos é agregada entre colunas. O volante renderizado por coluna é próprio, não cópia oficial.
8. **Dupla Sena**: probabilidades por sorteio, simulação de dois sorteios por concurso; relatório backtest apresenta melhor quantidade de acertos, e, quando disponíveis, soma rateios de duas extrações. Confirme faixas descritas em resultados públicos.
9. **Fechamento**: único disponível é o completo de grupos pequenos com garantia se todos os números sorteados estiverem dentro do grupo. Não existe fechamento reduzido com garantia declarada.
10. **Probabilidade combinada**: cálculo exato exibido apenas para grupos simples distintos (exceto Timemania e Lotomania). Sobreposições combinatórias complexas não são aproximadas fraudulentamente.
11. **PDF**: exportação CSV e funcionalidade de impressão do navegador para salvar como PDF. Não existe gerador PDF dedicado do servidor.
12. **Armazenamento de apostas**: somente `localStorage` por aparelho; não é sistema de venda ou comprovante. Não há conta/sincronização.
13. **Análise estatística**: Z-scores sem correção por testes múltiplos, sem IC para todas as métricas, sem quartetos. A interface não declara significância.
14. **Monte Carlo**: até 1 milhão de simulações via Web Worker. Pode ficar lento em dispositivos fracos e muitos jogos. Intervalo normal mostrado para taxa de premiação aproximada; para eventos extremamente raros, consulte aproximações exatas.
15. **Preços**: cadastro estático conferido em outubro de 2026; alterações de preço exigem atualização do código.
16. **CI/build**: a versão foi produzida em ambiente sem acesso ao registro npm; testes compiláveis isolados foram executados, mas instalação npm, testes Vitest e Next build precisam ser executados em máquina com acesso ao registro.

## Evolução sugerida

- Implementar ingestão via provedor documentado e monitoramento de falhas com retries duráveis.
- Importador de histórico com paginação/cursor e análise explícita de lacunas.
- Atualizador de regras/preços via fonte oficial validada por administrador.
- Validar lista de 80 equipes atuais e apostar em colunas múltiplas no Super Sete.
- Gerar PDF estruturado e login opcional com armazenamento de apostas por usuário.
- Motor científico de ML fora do processo web: walk-forward, registro de experimentos, comparação com aleatório (intervalos e ajuste de hipóteses), exibindo ausência de vantagem se essa for a conclusão.
