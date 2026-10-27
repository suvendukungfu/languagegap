# Benchmark Methodology

## 1. Intent-Equivalent Multilingual Evaluation

LanguageGap evaluates whether semantically equivalent questions receive equally accurate, complete, and understandable answers across diverse languages.

It is **not** a machine translation benchmark. Translating an English prompt literally often introduces unnatural syntax, cultural mismatches, or localized terminology issues. Instead, LanguageGap constructs tasks around **canonical semantic intents**, with prompt variants authored or verified by native language speakers.

---

## 2. Initial Scope: Digital Literacy & Technology in Society

Initial benchmark questions focus on topics where equal access to accurate information directly affects daily safety, digital rights, and privacy:

1. **Account Security & Strong Authentication**: Best practices for password management and two-factor authentication (2FA).
2. **Personal Data & Mobile Application Permissions**: Managing camera, contact, and location permissions on smartphones.
3. **Recognizing Suspicious Digital Messages (Phishing/Smishing)**: Identifying fraudulent SMS/messaging links requesting OTPs or urgent banking actions.
4. **AI-Generated Misinformation & Synthetic Media**: Practical checks to verify suspicious images, voice notes, and deepfakes.
5. **Understanding Recommendation Systems & Feed Algorithms**: How user engagement signals shape feeds, search results, and privacy profiles.
6. **Protecting Personal Information on Public Networks**: Risks and mitigations when using public Wi-Fi access points.

*Exclusion Notice:* Medical diagnosis, legal counsel, financial investment advice, and emergency response instructions are explicitly excluded from this initial benchmark.

---

## 3. Initial Supported Languages

| Language | ISO 639-1 | Script | Unicode Block | Writing System |
| :--- | :---: | :--- | :--- | :--- |
| **English** | `en` | Latin | `\u0020`–`\u007E` | Left-to-Right |
| **Hindi** | `hi` | Devanagari | `\u0900`–`\u097F` | Left-to-Right abugida |
| **Punjabi** | `pa` | Gurmukhi | `\u0A00`–`\u0A7F` | Left-to-Right abugida |
| **Odia** | `or` | Odia | `\u0B00`–`\u0B7F` | Left-to-Right abugida |

---

## 4. Benchmark Task Schema

Every task is defined in structured JSON conforming to the following model:

- `task_id`: Unique identifier (e.g., `DL-01-SEC-PWD`).
- `category`: Domain tag (`digital_literacy`).
- `topic`: Specific topic.
- `difficulty`: `beginner`, `intermediate`, or `advanced`.
- `canonical_intent`: A language-independent summary of what the user is asking.
- `gold_facts`: Array of atomic factual statements that a correct and complete response must mention.
- `disallowed_claims`: Known dangerous fallacies or misinformation to penalize (e.g., "Sharing OTPs with bank staff is safe").
- `reference_sources`: URLs or titles of stable, authoritative documentation (e.g., NIST SP 800-63B, CERT-In guidelines).
- `variants`: Dictionary mapping language code (`en`, `hi`, `pa`, `or`) to:
  - `prompt`: The natural question phrasing in the target language and script.
  - `status`: `native_authored` | `native_reviewed` | `provisional_translation`.
  - `author_notes`: Contextual explanation of localized phrasing or terminology choices.

---

## 5. Review & Approval Lifecycle

1. **Draft Creation**: Prompts are drafted ensuring equivalence to the canonical intent.
2. **Script Validation**: Automated checks verify script code points and NFC normalization.
3. **Human Review**: A native speaker validates that the prompt is natural, idiomatic, and culturally accessible.
4. **Approval**: Status transitions from `provisional_translation` to `native_reviewed`.
