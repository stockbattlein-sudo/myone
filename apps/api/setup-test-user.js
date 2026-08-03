const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Setting up test user...');

  // 1. Create / Update User
  const email = 'testtrader@stockbattle.in';
  const password = 'Password123!';
  const name = 'Test Trader';

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      emailVerified: true,
    },
    create: {
      email,
      name,
      passwordHash,
      role: Role.TRADER,
      emailVerified: true,
    },
  });
  console.log(`✅ User ${user.email} verified and set up!`);

  // 2. Set Wallet Balance to ₹10,000 (1000000 paise)
  // Clean up existing transaction logs for this user to make it clean
  await prisma.walletTransaction.deleteMany({
    where: { userId: user.id }
  });

  const transaction = await prisma.walletTransaction.create({
    data: {
      userId: user.id,
      amountInPaise: 1000000, // ₹10,000
      type: 'DEPOSIT',
      status: 'COMPLETED',
      referenceId: 'MOCK_SETUP_DEPOSIT',
    }
  });
  console.log(`✅ Deposited ₹10,000 into user wallet.`);

  // Clean up old challenges for this user so we start fresh
  const oldChallenges = await prisma.userChallenge.findMany({
    where: { userId: user.id }
  });
  for (const c of oldChallenges) {
    await prisma.userPosition.deleteMany({ where: { challengeId: c.id } });
    await prisma.userOrder.deleteMany({ where: { challengeId: c.id } });
    await prisma.dailyMetric.deleteMany({ where: { challengeId: c.id } });
  }
  await prisma.userChallenge.deleteMany({
    where: { userId: user.id }
  });
  console.log('🧹 Cleaned up old challenges for this user.');

  console.log('🎉 Setup complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
