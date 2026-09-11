import type {
  PreCheckoutQuery,
  SuccessfulPayment,
  RefundedPayment,
  PaidMediaPurchased,
} from '../types/telegram.js';
import type {
  ParsedSuccessfulPayment,
  ParsedRefundedPayment,
} from './types.js';

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

/**
 * Type guard to check if an object is a Telegram update containing a pre_checkout_query.
 */
export function isPreCheckoutQueryUpdate(
  update: unknown
): update is { pre_checkout_query: PreCheckoutQuery } {
  if (!isRecord(update)) return false;
  const q = update['pre_checkout_query'];
  return (
    isRecord(q) &&
    typeof q['id'] === 'string' &&
    typeof q['currency'] === 'string' &&
    typeof q['total_amount'] === 'number' &&
    typeof q['invoice_payload'] === 'string'
  );
}

/**
 * Extracts a PreCheckoutQuery object from an update if present.
 */
export function getPreCheckoutQuery(
  update: unknown
): PreCheckoutQuery | undefined {
  if (isPreCheckoutQueryUpdate(update)) {
    return update.pre_checkout_query;
  }
  return undefined;
}

/**
 * Type guard to check if an update or message contains a successful_payment.
 */
export function isSuccessfulPaymentUpdate(
  update: unknown
): update is { message: { successful_payment: SuccessfulPayment } } {
  if (!isRecord(update)) return false;
  const msg = update['message'];
  if (!isRecord(msg)) return false;
  const payment = msg['successful_payment'];
  return (
    isRecord(payment) &&
    typeof payment['currency'] === 'string' &&
    typeof payment['total_amount'] === 'number' &&
    typeof payment['invoice_payload'] === 'string' &&
    typeof payment['telegram_payment_charge_id'] === 'string'
  );
}

/**
 * Safely extracts raw SuccessfulPayment from an update or message object.
 */
export function getSuccessfulPayment(
  updateOrMessage: unknown
): SuccessfulPayment | undefined {
  if (!isRecord(updateOrMessage)) return undefined;

  // Direct SuccessfulPayment object
  if (
    typeof updateOrMessage['telegram_payment_charge_id'] === 'string' &&
    typeof updateOrMessage['total_amount'] === 'number'
  ) {
    return updateOrMessage as unknown as SuccessfulPayment;
  }

  // Update with message.successful_payment
  const msg = updateOrMessage['message'];
  if (isRecord(msg) && isRecord(msg['successful_payment'])) {
    return msg['successful_payment'] as unknown as SuccessfulPayment;
  }

  // Direct message with successful_payment
  if (isRecord(updateOrMessage['successful_payment'])) {
    return updateOrMessage['successful_payment'] as unknown as SuccessfulPayment;
  }

  return undefined;
}

/**
 * Parses and returns a strongly-typed, normalized payment helper from an update or message.
 * Provides camelCase properties and easy access to telegramPaymentChargeId.
 */
export function parseSuccessfulPayment(
  updateOrMessage: unknown
): ParsedSuccessfulPayment | undefined {
  const raw = getSuccessfulPayment(updateOrMessage);
  if (!raw) return undefined;

  return {
    currency: raw.currency,
    totalAmount: raw.total_amount,
    invoicePayload: raw.invoice_payload,
    telegramPaymentChargeId: raw.telegram_payment_charge_id,
    providerPaymentChargeId: raw.provider_payment_charge_id,
    subscriptionExpirationDate: raw.subscription_expiration_date,
    isRecurring: raw.is_recurring,
    isFirstRecurring: raw.is_first_recurring,
    shippingOptionId: raw.shipping_option_id,
    orderInfo: raw.order_info,
    raw,
  };
}

/**
 * Type guard to check if an update or message contains a refunded_payment.
 */
export function isRefundedPaymentUpdate(
  update: unknown
): update is { message: { refunded_payment: RefundedPayment } } {
  if (!isRecord(update)) return false;
  const msg = update['message'];
  if (!isRecord(msg)) return false;
  const refunded = msg['refunded_payment'];
  return (
    isRecord(refunded) &&
    typeof refunded['currency'] === 'string' &&
    typeof refunded['total_amount'] === 'number' &&
    typeof refunded['telegram_payment_charge_id'] === 'string'
  );
}

/**
 * Safely extracts raw RefundedPayment from an update or message object.
 */
export function getRefundedPayment(
  updateOrMessage: unknown
): RefundedPayment | undefined {
  if (!isRecord(updateOrMessage)) return undefined;

  if (
    typeof updateOrMessage['telegram_payment_charge_id'] === 'string' &&
    typeof updateOrMessage['total_amount'] === 'number' &&
    updateOrMessage['currency'] === 'XTR'
  ) {
    return updateOrMessage as unknown as RefundedPayment;
  }

  const msg = updateOrMessage['message'];
  if (isRecord(msg) && isRecord(msg['refunded_payment'])) {
    return msg['refunded_payment'] as unknown as RefundedPayment;
  }

  if (isRecord(updateOrMessage['refunded_payment'])) {
    return updateOrMessage['refunded_payment'] as unknown as RefundedPayment;
  }

  return undefined;
}

/**
 * Parses and returns a strongly-typed normalized refunded payment helper.
 */
export function parseRefundedPayment(
  updateOrMessage: unknown
): ParsedRefundedPayment | undefined {
  const raw = getRefundedPayment(updateOrMessage);
  if (!raw) return undefined;

  return {
    currency: raw.currency,
    totalAmount: raw.total_amount,
    invoicePayload: raw.invoice_payload,
    telegramPaymentChargeId: raw.telegram_payment_charge_id,
    providerPaymentChargeId: raw.provider_payment_charge_id,
    raw,
  };
}

/**
 * Type guard to check if an update contains purchased_paid_media.
 */
export function isPaidMediaPurchasedUpdate(
  update: unknown
): update is { purchased_paid_media: PaidMediaPurchased } {
  if (!isRecord(update)) return false;
  const pm = update['purchased_paid_media'];
  return (
    isRecord(pm) &&
    isRecord(pm['from']) &&
    typeof pm['paid_media_payload'] === 'string'
  );
}

/**
 * Safely extracts paid media purchased information from an update.
 */
export function getPaidMediaPurchased(
  update: unknown
): PaidMediaPurchased | undefined {
  if (isPaidMediaPurchasedUpdate(update)) {
    return update.purchased_paid_media;
  }
  return undefined;
}
