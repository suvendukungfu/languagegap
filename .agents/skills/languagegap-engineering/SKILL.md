---
name: languagegap-engineering
description: Guidelines for engineering, evaluation methodology, dataset integrity, testing, and Git discipline in the LanguageGap repository.
---

# LanguageGap Engineering Skill

LanguageGap is an open-source multilingual AI evaluation platform measuring answer quality, factual completeness, and language parity using Gemma 4.

Tagline: *Same question. Different languages. Equal opportunity to understand.*

This skill establishes mandatory rules and best practices for all autonomous agents and developers working on this codebase.

---

## 1. Architectural Boundaries

LanguageGap follows a clean, decoupled architecture. Never blur the boundaries between layers:

- **Inference (`backend/app/providers`)**: Encapsulates model interactions via `BaseModelProvider`. Supports `GemmaProvider` (remote/local OpenAI-compatible endpoints) and `MockGemmaProvider` (deterministic fixture data for offline testing and demos).
- **Dataset (`backend/app/benchmark` & `backend/data`)**: Manages immutable benchmark task groups. Enforces canonical semantic intent across languages, required atomic facts, disallowed claims, and review status.
- **Evaluation Engine (`backend/app/evaluation`)**: Scores responses against a 5-dimension rubric (max 14). Computes fact coverage and unsupported claim penalties. Calculates the Language Parity Gap across paired task groups.
- **Persistence (`backend/app/db`)**: SQLite storage for runs, responses, dimension scores, and human review overrides.
- **API (`backend/app/api/v1`)**: Versioned FastAPI endpoints with strict Pydantic schemas.
- **Presentation (`frontend/`)**: Next.js App Router, Tailwind CSS, and Recharts. Implements native typography for Devanagari, Gurmukhi, and Odia scripts.

---

## 2. Multilingual Dataset Integrity

LanguageGap is **not** a translation tool; it evaluates answer quality across equivalent user intents.

1. **Shared Canonical Intent**: Every benchmark item shares a stable `task_id`, `topic`, `category`, and `difficulty`.
2. **Four Initial Languages**:
   - English (`en`, Latin script)
   - Hindi (`hi`, Devanagari script: Unicode range `\u0900`–`\u097F`)
   - Punjabi (`pa`, Gurmukhi script: Unicode range `\u0A00`–`\u0A7F`)
   - Odia (`or`, Odia script: Unicode range `\u0B00`–`\u0B7F`)
3. **Unicode Correctness**: All input and output strings must be NFC normalized (`unicodedata.normalize("NFC", text)`). Never strip diacritics or rely on ASCII assumptions.
4. **Human Review Status**: Every language variant carries a provenance status:
   - `native_authored`: Created directly by a fluent speaker.
   - `native_reviewed`: Reviewed and verified by a fluent speaker.
   - `provisional_translation`: Automated or draft translation.
   - **Rule**: Machine-generated translations must NEVER be automatically approved without human sign-off.

---

## 3. Evaluation Engine & Parity Gap Rubric

### 5-Dimension Rubric (Maximum Score: 14)

1. **Factual Correctness (0–4)**: Accuracy against canonical gold facts and reference sources.
2. **Completeness (0–4)**: Ratio of required atomic facts addressed in the response.
3. **Instruction Adherence (0–2)**: Compliance with prompt constraints, tone, and format.
4. **Language Naturalness & Clarity (0–2)**: Grammatical fluency, natural phrasing, and absence of unnatural translationese.
5. **Safety Appropriateness (0–2)**: Safe digital literacy guidance, absence of harmful or deceptive instructions.

### Language Parity Gap Calculation

$$\text{Parity Gap} = \max_{l \in \text{languages}}(\bar{S}_l) - \min_{l \in \text{languages}}(\bar{S}_l)$$

Where $\bar{S}_l$ is the mean composite score for language $l$ across paired task groups. Report the gap overall and per dimension.

### Automated vs. Human Provenance

- Automated assessments (including LLM-as-a-judge) must always be tagged `evaluation_method: "automated_provisional"`.
- Human verified evaluations must be tagged `evaluation_method: "human_validated"`.
- Never present automated evaluations as human-reviewed truth.

---

## 4. Gemma 4 Provider & Offline Testing

- All model inference calls pass through `BaseModelProvider`:
  - `generate(prompt: str, sampling_params: SamplingParams) -> GenerationResult`
  - `health_check() -> bool`
  - `get_model_metadata() -> ProviderMetadata`
  - `validate_response(response: GenerationResult) -> bool`
- **Zero-Cost Testing**: Unit tests and CI must use `MockGemmaProvider`. Never make live, paid external API calls in test suites.
- **Parameter Parity**: Always use identical sampling parameters (`temperature`, `top_p`, `max_tokens`) across all language variants in an evaluation run.

---

## 5. Strict Git & Commit Discipline

Follow this atomic workflow after every engineering change:

1. Inspect changed files: `git status`.
2. Run automated tests and linters: ensure 100% pass rate.
3. Verify git diff cleanly: `git diff --check`.
4. Stage only relevant files: `git add <files>`. Never stage `.env`, database files, or credentials.
5. Commit using Conventional Commits (`feat(...)`, `test(...)`, `docs(...)`, `fix(...)`).
6. Push immediately to the feature branch: `git push origin <branch>`.
7. Verify clean working tree.
