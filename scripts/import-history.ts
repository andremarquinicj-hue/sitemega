/**
 * LottoMind AI 2.0 — importador histórico resiliente (Prisma 6 / Neon)
 * Substitui scripts/import-history.ts no projeto.
 *
 * Exemplos:
 *   npm.cmd run import:history -- --game=lotofacil --limit=1000
 *   npm.cmd run import:history -- --game=megasena --from=1 --to=300
 *
 * O script usa a tabela Draw existente e não modifica o schema Prisma.
 * Concurso previamente salvo e identificado por (lottery, contest) é ignorado.
 */
import { LOTTERY_KEYS, isLottery, type LotteryKey } from '../lib/rules';
import { fetchCaixa } from '../lib/caixa';
import { db, upsertDraw, logSync } from '../lib/db';

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

function opt(name: string): string | undefined {
  const arg = process.argv.find(x => x.startsWith(`--${name}=`));
  return arg?.slice(name.length + 3);
}

function positiveInt(raw: string | undefined, name: string): number | undefined {
  if (raw === undefined) return undefined;
  if (!/^\d+$/.test(raw)) throw Error(`--${name} deve ser inteiro positivo.`);
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < 1) throw Error(`--${name} inválido.`);
  return n;
}

function shortError(err: unknown): string {
  if (err && typeof err === 'object') {
    const code = 'code' in err && typeof err.code === 'string' ? `${err.code}: ` : '';
    const msg = 'message' in err && typeof err.message === 'string'
      ? err.message.split('\n')[0] : String(err);
    return (code + msg).slice(0, 220);
  }
  return String(err).slice(0, 220);
}

async function retry<T>(
  task: () => Promise<T>,
  description: string,
  isDatabase: boolean,
  attempts = 3,
): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await task();
    } catch (err) {
      last = err;
      if (i === attempts) break;
      console.warn(`${description}: tentativa ${i}/${attempts} falhou (${shortError(err)}).`);
      if (isDatabase) {
        // Em P1001/P1017, derrubar a sessão antiga e deixar o próximo comando
        // do Prisma abrir uma nova. O upsert é idempotente em caso de incerteza.
        try { await db()?.$disconnect(); } catch { /* conexão já encerrada */ }
      }
      await sleep(1000 * i * i);
    }
  }
  throw last;
}

async function importGame(
  game: LotteryKey,
  explicitFrom: number | undefined,
  explicitTo: number | undefined,
  limit: number,
): Promise<boolean> {
  const client = db();
  if (!client) throw Error('DATABASE_URL não configurada.');

  let from: number;
  let to: number;
  if (explicitFrom !== undefined && explicitTo !== undefined) {
    from = explicitFrom;
    to = explicitTo;
  } else {
    const latest = await retry(() => fetchCaixa(game), `${game} concurso atual`, false);
    to = latest.contest;
    from = Math.max(1, to - limit + 1);
  }
  if (from > to) throw Error('--from não pode ultrapassar --to.');
  if (to - from + 1 > 10_000) throw Error('Importe no máximo 10.000 concursos por execução.');

  const existing = await retry(
    () => client.draw.findMany({
      where: { lottery: game, contest: { gte: from, lte: to } },
      select: { contest: true },
    }),
    `${game} leitura dos existentes`, true,
  );
  const present = new Set(existing.map(d => d.contest));
  const total = to - from + 1;
  const missing = total - present.size;
  console.log(`${game}: intervalo ${from}–${to}; ${present.size} já existentes; ${missing} a buscar.`);

  let inserted = 0;
  let tried = 0;
  let consecutiveDbFailures = 0;
  const failed: number[] = [];
  let interrupted = false;
  for (let id = to; id >= from; id--) {
    if (present.has(id)) continue;
    tried++;
    let draw;
    try {
      draw = await retry(() => fetchCaixa(game, id), `${game} #${id} consulta`, false, 2);
      if (draw.contest !== id || draw.lottery !== game) {
        throw Error(`A fonte retornou concurso/modalidade diferente para #${id}.`);
      }
    } catch (err) {
      console.warn(`${game} #${id}: não foi possível consultar (${shortError(err)}).`);
      failed.push(id);
      await sleep(250);
      continue;
    }
    try {
      await retry(() => upsertDraw(draw), `${game} #${id} gravação`, true);
      inserted++;
      consecutiveDbFailures = 0;
    } catch (err) {
      console.error(`${game} #${id}: falha de gravação (${shortError(err)}).`);
      failed.push(id);
      consecutiveDbFailures++;
      if (consecutiveDbFailures >= 3) {
        console.error('Importação interrompida após 3 falhas consecutivas de banco. Os registros já salvos permanecem no Neon.');
        interrupted = true;
        break;
      }
    }
    if (tried % 50 === 0) {
      console.log(`${game}: ${tried}/${missing} ausentes examinados; ${inserted} novos salvos; ${failed.length} falhas.`);
    }
    await sleep(200);
  }

  const success = !interrupted && failed.length === 0;
  console.log(`${game}: ${inserted} novos salvos; ${failed.length} falhas; ${present.size} já existiam.`);
  if (failed.length) console.log(`Concursos que precisam de nova tentativa: ${failed.join(', ')}`);
  try {
    await logSync(game, success ? 'ok' : 'partial', inserted,
      `Histórico ${from}-${to}; novos ${inserted}; anteriores ${present.size}; falhas ${failed.length}.`);
  } catch { /* log não altera o resultado da importação */ }
  return success;
}

async function main(): Promise<void> {
  if (!db()) throw Error('Configure DATABASE_URL antes de importar o histórico.');
  const requested = opt('game');
  const from = positiveInt(opt('from'), 'from');
  const to = positiveInt(opt('to'), 'to');
  const limit = positiveInt(opt('limit'), 'limit') ?? 200;
  if (limit > 10_000) throw Error('Use --limit=1..10000.');
  if ((from === undefined) !== (to === undefined)) {
    throw Error('Para importar um intervalo, informe --from e --to juntos.');
  }
  if (requested && !isLottery(requested)) throw Error('Modalidade inválida.');
  const games: LotteryKey[] = requested && isLottery(requested) ? [requested] : [...LOTTERY_KEYS];
  let allGood = true;
  try {
    for (const game of games) {
      if (!await importGame(game, from, to, limit)) allGood = false;
    }
  } finally {
    try { await db()?.$disconnect(); } catch { /* cliente já desconectado */ }
  }
  if (!allGood) process.exitCode = 1;
}

main().catch(err => { console.error(`Falha de importação: ${shortError(err)}`); process.exitCode = 1; });
