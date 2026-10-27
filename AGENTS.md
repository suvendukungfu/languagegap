# AGENTS.md — Contributor Guidelines for Autonomous Coding Agents

Welcome to the **LanguageGap** repository. This document defines the operating rules, constraints, and architecture boundaries for autonomous coding agents (including Google Antigravity, Claude, Copilot, and open-source agent runtimes).

---

## 1. Project Purpose & Scope

LanguageGap is an open-source research and engineering platform designed to evaluate AI response quality, factual completeness, and cross-lingual parity using Google's Gemma 4.

- **Tagline**: Same question. Different languages. Equal opportunity to understand.
- **Initial Languages**: English (`en`), Hindi (`hi`), Punjabi (`pa`), Odia (`or`).
- **Initial Benchmark**: Digital literacy, cybersecurity, and societal technology questions with verified atomic facts.

---

## 2. Fundamental Operating Rules

1. **Do Not Over-Abstract**: Keep modules small, focused, and composable. Use standard FastAPI, Pydantic v2, and Next.js conventions. Avoid prematurely introducing message queues, Redis, microservices, or complex auth.
2. **Deterministic & Zero-Cost CI**: Never write tests that require live internet access, paid API tokens, or local GPU clusters. All automated test suites must execute deterministically using `MockGemmaProvider`.
3. **Transparent Evaluation Provenance**:
   - Model-generated answers must be clearly marked as such.
   - Algorithmic and LLM-as-a-judge evaluations must be marked `provisional_automated`.
   - Human-audited reviews must be recorded as `human_validated` with reviewer notes.
   - **Never** present automated scores as ground-truth human findings.
4. **Unicode & Script Correctness**:
   - Always normalize strings using Unicode NFC (`unicodedata.normalize("NFC", text)`).
   - Validate script ranges for Devanagari (`\u0900`–`\u097F`), Gurmukhi (`\u0A00`–`\u0A7F`), and Odia (`\u0B00`–`\u0B7F`).
   - Use proper web fonts for Indic script rendering in the frontend.
5. **No Hallucinated Data**:
   - Do not invent fake benchmark statistics, artificial benchmarks, or mock users.
   - Any fixture data used for demonstrations must be explicitly labeled: `[Illustrative Demo Fixture]`.

---

## 3. Architecture Overview

```
Frontend (Next.js 15+ / Tailwind / Recharts)
  │
  ▼
FastAPI REST Layer (backend/app/api/v1)
  ├── Dataset Loader (backend/app/benchmark) ──► JSON Benchmark Data
  ├── Evaluation Engine (backend/app/evaluation)
  ├── Model Provider Abstraction (backend/app/providers)
  │     ├── GemmaProvider (Live OpenAI-compatible endpoint)
  │     └── MockGemmaProvider (Deterministic offline fixture)
  └── SQLite Persistence (backend/app/db)
```

---

## 4. Verification and Quality Gates

Before finalizing any task or milestone, agents MUST:

1. Run backend tests:
   ```bash
   cd backend && pytest -v
   ```
2. Run frontend type check and linter:
   ```bash
   cd frontend && npm run lint && npm run build
   ```
3. Run Git diff check:
   ```bash
   git diff --check
   ```
4. Verify that `.env`, `.db`, or credentials are NOT tracked.
5. Stage only intended files and write a Conventional Commit message.
6. Push directly to the assigned feature branch (e.g., `feat/languagegap-mvp`).
