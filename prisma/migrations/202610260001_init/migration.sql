CREATE TABLE "Draw" (
  "id" TEXT NOT NULL, "lottery" TEXT NOT NULL, "contest" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL, "nextDate" TIMESTAMP(3), "numbers" JSONB NOT NULL,
  "secondNumbers" JSONB, "extra" TEXT, "prizeEstimate" DOUBLE PRECISION,
  "payouts" JSONB, "source" TEXT NOT NULL, "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Draw_lottery_contest_key" ON "Draw"("lottery","contest");
CREATE INDEX "Draw_lottery_contest_idx" ON "Draw"("lottery", "contest" DESC);
CREATE TABLE "SyncRun" (
  "id" TEXT NOT NULL, "lottery" TEXT NOT NULL, "status" TEXT NOT NULL,
  "details" TEXT, "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SyncRun_lottery_createdAt_idx" ON "SyncRun"("lottery", "createdAt" DESC);
