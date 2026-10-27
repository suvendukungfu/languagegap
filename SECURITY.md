# Security Policy

## 1. Supported Versions

| Version | Supported |
| :--- | :---: |
| 1.0.x (Current MVP) | Yes |

---

## 2. Reporting a Vulnerability

We take the security and integrity of LanguageGap seriously. If you discover a security vulnerability or credential leak, please report it privately:

- **Email**: Send details to `ssuvendukumar489@gmail.com`.
- **Response Time**: We acknowledge receipt of reports within 48 hours and provide status updates on fixes.
- Please do **not** open public GitHub issues for undisclosed security vulnerabilities.

---

## 3. Safe AI Evaluation Principles

- **No Execution of Generated Content**: LanguageGap treats all LLM outputs as untrusted raw text strings. Generated code or markdown is never directly executed.
- **Credential Isolation**: All API keys and provider credentials must remain on the backend server via environment variables. Never expose them to the browser or commit them to Git.
- **Privacy & Redaction**: Benchmark datasets contain only public, non-confidential, and synthetic data.
