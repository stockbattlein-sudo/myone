import { PrismaClient, Role, ChallengeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from parent folder .env
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@stockbattle.in';
  const adminPassword = process.env.ADMIN_PASSWORD || 'S3cure_StockB4ttle_@dmin_Pa$$word!';
  const adminName = process.env.ADMIN_NAME || 'StockBattle Admin';

  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  if (existingAdmin) {
    console.log(`ℹ️  Admin user already exists: ${existingAdmin.email}. Updating details...`);
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
      },
    });
    console.log('✅ Admin credentials updated successfully!');
  } else {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: Role.ADMIN,
        emailVerified: true,
      },
    });
    console.log(`✅ Admin user created: ${admin.email}`);
  }

  // 2. Seed Challenge Tiers
  console.log('🌱 Seeding challenge tiers...');
  await prisma.challengeTier.deleteMany({}); // Reset active tiers to prevent duplicates

  const tiers = [
    // ── TWO STEP TIERS ────────────────────────
    {
      name: '₹2L Tier',
      type: ChallengeType.TWO_STEP,
      priceInPaise: 299900,
      accountSize: 200000.0,
      targetPhase1: 10.0,
      targetPhase2: 5.0,
      maxLoss: 10.0,
      dailyLossLimit: 3.0,
      minTradingDays: 5,
      newsTrading: true,
      weekendHolding: false,
      payoutSchedule: 'Weekly',
      profitShare: 80.0,
      consistencyRule: null,
    },
    {
      name: '₹5L Tier',
      type: ChallengeType.TWO_STEP,
      priceInPaise: 499900,
      accountSize: 500000.0,
      targetPhase1: 10.0,
      targetPhase2: 5.0,
      maxLoss: 10.0,
      dailyLossLimit: 3.0,
      minTradingDays: 5,
      newsTrading: true,
      weekendHolding: false,
      payoutSchedule: 'Weekly',
      profitShare: 80.0,
      consistencyRule: null,
    },
    {
      name: '₹10L Tier',
      type: ChallengeType.TWO_STEP,
      priceInPaise: 899900,
      accountSize: 1000000.0,
      targetPhase1: 10.0,
      targetPhase2: 5.0,
      maxLoss: 10.0,
      dailyLossLimit: 3.0,
      minTradingDays: 5,
      newsTrading: true,
      weekendHolding: false,
      payoutSchedule: 'Weekly',
      profitShare: 80.0,
      consistencyRule: null,
    },

    // ── ONE STEP TIERS ────────────────────────
    {
      name: '₹2L Tier',
      type: ChallengeType.ONE_STEP,
      priceInPaise: 499900,
      accountSize: 200000.0,
      targetPhase1: 10.0,
      targetPhase2: null,
      maxLoss: 6.0,
      dailyLossLimit: 2.0,
      minTradingDays: 5,
      newsTrading: true,
      weekendHolding: false,
      payoutSchedule: 'Weekly',
      profitShare: 80.0,
      consistencyRule: null,
    },
    {
      name: '₹5L Tier',
      type: ChallengeType.ONE_STEP,
      priceInPaise: 799900,
      accountSize: 500000.0,
      targetPhase1: 10.0,
      targetPhase2: null,
      maxLoss: 6.0,
      dailyLossLimit: 2.0,
      minTradingDays: 5,
      newsTrading: true,
      weekendHolding: false,
      payoutSchedule: 'Weekly',
      profitShare: 80.0,
      consistencyRule: null,
    },
    {
      name: '₹10L Tier',
      type: ChallengeType.ONE_STEP,
      priceInPaise: 1299900,
      accountSize: 1000000.0,
      targetPhase1: 10.0,
      targetPhase2: null,
      maxLoss: 6.0,
      dailyLossLimit: 2.0,
      minTradingDays: 5,
      newsTrading: true,
      weekendHolding: false,
      payoutSchedule: 'Weekly',
      profitShare: 80.0,
      consistencyRule: null,
    },

    // ── INSTANT TIERS ─────────────────────────
    {
      name: '₹50K Tier',
      type: ChallengeType.INSTANT,
      priceInPaise: 309900,
      accountSize: 50000.0,
      targetPhase1: 0.0, // No Target
      targetPhase2: null,
      maxLoss: 4.0, // Max Drawdown
      dailyLossLimit: 3.0, // Daily Drawdown
      minTradingDays: 0,
      newsTrading: true,
      weekendHolding: true,
      payoutSchedule: 'Weekly',
      profitShare: 70.0,
      consistencyRule: 15.0,
    },
    {
      name: '₹1L Tier',
      type: ChallengeType.INSTANT,
      priceInPaise: 409900,
      accountSize: 100000.0,
      targetPhase1: 0.0,
      targetPhase2: null,
      maxLoss: 4.0,
      dailyLossLimit: 3.0,
      minTradingDays: 0,
      newsTrading: true,
      weekendHolding: true,
      payoutSchedule: 'Weekly',
      profitShare: 70.0,
      consistencyRule: 15.0,
    },
    {
      name: '₹1.5L Tier',
      type: ChallengeType.INSTANT,
      priceInPaise: 509900,
      accountSize: 150000.0,
      targetPhase1: 0.0,
      targetPhase2: null,
      maxLoss: 4.0,
      dailyLossLimit: 3.0,
      minTradingDays: 0,
      newsTrading: true,
      weekendHolding: true,
      payoutSchedule: 'Weekly',
      profitShare: 70.0,
      consistencyRule: 15.0,
    },
  ];

  for (const tier of tiers) {
    const created = await prisma.challengeTier.create({
      data: tier,
    });
    console.log(`✅ Seeded tier: [${created.type}] ${created.name} for ₹${created.priceInPaise / 100}`);
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
