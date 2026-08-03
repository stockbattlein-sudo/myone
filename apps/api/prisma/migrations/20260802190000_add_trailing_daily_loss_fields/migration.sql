-- AlterTable: Add peak daily equity tracking for trailing intraday loss (Model C)
ALTER TABLE "user_challenges" ADD COLUMN "peakDailyEquityInPaise" INTEGER;
