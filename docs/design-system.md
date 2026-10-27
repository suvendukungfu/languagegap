# LanguageGap Design System: Language Equity Observatory

## 1. Design Philosophy & Inspiration

LanguageGap's design identity translates the editorial storytelling and visual archival depth of award-winning digital exhibitions—specifically inspired by the visual principles, interaction patterns, and typography of *The Fascinating History of Banking* ([bank-history.mosmuseum.ru/en](https://bank-history.mosmuseum.ru/en))—into an original interactive research observatory for multilingual AI evaluation.

Rather than adopting a generic dark-mode AI dashboard with purple neon gradients, LanguageGap is conceived as an **open research exhibition**. It approaches language equity as a serious civil rights and digital literacy question:

> **"Same question. Different languages. Equal opportunity to understand."**

---

## 2. Archival Color Palette

All colors adhere to WCAG 2.2 AA contrast standards against their corresponding surfaces, avoiding harsh pure-white backgrounds in favor of archival textures.

| Token | Light Value | Dark Value | Role & Semantic Meaning |
| :--- | :--- | :--- | :--- |
| `--background` (Paper) | `#F6F2E9` | `#171614` | Primary archival paper backdrop with subtle radial tactile grain |
| `--surface` (Ivory) | `#FCFAF6` | `#1F1D19` | Elevated specimen card surface for readability and contrast |
| `--surface-muted` | `#EFE9DC` | `#2A2822` | Secondary containers, callouts, and code point badges |
| `--foreground` (Deep Ink) | `#1F1E1A` | `#EDE8DC` | High-contrast editorial display and primary body text |
| `--ink-muted` | `#5E594F` | `#A69F91` | Secondary labels, descriptions, and provenance metadata |
| `--indigo` | `#2D4059` | `#6F8CB0` | Primary brand accent; English language variant anchor |
| `--terracotta` | `#B35B43` | `#D9785F` | Secondary warmth accent; Hindi (Devanagari) variant anchor |
| `--sage` | `#6E775F` | `#96A184` | Natural balance accent; Punjabi (Gurmukhi) variant anchor |
| `--gold` | `#C79D4C` | `#DFB768` | Telemetry highlight accent; Odia (Oriya) variant anchor |
| `--border` | `#DDD6C8` | `#36332C` | Subtle dividers mimicking physical document framing |

---

## 3. Multilingual Typography & Indic Script Stacks

LanguageGap prioritizes authentic orthography over decorative transliteration. Font stacks provide dedicated support for complex Indic conjuncts and ligatures:

### Display & Interface Typefaces
- **Editorial Serif:** *Newsreader* (Google Fonts, variable optical sizes `opsz 6..72`, stylistic alternates `cv02`, `cv03`, `dlig`). Used for exhibition chapter headings and literary quotes.
- **Product Sans:** *Plus Jakarta Sans* / *Geist Sans*. High legibility at small sizes (10px–14px) for telemetry numbers and metadata.

### Native Script Stacks & Metrics
```css
/* Devanagari (Hindi) */
.font-devanagari {
  font-family: 'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Nirmala UI', sans-serif;
  line-height: 1.7; /* Prevents vertical glyph clipping on conjunct matras */
}

/* Gurmukhi (Punjabi) */
.font-gurmukhi {
  font-family: 'Noto Sans Gurmukhi', 'Kohinoor Gurmukhi', 'Raavi', sans-serif;
  line-height: 1.7; /* Preserves tippi, bindi, and addak diacritics */
}

/* Odia */
.font-odia {
  font-family: 'Noto Sans Oriya', 'Kalinga', 'Nirmala UI', sans-serif;
  line-height: 1.75; /* Protects rounded upper ligatures and lower karas */
}
```

---

## 4. Design Components & Archival Primitives

### `specimen-card`
Curatorial white-paper plate with subtle multi-stop box shadows (`0 1px 2px rgba(31,30,26,0.03), 0 10px 30px -5px rgba(31,30,26,0.04)`) and warm border dividers.

### `specimen-tag`
Monospaced catalog classification label (`letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px–11px`) used for chapter markers, task IDs, and Unicode code point ranges.

### `archival-stamp`
Historical bordered stamp (`border: 1.5px solid currentColor; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700`) indicating formal methodology or verification status:
- `PROVISIONAL AUTOMATED`: Fast preliminary rule-based matching.
- `HUMAN VERIFIED`: Expert native speaker certification with immutable audit timestamp.
- `ILLUSTRATIVE DEMO FIXTURE`: Transparent label on deterministic mock provider runs.

### `LanguageComparisonMatrix`
Four-panel side-by-side specimen plate comparing English, Hindi, Punjabi, and Odia responses for a matched task, featuring real-time gold fact coverage, disallowed claim alerts, and the audit trigger.

### `HumanReviewModal`
Accessible WCAG 2.2 AA audit certificate dialog with keyboard trap, score differential sliders, and mandatory reviewer identity & notes provenance recording.

---

## 5. Motion & Accessibility

### Motion Guidelines
- **Zero Scroll Hijacking:** Navigation uses standard browser scrolling with CSS smooth scrolling (`scroll-behavior: smooth`).
- **Reduced Motion Support:** When `prefers-reduced-motion: reduce` is detected, all transitions and animations immediately collapse to 0.01ms.
- **Battery-Friendly:** No continuous ambient loops or canvas particles that drain mobile batteries.

### Accessibility Safeguards
- Contrast ratios exceed WCAG 2.2 AA 4.5:1 for body copy and 3:1 for large display text.
- Full keyboard focusability (`focus-visible:ring-2 focus-visible:ring-[#2D4059] focus-visible:ring-offset-2`).
- Screen reader semantic announcements using ARIA roles (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`).

---

## 6. Visual Audit Screenshots

| View | Screenshot Asset |
| :--- | :--- |
| **Desktop Exhibition Homepage** | [`docs/screenshots/redesign/desktop_home_redesign.png`](file:///Users/suvendusahoo/hackchandiuniverisity/languagegap/docs/screenshots/redesign/desktop_home_redesign.png) |
| **Mobile Exhibition Homepage (390px)** | [`docs/screenshots/redesign/mobile_home_redesign.png`](file:///Users/suvendusahoo/hackchandiuniverisity/languagegap/docs/screenshots/redesign/mobile_home_redesign.png) |
| **Cross-Lingual Evaluation Matrix** | [`docs/screenshots/redesign/evaluation_detail_redesign.png`](file:///Users/suvendusahoo/hackchandiuniverisity/languagegap/docs/screenshots/redesign/evaluation_detail_redesign.png) |
| **Curator Evaluation Launcher** | [`docs/screenshots/redesign/evaluate_page_redesign.png`](file:///Users/suvendusahoo/hackchandiuniverisity/languagegap/docs/screenshots/redesign/evaluate_page_redesign.png) |
