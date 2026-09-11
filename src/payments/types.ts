/**
 * Types and options for Telegram Stars payments
 */

export interface CreateInvoiceOptions {
  /**
   * Unique identifier for the target chat or username of the target channel/supergroup.
   */
  chatId: number | string;

  /**
   * Product name, 1-32 characters.
   */
  title: string;

  /**
   * Product description, 1-255 characters.
   */
  description: string;

  /**
   * Bot-defined invoice payload, 1-128 bytes. Merchant internal order reference.
   */
  payload: string;

  /**
   * Price in Telegram Stars (integer amount > 0).
   */
  amount: number;

  /**
   * Optional portion label for price breakdown. Defaults to the product title.
   */
  label?: string;

  /**
   * Unique deep-linking parameter.
   */
  startParameter?: string;

  /**
   * Product photo URL.
   */
  photoUrl?: string;
  photoSize?: number;
  photoWidth?: number;
  photoHeight?: number;

  /**
   * Optional customer detail flags.
   */
  needName?: boolean;
  needPhoneNumber?: boolean;
  needEmail?: boolean;
  needShippingAddress?: boolean;
  sendPhoneNumberToProvider?: boolean;
  sendEmailToProvider?: boolean;
  isFlexible?: boolean;

  /**
   * Message delivery options.
   */
  disableNotification?: boolean;
  protectContent?: boolean;
  messageThreadId?: number;
  messageEffectId?: string;
  replyParameters?: Record<string, unknown>;
  replyMarkup?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface CreateInvoiceLinkOptions {
  /**
   * Product name, 1-32 characters.
   */
  title: string;

  /**
   * Product description, 1-255 characters.
   */
  description: string;

  /**
   * Bot-defined invoice payload, 1-128 bytes.
   */
  payload: string;

  /**
   * Price in Telegram Stars (integer amount > 0).
   */
  amount: number;

  /**
   * Optional portion label. Defaults to title.
   */
  label?: string;

  /**
   * Number of seconds the subscription will be active before renewal.
   * For Telegram Stars recurring subscriptions, currently must always be 2592000 (30 days).
   * Amount must not exceed 10,000 Stars.
   */
  subscriptionPeriod?: number;

  /**
   * Unique identifier of business connection on behalf of which link is created.
   */
  businessConnectionId?: string;

  /**
   * Photo options.
   */
  photoUrl?: string;
  photoSize?: number;
  photoWidth?: number;
  photoHeight?: number;

  /**
   * Optional customer flags.
   */
  needName?: boolean;
  needPhoneNumber?: boolean;
  needEmail?: boolean;
  needShippingAddress?: boolean;
  sendPhoneNumberToProvider?: boolean;
  sendEmailToProvider?: boolean;
  isFlexible?: boolean;

  signal?: AbortSignal;
}

export interface AnswerPreCheckoutQueryOptions {
  /**
   * Unique query identifier from PreCheckoutQuery.
   */
  preCheckoutQueryId: string;

  /**
   * True to approve payment, False to reject.
   */
  ok: boolean;

  /**
   * Error message displayed to user if ok is false.
   */
  errorMessage?: string;

  signal?: AbortSignal;
}

export interface RefundOptions {
  /**
   * Identifier of the user whose payment will be refunded.
   */
  userId: number;

  /**
   * Telegram payment charge identifier from SuccessfulPayment.telegram_payment_charge_id.
   */
  telegramPaymentChargeId: string;

  signal?: AbortSignal;
}

export interface EditSubscriptionOptions {
  /**
   * Identifier of the user whose subscription will be edited.
   */
  userId: number;

  /**
   * Telegram payment identifier for the subscription.
   */
  telegramPaymentChargeId: string;

  /**
   * Pass True to cancel extension; pass False to allow user to re-enable.
   */
  isCanceled: boolean;

  signal?: AbortSignal;
}
