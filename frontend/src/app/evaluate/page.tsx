"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Play, Settings2, Check, ArrowRight } from "lucide-react";
import { BenchmarkSummary } from "@/types";
import { createEvaluation, getBenchmarks, getEvaluation } from "@/lib/api";

export default function EvaluateSetupPage() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkSummary[]>([]);
  const selectedBenchmark = "digital_literacy";
  const [provider, setProvider] = useState<string>("mock");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [topP, setTopP] = useState<number>(0.95);
  const [maxTokens, setMaxTokens] = useState<number>(1024);

  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string>("pending");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getBenchmarks()
      .then((data) => {
        setBenchmarks(data);
        if (data.length > 0) {
          const defaultTasks = data[0].tasks.map((t) => t.task_id);
          setSelectedTasks(defaultTasks);
        }
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : "Failed to load benchmarks");
      });
  }, []);

  // Poll active run if running
  useEffect(() => {
    if (!activeRunId || runStatus === "completed" || runStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const detail = await getEvaluation(activeRunId);
        setRunStatus(detail.run.status);
        if (detail.run.status === "completed") {
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeRunId, runStatus]);

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectAllTasks = () => {
    if (benchmarks.length > 0) {
      setSelectedTasks(benchmarks[0].tasks.map((t) => t.task_id));
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTasks.length === 0) {
      setErrorMsg("Please select at least one benchmark task to evaluate.");
      return;
    }

    setIsLaunching(true);
    setErrorMsg(null);
    try {
      const run = await createEvaluation(
        {
          dataset_id: selectedBenchmark,
          provider: provider,
          task_ids: selectedTasks,
          sampling_params: {
            temperature,
            top_p: topP,
            max_tokens: maxTokens,
          },
        },
        false // asynchronous background execution
      );
      setActiveRunId(run.id);
      setRunStatus(run.status);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to start evaluation");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Page Header */}
      <div className="border-b border-[#DDD6C8] pb-6 dark:border-[#36332C]">
        <div className="flex items-center gap-2 mb-2">
          <span className="archival-stamp rounded px-1.5 py-0.5 text-[9px] text-[#2D4059] border-[#2D4059] dark:text-[#6F8CB0] dark:border-[#6F8CB0]">
            EXPERIMENT DISPATCH
          </span>
          <span className="specimen-tag text-[10px] text-[#7A7468]">
            BENCHMARK: DIGITAL LITERACY V1.0.0
          </span>
        </div>
        <h1 className="font-editorial-serif text-3xl font-bold tracking-tight text-[#1F1E1A] dark:text-[#EDE8DC] sm:text-4xl">
          Launch Multilingual Evaluation
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#5E594F] dark:text-[#A69F91] leading-relaxed max-w-2xl">
          Configure cross-lingual benchmark tasks and inference hyperparameters. Each selected task automatically executes across English, Hindi, Punjabi, and Odia.
        </p>
      </div>

      {errorMsg && (
        <div className="mt-6 rounded-xl border border-[#E5B5A7] bg-[#FAECE8] p-4 text-xs text-[#9E4A34] dark:border-[#52291E] dark:bg-[#2D1B17] dark:text-[#E5A394]">
          <strong>Configuration Error:</strong> {errorMsg}
        </div>
      )}

      {/* Live Run Progress Banner */}
      {activeRunId && (
        <div className="mt-6 rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] p-6 shadow-xs dark:border-[#36332C] dark:bg-[#1F1D19]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="archival-stamp rounded px-1.5 py-0.5 text-[9px] text-[#B35B43] border-[#B35B43]">
                EVALUATION IN FLIGHT
              </span>
              <h3 className="font-editorial-serif text-lg font-bold text-[#1F1E1A] dark:text-[#EDE8DC] mt-1.5">
                Cohort Run: <span className="font-mono text-base font-normal text-[#2D4059] dark:text-[#6F8CB0]">{activeRunId}</span>
              </h3>
              <p className="text-xs text-[#7A7468] dark:text-[#8C8577] mt-1">
                Status: <strong className="capitalize text-[#1F1E1A] dark:text-[#EDE8DC]">{runStatus}</strong> &bull; Evaluating {selectedTasks.length} tasks across 4 scripts
              </p>
            </div>

            <div className="flex items-center gap-3">
              {runStatus === "running" || runStatus === "pending" ? (
                <div className="flex items-center gap-2 rounded-xl border border-[#DDD6C8] bg-white px-4 py-2 text-xs font-semibold text-[#2D4059] shadow-2xs dark:border-[#36332C] dark:bg-[#171614] dark:text-[#6F8CB0]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#B35B43]" />
                  Generating & Evaluating Responses...
                </div>
              ) : runStatus === "completed" ? (
                <Link
                  href={`/evaluations/${activeRunId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#6E775F] bg-[#6E775F] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#5A634D] transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" /> View Comparison Matrix <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="text-xs text-[#B35B43] font-semibold">Evaluation Run Failed</span>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleLaunch} className="mt-8 space-y-8">
        {/* Step 1: Provider selection */}
        <div className="rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] p-6 shadow-xs dark:border-[#36332C] dark:bg-[#1F1D19]">
          <span className="specimen-tag text-[9px] font-bold text-[#2D4059] dark:text-[#6F8CB0] block mb-1">
            STAGE 01 &bull; INFERENCE PIPELINE
          </span>
          <h3 className="font-editorial-serif text-lg font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
            Select Model Inference Provider
          </h3>
          <p className="text-xs text-[#7A7468] dark:text-[#8C8577] mt-0.5">
            Choose between deterministic offline demonstration fixtures or live Gemma 4 inference server.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer flex-col rounded-xl border p-4.5 transition-all ${
                provider === "mock"
                  ? "border-[#B35B43] bg-[#FAECE8]/60 shadow-xs dark:border-[#D9785F] dark:bg-[#2D1B17]/60"
                  : "border-[#DDD6C8] bg-white hover:border-[#C8BFAD] dark:border-[#36332C] dark:bg-[#171614]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif font-bold text-base text-[#1F1E1A] dark:text-[#EDE8DC]">
                  Mock Provider
                </span>
                <input
                  type="radio"
                  name="provider"
                  value="mock"
                  checked={provider === "mock"}
                  onChange={() => setProvider("mock")}
                  className="h-4 w-4 accent-[#B35B43]"
                />
              </div>
              <p className="mt-2 text-xs text-[#5E594F] dark:text-[#A69F91] leading-relaxed">
                Deterministic, zero-cost multilingual fixture responses. Ideal for instant demonstrations, unit validation, and testing.
              </p>
              <span className="mt-3 inline-block rounded border border-[#CBD5E1] bg-[#E8ECF2] px-2 py-0.5 text-[9px] font-bold specimen-tag text-[#2D4059] w-fit dark:bg-[#1E293B] dark:text-[#94A3B8]">
                Illustrative Fixture Data
              </span>
            </label>

            <label
              className={`flex cursor-pointer flex-col rounded-xl border p-4.5 transition-all ${
                provider === "gemma"
                  ? "border-[#B35B43] bg-[#FAECE8]/60 shadow-xs dark:border-[#D9785F] dark:bg-[#2D1B17]/60"
                  : "border-[#DDD6C8] bg-white hover:border-[#C8BFAD] dark:border-[#36332C] dark:bg-[#171614]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif font-bold text-base text-[#1F1E1A] dark:text-[#EDE8DC]">
                  Gemma 4 Live Server
                </span>
                <input
                  type="radio"
                  name="provider"
                  value="gemma"
                  checked={provider === "gemma"}
                  onChange={() => setProvider("gemma")}
                  className="h-4 w-4 accent-[#B35B43]"
                />
              </div>
              <p className="mt-2 text-xs text-[#5E594F] dark:text-[#A69F91] leading-relaxed">
                Sends live requests to your OpenAI-compatible Gemma 4 inference server (Ollama, vLLM, Google AI Studio) configured in backend environment.
              </p>
              <span className="mt-3 inline-block rounded border border-[#BAC3AE] bg-[#EDF0EA] px-2 py-0.5 text-[9px] font-bold specimen-tag text-[#4E5642] w-fit dark:bg-[#20271C] dark:text-[#A3B192]">
                Live Model Inference
              </span>
            </label>
          </div>
        </div>

        {/* Step 2: Task selection */}
        <div className="rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] p-6 shadow-xs dark:border-[#36332C] dark:bg-[#1F1D19]">
          <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3.5 dark:border-[#2D2A24]">
            <div>
              <span className="specimen-tag text-[9px] font-bold text-[#2D4059] dark:text-[#6F8CB0] block mb-1">
                STAGE 02 &bull; TASK SELECTION
              </span>
              <h3 className="font-editorial-serif text-lg font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
                Benchmark Task Sets (Digital Literacy v1.0.0)
              </h3>
              <p className="text-xs text-[#7A7468] dark:text-[#8C8577]">
                Select matched cross-lingual prompts to evaluate across English, Hindi, Punjabi, and Odia.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSelectAllTasks}
              className="specimen-tag text-[10px] font-bold text-[#B35B43] hover:underline"
            >
              Select All (6)
            </button>
          </div>

          {benchmarks.length > 0 && (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {benchmarks[0].tasks.map((task) => {
                const isSelected = selectedTasks.includes(task.task_id);
                return (
                  <div
                    key={task.task_id}
                    onClick={() => handleTaskToggle(task.task_id)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3 ${
                      isSelected
                        ? "border-[#B35B43] bg-white shadow-xs dark:border-[#D9785F] dark:bg-[#171614]"
                        : "border-[#DDD6C8] bg-[#F6F2E9]/40 hover:bg-white dark:border-[#36332C] dark:bg-[#171614]/40"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        isSelected
                          ? "border-[#B35B43] bg-[#B35B43] text-white"
                          : "border-[#DDD6C8] bg-white dark:border-[#36332C]"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-3" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#1F1E1A] dark:text-[#EDE8DC]">
                          {task.task_id}
                        </span>
                        <span className="rounded bg-[#EFE9DC] px-1.5 py-0.2 text-[9px] font-semibold text-[#5E594F] dark:bg-[#2A2822] dark:text-[#A69F91]">
                          {task.difficulty}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#5E594F] dark:text-[#A69F91] leading-tight">
                        {task.canonical_intent}
                      </p>
                      <span className="mt-1.5 inline-block text-[10px] text-[#7A7468]">
                        4 matched variants: en &bull; hi &bull; pa &bull; or
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Hyperparameters */}
        <div className="rounded-2xl border border-[#DDD6C8] bg-[#FCFAF6] p-6 shadow-xs dark:border-[#36332C] dark:bg-[#1F1D19]">
          <span className="specimen-tag text-[9px] font-bold text-[#2D4059] dark:text-[#6F8CB0] block mb-1">
            STAGE 03 &bull; INFERENCE HYPERPARAMETERS
          </span>
          <h3 className="font-editorial-serif text-lg font-bold text-[#1F1E1A] dark:text-[#EDE8DC] flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-[#B35B43]" />
            Sampling Hyperparameters
          </h3>
          <p className="text-xs text-[#7A7468] dark:text-[#8C8577] mt-0.5">
            Parameters are applied identically across all four language variants to maintain experimental parity.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-[#1F1E1A] dark:text-[#EDE8DC]">Temperature</label>
                <span className="font-mono font-bold text-[#B35B43]">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-[#B35B43]"
              />
              <p className="text-[10px] text-[#7A7468]">Lower = deterministic & reproducible</p>
            </div>

            {/* Top P */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-[#1F1E1A] dark:text-[#EDE8DC]">Top P (Nucleus)</label>
                <span className="font-mono font-bold text-[#B35B43]">{topP}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full accent-[#B35B43]"
              />
              <p className="text-[10px] text-[#7A7468]">Probability threshold for token pool</p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-[#1F1E1A] dark:text-[#EDE8DC]">Max Generation Tokens</label>
                <span className="font-mono font-bold text-[#B35B43]">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="2048"
                step="128"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                className="w-full accent-[#B35B43]"
              />
              <p className="text-[10px] text-[#7A7468]">Sufficient budget for Indic scripts</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLaunching || selectedTasks.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#B35B43] bg-[#B35B43] px-8 py-3.5 text-sm font-semibold text-white shadow-xs hover:bg-[#9E4A34] transition-all disabled:opacity-50"
          >
            {isLaunching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Dispatching Cohort...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Dispatch Evaluation Cohort ({selectedTasks.length * 4} Responses)
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
