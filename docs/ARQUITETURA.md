# Arquitetura técnica

```text
Navegador (Next.js Client Components / Tailwind / Recharts)
  ├── Configuração local, gráficos, salvamento em localStorage
  ├── Web Worker: Monte Carlo (10k–1M simulações)
  └── Requisições JSON → Next.js Route Handlers (Node.js)
        ├── /api/results → Fonte Caixa → validação/normalização → cache
        ├── /api/generate → lib/math.ts + histórico consultado
        ├── /api/backtest → lib/math.ts (treino apenas anterior)
        └── /api/sync (Bearer CRON_SECRET)
              └── PostgreSQL → Prisma: Draw + SyncRun

CLI scripts/import-history.ts → Caixa → Prisma PostgreSQL
```

## Domínios e isolamento

- `lib/rules.ts`: catálogo de 8 modalidades, faixas numéricas, tamanho de aposta e preços mínimos, estratégia e tipos.
- `lib/math.ts`: combinatória, distribuições hipergeométrica/binomial, amostragem, filtro de estratégias, fechamento completo, backtesting sem vazamento temporal, estatísticas.
- `lib/caixa.ts`: isolamento do contrato bruto da Caixa, validação forte de concurso, data, quantidade de dezenas, duplicidade e segundo sorteio da Dupla Sena.
- `lib/db.ts`: persistence adapter PostgreSQL com Prisma, idempotência por índice `(lottery,contest)`.
- `lib/data.ts`: histórico salvo, consulta online e fallback do cache persistente.
- `lib/simulation.worker.ts`: Monte Carlo assíncrono, sem chamar serviços externos.
- `components/Dashboard.tsx`: SPA dentro do App Router com painéis e importações de API.

## Administração e segurança

`/api/sync` só funciona quando **CRON_SECRET com no mínimo 16 caracteres** e `DATABASE_URL` estão configurados. Outras rotas recebem entradas validadas e com limites. Não há armazenamento de credenciais do usuário. A consulta à Caixa roda no servidor e usa cache de 15 minutos de `fetch`. **Ainda não há rate limiting distribuído para API públicas**, autenticação de usuários, observabilidade terceirizada, jobs duráveis ou provedor alternativo automático.

## Esquema persistente

Tabela `Draw` guarda modalidade, concurso, datas, dezenas, segundo sorteio, complementos, rateios, estimativa, fonte e horário da captura. `SyncRun` guarda status por execução. A chave lógica `(lottery, contest)` impede duplicações. Alterações futuras devem ser feitas por migrações Prisma versionadas.

## Custo e deploy

Acesso público aos endpoints oficiais pode sofrer bloqueio por limite/CORS/WAF; se isso ocorrer, trocar por integração autorizada e documentada sem alterar a lógica matemático-estatística. Cron Hobby é no máximo diário; sincronização longa deve ser executada no CLI, não nas Functions da Vercel. O banco Neon ou Supabase é externo à Vercel e exige provisionamento independente.
