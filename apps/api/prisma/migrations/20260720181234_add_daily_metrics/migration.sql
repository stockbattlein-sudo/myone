-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startingBalanceInPaise" INTEGER NOT NULL,
    "closingBalanceInPaise" INTEGER NOT NULL,
    "realizedPnLInPaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_challengeId_date_key" ON "daily_metrics"("challengeId", "date");

-- AddForeignKey
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "user_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
