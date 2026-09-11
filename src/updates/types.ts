import type {
  SuccessfulPayment,
  RefundedPayment,
  OrderInfo,
} from '../types/telegram.js';

/**
 * Normalized representation of a successful Telegram payment with camelCase accessors
 * and direct reference to the raw Telegram structure.
 */
export interface ParsedSuccessfulPayment {
  currency: string;
  totalAmount: number;
  invoicePayload: string;
  telegramPaymentChargeId: string;
  providerPaymentChargeId: string;
  subscriptionExpirationDate?: number;
  isRecurring?: true;
  isFirstRecurring?: true;
  shippingOptionId?: string;
  orderInfo?: OrderInfo;
  raw: SuccessfulPayment;
}

/**
 * Normalized representation of a refunded payment with camelCase accessors.
 */
export interface ParsedRefundedPayment {
  currency: string;
  totalAmount: number;
  invoicePayload: string;
  telegramPaymentChargeId: string;
  providerPaymentChargeId?: string;
  raw: RefundedPayment;
}
