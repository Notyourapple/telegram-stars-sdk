/**
 * @YOUR_GITHUB_USERNAME/telegram-stars
 * Production-grade Telegram Stars SDK for Node.js / TypeScript
 */

export { TelegramStarsClient } from './sdk.js';

// API Client & Transport
export { TelegramApiClient } from './client/telegram-client.js';
export type { CallMethodOptions } from './client/telegram-client.js';
export { redactToken, sanitizeHeaders } from './client/redact.js';
export { validateConfig } from './client/config-validator.js';
export { executeWithRetry, calculateBackoff, isRetryableError } from './client/retry.js';
export type { RetryOptions } from './client/retry.js';
export { sendHttpRequest } from './client/transport.js';
export type { TransportRequestOptions } from './client/transport.js';

// Domain Services
export { PaymentsService } from './payments/payments.js';
export { BalanceService } from './balance/balance.js';
export { TransactionsService } from './transactions/transactions.js';

// Update Helpers
export {
  isPreCheckoutQueryUpdate,
  getPreCheckoutQuery,
  isSuccessfulPaymentUpdate,
  getSuccessfulPayment,
  parseSuccessfulPayment,
  isRefundedPaymentUpdate,
  getRefundedPayment,
  parseRefundedPayment,
  isPaidMediaPurchasedUpdate,
  getPaidMediaPurchased,
} from './updates/update-helpers.js';

// Structured Errors
export {
  TelegramStarsError,
  TelegramConfigurationError,
  TelegramValidationError,
  TelegramNetworkError,
  TelegramTimeoutError,
  TelegramApiError,
  TelegramRateLimitError,
} from './errors/index.js';

// TypeScript Types
export type {
  TelegramStarsConfig,
  ResolvedTelegramStarsConfig,
  Logger,
  FetchFunction,
} from './types/config.js';

export type {
  TelegramUser,
  TelegramChat,
  LabeledPrice,
  StarAmount,
  StarTransaction,
  StarTransactions,
  TransactionPartner,
  TransactionPartnerUser,
  TransactionPartnerChat,
  TransactionPartnerAffiliateProgram,
  TransactionPartnerFragment,
  TransactionPartnerTelegramAds,
  TransactionPartnerTelegramApi,
  TransactionPartnerOther,
  RevenueWithdrawalState,
  RevenueWithdrawalStatePending,
  RevenueWithdrawalStateSucceeded,
  RevenueWithdrawalStateFailed,
  AffiliateInfo,
  ShippingAddress,
  OrderInfo,
  SuccessfulPayment,
  RefundedPayment,
  PreCheckoutQuery,
  PaidMediaPurchased,
  TelegramResponse,
  TelegramResponseParameters,
  TelegramUpdate,
} from './types/telegram.js';

export type {
  CreateInvoiceOptions,
  CreateInvoiceLinkOptions,
  AnswerPreCheckoutQueryOptions,
  RefundOptions,
  EditSubscriptionOptions,
} from './payments/types.js';

export type { GetBalanceOptions } from './balance/types.js';

export type {
  ListTransactionsOptions,
  IterateTransactionsOptions,
} from './transactions/types.js';

export type {
  ParsedSuccessfulPayment,
  ParsedRefundedPayment,
} from './updates/types.js';
