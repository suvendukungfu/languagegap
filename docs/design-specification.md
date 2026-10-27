# LanguageGap — Editorial Design Specification & Architecture Plan
## The Language Equity Observatory

> **Reference Inspiration:** *The Fascinating History of Banking* (Mosmuseum / Awwwards)
> **Creative Direction:** Museum-quality interactive exhibition meets rigorous AI evaluation platform.
> **Brand Concept:** *"Same question. Different languages. Equal opportunity to understand."*

---

### 1. Architectural & Design Audit

#### 1.1 Existing Route Structure
- `/` (`src/app/page.tsx`): Overview & recent evaluation runs table, latest parity card, Recharts bar chart.
- `/evaluate` (`src/app/evaluate/page.tsx`): Benchmark selector (`digital_literacy`), provider selection (`mock` / `gemma`), task checkbox selector, sampling hyperparameter sliders, async launch triggers.
- `/evaluations/[id]` (`src/app/evaluations/[id]/page.tsx`): 4-way language comparison matrix for 6 paired tasks, fact checklist, disallowed claim alerts, score badge, human review launch modal.

#### 1.2 Identified Redesign Opportunities
1. **Landing Narrative:** The current landing page is a standard SaaS-style cards container. We will expand it into an 8-chapter exhibition storytelling journey that guides visitors through the language divide, the matched experiment, live specimens, 14-pt rubric breakdown, language parity analytics, and human review provenance.
2. **Visual Hierarchy & Atmosphere:** Replace cold generic slate blues with warm archival ivory, deep ink typography, muted indigo headers, terracotta accent markers, and delicate museum specimen labels.
3. **Multilingual Typography:** Implement dedicated font stacks and script-aware layout tuning for Latin, Devanagari (`hi`), Gurmukhi (`pa`), and Odia (`or`).
4. **Interactive Observatory Shell:** Persistent exhibition masthead with chapter jump links, live provider telemetry, and smooth tab navigation.
5. **Human Review Archival Slip:** Style the human review override modal as an authenticated archival inspection certificate with verified stamp badges.

---

### 2. Design Tokens & Palette

| Token Name | Hex Code | HSL / CSS Variable | Primary Function |
| :--- | :--- | :--- | :--- |
| **Paper Canvas** | `#F6F2E9` | `hsl(42, 33%, 94%)` | Primary background, warm archival document feel |
| **Surface Cream** | `#FCFAF6` | `hsl(40, 40%, 98%)` | Elevated cards, specimen panels, modal sheets |
| **Deep Ink** | `#1F1E1A` | `hsl(45, 9%, 11%)` | Primary headlines, authoritative editorial body copy |
| **Muted Charcoal** | `#4A473F` | `hsl(43, 8%, 27%)` | Subheadings, secondary research commentary |
| **Muted Indigo** | `#2D4059` | `hsl(214, 33%, 26%)` | Primary brand accent, exhibit badges, chapter numbers |
| **Terracotta Rust** | `#B35B43` | `hsl(13, 46%, 48%)` | Disparity alerts, active chapter indicators, CTA buttons |
| **Sage Olive** | `#6E775F` | `hsl(83, 11%, 42%)` | Verified badges, equity metrics, supporting rules |
| **Archival Border** | `#DDD6C8` | `hsl(39, 21%, 83%)` | Card borders, table dividers, specimen frames |
| **Accent Gold** | `#C79D4C` | `hsl(40, 52%, 54%)` | Seals, highlight tags, award typography |

---

### 3. Typography Architecture

- **Display Headline Serif:** *Newsreader* (Optical sizing 6–72pt, italic accents for quotes and questions).
- **Interface & Analytical Sans:** *Plus Jakarta Sans* / *Geist* (weights 400, 500, 600, 700).
- **Indic Script Stacks:**
  - **Devanagari (`hi`):** `'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Nirmala UI', sans-serif`
  - **Gurmukhi (`pa`):** `'Noto Sans Gurmukhi', 'Mukta Mahee', 'Raavi', sans-serif`
  - **Odia (`or`):** `'Noto Sans Oriya', 'Kalinga', 'Nirmala UI', sans-serif`
- **Monospace Telemetry:** *Geist Mono* (Run IDs, model tags, latency timestamps, token counters).

---

### 4. Implementation Phasing Strategy

- **Phase B (Foundations):** Update `globals.css` with museum tokens, typography classes, specimen borders, and paper grain SVG filters.
- **Phase C (Editorial Storytelling Experience):** Build the 8-chapter exhibition on the homepage (`/`):
  - *Section 01:* Exhibition Hero — "Same question. Different languages. Different answers?"
  - *Section 02:* The Problem — Cross-lingual comprehension divide.
  - *Section 03:* The Experiment — 5-stage evaluation lifecycle.
  - *Section 04:* The Multilingual Comparison — Live matched task specimen comparison.
  - *Section 05:* The Evaluation Framework — Interactive 14-pt rubric breakdown.
  - *Section 06:* Language Parity Observatory — Live parity report cards and Recharts visualizations.
  - *Section 07:* Human Review Provenance — Audited truth vs. provisional scoring.
  - *Section 08:* Research Call to Action — Launch evaluation, audit historical runs, inspect benchmark.
- **Phase D (Application Interface Redesign):**
  - Modernize `Navbar` into an editorial archival masthead with live provider telemetry and chapter jumps.
  - Redesign `EvaluationSetupPage` (`/evaluate`) with exhibition curation layout.
  - Redesign `EvaluationDetailPage` (`/evaluations/[id]`) with museum specimen card matrix.
  - Style `HumanReviewModal` as an authenticated archival inspection slip.
  - Style Recharts in `ParityBarChart` with light archival paper palette.
- **Phase E & F (Motion, a11y & Quality Gates):**
  - Smooth chapter transitions, sticky table of contents, prefers-reduced-motion fallbacks.
  - Run secret scanning, Pytest (52 tests), ESLint, TypeScript typecheck, Vitest unit tests, and production build.
  - Capture desktop and mobile screenshots with browser subagent.
- **Phase G (Documentation & Commit):**
  - Commit cleanly to `feat/languagegap-mvp` and push.
