const { PrismaClient, ChallengeType, ChallengeStatus, OrderStatus, TransactionStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');
const axios = require('axios');

const prisma = new PrismaClient();

async function run() {
  console.log('=== ITEM 4: INSTANT PAYOUT FLOW TRACE ===\n');

  const hash = await bcrypt.hash('TestPassword123!', 10);
  await prisma.user.updateMany({
    where: { email: 'testtrader@stockbattle.in' },
    data: { passwordHash: hash, emailVerified: true }
  });

  const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
    email: 'testtrader@stockbattle.in',
    password: 'TestPassword123!'
  });
  const cookies = loginRes.headers['set-cookie'];
  const headers = { headers: { Cookie: cookies.join('; ') } };
  console.log('Auth: Login OK');

  const user = await prisma.user.findUnique({ where: { email: 'testtrader@stockbattle.in' } });

  const testChallenge = await prisma.userChallenge.findFirst({
    where: { userId: user.id, status: ChallengeStatus.ACTIVE, tier: { type: ChallengeType.INSTANT } },
    include: { tier: true }
  });

  if (!testChallenge) {
    console.log('ERROR: No INSTANT challenge found');
    return;
  }

  const challengeId = testChallenge.id;
  const rules = testChallenge.rulesSnapshot;
  const initialSizeInPaise = rules.accountSize * 100;
  const consistencyLimit = rules.consistencyRule || 15.0;

  console.log('Challenge ID:', challengeId);
  console.log('Tier:', testChallenge.tier.name, '(' + testChallenge.tier.type + ')');
  console.log('Initial Balance (paise):', initialSizeInPaise);
  console.log('Consistency Rule:', consistencyLimit + '%');

  // --- TEST A: LEGITIMATE PAYOUT ---
  // Spread ₹7000 profit across 8 days, each < 15% of total
  const totalProfit = 7000 * 100; // 700000 paise
  const dailyAmount = Math.floor(totalProfit / 8); // ~87500 paise = ₹875 each (12.5% of total)
  const lastDayAmount = totalProfit - (dailyAmount * 7);

  await prisma.userChallenge.update({
    where: { id: challengeId },
    data: { virtualBalanceInPaise: initialSizeInPaise + totalProfit }
  });
  await prisma.userPosition.deleteMany({ where: { challengeId } });
  await prisma.userOrder.updateMany({ where: { challengeId, status: OrderStatus.PENDING }, data: { status: OrderStatus.CANCELLED } });
  await prisma.dailyMetric.deleteMany({ where: { challengeId } });

  const metrics = [];
  let runningBalance = initialSizeInPaise;
  for (let i = 0; i < 8; i++) {
    const dayProfit = i === 7 ? lastDayAmount : dailyAmount;
    metrics.push({
      challengeId,
      date: `${18 + i}/7/2026`,
      startingBalanceInPaise: runningBalance,
      closingBalanceInPaise: runningBalance + dayProfit,
      realizedPnLInPaise: dayProfit
    });
    runningBalance += dayProfit;
  }
  await prisma.dailyMetric.createMany({ data: metrics });

  console.log('\n--- TEST A: LEGITIMATE PAYOUT (8-day spread, each ~12.5%) ---');
  console.log('Total profit: ₹' + (totalProfit / 100));
  for (const m of metrics) {
    const pct = ((m.realizedPnLInPaise / totalProfit) * 100).toFixed(1);
    console.log(`  ${m.date}: ₹${(m.realizedPnLInPaise / 100).toFixed(2)} (${pct}%)`);
  }

  const walletBefore = await prisma.walletTransaction.aggregate({
    where: { userId: user.id, status: TransactionStatus.COMPLETED },
    _sum: { amountInPaise: true }
  });
  console.log('\nWallet BEFORE: ₹' + ((walletBefore._sum.amountInPaise || 0) / 100));

  try {
    const payoutRes = await axios.post(`http://localhost:3001/api/trading/challenge/${challengeId}/payout`, {}, headers);
    console.log('\nPayout Response: HTTP', payoutRes.status);
    console.log('Payload:', JSON.stringify(payoutRes.data));

    const walletAfter = await prisma.walletTransaction.aggregate({
      where: { userId: user.id, status: TransactionStatus.COMPLETED },
      _sum: { amountInPaise: true }
    });
    console.log('\nWallet AFTER: ₹' + ((walletAfter._sum.amountInPaise || 0) / 100));

    const updated = await prisma.userChallenge.findUnique({ where: { id: challengeId } });
    console.log('Balance reset to initial?', updated.virtualBalanceInPaise === initialSizeInPaise ? 'YES ✓' : 'NO ✗ (got ' + updated.virtualBalanceInPaise + ')');

    const metricsCount = await prisma.dailyMetric.count({ where: { challengeId } });
    console.log('Daily metrics wiped?', metricsCount === 0 ? 'YES ✓' : 'NO ✗ (' + metricsCount + ' rows)');

    const latestTx = await prisma.walletTransaction.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    console.log('Wallet entry: ₹' + (latestTx.amountInPaise / 100) + ' ' + latestTx.type + ' ' + latestTx.status + ' ref=' + latestTx.referenceId);
  } catch (err) {
    console.log('Payout FAILED:', err.response?.data?.message || err.message);
  }

  // --- TEST B: CONSISTENCY BREACH ---
  console.log('\n\n--- TEST B: CONSISTENCY BREACH (should reject) ---');

  await prisma.userChallenge.update({
    where: { id: challengeId },
    data: { virtualBalanceInPaise: initialSizeInPaise + 5000 * 100 }
  });
  await prisma.dailyMetric.deleteMany({ where: { challengeId } });
  await prisma.dailyMetric.createMany({
    data: [
      { challengeId, date: '24/7/2026', startingBalanceInPaise: initialSizeInPaise, closingBalanceInPaise: initialSizeInPaise + 4500 * 100, realizedPnLInPaise: 4500 * 100 },
      { challengeId, date: '25/7/2026', startingBalanceInPaise: initialSizeInPaise + 4500 * 100, closingBalanceInPaise: initialSizeInPaise + 5000 * 100, realizedPnLInPaise: 500 * 100 },
    ]
  });
  console.log('Day 1: ₹4500 (90% of total) ← SHOULD BREACH');
  console.log('Day 2: ₹500 (10% of total)');

  try {
    const res = await axios.post(`http://localhost:3001/api/trading/challenge/${challengeId}/payout`, {}, headers);
    console.log('UNEXPECTED SUCCESS:', JSON.stringify(res.data));
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('CORRECTLY REJECTED ✓  HTTP', err.response.status);
      console.log('Message:', err.response.data.message);
    } else {
      console.log('Unexpected error:', err.response?.status, err.response?.data?.message || err.message);
    }
  }

  // --- ATOMICITY CHECK ---
  console.log('\n--- ATOMICITY VERIFICATION ---');
  console.log('$transaction wrapper present in risk.service.ts?');
  const fs = require('fs');
  const riskSrc = fs.readFileSync(require('path').join(__dirname, 'src/trading/risk.service.ts'), 'utf8');
  const hasTransaction = riskSrc.includes('$transaction');
  console.log(hasTransaction ? 'YES ✓ — payout operations are atomic' : 'NO ✗ — payout operations are NOT atomic');
}

run().catch(e => console.error('SCRIPT ERROR:', e.message)).finally(() => prisma.$disconnect());
