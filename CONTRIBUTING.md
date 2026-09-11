# Contributing to @YOUR_GITHUB_USERNAME/telegram-stars

Thank you for your interest in contributing to the Telegram Stars SDK!

## Development Setup

Requirements:
- Node.js 20+
- npm 10+
- Git

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/telegram-stars-sdk.git
cd telegram-stars-sdk
npm install
```

## Quality Standards

All pull requests must pass the automated quality gates:

1. **Linting**:
   ```bash
   npm run lint
   ```
2. **Type Checking**:
   ```bash
   npm run typecheck
   ```
3. **Tests**:
   ```bash
   npm test
   ```
4. **Build**:
   ```bash
   npm run build
   ```
5. **Dry Run Pack**:
   ```bash
   npm pack --dry-run
   ```

## Rules & Philosophy

1. **Official Telegram Bot API Only**: Never invent endpoints or mock production behaviors. Refer to `docs/telegram-api-reference.md`.
2. **Zero Runtime Dependencies**: Do not introduce third-party runtime dependencies into `dependencies` in `package.json`.
3. **Security First**: Ensure bot tokens cannot leak into logs, exceptions, or errors.
4. **Mutation Safety**: Never add automatic retry behavior to payment mutation methods.
