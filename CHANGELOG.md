# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-11

### Added
- Initial production-grade release of `@notyourapple/telegram-stars`.
- Zero-runtime-dependency HTTP client with Node.js 20+ native fetch and AbortController.
- Full Telegram Stars payment support:
  - `sendInvoice` / `createInvoice` with currency `XTR` and single item `prices`.
  - `createInvoiceLink` with support for 30-day recurring Telegram Star subscriptions (`subscription_period: 2592000`).
  - `answerPreCheckoutQuery`, `approvePreCheckoutQuery`, and `rejectPreCheckoutQuery`.
  - `refund` wrapping `refundStarPayment`.
  - `editSubscription` wrapping `editUserStarSubscription`.
- Telegram Stars balance retrieval:
  - `balance.get()` wrapping `getMyStarBalance`.
- Telegram Stars transaction history:
  - `transactions.list()` wrapping `getStarTransactions`.
  - `transactions.iterate()` async generator auto-pagination with loop guards.
- Event narrowing and update extraction:
  - `isPreCheckoutQueryUpdate` and `getPreCheckoutQuery`.
  - `isSuccessfulPaymentUpdate`, `getSuccessfulPayment`, and `parseSuccessfulPayment`.
  - `isRefundedPaymentUpdate`, `getRefundedPayment`, and `parseRefundedPayment`.
  - `isPaidMediaPurchasedUpdate` and `getPaidMediaPurchased`.
- Structured error hierarchy:
  - `TelegramStarsError`, `TelegramConfigurationError`, `TelegramValidationError`, `TelegramNetworkError`, `TelegramTimeoutError`, `TelegramApiError`, `TelegramRateLimitError`.
- Conservative retry engine:
  - Safe idempotent operations automatically retried with exponential backoff and jitter.
  - Payment mutations are strictly never retried automatically.
- Security and token redaction across URLs, headers, error messages, and JSON serialization.
- Dual ESM and CommonJS builds with TypeScript declaration maps.
- Complete unit and integration test suite with 100% fixture-based offline testing.
- GitHub Actions workflows for CI, Release, and GitHub Packages publishing.
