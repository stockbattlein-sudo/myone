-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('ONE_STEP', 'TWO_STEP', 'INSTANT');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'PASSED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BONUS', 'REFERRAL_CREDIT', 'CHALLENGE_PURCHASE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "challenge_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "priceInPaise" INTEGER NOT NULL,
    "accountSize" DOUBLE PRECISION NOT NULL,
    "targetPhase1" DOUBLE PRECISION NOT NULL,
    "targetPhase2" DOUBLE PRECISION,
    "maxLoss" DOUBLE PRECISION NOT NULL,
    "dailyLossLimit" DOUBLE PRECISION NOT NULL,
    "minTradingDays" INTEGER NOT NULL,
    "newsTrading" BOOLEAN NOT NULL DEFAULT true,
    "weekendHolding" BOOLEAN NOT NULL DEFAULT false,
    "payoutSchedule" TEXT NOT NULL,
    "profitShare" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "consistencyRule" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "currentPhase" INTEGER NOT NULL DEFAULT 1,
    "virtualBalance" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "rulesSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountInPaise" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenges" ADD CONSTRAINT "user_challenges_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "challenge_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
