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

---

## 4. Dependency Audit Guidance

Maintainers and contributors must regularly audit both Python and JavaScript dependency trees:

- **Frontend Node.js Dependencies:**
  ```bash
  cd frontend
  npm audit --audit-level=high
  ```
  Advisory notices rated `high` or `critical` must be resolved promptly using `npm update` or upstream package bumps.

- **Backend Python Dependencies:**
  ```bash
  cd backend
  .venv/bin/pip check
  # Optional vulnerability scanner
  pip-audit -r requirements.txt
  ```

- **Automated Dependabot:**
  Dependabot / Renovate scans are enabled on GitHub to surface CVEs against direct dependencies (`fastapi`, `pydantic`, `next`, `recharts`).

---

## 5. Security Boundaries & Automated Secret Scanning

- **Secret Scanning Script:**
  Run `python3 scripts/check_secrets.py` prior to any git commit. It verifies that private keys, bearer tokens, API credentials, and `.env` files are not tracked in the git working tree.
- **API Boundaries:**
  FastAPI strictly validates request schemas using Pydantic. SQLite interactions use SQLAlchemy ORM parameter binding, preventing SQL injection vulnerabilities. CORS is restricted to authorized origins (`settings.cors_origins`).
