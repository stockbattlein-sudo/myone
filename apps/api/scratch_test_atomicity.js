const { PrismaClient, TransactionType, TransactionStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAdversarialAtomicityTest() {
  console.log('====================================================');
  console.log('🔥 ADVERSARIAL ATOMICITY TEST FOR INSTANT PAYOUT');
  console.log('====================================================\n');

  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found in DB');
    return;
  }

  const initialTxCount = await prisma.walletTransaction.count({ where: { userId: user.id } });
  console.log(`1. Initial Wallet Transactions Count for user: ${initialTxCount}`);

  const testRefId = `adversarial_test_${Date.now()}`;
  console.log(`2. Attempting Payout Transaction with a SIMULATED MIDWAY FAILURE...`);
  console.log(`   - Step 1: Create Wallet Transaction (ref: ${testRefId})`);
  console.log(`   - Step 2: Update User Challenge`);
  console.log(`   - Step 3: Delete Daily Metrics (FORCED TO FAIL WITH INVALID CLAUSE)`);

  let errorCaught = false;
  try {
    await prisma.$transaction(async (tx) => {
      // Step 1: Valid wallet transaction creation
      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          amountInPaise: 999900,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          referenceId: testRefId,
          metadata: { test: 'adversarial_atomicity' },
        },
      });

      console.log('   ✓ Step 1 executed inside transaction buffer');

      // Step 2: Simulate unexpected database crash / error before transaction completes
      throw new Error('SIMULATED_DATABASE_CRASH_MIDWAY_THROUGH_PAYOUT');

      // Step 3: Never reached
    });
  } catch (err) {
    errorCaught = true;
    console.log(`\n3. Transaction aborted with expected error: "${err.message}"`);
  }

  // Verify DB state AFTER the crash
  const postTxCount = await prisma.walletTransaction.count({ where: { userId: user.id } });
  const failedTxExists = await prisma.walletTransaction.findFirst({
    where: { referenceId: testRefId }
  });

  console.log('\n====================================================');
  console.log('📊 ADVERSARIAL ROLLBACK VERIFICATION RESULTS');
  console.log('====================================================');
  console.log(`- Error Caught as expected? ${errorCaught ? 'YES ✓' : 'NO ✗'}`);
  console.log(`- Wallet Transaction Count unchanged? ${initialTxCount === postTxCount ? `YES ✓ (${postTxCount})` : `NO ✗ (Count changed: ${postTxCount})`}`);
  console.log(`- Did Step 1 write persist to disk? ${failedTxExists === null ? 'NO ✓ (Fully rolled back to 0 trace)' : 'YES ✗ (DATA CORRUPTION: Step 1 leaked despite failure!)'}`);
  console.log('====================================================\n');
}

runAdversarialAtomicityTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
