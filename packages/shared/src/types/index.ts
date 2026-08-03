// ── Enums ─────────────────────────────────────

export enum Role {
  TRADER = 'TRADER',
  ADMIN = 'ADMIN',
}

export enum OtpType {
  EMAIL_VERIFY = 'EMAIL_VERIFY',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

// ── User Types ───────────────────────────────

/** Full user record — never exposed to clients directly */
export interface User {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  passwordHash: string;
  role: Role;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Sanitised user — safe to send to the frontend */
export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
}

// ── API Response Types ───────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── JWT ──────────────────────────────────────

export interface JwtPayload {
  sub: string;       // userId
  role: Role;
  email: string;
  iat?: number;
  exp?: number;
}

// ── Challenge & Transaction Enums ────────────

export enum ChallengeType {
  ONE_STEP = 'ONE_STEP',
  TWO_STEP = 'TWO_STEP',
  INSTANT = 'INSTANT',
}

export enum ChallengeStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  BONUS = 'BONUS',
  REFERRAL_CREDIT = 'REFERRAL_CREDIT',
  CHALLENGE_PURCHASE = 'CHALLENGE_PURCHASE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ── Public API Models ────────────────────────

export interface ChallengeTierDto {
  id: string;
  name: string;
  type: ChallengeType;
  priceInPaise: number;
  accountSize: number;
  targetPhase1: number;
  targetPhase2: number | null;
  maxLoss: number;
  dailyLossLimit: number;
  minTradingDays: number;
  newsTrading: boolean;
  weekendHolding: boolean;
  payoutSchedule: string;
  profitShare: number;
  consistencyRule: number | null;
}

export interface UserChallengeDto {
  id: string;
  tierId: string;
  status: ChallengeStatus;
  currentPhase: number;
  virtualBalanceInPaise: number;
  dailyStartingBalanceInPaise: number;
  peakDailyEquityInPaise?: number | null;
  failureReason: string | null;
  startDate: string;
  endDate: string | null;
  rulesSnapshot: Record<string, any>;
  tier: ChallengeTierDto;
}

export interface WalletTransactionDto {
  id: string;
  amountInPaise: number;
  type: TransactionType;
  status: TransactionStatus;
  referenceId: string | null;
  createdAt: string;
}

// ── Position & Order Enums & Types ───────────

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export interface UserOrderDto {
  id: string;
  challengeId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  quantity: number;
  priceInPaise: number;
  executedAt: string | null;
  createdAt: string;
}

export interface UserPositionDto {
  id: string;
  challengeId: string;
  symbol: string;
  quantity: number;
  averagePriceInPaise: number;
  updatedAt: string;
}


