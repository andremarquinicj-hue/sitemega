# LottoMind AI 1.2 — Fortuna Edition (mobile e conferência de prêmios)

Esta atualização inclui **uma identidade verde-esmeralda e dourada**, melhor leitura no celular, navegação inferior móvel, manifesto para adicionar o site à tela inicial, um novo menu **Conferir prêmios**, indicadores de resultados pós-sorteio e conferência automática dos conjuntos salvos cujo concurso associado já foi divulgado.

O **conferidor consulta o concurso específico**, calcula acertos e quantidades de prêmios por faixa (inclusive apostas múltiplas nas modalidades compatíveis), e apresenta valores em reais **somente quando o retorno de dados fornece rateios válidos**. Se a Caixa ou a fonte alternativa não estiver acessível, permite digitar o resultado manualmente para conferir os acertos, sem inventar valores pagos. O LottoMind AI não compra nem autentica bilhetes e não garante recebimento.

**No celular:** abra o link da Vercel pelo Chrome ou Safari; há menu lateral e barra inferior de atalhos. Também é possível usar “Adicionar à tela inicial” no navegador compatível. O site continua dependente de conexão para carregar resultados; o manifesto não representa aplicativo nativo nem garante funcionamento offline. Jogos salvos ficam no `localStorage` do navegador: não são sincronizados entre computador e telefone. Para salvar em vários aparelhos será necessária autenticação e um backend de usuários.

**Após cada concurso:** quando a fonte atualiza, o painel compara a repetição de dezenas e a distribuição par/ímpar com seus valores esperados sob sorteios aleatórios (particularmente útil para a Lotofácil). Não transforma esses padrões em aumento de chances. Jogos salvos como “apostados” serão destacados somente quando o número do concurso salvo corresponder ao resultado disponível. Confirme sempre o concurso impresso no bilhete.

Para implementação e testes veja [docs/CONFERENCIA_E_VISUAL_1_2.md](docs/CONFERENCIA_E_VISUAL_1_2.md). Para atualizar o GitHub, consulte [ATUALIZAR_GITHUB.md](ATUALIZAR_GITHUB.md).

---

> **Atualização 1.1 — Cobertura combinatória (27/10/2026):** melhorada a estratégia Máxima diversidade, com focos Sena/Quadra/Quina para Mega-Sena simples, auditoria de cobertura e testes (`tests/coverage.test.ts`). Veja [docs/COBERTURA_COMBINATORIA.md](docs/COBERTURA_COMBINATORIA.md). O build completo deve ser validado na Vercel; as probabilidades não indicam previsão de dezenas.

# LottoMind AI — Plataforma Inteligente de Análise Estatística de Loterias

**Projeto executável em Next.js 15 + TypeScript + Tailwind + Recharts + PostgreSQL/Prisma.** Interface escura responsiva; resultados obtidos da API pública da Caixa; oito loterias; análises descritivas; gerador condicionado a orçamento; Monte Carlo no navegador; backtesting walk-forward; histórico local de apostas.

> **Importante:** este repositório é um **MVP funcional com limitações explícitas**, e não um motor capaz de prever sorteios. Os modelos supervisionados de IA (Random Forest, Gradient Boosting etc.) e as garantias de fechamentos reduzidos não foram implementados e não são apresentados como prontos. A plataforma não vende apostas, não tem vínculo com a Caixa e não inventa dados históricos.

> **Atualização 26/10/2026 — deploy Vercel:** foi corrigida a sintaxe de `prisma/schema.prisma` que provocava `P1012` no `prisma generate`. Consulte `docs/CORRECAO_VERCEL.md` para atualizar o repositório existente. O build completo ainda depende de validação no ambiente conectado à Vercel.


## Atualização de implantação — 26/10/2026

Esta revisão corrige o formato do Prisma (`prisma/schema.prisma`), a tipagem da importação de histórico (`scripts/import-history.ts`) e o tipo explícito do retorno de sincronização (`app/api/sync/route.ts`). Para substituir os arquivos no repositório `sitemega`, siga `ATUALIZAR_GITHUB.md`. O ZIP atualizado contém os arquivos diretamente na raiz, sem subpasta extra.

**Validação adicional:** os 24 arquivos TS/TSX passaram na checagem de sintaxe, o núcleo e o importador passaram por checagem TypeScript rigorosa com declarações auxiliares de tipos, e 56 cenários de geração nas oito modalidades passaram em execução isolada. A verificação de tipagem completa com bibliotecas reais e o `next build` ainda não foram executados localmente, pois o registro npm ficou indisponível; a validação final do deploy permanece pendente.

## 1. Pré-requisitos

- Node.js 20.11 ou superior (recomendado Node.js 22 LTS), npm.
- Um banco PostgreSQL (Neon, Supabase, PostgreSQL próprio) para histórico persistente e cron. **Sem banco**, a interface, estatísticas dos concursos acessíveis, gerador, backtesting amostral e simulações ainda funcionam usando consulta direta à Caixa; o histórico completo não fica retido no servidor.
- Conexão de rede de seu servidor para `https://servicebus2.caixa.gov.br`.

## 2. Instalação local

```bash
npm install
cp .env.example .env
```

Edite `.env` com `DATABASE_URL` do PostgreSQL (caso disponível) e um `CRON_SECRET` aleatório de pelo menos 16 caracteres. Em Windows, crie `.env` copiando o arquivo `.env.example` pelo Explorador.

Com PostgreSQL configurado:

```bash
npx prisma generate
npm run db:migrate
npm run dev
```

Sem banco, deixe `DATABASE_URL` **removida ou vazia**, execute `npx prisma generate` e `npm run dev`. Acesse `http://localhost:3000`.

### Migrar banco pela primeira vez

Use `npm run db:migrate` para aplicar a migração SQL versionada em `prisma/migrations/`. `npm run db:dev` é destinado a alterações locais no schema, não ao deploy em produção.

## 3. Importar resultados históricos reais

A interface busca automaticamente até 30 concursos recentes por modalidade, além do concurso mais recente, quando a base persistida possui poucos registros. Para criar uma série histórica maior, utilize **no seu computador** com o banco já configurado:

```bash
npm run import:history -- --game=megasena --limit=500
npm run import:history -- --game=quina --limit=500
npm run import:history -- --limit=200
```

O último comando inclui as 8 modalidades, buscando os 200 concursos mais recentes de cada uma. Para séries completas, repita com `--limit=10000` e acompanhe logs e possíveis bloqueios da fonte; o processo é idempotente (`upsert`) e pode ser retomado. Importação de milhares de concursos deve ser feita em ambiente de longa duração, **não em uma Function da Vercel**. Cada retorno é validado e registrado com número do concurso, data, dezenas e fonte. Erros de consulta são contabilizados e nunca substituídos por números sintéticos.

## 4. Publicar no GitHub e na Vercel

1. Extraia este ZIP. Coloque o conteúdo da pasta `lotto-mind-ai/` na **raiz** de um novo repositório GitHub (se houver uma pasta extra no topo, configure o Root Directory na Vercel).
2. Crie um banco PostgreSQL no **Neon** ou **Supabase** e obtenha a URL de conexão PostgreSQL que o Prisma suporta, com SSL quando exigido.
3. Na Vercel, clique em **Add New → Project**, importe o repositório e mantenha o framework **Next.js** e o Build Command padrão `npm run build`.
4. Em **Settings → Environment Variables**, cadastre `DATABASE_URL`, `CRON_SECRET` e, opcionalmente, `CAIXA_API_BASE`. **Nunca publique `.env` ou senhas no GitHub**.
5. Aplique as migrações **antes de usar a sincronização** com `npm run db:migrate` de sua máquina (conectada ao banco de produção). Alternativamente, configure um passo controlado de migração em CI; não dependa de migrações automáticas em requisições de usuário.
6. Faça deploy. Confirme `https://SEU-SITE.vercel.app/api/health` e abra as oito modalidades. Valide disponibilidade real da Caixa nos logs de funções.
7. O arquivo `vercel.json` agenda `GET /api/sync` **uma vez por dia**, às **09:17 UTC**. A Vercel envia `Authorization: Bearer $CRON_SECRET`; confirme `CRON_SECRET` no projeto. A Function sincroniza último concurso e, quando necessário, alguns concursos recentes. Para um grande histórico inicial, use o comando CLI acima.

**Cron no plano Hobby:** a Vercel atualmente restringe cron a no máximo uma execução diária e não garante minuto exato. O agendamento fornecido respeita esse limite; confira [documentação oficial](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## 5. Fonte dos dados e confiabilidade

- Origem: `https://servicebus2.caixa.gov.br/portaldeloterias/api/{modalidade}` (recente) e `.../{modalidade}/{concurso}` (histórico).
- Esse endpoint é utilizado pelo portal Caixa, mas **não constitui uma API pública formalmente documentada com SLA**; funcionamento em produção e permissões de acesso precisam ser verificados após deploy. Pode haver erros 403/429/500 e limitações regionais.
- O backend aplica validação, timeout, retry, cache HTTP pelo `fetch` do Next.js (revalidação em 15 minutos) e armazenamento PostgreSQL, se disponível.
- Na falha da Caixa, `GET /api/results` pode devolver o último resultado salvo com `status: "cached"`; na falta de fonte e cache, `status: "unavailable"` e `draws: []`.
- As apostas **não** são enviadas à Caixa e nunca são consideradas realizadas automaticamente.

## 6. APIs implementadas

| Rota | Método | Função |
|---|---|---|
| `/api/health` | GET | Disponibilidade HTTP do aplicativo |
| `/api/results?lottery=megasena&limit=200` | GET | Resultados reais mais recentes e histórico disponível |
| `/api/generate` | POST | Gera apostas e valida orçamento, restrições e estratégia |
| `/api/backtest` | POST | Backtesting walk-forward com comparação aleatória |
| `/api/sync` | GET/POST | Sincroniza dados; **exige** `Authorization: Bearer <CRON_SECRET>` e banco |

Corpo mínimo do gerador: `{"lottery":"megasena","strategy":"diversity","count":5,"pick":6,"budget":50,"required":[],"excluded":[],"extra":""}`.
Corpo do backtest: `{"lottery":"megasena","strategy":"frequency","count":50}`.

## 7. Funcionalidades efetivas

| Área | Disponibilidade |
|---|---|
| Oito modalidades com preços/regras de apostas simples e ampliadas de dezenas | Implementado; Super Sete apenas 1 dígito por coluna |
| Resultados da Caixa, validação, cache e migração de banco | Implementado; depende da disponibilidade da fonte e das variáveis de ambiente |
| Frequências, desvio padronizado, atrasos, pares, paridade e heatmap | Implementado para concursos consultados; frequência do Super Sete agregada |
| Gerador aleatório, equilibrado, frequências, atrasos, diversificação, Fibonacci, numerologia | Implementado; sem afirmação de previsão |
| Fechamento matemático | **Somente fechamento completo** de grupos pequenos, com garantia estritamente condicional |
| Orçamento/custos e cálculo combinatório | Implementado com valores de referência conferidos em 2026 (não dinâmicos) |
| Simulação 10 mil / 100 mil / 1 milhão | Implementado no Web Worker, com comparação matemática de referência |
| Backtesting temporal | Implementado; exige concursos disponíveis, sem data leakage, comparativo com um jogo aleatório por concurso |
| Salvar jogos, marcar compra, CSV, impressão/PDF do navegador | Implementado em `localStorage`; PDF via **Imprimir → Salvar como PDF** |
| Autenticação, sincronização de jogos por conta, equipes Timemania validadas | **Não implementado** |
| Machine learning treinado e validado, Random Forest ou rede neural | **Não implementado** (não se vende estimativa falsa como IA) |
| Cobertura de fechamento reduzido e análise de significância corrigida | **Não implementado** |

## 8. Testes

```bash
npm run lint   # checagem rigorosa de tipos TypeScript
npm test       # Vitest: matemática, validação de dados, geração, API e walk-forward
npm run build  # verificação de build de produção
```

**Limitação da entrega:** o ambiente em que esta versão foi preparada não conseguiu acessar o registro npm; portanto, `npm install`, `npm test` e `npm run build` **não puderam ser executados com dependências instaladas**. Foram executados um type-check isolado dos módulos matemáticos e testes de execução Node do motor compilado; veja `docs/PLANO_TESTES.md` para os resultados efetivamente observados. Execute os três comandos acima após `npm install` antes de publicar; falhas encontradas no seu ambiente devem ser corrigidas, não presumidas como aprovadas.

## 9. Alertas éticos e financeiros

Jogue apenas se for maior de 18 anos. Defina um orçamento de entretenimento sem comprometer necessidades. A frequência, atraso e numerologia não mudam a distribuição teórica de um sorteio independente. A diversificação pode evitar jogos repetidos e ampliar a cobertura combinatória, mas **não cria números individuais mais prováveis**.

Consulte `docs/MANUAL.md`, `docs/ARQUITETURA.md`, `docs/PLANO_TESTES.md` e `docs/LIMITACOES.md`.

## Consulta com fallback quando a Caixa retorna HTTP 403

A API interna pública da Caixa pode bloquear chamadas de servidores Vercel (por exemplo HTTP 403). A consulta implementada em `lib/caixa.ts` tenta, **nesta ordem**:

1. `servicebus2.caixa.gov.br` — fonte primária, payload oficial.
2. `loteriascaixa-api.herokuapp.com` — API comunitária de resultados públicos, com seu próprio histórico e atualizações.
3. Para o último concurso da Mega-Sena, se ambas falharem: `resultadomega.com.br/api/ultimo.json`. Para os resultados históricos da Mega-Sena, o endpoint compacto `/api/concursos.json` reduz chamadas externas.

O sistema valida modalidade, concurso, data e dezenas antes de apresentar os resultados. A procedência é exibida no dashboard. **Fontes alternativas não são oficiais, podem estar atrasadas ou indisponíveis e não dispensam conferência com a Caixa.** No histórico compacto da Mega-Sena, o prêmio por faixa é desconhecido; não se inventam valores. A fonte de resultados oficial é pública, mas não possui documentação de estabilidade nem SLA.

A publicação não requer variáveis adicionais para tentar o fallback. A persistência histórica e o cron continuam exigindo `DATABASE_URL` e `CRON_SECRET`. A compatibilidade do segundo sorteio da Dupla Sena depende de o provedor alternativo enviar explicitamente as duas dezenas sorteadas; sem elas, a resposta é rejeitada.
