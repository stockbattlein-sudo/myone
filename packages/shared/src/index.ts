// ── Types ─────────────────────────────────────
export { Role, OtpType, ChallengeType, ChallengeStatus, TransactionType, TransactionStatus, OrderSide, OrderType, OrderStatus } from './types/index';
export type {
  User,
  SafeUser,
  ApiResponse,
  PaginatedResponse,
  JwtPayload,
  ChallengeTierDto,
  UserChallengeDto,
  WalletTransactionDto,
  UserOrderDto,
  UserPositionDto,
} from './types/index';

// ── Constants ────────────────────────────────
export { LEGAL_DISCLAIMER, APP_NAME } from './constants/legal';

// ── Validation Schemas ───────────────────────
export {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './validation/auth';
export type {
  SignupInput,
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './validation/auth';
