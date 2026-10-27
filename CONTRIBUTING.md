# Contributing to LanguageGap

Thank you for your interest in contributing to **LanguageGap**! We welcome contributions from researchers, software engineers, linguists, and open-source contributors (including Google Summer of Code participants).

---

## 1. Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior following the guidelines in [SECURITY.md](SECURITY.md).

---

## 2. Getting Started

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Set up the development environment:
   ```bash
   # Backend
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   
   # Frontend
   cd ../frontend
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

---

## 3. Contribution Guidelines

### Adding Multilingual Benchmark Questions
- All questions must center around **canonical semantic intent**.
- Do not use raw automated translation without native-speaker validation.
- Every task must specify verifiable atomic facts and reference sources.
- Unicode strings must be NFC normalized.

### Provider Integrations
- Always inherit from `BaseModelProvider`.
- Preserve sampling parameter freeze across language variants.
- Provide deterministic mock responses for offline unit tests.

### Code Style & Quality
- Python: Follow PEP 8 guidelines. Type annotations are mandatory for all public functions and models.
- TypeScript: Strict type-checking enabled. No `any` types unless strictly justified.
- Tests: Add unit tests for every new feature or bug fix.

---

## 4. Pull Request Process

1. Verify all tests pass locally:
   ```bash
   cd backend && pytest
   cd ../frontend && npm run lint && npm run test
   ```
2. Verify git cleanliness: `git diff --check`.
3. Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
4. Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely.
