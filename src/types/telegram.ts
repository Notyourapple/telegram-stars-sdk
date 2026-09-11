/**
 * Official Telegram Bot API Types for Telegram Stars
 * Based strictly on https://core.telegram.org/bots/api
 */

/**
 * Represents a Telegram user or bot.
 */
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
  can_connect_to_business?: boolean;
  has_main_web_app?: boolean;
}

/**
 * Represents a chat in Telegram.
 */
export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_forum?: boolean;
}

/**
 * Represents a portion of the price for goods or services.
 * For Telegram Stars, the currency is always "XTR" and amount is an integer count of Stars.
 */
export interface LabeledPrice {
  label: string;
  amount: number;
}

/**
 * Describes an amount of Telegram Stars.
 */
export interface StarAmount {
  /**
   * Integer amount of Telegram Stars, rounded to 0; can be negative.
   */
  amount: number;

  /**
   * Optional number of 1/1,000,000,000 shares of Telegram Stars (-999,999,999 to 999,999,999).
   */
  nanostar_amount?: number;
}

/**
 * State of a revenue withdrawal operation.
 */
export interface RevenueWithdrawalStatePending {
  type: 'pending';
}

export interface RevenueWithdrawalStateSucceeded {
  type: 'succeeded';
  date: number;
  url: string;
}

export interface RevenueWithdrawalStateFailed {
  type: 'failed';
}

export type RevenueWithdrawalState =
  | RevenueWithdrawalStatePending
  | RevenueWithdrawalStateSucceeded
  | RevenueWithdrawalStateFailed;

/**
 * Information about an affiliate.
 */
export interface AffiliateInfo {
  affiliate_user?: TelegramUser;
  affiliate_chat?: TelegramChat;
  commission_per_mille: number;
  amount: number;
  nanostar_amount?: number;
}

/**
 * Partner in a Telegram Star transaction.
 */
export interface TransactionPartnerUser {
  type: 'user';
  transaction_type:
    | 'invoice_payment'
    | 'paid_media_payment'
    | 'gift_purchase'
    | 'premium_purchase'
    | 'business_account_transfer'
    | string;
  user: TelegramUser;
  affiliate?: AffiliateInfo;
  invoice_payload?: string;
  subscription_period?: number;
  paid_media_payload?: string;
}

export interface TransactionPartnerChat {
  type: 'chat';
  chat: TelegramChat;
}

export interface TransactionPartnerAffiliateProgram {
  type: 'affiliate_program';
  sponsor_user?: TelegramUser;
  commission_per_mille: number;
}

export interface TransactionPartnerFragment {
  type: 'fragment';
  withdrawal_state?: RevenueWithdrawalState;
}

export interface TransactionPartnerTelegramAds {
  type: 'telegram_ads';
}

export interface TransactionPartnerTelegramApi {
  type: 'telegram_api';
  request_count: number;
}

export interface TransactionPartnerOther {
  type: 'other';
}

export type TransactionPartner =
  | TransactionPartnerUser
  | TransactionPartnerChat
  | TransactionPartnerAffiliateProgram
  | TransactionPartnerFragment
  | TransactionPartnerTelegramAds
  | TransactionPartnerTelegramApi
  | TransactionPartnerOther;

/**
 * Describes a Telegram Star transaction.
 */
export interface StarTransaction {
  /**
   * Unique identifier of the transaction. Coincides with the identifier of the original
   * transaction for refund transactions. Coincides with SuccessfulPayment.telegram_payment_charge_id
   * for successful incoming payments from users.
   */
  id: string;

  /**
   * Integer amount of Telegram Stars transferred by the transaction.
   */
  amount: number;

  /**
   * Optional number of 1/1,000,000,000 shares of Telegram Stars (0 to 999,999,999).
   */
  nanostar_amount?: number;

  /**
   * Date the transaction was created in Unix time.
   */
  date: number;

  /**
   * Source of an incoming transaction. Only present for incoming transactions.
   */
  source?: TransactionPartner;

  /**
   * Receiver of an outgoing transaction. Only present for outgoing transactions.
   */
  receiver?: TransactionPartner;
}

/**
 * List of Telegram Star transactions.
 */
export interface StarTransactions {
  transactions: StarTransaction[];
}

/**
 * Shipping address information.
 */
export interface ShippingAddress {
  country_code: string;
  state: string;
  city: string;
  street_line1: string;
  street_line2: string;
  post_code: string;
}

/**
 * Order information provided by the user.
 */
export interface OrderInfo {
  name?: string;
  phone_number?: string;
  email?: string;
  shipping_address?: ShippingAddress;
}

/**
 * Information about a successful payment.
 */
export interface SuccessfulPayment {
  /**
   * Three-letter ISO 4217 currency code, or "XTR" for payments in Telegram Stars.
   */
  currency: string;

  /**
   * Total price in the smallest units of the currency (for Stars, integer amount).
   */
  total_amount: number;

  /**
   * Bot-specified invoice payload.
   */
  invoice_payload: string;

  /**
   * Expiration date of the subscription in Unix time (for recurring payments only).
   */
  subscription_expiration_date?: number;

  /**
   * True if recurring payment for a subscription.
   */
  is_recurring?: true;

  /**
   * True if first payment for a subscription.
   */
  is_first_recurring?: true;

  /**
   * Identifier of the shipping option chosen by the user.
   */
  shipping_option_id?: string;

  /**
   * Order info provided by the user.
   */
  order_info?: OrderInfo;

  /**
   * Telegram payment identifier.
   */
  telegram_payment_charge_id: string;

  /**
   * Provider payment identifier.
   */
  provider_payment_charge_id: string;
}

/**
 * Information about a refunded payment.
 */
export interface RefundedPayment {
  /**
   * Three-letter ISO 4217 currency code, or "XTR" for payments in Telegram Stars.
   */
  currency: string;

  /**
   * Total refunded price in the smallest units of the currency.
   */
  total_amount: number;

  /**
   * Bot-specified invoice payload.
   */
  invoice_payload: string;

  /**
   * Telegram payment identifier.
   */
  telegram_payment_charge_id: string;

  /**
   * Provider payment identifier.
   */
  provider_payment_charge_id?: string;
}

/**
 * Incoming pre-checkout query from Telegram.
 */
export interface PreCheckoutQuery {
  /**
   * Unique query identifier.
   */
  id: string;

  /**
   * User who sent the query.
   */
  from: TelegramUser;

  /**
   * Currency code ("XTR" for Stars).
   */
  currency: string;

  /**
   * Total price in Stars.
   */
  total_amount: number;

  /**
   * Bot-specified invoice payload.
   */
  invoice_payload: string;

  /**
   * Identifier of chosen shipping option.
   */
  shipping_option_id?: string;

  /**
   * Order info provided by the user.
   */
  order_info?: OrderInfo;
}

/**
 * Information about paid media purchased by a user.
 */
export interface PaidMediaPurchased {
  from: TelegramUser;
  paid_media_payload: string;
}

/**
 * Parameters returned in Telegram API error responses.
 */
export interface TelegramResponseParameters {
  migrate_to_chat_id?: number;
  retry_after?: number;
}

/**
 * Generic Telegram Bot API envelope response.
 */
export interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
  parameters?: TelegramResponseParameters;
}

/**
 * Minimal representation of an incoming Telegram Update for type narrowing.
 */
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: TelegramUser;
    chat: TelegramChat;
    date: number;
    successful_payment?: SuccessfulPayment;
    refunded_payment?: RefundedPayment;
    [key: string]: unknown;
  };
  pre_checkout_query?: PreCheckoutQuery;
  purchased_paid_media?: PaidMediaPurchased;
  [key: string]: unknown;
}
