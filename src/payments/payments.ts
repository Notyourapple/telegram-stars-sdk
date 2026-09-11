import type { TelegramApiClient } from '../client/telegram-client.js';
import type {
  CreateInvoiceOptions,
  CreateInvoiceLinkOptions,
  AnswerPreCheckoutQueryOptions,
  RefundOptions,
  EditSubscriptionOptions,
} from './types.js';
import { TelegramValidationError } from '../errors/base.js';

export class PaymentsService {
  constructor(private readonly client: TelegramApiClient) {}

  /**
   * Sends a Telegram Stars invoice to a specific chat.
   * Uses official Telegram Bot API `sendInvoice` with currency "XTR".
   * Note: Payment mutations are NEVER retried automatically.
   */
  public async createInvoice(
    options: CreateInvoiceOptions
  ): Promise<Record<string, unknown>> {
    return this.sendInvoice(options);
  }

  /**
   * Alias for createInvoice.
   */
  public async sendInvoice(
    options: CreateInvoiceOptions
  ): Promise<Record<string, unknown>> {
    this.validateInvoiceParams(options);

    const payload: Record<string, unknown> = {
      chat_id: options.chatId,
      title: options.title,
      description: options.description,
      payload: options.payload,
      provider_token: '', // Must be empty string for Telegram Stars
      currency: 'XTR', // Official currency tag for Telegram Stars
      prices: [
        {
          label: options.label ?? options.title,
          amount: options.amount,
        },
      ],
    };

    if (options.startParameter !== undefined) {
      payload['start_parameter'] = options.startParameter;
    }
    if (options.photoUrl !== undefined) {
      payload['photo_url'] = options.photoUrl;
    }
    if (options.photoSize !== undefined) {
      payload['photo_size'] = options.photoSize;
    }
    if (options.photoWidth !== undefined) {
      payload['photo_width'] = options.photoWidth;
    }
    if (options.photoHeight !== undefined) {
      payload['photo_height'] = options.photoHeight;
    }
    if (options.needName !== undefined) {
      payload['need_name'] = options.needName;
    }
    if (options.needPhoneNumber !== undefined) {
      payload['need_phone_number'] = options.needPhoneNumber;
    }
    if (options.needEmail !== undefined) {
      payload['need_email'] = options.needEmail;
    }
    if (options.needShippingAddress !== undefined) {
      payload['need_shipping_address'] = options.needShippingAddress;
    }
    if (options.sendPhoneNumberToProvider !== undefined) {
      payload['send_phone_number_to_provider'] = options.sendPhoneNumberToProvider;
    }
    if (options.sendEmailToProvider !== undefined) {
      payload['send_email_to_provider'] = options.sendEmailToProvider;
    }
    if (options.isFlexible !== undefined) {
      payload['is_flexible'] = options.isFlexible;
    }
    if (options.disableNotification !== undefined) {
      payload['disable_notification'] = options.disableNotification;
    }
    if (options.protectContent !== undefined) {
      payload['protect_content'] = options.protectContent;
    }
    if (options.messageThreadId !== undefined) {
      payload['message_thread_id'] = options.messageThreadId;
    }
    if (options.messageEffectId !== undefined) {
      payload['message_effect_id'] = options.messageEffectId;
    }
    if (options.replyParameters !== undefined) {
      payload['reply_parameters'] = options.replyParameters;
    }
    if (options.replyMarkup !== undefined) {
      payload['reply_markup'] = options.replyMarkup;
    }

    return this.client.callMethod<Record<string, unknown>>(
      'sendInvoice',
      payload,
      {
        signal: options.signal,
        isSafeMethod: false, // Mutation - never retry
      }
    );
  }

  /**
   * Creates a shareable link for a Telegram Stars invoice.
   * Uses official Telegram Bot API `createInvoiceLink` with currency "XTR".
   */
  public async createInvoiceLink(
    options: CreateInvoiceLinkOptions
  ): Promise<string> {
    this.validateInvoiceParams(options);

    const payload: Record<string, unknown> = {
      title: options.title,
      description: options.description,
      payload: options.payload,
      provider_token: '', // Must be empty string for Telegram Stars
      currency: 'XTR',
      prices: [
        {
          label: options.label ?? options.title,
          amount: options.amount,
        },
      ],
    };

    if (options.subscriptionPeriod !== undefined) {
      // Official Telegram requirement for Stars subscription
      if (options.subscriptionPeriod !== 2592000) {
        throw new TelegramValidationError(
          'subscriptionPeriod for Telegram Stars subscriptions must currently be 2592000 (30 days).',
          'subscriptionPeriod'
        );
      }
      if (options.amount > 10000) {
        throw new TelegramValidationError(
          'Subscription price must not exceed 10000 Telegram Stars.',
          'amount'
        );
      }
      payload['subscription_period'] = options.subscriptionPeriod;
    }

    if (options.businessConnectionId !== undefined) {
      payload['business_connection_id'] = options.businessConnectionId;
    }
    if (options.photoUrl !== undefined) {
      payload['photo_url'] = options.photoUrl;
    }
    if (options.photoSize !== undefined) {
      payload['photo_size'] = options.photoSize;
    }
    if (options.photoWidth !== undefined) {
      payload['photo_width'] = options.photoWidth;
    }
    if (options.photoHeight !== undefined) {
      payload['photo_height'] = options.photoHeight;
    }
    if (options.needName !== undefined) {
      payload['need_name'] = options.needName;
    }
    if (options.needPhoneNumber !== undefined) {
      payload['need_phone_number'] = options.needPhoneNumber;
    }
    if (options.needEmail !== undefined) {
      payload['need_email'] = options.needEmail;
    }
    if (options.needShippingAddress !== undefined) {
      payload['need_shipping_address'] = options.needShippingAddress;
    }
    if (options.sendPhoneNumberToProvider !== undefined) {
      payload['send_phone_number_to_provider'] = options.sendPhoneNumberToProvider;
    }
    if (options.sendEmailToProvider !== undefined) {
      payload['send_email_to_provider'] = options.sendEmailToProvider;
    }
    if (options.isFlexible !== undefined) {
      payload['is_flexible'] = options.isFlexible;
    }

    return this.client.callMethod<string>('createInvoiceLink', payload, {
      signal: options.signal,
      isSafeMethod: false,
    });
  }

  /**
   * Responds to an incoming pre_checkout_query update.
   * Note: The Telegram Bot API must receive an answer within 10 seconds.
   */
  public async answerPreCheckoutQuery(
    options: AnswerPreCheckoutQueryOptions
  ): Promise<boolean> {
    if (!options.preCheckoutQueryId || options.preCheckoutQueryId.trim().length === 0) {
      throw new TelegramValidationError(
        'preCheckoutQueryId must be a non-empty string.',
        'preCheckoutQueryId'
      );
    }

    if (!options.ok && (!options.errorMessage || options.errorMessage.trim().length === 0)) {
      throw new TelegramValidationError(
        'errorMessage is required when rejecting a pre-checkout query (ok: false).',
        'errorMessage'
      );
    }

    const payload: Record<string, unknown> = {
      pre_checkout_query_id: options.preCheckoutQueryId,
      ok: options.ok,
    };

    if (!options.ok && options.errorMessage) {
      payload['error_message'] = options.errorMessage;
    }

    return this.client.callMethod<boolean>('answerPreCheckoutQuery', payload, {
      signal: options.signal,
      isSafeMethod: false,
    });
  }

  /**
   * Convenience helper to approve an incoming pre-checkout query.
   */
  public async approvePreCheckoutQuery(
    preCheckoutQueryId: string,
    options?: { signal?: AbortSignal }
  ): Promise<boolean> {
    return this.answerPreCheckoutQuery({
      preCheckoutQueryId,
      ok: true,
      signal: options?.signal,
    });
  }

  /**
   * Convenience helper to reject an incoming pre-checkout query with an explanation.
   */
  public async rejectPreCheckoutQuery(
    preCheckoutQueryId: string,
    errorMessage: string,
    options?: { signal?: AbortSignal }
  ): Promise<boolean> {
    return this.answerPreCheckoutQuery({
      preCheckoutQueryId,
      ok: false,
      errorMessage,
      signal: options?.signal,
    });
  }

  /**
   * Refunds a successful Telegram Stars payment.
   * Calls official Telegram Bot API `refundStarPayment`.
   */
  public async refund(options: RefundOptions): Promise<boolean> {
    if (
      typeof options.userId !== 'number' ||
      !Number.isInteger(options.userId) ||
      options.userId <= 0
    ) {
      throw new TelegramValidationError(
        'userId must be a positive integer.',
        'userId'
      );
    }

    if (
      !options.telegramPaymentChargeId ||
      options.telegramPaymentChargeId.trim().length === 0
    ) {
      throw new TelegramValidationError(
        'telegramPaymentChargeId must be a non-empty string.',
        'telegramPaymentChargeId'
      );
    }

    const payload = {
      user_id: options.userId,
      telegram_payment_charge_id: options.telegramPaymentChargeId.trim(),
    };

    return this.client.callMethod<boolean>('refundStarPayment', payload, {
      signal: options.signal,
      isSafeMethod: false,
    });
  }

  /**
   * Allows the bot to cancel or re-enable extension of a subscription paid in Telegram Stars.
   * Calls official Telegram Bot API `editUserStarSubscription`.
   */
  public async editSubscription(
    options: EditSubscriptionOptions
  ): Promise<boolean> {
    if (
      typeof options.userId !== 'number' ||
      !Number.isInteger(options.userId) ||
      options.userId <= 0
    ) {
      throw new TelegramValidationError(
        'userId must be a positive integer.',
        'userId'
      );
    }

    if (
      !options.telegramPaymentChargeId ||
      options.telegramPaymentChargeId.trim().length === 0
    ) {
      throw new TelegramValidationError(
        'telegramPaymentChargeId must be a non-empty string.',
        'telegramPaymentChargeId'
      );
    }

    const payload = {
      user_id: options.userId,
      telegram_payment_charge_id: options.telegramPaymentChargeId.trim(),
      is_canceled: options.isCanceled,
    };

    return this.client.callMethod<boolean>(
      'editUserStarSubscription',
      payload,
      {
        signal: options.signal,
        isSafeMethod: false,
      }
    );
  }

  /**
   * Validates common invoice parameters according to Telegram Bot API rules.
   */
  private validateInvoiceParams(options: {
    title: string;
    description: string;
    payload: string;
    amount: number;
  }): void {
    if (!options.title || options.title.length < 1 || options.title.length > 32) {
      throw new TelegramValidationError(
        'Invoice title must be between 1 and 32 characters.',
        'title'
      );
    }

    if (
      !options.description ||
      options.description.length < 1 ||
      options.description.length > 255
    ) {
      throw new TelegramValidationError(
        'Invoice description must be between 1 and 255 characters.',
        'description'
      );
    }

    const payloadBytes = Buffer.byteLength(options.payload ?? '', 'utf8');
    if (payloadBytes < 1 || payloadBytes > 128) {
      throw new TelegramValidationError(
        'Invoice payload must be between 1 and 128 bytes.',
        'payload'
      );
    }

    if (
      typeof options.amount !== 'number' ||
      !Number.isInteger(options.amount) ||
      options.amount <= 0
    ) {
      throw new TelegramValidationError(
        'Invoice amount must be a positive integer (number of Telegram Stars).',
        'amount'
      );
    }
  }
}
