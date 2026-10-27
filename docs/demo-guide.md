# LanguageGap Demonstration Guide

This guide describes how an evaluator, researcher, or judge can run and inspect LanguageGap locally using deterministic fixtures or live model endpoints.

---

## 1. Quick Local Execution

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node.js 25)

### Running Backend (Terminal 1)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```

### Running Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Walkthrough of the Evaluation Workflow

1. **Dashboard Overview**:
   - Navigate to `/` to view aggregate language parity metrics, historical benchmark runs, and cross-lingual score distributions.
2. **Start a New Evaluation**:
   - Click **Run Evaluation** (`/evaluate`).
   - Select the **Digital Literacy v1** benchmark.
   - Choose the execution provider:
     - `Mock Provider`: Fast, deterministic offline run with realistic Indic responses.
     - `Gemma Provider`: Live inference using configured endpoint.
   - Click **Start Evaluation Run**.
3. **Inspect Cross-Lingual Comparisons**:
   - Open the completed evaluation run.
   - View the side-by-side responses for English, Hindi, Punjabi, and Odia.
   - Observe the missing required facts and score breakdown per language.
4. **Human Verification & Score Override**:
   - Click **Review Response** on any provisional item.
   - Inspect the gold facts checklist, edit dimension scores if justified, and enter reviewer notes.
   - Save the review: notice how the badge changes from `Provisional` to `Human Verified`, and aggregate parity scores update dynamically.
