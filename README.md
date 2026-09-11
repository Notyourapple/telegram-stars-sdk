# @notyourapple/telegram-stars

> A production-ready TypeScript SDK for integrating Telegram Stars payments, balances, transactions, refunds, and payment events into Node.js applications.

[![CI](https://github.com/Notyourapple/telegram-stars-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/Notyourapple/telegram-stars-sdk/actions/workflows/ci.yml)
[![GitHub Packages](https://img.shields.io/badge/registry-GitHub%20Packages-blue.svg)](https://github.com/Notyourapple/telegram-stars-sdk/packages)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-100%25%20passing-brightgreen)](https://github.com/Notyourapple/telegram-stars-sdk)

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Quick Start](#quick-start)
- [Creating Stars Invoices](#creating-stars-invoices)
- [Creating Shareable Invoice Links](#creating-shareable-invoice-links)
- [Handling Pre-Checkout](#handling-pre-checkout)
- [Processing Successful Payments](#processing-successful-payments)
- [Storing Payment Charge IDs](#storing-payment-charge-ids)
- [Refunds](#refunds)
- [Telegram Star Subscriptions](#telegram-star-subscriptions)
- [Checking Stars Balance](#checking-stars-balance)
- [Transaction History](#transaction-history)
- [Pagination](#pagination)
- [Error Handling](#error-handling)
- [Retry Behavior](#retry-behavior)
- [Security](#security)
- [Testing](#testing)
- [Examples](#examples)
- [API Reference](#api-reference)
- [GitHub Packages Installation](#github-packages-installation)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Official Telegram Bot API Only**: Mapped strictly to verified methods (`sendInvoice`, `createInvoiceLink`, `answerPreCheckoutQuery`, `refundStarPayment`, `getMyStarBalance`, `getStarTransactions`, `editUserStarSubscription`).
- **Zero Runtime Dependencies**: Powered entirely by native Node.js 20+ global `fetch`, `AbortController`, and `AbortSignal`.
- **Framework-Agnostic**: Works with raw webhooks, HTTP servers (Express, Fastify, Hono), or bot frameworks (grammY, Telegraf). No lock-in.
- **Financial-Grade Mutation Safety**: Payment mutations (`createInvoice`, `refund`, `approvePreCheckoutQuery`) **never** automatically retry to prevent duplicate charges or inconsistent states.
- **Conservative Retry Engine**: Safe, idempotent read operations (`getMyStarBalance`, `getStarTransactions`) automatically retry on 429 rate limits or transient network errors using bounded exponential backoff with full jitter, honoring Telegram's `retry_after`.
- **Credential Leak Prevention**: Automatic token redaction guarantees bot tokens never enter logs, error messages, stack traces, URLs, or serialized JSON payloads.
- **Streaming Auto-Pagination**: Built-in `for await (const tx of stars.transactions.iterate())` handles limits, offsets, and termination conditions with zero risk of infinite loops.
- **Dual ESM / CommonJS Support**: Pre-built dual module distribution with complete TypeScript declaration maps.

---

## Requirements

- **Node.js**: `20.0.0` or higher
- **Telegram Bot Token**: Obtained from [@BotFather](https://t.me/BotFather)

---

## Installation

### From GitHub Packages:

Configure your `.npmrc`:

```ini
@notyourapple:registry=https://npm.pkg.github.com
```

Then install via npm:

```bash
npm install @notyourapple/telegram-stars
```

---

## Configuration

Initialize the client with your bot token. Initialization is synchronous and never makes background network calls.

```typescript
import { TelegramStarsClient } from '@notyourapple/telegram-stars';

const stars = new TelegramStarsClient({
  token: process.env.TELEGRAM_BOT_TOKEN!, // Required: Bot token from @BotFather
  apiBaseUrl: 'https://api.telegram.org',  // Optional: Custom Telegram Bot API endpoint/proxy
  timeoutMs: 30000,                      // Optional: Request timeout (default: 30s)
  maxRetries: 3,                         // Optional: Max retries for safe reads (default: 3)
  retryDelayMs: 500,                     // Optional: Initial retry backoff delay (default: 500ms)
});
```

---

## Quick Start

```typescript
import { TelegramStarsClient } from '@notyourapple/telegram-stars';

const stars = new TelegramStarsClient({
  token: process.env.TELEGRAM_BOT_TOKEN!,
});

// Check bot Stars balance
const balance = await stars.balance.get();
console.log(`Bot balance: ${balance.amount} Stars`);

// Send a Stars invoice to a user
const message = await stars.payments.createInvoice({
  chatId: 12345678,
  title: 'Supporter Role',
  description: 'Unlock 30 days of exclusive chat perks',
  payload: 'order_supporter_001',
  amount: 250, // 250 Telegram Stars (XTR)
});
```

---

## Creating Stars Invoices

Telegram Stars digital goods invoices must always specify currency `XTR` and omit the provider token. The SDK handles this automatically.

```typescript
const invoice = await stars.payments.createInvoice({
  chatId: 12345678,
  title: 'Rare Game Asset',
  description: 'In-game cosmetic armor',
  payload: 'order_armor_99',
  amount: 500, // Amount in Telegram Stars
  photoUrl: 'https://example.com/assets/armor.png',
  photoWidth: 600,
  photoHeight: 400,
  startParameter: 'rare-armor-promo',
});
```

---

## Creating Shareable Invoice Links

Invoice links (`https://t.me/$...`) can be shared across channels, web apps, or sent via inline buttons:

```typescript
const link = await stars.payments.createInvoiceLink({
  title: 'E-Book: TypeScript in Production',
  description: 'Instant digital download',
  payload: 'ebook_ts_2026',
  amount: 150,
});

console.log(`Pay link: ${link}`);
```

---

## Handling Pre-Checkout

When a user confirms payment in the Telegram app, Telegram sends a `pre_checkout_query` update. **Your bot must respond within 10 seconds.**

The SDK requires explicit approval or rejection so your business rules are always enforced:

```typescript
import {
  isPreCheckoutQueryUpdate,
  getPreCheckoutQuery,
} from '@notyourapple/telegram-stars';

async function handleWebhookUpdate(update: unknown) {
  if (isPreCheckoutQueryUpdate(update)) {
    const query = getPreCheckoutQuery(update)!;

    // Validate your internal business logic (inventory, user status, etc.)
    const itemAvailable = await checkStock(query.invoice_payload);

    if (itemAvailable) {
      // Approve transaction
      await stars.payments.approvePreCheckoutQuery(query.id);
    } else {
      // Reject with user-facing explanation
      await stars.payments.rejectPreCheckoutQuery(
        query.id,
        'Sorry, this item is out of stock.'
      );
    }
  }
}
```

---

## Processing Successful Payments

Once Telegram charges the user's Stars balance, a `successful_payment` update arrives in the chat:

```typescript
import {
  isSuccessfulPaymentUpdate,
  parseSuccessfulPayment,
} from '@notyourapple/telegram-stars';

async function handleWebhookUpdate(update: unknown) {
  if (isSuccessfulPaymentUpdate(update)) {
    const payment = parseSuccessfulPayment(update)!;

    console.log(`Payment confirmed!`);
    console.log(`Amount: ${payment.totalAmount} ${payment.currency}`);
    console.log(`Order Payload: ${payment.invoicePayload}`);
    console.log(`Charge ID: ${payment.telegramPaymentChargeId}`);

    // Fulfill digital purchase
    await grantDigitalItem(payment.invoicePayload);
  }
}
```

---

## Storing Payment Charge IDs

> [!IMPORTANT]
> Always store `telegramPaymentChargeId` in your database.
>
> If you ever need to issue a refund or verify a chargeback dispute, Telegram's API **requires** the `telegramPaymentChargeId`.

```typescript
await db.orders.update({
  where: { payload: payment.invoicePayload },
  data: {
    status: 'PAID',
    telegramPaymentChargeId: payment.telegramPaymentChargeId,
    paidAt: new Date(),
  },
});
```

---

## Refunds

Refunds use official Telegram Bot API `refundStarPayment`. Upon refund, Stars are returned to the user and debited from the bot's Star balance.

```typescript
await stars.payments.refund({
  userId: customerTelegramUserId,
  telegramPaymentChargeId: savedTelegramPaymentChargeId,
});
```

---

## Telegram Star Subscriptions

Telegram supports recurring subscriptions for Telegram Stars:
- Currently, subscriptions must have a period of `2592000` seconds (30 days).
- Maximum price: 10,000 Telegram Stars.

Create a recurring subscription link:

```typescript
const subscriptionLink = await stars.payments.createInvoiceLink({
  title: 'VIP Community Subscription',
  description: 'Monthly access to exclusive community events',
  payload: 'sub_vip_monthly',
  amount: 300,
  subscriptionPeriod: 2592000, // Exactly 30 days
});
```

Cancel or re-enable subscription extension:

```typescript
await stars.payments.editSubscription({
  userId: customerTelegramUserId,
  telegramPaymentChargeId: subscriptionChargeId,
  isCanceled: true, // Cancel automatic renewal
});
```

---

## Checking Stars Balance

```typescript
const balance = await stars.balance.get();

console.log(`Total Stars: ${balance.amount}`);
if (balance.nanostar_amount) {
  console.log(`Nanostars: ${balance.nanostar_amount}`);
}
```

---

## Transaction History

Retrieve transactions with limits and offsets:

```typescript
const result = await stars.transactions.list({
  limit: 25,
  offset: 0,
});

for (const tx of result.transactions) {
  console.log(`Tx ${tx.id}: ${tx.amount} Stars on ${new Date(tx.date * 1000)}`);
}
```

---

## Pagination

Use the async generator `stars.transactions.iterate()` to stream transaction records without manual offset management:

```typescript
for await (const tx of stars.transactions.iterate({ batchSize: 50, maxTransactions: 200 })) {
  console.log(`Transaction #${tx.id}: ${tx.amount} Stars`);
  if (tx.source) {
    console.log(`Partner: ${tx.source.type}`);
  }
}
```

---

## Error Handling

The SDK provides a clean, strongly typed error hierarchy:

```
TelegramStarsError
├── TelegramConfigurationError  (invalid token, baseUrl, timeouts)
├── TelegramValidationError      (invalid client-side parameters)
├── TelegramNetworkError        (connectivity, DNS, socket drop)
├── TelegramTimeoutError        (request exceeded timeoutMs)
├── TelegramApiError            (Telegram returned ok: false)
│   └── TelegramRateLimitError  (HTTP 429 flood control)
```

Catching specific errors:

```typescript
import {
  TelegramRateLimitError,
  TelegramApiError,
  TelegramValidationError,
} from '@notyourapple/telegram-stars';

try {
  await stars.payments.refund({ userId, telegramPaymentChargeId });
} catch (error) {
  if (error instanceof TelegramRateLimitError) {
    console.error(`Rate limited. Wait ${error.retryAfter}s before retrying.`);
  } else if (error instanceof TelegramApiError) {
    console.error(`Telegram rejected [${error.errorCode}]: ${error.description}`);
  } else if (error instanceof TelegramValidationError) {
    console.error(`Invalid input on field ${error.field}: ${error.message}`);
  }
}
```

---

## Retry Behavior

1. **Payment Mutations are NEVER retried automatically**:
   - `createInvoice`, `sendInvoice`
   - `createInvoiceLink`
   - `answerPreCheckoutQuery`, `approvePreCheckoutQuery`, `rejectPreCheckoutQuery`
   - `refund`
   - `editSubscription`
2. **Safe Read Operations are retried with Exponential Backoff + Full Jitter**:
   - `getMyStarBalance`
   - `getStarTransactions`
   - Automatically honors Telegram's `parameters.retry_after` if returned on HTTP 429.

---

## Security

- **Zero Credential Leaking**: Bot tokens are stripped from URLs, error messages, stack traces, and serialized objects.
- **No Global State**: No shared state or singletons. Multiple client instances with different tokens operate independently.
- **Input Validation**: All client parameters are validated before network dispatch.
- **Reporting Vulnerabilities**: See [SECURITY.md](SECURITY.md) for vulnerability disclosure policy.

---

## Testing

Run unit and integration tests:

```bash
npm test
```

Run test coverage report:

```bash
npm run test:coverage
```

---

## Examples

Complete, runnable examples are located in [`examples/`](examples/):

- [`examples/basic-payment/`](examples/basic-payment): Create and send invoices and invoice links.
- [`examples/payment-handler/`](examples/payment-handler): Process incoming pre-checkout queries and successful payment updates.
- [`examples/transactions/`](examples/transactions): Query balance and stream transaction history.
- [`examples/refund/`](examples/refund): Refund a Stars transaction using a stored charge ID.

---

## API Reference

Comprehensive mapping of all Telegram methods, schemas, and fields is documented in:
[docs/telegram-api-reference.md](docs/telegram-api-reference.md)

---

## GitHub Packages Installation

To configure authentication for GitHub Packages:

1. Create a GitHub Personal Access Token (PAT) with `read:packages` scope.
2. Add the following to your `~/.npmrc`:
   ```ini
   @notyourapple:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
   ```
3. Install the package:
   ```bash
   npm install @notyourapple/telegram-stars
   ```

---

## Development

```bash
# Clone the repository
git clone https://github.com/Notyourapple/telegram-stars-sdk.git
cd telegram-stars-sdk

# Install dependencies
npm install

# Run linter
npm run lint

# Run type checker
npm run typecheck

# Run test suite
npm test

# Build dual ESM/CJS bundles
npm run build

# Verify package contents
npm pack --dry-run
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on code style, testing, and contribution processes.

---

## License

[MIT](LICENSE) © 2026 Gaurab Dowerah and Contributors
