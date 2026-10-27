/**
 * TypeScript Data Models matching Backend FastAPI Contracts.
 */

export type SupportedLanguage = "en" | "hi" | "pa" | "or";

export type EvaluationMethod = "automated_provisional" | "human_validated";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  script: string;
  direction: string;
  native_name: string;
  unicode_range: string;
}

export interface DimensionScores {
  factual_correctness: number;
  completeness: number;
  instruction_adherence: number;
  language_naturalness: number;
  safety_appropriateness: number;
  total_score: number;
}

export interface FactCoverageItem {
  fact: string;
  covered: boolean;
  evidence: string | null;
  confidence: number;
}

export interface UnsupportedClaimItem {
  claim: string;
  severity: "low" | "medium" | "critical";
  explanation: string;
}

export interface HumanReviewRecord {
  reviewer_id: string;
  reviewed_at: string;
  original_scores: DimensionScores;
  overridden_scores: DimensionScores;
  reviewer_notes: string;
}

export interface TaskResponseDetail {
  id: string;
  task_id: string;
  language: SupportedLanguage;
  prompt: string;
  response_text: string;
  latency_ms: number;
  dimension_scores: DimensionScores;
  is_provisional: boolean;
  evaluation_method: string;
  fact_coverage: FactCoverageItem[];
  unsupported_claims: UnsupportedClaimItem[];
  evidence_notes?: string | null;
  human_review?: HumanReviewRecord | null;
}

export interface EvaluationSummary {
  id: string;
  dataset_id: string;
  benchmark_version: string;
  model_id: string;
  provider_name: string;
  status: "pending" | "running" | "completed" | "failed";
  created_at: string;
  completed_at?: string | null;
  error_message?: string | null;
  response_count: number;
}

export interface EvaluationDetailResponse {
  run: EvaluationSummary;
  responses: TaskResponseDetail[];
}

export interface DimensionalParityGap {
  dimension_name: string;
  max_language: SupportedLanguage;
  min_language: SupportedLanguage;
  max_mean: number;
  min_mean: number;
  gap: number;
}

export interface ParityGapReport {
  benchmark_version: string;
  model_id: string;
  provider_name: string;
  sample_count: number;
  paired_task_count: number;
  language_means: Record<SupportedLanguage, number>;
  overall_parity_gap: number;
  highest_language: SupportedLanguage;
  lowest_language: SupportedLanguage;
  dimensional_gaps: Record<string, DimensionalParityGap>;
  is_provisional: boolean;
  generated_at: string;
}

export interface BenchmarkTaskVariant {
  script: string;
  review_status: string;
  prompt: string;
}

export interface BenchmarkTaskItem {
  task_id: string;
  category: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  canonical_intent: string;
  required_facts_count: number;
  disallowed_claims_count: number;
  source_references: string[];
  variants: Record<SupportedLanguage, BenchmarkTaskVariant>;
}

export interface BenchmarkSummary {
  dataset_id: string;
  version: string;
  title: string;
  description: string;
  task_count: number;
  tasks: BenchmarkTaskItem[];
}

export interface CreateEvaluationRequest {
  dataset_id?: string;
  provider?: string;
  task_ids?: string[];
  sampling_params?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export interface HumanReviewRequest {
  reviewer_id: string;
  score_overrides: {
    factual_correctness: number;
    completeness: number;
    instruction_adherence: number;
    language_naturalness: number;
    safety_appropriateness: number;
  };
  reviewer_notes: string;
}
