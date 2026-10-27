/**
 * Typed API Client for LanguageGap Backend.
 */

import {
  BenchmarkSummary,
  CreateEvaluationRequest,
  EvaluationDetailResponse,
  EvaluationSummary,
  HumanReviewRequest,
  LanguageInfo,
  ParityGapReport,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function getHealth(): Promise<{ status: string; version: string; provider: string }> {
  return fetchJson(`${API_BASE}/health`);
}

export async function getLanguages(): Promise<LanguageInfo[]> {
  return fetchJson(`${API_BASE}/languages`);
}

export async function getBenchmarks(): Promise<BenchmarkSummary[]> {
  return fetchJson(`${API_BASE}/benchmarks`);
}

export async function listEvaluations(): Promise<EvaluationSummary[]> {
  return fetchJson(`${API_BASE}/evaluations`);
}

export async function getEvaluation(id: string): Promise<EvaluationDetailResponse> {
  return fetchJson(`${API_BASE}/evaluations/${id}`);
}

export async function getEvaluationReport(id: string): Promise<ParityGapReport> {
  return fetchJson(`${API_BASE}/evaluations/${id}/report`);
}

export async function createEvaluation(
  payload: CreateEvaluationRequest,
  sync: boolean = false
): Promise<EvaluationSummary> {
  return fetchJson(`${API_BASE}/evaluations?sync=${sync}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitHumanReview(
  responseId: string,
  payload: HumanReviewRequest
): Promise<{ status: string; response_id: string }> {
  return fetchJson(`${API_BASE}/reviews/${responseId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
