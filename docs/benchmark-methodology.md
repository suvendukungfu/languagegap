# Benchmark Methodology

## 1. Intent-Equivalent Multilingual Evaluation

LanguageGap evaluates whether semantically equivalent questions receive equally accurate, complete, and understandable answers across diverse languages.

It is **not** a machine translation benchmark. Translating an English prompt literally often introduces unnatural syntax, cultural mismatches, or localized terminology issues. Instead, LanguageGap constructs tasks around **canonical semantic intents**, with prompt variants authored or verified by native language speakers.

---

## 2. Initial Scope: Digital Literacy & Technology in Society (v1.0.0)

Initial benchmark questions focus on topics where equal access to accurate information directly affects daily safety, digital rights, and privacy:

1. **`DL-01-SEC-2FA` — Account Security & Strong Authentication**: Best practices for password management and two-factor authentication (2FA).
2. **`DL-02-PRIV-PERMS` — Personal Data & Mobile Application Permissions**: Managing camera, contact, and location permissions on smartphones.
3. **`DL-03-FRAUD-PHISH` — Recognizing Suspicious Digital Messages (Phishing/Smishing)**: Identifying fraudulent SMS/messaging links requesting OTPs or urgent banking actions.
4. **`DL-04-AI-SYNTH` — AI-Generated Misinformation & Synthetic Media**: Practical checks to verify suspicious images, voice notes, and deepfakes.
5. **`DL-05-ALGO-FEED` — Understanding Recommendation Systems & Feed Algorithms**: How user engagement signals shape feeds, search results, and privacy profiles.
6. **`DL-06-NET-WIFI` — Protecting Personal Information on Public Networks**: Risks and mitigations when using public Wi-Fi access points.

*Exclusion Notice:* Medical diagnosis, legal counsel, financial investment advice, and emergency response instructions are explicitly excluded from this initial benchmark.

---

## 3. Initial Supported Languages & Script Fidelity

| Language | ISO 639-1 | Script | Unicode Block | Writing System |
| :--- | :---: | :--- | :--- | :--- |
| **English** | `en` | Latin | `\u0020`–`\u007E` | Left-to-Right |
| **Hindi** | `hi` | Devanagari | `\u0900`–`\u097F` | Left-to-Right abugida |
| **Punjabi** | `pa` | Gurmukhi | `\u0A00`–`\u0A7F` | Left-to-Right abugida |
| **Odia** | `or` | Odia | `\u0B00`–`\u0B7F` | Left-to-Right abugida |

All text prompts are strictly validated for Unicode NFC normalization (`unicodedata.normalize("NFC", text)`) and verified against the Unicode block of their declared script.

---

## 4. Benchmark Task Schema

Every task is defined in structured JSON (`backend/data/benchmarks/v1/digital_literacy.json`) conforming to `BenchmarkTaskSchema`:

- `task_id`: Unique stable identifier (e.g., `DL-01-SEC-2FA`).
- `category`: Domain tag (`digital_literacy`).
- `topic`: Specific topic.
- `difficulty`: `beginner`, `intermediate`, or `advanced`.
- `canonical_intent`: A language-independent summary of what the user is asking.
- `required_facts`: Array of atomic factual statements that a correct and complete response must mention.
- `disallowed_claims`: Known dangerous fallacies or misinformation to penalize (e.g., "Sharing OTPs with bank staff is safe").
- `source_references`: Stable, authoritative documentation citations (NIST, CERT-In, RBI, FTC, CISA).
- `variants`: Dictionary mapping language code (`en`, `hi`, `pa`, `or`) to:
  - `language`: `en` | `hi` | `pa` | `or`.
  - `script`: `Latin` | `Devanagari` | `Gurmukhi` | `Odia`.
  - `prompt`: The natural question phrasing in the target language and script.
  - `review_status`: `native_authored` | `native_reviewed` | `pending_native_review` | `provisional_translation`.
  - `author_notes`: Contextual explanation of localized phrasing or terminology choices.

---

## 5. Review & Approval Lifecycle

```
[Draft Variant] ──► [Unicode & Script Check] ──► [Native Speaker Audit] ──► [Approved Status]
       │                                                    │
       ▼                                                    ▼
(provisional_translation)                          (native_reviewed / native_authored)
```

1. **Draft Creation**: Prompts are drafted ensuring equivalence to the canonical intent.
2. **Automated Validation**: Automated checks verify script code points and NFC normalization.
3. **Review Status**:
   - `native_authored`: Directly written by a fluent native speaker.
   - `native_reviewed`: Audited and verified by a native speaker.
   - `pending_native_review`: Awaiting fluent reviewer audit.
   - `provisional_translation`: Automated or draft translation.
4. **Provenance Integrity Guarantee**:
   - Only `native_authored` and `native_reviewed` are treated as human-approved (`is_human_approved = True`).
   - Machine-generated translations must NEVER automatically receive approved status.

---

## 6. Running Dataset Validation

To validate the benchmark dataset locally:

```bash
cd backend
python -m app.benchmark.validator data/benchmarks/v1/digital_literacy.json
```
or run the Pytest test suite:
```bash
pytest tests/test_dataset_schema.py tests/test_unicode_normalization.py -v
```
