# Official Telegram Bot API Reference for Telegram Stars

This document details the official Telegram Bot API methods, objects, parameters, and constraints used by this SDK.
All definitions are strictly verified against [Telegram Bot API Documentation](https://core.telegram.org/bots/api) and [Telegram Stars Payments](https://core.telegram.org/bots/payments-stars).

---

## 1. Official Telegram Bot API Methods

### 1.1. `sendInvoice`
Sends an invoice message to a target chat.

- **HTTP Method**: `POST`
- **Endpoint**: `https://api.telegram.org/bot<token>/sendInvoice`
- **Official Parameters**:
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `chat_id` | `Integer \| String` | Yes | Target chat ID or username (e.g., `@channelusername`). |
  | `message_thread_id` | `Integer` | Optional | Identifier for target forum thread (supergroups only). |
  | `direct_messages_topic_id` | `Integer` | Optional | Identifier for direct messages topic. |
  | `title` | `String` | Yes | Product name, 1–32 characters. |
  | `description` | `String` | Yes | Product description, 1–255 characters. |
  | `payload` | `String` | Yes | Bot-defined invoice payload, 1–128 bytes. |
  | `provider_token` | `String` | Optional | Payment provider token. **Must be empty string `""` for Telegram Stars.** |
  | `currency` | `String` | Yes | ISO 4217 code. **Must be `"XTR"` for Telegram Stars.** |
  | `prices` | `Array of LabeledPrice` | Yes | Price breakdown. **Must contain exactly one item for Telegram Stars**, representing an integer amount of Stars. |
  | `start_parameter` | `String` | Optional | Deep-linking parameter. If empty, forwarded messages allow multi-user payment via Pay button. |
  | `provider_data` | `String` | Optional | JSON-serialized data for provider (not used for Stars). |
  | `photo_url` | `String` | Optional | Product photo URL. |
  | `photo_size` | `Integer` | Optional | Photo size in bytes. |
  | `photo_width` | `Integer` | Optional | Photo width. |
  | `photo_height` | `Integer` | Optional | Photo height. |
  | `need_name` | `Boolean` | Optional | Request user's full name. |
  | `need_phone_number` | `Boolean` | Optional | Request user's phone number. |
  | `need_email` | `Boolean` | Optional | Request user's email address. |
  | `need_shipping_address` | `Boolean` | Optional | Request user's shipping address. |
  | `send_phone_number_to_provider` | `Boolean` | Optional | Send phone number to provider. |
  | `send_email_to_provider` | `Boolean` | Optional | Send email to provider. |
  | `is_flexible` | `Boolean` | Optional | Pass True if final price depends on shipping. |
  | `disable_notification` | `Boolean` | Optional | Send message silently. |
  | `protect_content` | `Boolean` | Optional | Protect content from forwarding and saving. |
  | `message_effect_id` | `String` | Optional | Identifier of message effect. |
  | `reply_parameters` | `ReplyParameters` | Optional | Reply configuration. |
  | `reply_markup` | `InlineKeyboardMarkup` | Optional | Inline keyboard markup (first button must be a Pay button). |
- **Return Type**: `Message` on success.

---

### 1.2. `createInvoiceLink`
Creates an HTTP deep link for an invoice that can be shared or embedded in Web Apps.

- **HTTP Method**: `POST`
- **Endpoint**: `https://api.telegram.org/bot<token>/createInvoiceLink`
- **Official Parameters**:
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `business_connection_id` | `String` | Optional | Business connection identifier (for Star payments only). |
  | `title` | `String` | Yes | Product name, 1–32 characters. |
  | `description` | `String` | Yes | Product description, 1–255 characters. |
  | `payload` | `String` | Yes | Bot-defined invoice payload, 1–128 bytes. |
  | `provider_token` | `String` | Optional | Payment provider token. **Must be empty string `""` for Telegram Stars.** |
  | `currency` | `String` | Yes | **Must be `"XTR"` for Telegram Stars.** |
  | `prices` | `Array of LabeledPrice` | Yes | Price breakdown. **Must contain exactly one item for Telegram Stars.** |
  | `subscription_period` | `Integer` | Optional | Active duration in seconds before recurring payment. **Currently must always be `2592000` (30 days)** when specified. Max price: 10,000 Stars. |
  | `max_tip_amount` | `Integer` | Optional | Tip limit. *Not supported for Telegram Stars.* |
  | `suggested_tip_amounts`| `Array of Integer`| Optional | Array of suggested tips. *Not supported for Telegram Stars.* |
  | `provider_data` | `String` | Optional | Provider payload. |
  | `photo_url` | `String` | Optional | Product photo URL. |
  | `photo_size` | `Integer` | Optional | Photo size in bytes. |
  | `photo_width` | `Integer` | Optional | Photo width. |
  | `photo_height` | `Integer` | Optional | Photo height. |
  | `need_name` | `Boolean` | Optional | Request user's full name. |
  | `need_phone_number` | `Boolean` | Optional | Request user's phone number. |
  | `need_email` | `Boolean` | Optional | Request user's email address. |
  | `need_shipping_address` | `Boolean` | Optional | Request user's shipping address. |
  | `send_phone_number_to_provider` | `Boolean` | Optional | Send phone number to provider. |
  | `send_email_to_provider` | `Boolean` | Optional | Send email to provider. |
  | `is_flexible` | `Boolean` | Optional | Pass True if final price depends on shipping. |
- **Return Type**: `String` (invoice URL, e.g. `https://t.me/$...`).

---

### 1.3. `answerPreCheckoutQuery`
Responds to an incoming `pre_checkout_query` update. Must be sent within 10 seconds.

- **HTTP Method**: `POST`
- **Endpoint**: `https://api.telegram.org/bot<token>/answerPreCheckoutQuery`
- **Official Parameters**:
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `pre_checkout_query_id` | `String` | Yes | Unique query identifier from `PreCheckoutQuery`. |
  | `ok` | `Boolean` | Yes | Pass `true` to approve payment, or `false` to reject. |
  | `error_message` | `String` | Optional | Human-readable explanation if `ok` is `false`. |
- **Return Type**: `Boolean` (`true` on success).

---

### 1.4. `refundStarPayment`
Refunds a successful payment in Telegram Stars.

- **HTTP Method**: `POST`
- **Endpoint**: `https://api.telegram.org/bot<token>/refundStarPayment`
- **Official Parameters**:
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `user_id` | `Integer` | Yes | Identifier of the user whose payment will be refunded. |
  | `telegram_payment_charge_id` | `String` | Yes | Telegram payment identifier from `SuccessfulPayment`. |
- **Return Type**: `Boolean` (`true` on success).

---

### 1.5. `editUserStarSubscription`
Cancels or re-enables automatic extension of a subscription paid in Telegram Stars.

- **HTTP Method**: `POST`
- **Endpoint**: `https://api.telegram.org/bot<token>/editUserStarSubscription`
- **Official Parameters**:
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `user_id` | `Integer` | Yes | Identifier of the user whose subscription will be edited. |
  | `telegram_payment_charge_id` | `String` | Yes | Telegram payment identifier for the subscription. |
  | `is_canceled` | `Boolean` | Yes | `true` to cancel extension; `false` to allow re-enabling. |
- **Return Type**: `Boolean` (`true` on success).

---

### 1.6. `getMyStarBalance`
Retrieves the current Telegram Stars balance of the bot.

- **HTTP Method**: `POST` (or `GET`)
- **Endpoint**: `https://api.telegram.org/bot<token>/getMyStarBalance`
- **Official Parameters**: None.
- **Return Type**: `StarAmount` on success.

---

### 1.7. `getStarTransactions`
Returns the bot's Telegram Star transactions in chronological order.

- **HTTP Method**: `POST` (or `GET`)
- **Endpoint**: `https://api.telegram.org/bot<token>/getStarTransactions`
- **Official Parameters**:
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `offset` | `Integer` | Optional | Number of transactions to skip in the response. |
  | `limit` | `Integer` | Optional | Maximum transactions to retrieve (1–100, default 100). |
- **Return Type**: `StarTransactions` on success.

---

## 2. Official Telegram Objects & Schemas

### 2.1. `StarAmount`
Describes an amount of Telegram Stars.
- `amount` (`Integer`): Integer amount of Telegram Stars, rounded to 0; can be negative.
- `nanostar_amount` (`Integer`, Optional): Number of 1/1,000,000,000 shares of Telegram Stars (-999,999,999 to 999,999,999).

### 2.2. `StarTransaction`
Describes a single Telegram Star transaction.
- `id` (`String`): Unique identifier of transaction. Matches `SuccessfulPayment.telegram_payment_charge_id` for incoming payments; matches original transaction ID for refunds.
- `amount` (`Integer`): Integer amount of Telegram Stars transferred.
- `nanostar_amount` (`Integer`, Optional): Shares of Telegram Stars (0 to 999,999,999).
- `date` (`Integer`): Unix timestamp when created.
- `source` (`TransactionPartner`, Optional): Source of incoming transaction.
- `receiver` (`TransactionPartner`, Optional): Receiver of outgoing transaction.

### 2.3. `TransactionPartner` (Discriminated Union on `type`)
- `type: "user"` (`TransactionPartnerUser`):
  - `transaction_type` (`String`): One of `"invoice_payment"`, `"paid_media_payment"`, `"gift_purchase"`, `"premium_purchase"`, `"business_account_transfer"`.
  - `user` (`User`): Information about the user.
  - `affiliate` (`AffiliateInfo`, Optional): Affiliate commission info.
  - `invoice_payload` (`String`, Optional): Bot-specified payload for `"invoice_payment"`.
  - `subscription_period` (`Integer`, Optional): Duration of subscription for recurring payments.
  - `paid_media` (`Array of PaidMedia`, Optional): Information about paid media.
  - `paid_media_payload` (`String`, Optional): Payload for paid media.
  - `gift` (`Gift`, Optional): Gift details.
- `type: "chat"` (`TransactionPartnerChat`):
  - `chat` (`Chat`): Chat information.
  - `gift` (`Gift`, Optional): Gift sent to chat.
- `type: "affiliate_program"` (`TransactionPartnerAffiliateProgram`):
  - `sponsor_user` (`User`, Optional): Bot/user sponsoring affiliate program.
  - `commission_per_mille` (`Integer`): Commission per 1,000 Stars.
- `type: "fragment"` (`TransactionPartnerFragment`):
  - `withdrawal_state` (`RevenueWithdrawalState`, Optional): State of outgoing withdrawal.
- `type: "telegram_ads"` (`TransactionPartnerTelegramAds`):
  - Transaction with Telegram Ads platform.
- `type: "telegram_api"` (`TransactionPartnerTelegramApi`):
  - `request_count` (`Integer`): Billed requests exceeding limits.
- `type: "other"` (`TransactionPartnerOther`):
  - Transaction partner not categorized above.

### 2.4. `RevenueWithdrawalState` (Discriminated Union on `type`)
- `type: "pending"`: Withdrawal in progress.
- `type: "succeeded"`:
  - `date` (`Integer`): Completion date in Unix time.
  - `url` (`String`): HTTPS link to transaction details on Fragment.
- `type: "failed"`: Withdrawal failed.

### 2.5. `SuccessfulPayment`
Received on `message.successful_payment` after user pays.
- `currency` (`String`): Three-letter ISO 4217 code or `"XTR"`.
- `total_amount` (`Integer`): Total price in smallest currency units (for Stars, integer amount).
- `invoice_payload` (`String`): Bot-specified invoice payload.
- `subscription_expiration_date` (`Integer`, Optional): Subscription expiry date in Unix time.
- `is_recurring` (`True`, Optional): True if recurring subscription payment.
- `is_first_recurring` (`True`, Optional): True if first payment for recurring subscription.
- `shipping_option_id` (`String`, Optional): Shipping option chosen.
- `order_info` (`OrderInfo`, Optional): Order info provided by user.
- `telegram_payment_charge_id` (`String`): Telegram payment identifier.
- `provider_payment_charge_id` (`String`): Provider payment identifier.

### 2.6. `RefundedPayment`
Received on `message.refunded_payment` when a payment is refunded.
- `currency` (`String`): Always `"XTR"`.
- `total_amount` (`Integer`): Total refunded amount in Stars.
- `invoice_payload` (`String`): Bot-specified invoice payload.
- `telegram_payment_charge_id` (`String`): Identifier of refunded payment.
- `provider_payment_charge_id` (`String`, Optional): Provider payment identifier.

### 2.7. `PreCheckoutQuery`
Received on `update.pre_checkout_query`.
- `id` (`String`): Unique query identifier.
- `from` (`User`): User who sent the query.
- `currency` (`String`): Always `"XTR"` for Stars.
- `total_amount` (`Integer`): Total price in Stars.
- `invoice_payload` (`String`): Bot-specified payload.
- `shipping_option_id` (`String`, Optional): Shipping option chosen.
- `order_info` (`OrderInfo`, Optional): User order information.

---

## 3. Telegram API Error Response Model

When Telegram Bot API returns `ok: false`, the payload conforms to:

```json
{
  "ok": false,
  "error_code": 400,
  "description": "Bad Request: ...",
  "parameters": {
    "migrate_to_chat_id": 123456,
    "retry_after": 5
  }
}
```

- `error_code` (`Integer`): HTTP-like status code (e.g., 400, 401, 403, 404, 429, 500).
- `description` (`String`): Human-readable error description.
- `parameters.retry_after` (`Integer`, Optional): Seconds to wait before repeating request (returned on 429 Too Many Requests or flood control).
- `parameters.migrate_to_chat_id` (`Integer`, Optional): Group migrated to supergroup with new ID.
