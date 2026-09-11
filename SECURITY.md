# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

---

## Security Principles of this SDK

1. **Zero Runtime Dependencies**: To minimize supply-chain risks, this package relies solely on native Node.js 20+ capabilities.
2. **Credential Redaction**: Bot tokens and authorization secrets are intercepted and stripped before error serialization, stack traces, or debug logging.
3. **No Dynamic Execution**: The SDK avoids `eval`, dynamic script evaluation, or child process execution.
4. **Isolated Instance State**: No mutable global state or singleton instances. Multiple client instances run independently with separate credentials.
5. **No Blind Mutation Retries**: Payment mutations are never retried automatically to prevent duplicate deductions or race conditions.

---

## Reporting a Vulnerability

If you discover a potential security vulnerability in this project:

1. **Do not open a public GitHub issue.**
2. Send an advisory report via GitHub Private Vulnerability Reporting or email the maintainer directly.
3. Include:
   - Description of the issue
   - Minimal reproduction code or steps
   - Potential impact
4. You will receive an acknowledgment within 48 hours and updates regarding resolution and CVE assignment if applicable.
