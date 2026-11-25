# Análise do histórico completo — LottoMind AI 2.0.1

## Arquitetura aplicada

- **`lib/db.ts` / `readDbHistory`**: consulta registros do Neon em páginas de até 400 concursos, ordenados por concurso e com limite de proteção de 10.000 resultados por modalidade.
- **`lib/data.ts` / `getAnalysisHistory`**: recebe o concurso mais recente da fonte e combina com os registros persistidos; em caso de indisponibilidade do banco, devolve uma amostra reduzida e `origin="limited-fallback"`.
- **`lib/statistics.ts`**: remove concursos duplicados ou inválidos, calcula estatísticas descritivas de 10, 30, 50, 100, 200, 500 e **todos os concursos efetivamente disponíveis**, frequência, esperado, atrasos, pares e distribuição. Retorna números da amostra, primeiro/último concurso e lacunas internas.
- **`GET /api/statistics?lottery=megasena`**: responde com **resumos**, não com milhares de resultados. `report.historicalDraws` e `report.windows.all.observed` indicam quantos concursos realmente participaram.
- **`GET /api/advisor`**: Radar recebe o histórico persistido e faz até 300 testes walk-forward, reservando no mínimo 90 concursos mais antigos para treinamento. Compara uma aposta por rodada contra a expectativa matemática e cinco apostas aleatórias de igual custo por rodada. A liderança no passado é mostrada como retrospectiva, não como escolha de previsão.
- **`POST /api/backtest`**: suporta até 500 concursos de avaliação usando somente resultados de concursos anteriores para formar cada jogo. Compara uma aposta aleatória por rodada, também de mesmo custo.
- **`POST /api/generate` e `POST /api/lab`**: estratégias históricas passam a receber o histórico do banco completo. O próprio gerador decide a heurística, sem afirmar que as dezenas mais frequentes serão sorteadas.
- **Interface**: as abas `Visão geral`, `Análise estatística`, `Radar diário`, `Backtesting` e `Laboratório 2.0` exibem contagens, janelas e/ou origem. O histórico bruto continua limitado a 200/500 resultados nas interfaces para proteger a experiência móvel.
- **`scripts/import-history.ts`**: versão resiliente incorporada. Pula concursos já gravados, suporta `--from=... --to=...` e tenta recuperar falhas temporárias sem apagar dados.

## Como auditar no site

1. Execute `GET /api/statistics?lottery=megasena`. Em `report` procure `historicalDraws`, `firstContest`, `lastContest`, `missingWithinRange` e `windows["all"].observed`.
2. Repita para `lotofacil`. `origin="postgresql"` confirma leitura persistida; `completeScan=true` indica varredura dos **registros salvos** dentro do limite de proteção, **não prova** que todos os concursos existentes desde o primeiro sorteio estejam no banco.
3. Consulte `/api/advisor?lottery=megasena`: `radar.observations` deve corresponder à amostra válida, `radar.testedDraws` até 300 e `minimumTraining=90`.
4. Abra `Análise estatística` e escolha `Todo histórico` para exibir métricas calculadas a partir dos registros persistidos.
5. Em `Backtesting`, teste 100 ou 500 concursos e compare com a estratégia aleatória.

## Limitações e validação

- A presença de 1.266 concursos não inclui necessariamente concursos 1–1824. **Jamais mostrar uma base parcial como arquivo histórico oficial completo.** O contador de lacunas só verifica o intervalo entre o concurso mínimo e o máximo salvos.
- O Radar usa até 300 rodadas de teste para limitar carga de servidor; o histórico completo anterior à janela pode integrar o treinamento. Backtesting específico permite até 500 rodadas.
- Média aleatória empírica varia com sementes reprodutíveis; a referência teórica de acertos é mais estável. O desvio de uma estratégia em dados passados **não demonstra capacidade preditiva**. Interpretar seis estratégias requer correção de múltiplos testes, e validação prospectiva adicional.
- Modelos neurais, treinamento automático de ML e recomendações de dezenas com vantagem estatisticamente demonstrada **não foram implementados**.
- Resumos são recalculados no servidor conforme novos resultados são sincronizados; a atualização depende das fontes externas, credenciais e rotina cron. O site pode exibir dados em cache por 5–15 minutos.
- **Os resultados detalhados reais não foram acessados diretamente neste ambiente.** Os testes independentes utilizaram históricos simulados de 1.266 e 956 concursos para validar operações e tamanhos de amostra. Não afirma uma análise preditiva de seus resultados específicos.
- `npm test`, `npm run lint` completo e `npm run build` com dependências reais devem ser executados no ambiente conectado ao npm. A instalação de pacotes ficou indisponível aqui. Não publique antes de examinar as vulnerabilidades de produção indicadas pelo npm audit.

## Testes executados localmente nesta entrega

- **47 arquivos TS/TSX** passaram em verificação sintática TypeScript (sem compilação integral do Next.js).
- Núcleo puro `lib/rules.ts`, `lib/math.ts`, `lib/statistics.ts`, `lib/advisor.ts` passou `tsc --noEmit --strict`.
- Testes independentes executados: 1.266 concursos artificiais de Mega-Sena, 956 de Lotofácil, todas as janelas de estatística, 300 avaliações do Radar por modalidade, 500 avaliações de backtesting por modalidade, contagem total de dezenas e verificação de lacunas. Todos passaram.
- Testes Vitest adicionais escritos em `tests/statistics.test.ts`, ainda aguardando execução no ambiente com dependências.
