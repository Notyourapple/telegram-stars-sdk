import { describe, it, expect } from 'vitest';
import {
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
} from '../../src/updates/update-helpers.js';
import preCheckoutFixture from '../fixtures/pre-checkout-query.json' with { type: 'json' };
import successfulPaymentFixture from '../fixtures/successful-payment.json' with { type: 'json' };
import refundedPaymentFixture from '../fixtures/refunded-payment.json' with { type: 'json' };

describe('Update Event Utilities', () => {
  describe('pre_checkout_query', () => {
    it('identifies and extracts pre_checkout_query from update', () => {
      expect(isPreCheckoutQueryUpdate(preCheckoutFixture)).toBe(true);
      const query = getPreCheckoutQuery(preCheckoutFixture);
      expect(query).toBeDefined();
      expect(query?.id).toBe('query_precheckout_abc123xyz');
      expect(query?.currency).toBe('XTR');
      expect(query?.total_amount).toBe(250);
      expect(query?.invoice_payload).toBe('order_digital_good_101');
    });

    it('returns false/undefined for non-precheckout updates', () => {
      expect(isPreCheckoutQueryUpdate(successfulPaymentFixture)).toBe(false);
      expect(getPreCheckoutQuery(successfulPaymentFixture)).toBeUndefined();
      expect(isPreCheckoutQueryUpdate(null)).toBe(false);
      expect(isPreCheckoutQueryUpdate({})).toBe(false);
    });
  });

  describe('successful_payment', () => {
    it('identifies and extracts successful_payment from update', () => {
      expect(isSuccessfulPaymentUpdate(successfulPaymentFixture)).toBe(true);

      const raw = getSuccessfulPayment(successfulPaymentFixture);
      expect(raw).toBeDefined();
      expect(raw?.currency).toBe('XTR');
      expect(raw?.telegram_payment_charge_id).toBe('chg_telegram_stars_987654321');

      const parsed = parseSuccessfulPayment(successfulPaymentFixture);
      expect(parsed).toBeDefined();
      expect(parsed?.telegramPaymentChargeId).toBe('chg_telegram_stars_987654321');
      expect(parsed?.totalAmount).toBe(250);
      expect(parsed?.invoicePayload).toBe('order_digital_good_101');
      expect(parsed?.currency).toBe('XTR');
      expect(parsed?.raw).toBe(raw);
    });

    it('extracts from message object directly or raw successful payment object', () => {
      const msg = successfulPaymentFixture.message;
      expect(getSuccessfulPayment(msg)).toBeDefined();

      const rawPayment = successfulPaymentFixture.message.successful_payment;
      expect(getSuccessfulPayment(rawPayment)).toBeDefined();
      expect(parseSuccessfulPayment(rawPayment)?.telegramPaymentChargeId).toBe(
        'chg_telegram_stars_987654321'
      );
    });

    it('returns false/undefined for non-successful-payment objects', () => {
      expect(isSuccessfulPaymentUpdate(preCheckoutFixture)).toBe(false);
      expect(getSuccessfulPayment(preCheckoutFixture)).toBeUndefined();
      expect(parseSuccessfulPayment(null)).toBeUndefined();
    });
  });

  describe('refunded_payment', () => {
    it('identifies and extracts refunded_payment from update', () => {
      expect(isRefundedPaymentUpdate(refundedPaymentFixture)).toBe(true);

      const raw = getRefundedPayment(refundedPaymentFixture);
      expect(raw).toBeDefined();
      expect(raw?.currency).toBe('XTR');
      expect(raw?.telegram_payment_charge_id).toBe('chg_telegram_stars_987654321');

      const parsed = parseRefundedPayment(refundedPaymentFixture);
      expect(parsed).toBeDefined();
      expect(parsed?.telegramPaymentChargeId).toBe('chg_telegram_stars_987654321');
      expect(parsed?.totalAmount).toBe(250);
      expect(parsed?.invoicePayload).toBe('order_digital_good_101');
    });

    it('returns false/undefined for non-refunded updates', () => {
      expect(isRefundedPaymentUpdate(preCheckoutFixture)).toBe(false);
      expect(getRefundedPayment(preCheckoutFixture)).toBeUndefined();
      expect(parseRefundedPayment(undefined)).toBeUndefined();
    });
  });

  describe('purchased_paid_media', () => {
    const paidMediaUpdate = {
      update_id: 10005,
      purchased_paid_media: {
        from: { id: 112233, is_bot: false, first_name: 'Bob' },
        paid_media_payload: 'channel_post_media_77',
      },
    };

    it('identifies and extracts paid_media_purchased', () => {
      expect(isPaidMediaPurchasedUpdate(paidMediaUpdate)).toBe(true);
      const pm = getPaidMediaPurchased(paidMediaUpdate);
      expect(pm?.paid_media_payload).toBe('channel_post_media_77');
      expect(pm?.from.id).toBe(112233);
    });

    it('returns false for updates without purchased_paid_media', () => {
      expect(isPaidMediaPurchasedUpdate(preCheckoutFixture)).toBe(false);
      expect(getPaidMediaPurchased(preCheckoutFixture)).toBeUndefined();
    });
  });
});
