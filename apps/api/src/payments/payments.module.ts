import { Module, forwardRef } from '@nestjs/common';
import { RazorpayMockService } from './razorpay-mock.service';
import { PaymentsController } from './payments.controller';
import { ChallengesModule } from '../challenges/challenges.module';

@Module({
  imports: [forwardRef(() => ChallengesModule)],
  providers: [RazorpayMockService],
  controllers: [PaymentsController],
  exports: [RazorpayMockService],
})
export class PaymentsModule {}
