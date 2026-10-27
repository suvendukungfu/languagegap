"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Play, Settings2, Check, ArrowRight, ArrowLeft } from "lucide-react";
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
  const [completedResponses, setCompletedResponses] = useState<number>(0);
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
        setCompletedResponses(detail.responses?.length || 0);
        if (detail.run.status === "completed") {
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
    }, 1200);

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
    setCompletedResponses(0);
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to start evaluation");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#ADADAD] pt-24 pb-20 selection:bg-[#F0A24C]/25 selection:text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#7D7D7D] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Research Overview</span>
        </Link>

        {/* Page Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] tracking-widest uppercase font-mono text-[#F0A24C] bg-[#2C241D] border border-[#F0A24C]/30">
              EXPERIMENT DISPATCH
            </span>
            <span className="text-[10px] font-mono text-[#7D7D7D]">
              BENCHMARK: DIGITAL LITERACY V1.0.0
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
            Launch Multilingual Evaluation
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#ADADAD] leading-relaxed max-w-2xl font-light">
            Configure cross-lingual benchmark tasks and inference hyperparameters. Each selected task automatically executes across English, Hindi, Punjabi, and Odia.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-xs text-red-200">
            <strong>Configuration Error:</strong> {errorMsg}
          </div>
        )}

        {/* Live Run Progress Banner */}
        {activeRunId && (
          <div className="mt-6 rounded-2xl border border-[#F0A24C]/40 bg-[#1D1D1D]/90 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#F0A24C] bg-[#2C241D] border border-[#F0A24C]/40">
                  {runStatus === "completed" ? "EVALUATION COMPLETE" : "EVALUATION IN FLIGHT"}
                </span>
                <h3 className="text-base font-normal text-white mt-2">
                  Cohort Run: <span className="font-mono text-sm text-[#F0A24C]">{activeRunId}</span>
                </h3>
                <p className="text-xs text-[#7D7D7D] mt-1">
                  Status: <strong className="capitalize text-white">{runStatus}</strong> •{" "}
                  {completedResponses} / {selectedTasks.length * 4} Responses Evaluated across 4 scripts
                </p>
              </div>

              <div className="flex items-center gap-3">
                {runStatus === "running" || runStatus === "pending" ? (
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#131313] px-4 py-2 text-xs font-medium text-white shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-[#F0A24C]" />
                    <span>Evaluating {provider === "gemma" ? "Gemma 4" : "Cohort"} Responses ({completedResponses}/{selectedTasks.length * 4})...</span>
                  </div>
                ) : runStatus === "completed" ? (
                  <Link
                    href={`/evaluations/${activeRunId}`}
                    className="btn-amber-glass inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-normal shadow-[0_0_20px_rgba(240,162,76,0.3)] animate-pulse"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#F0A24C]" />
                    <span>View Comparison Matrix</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="text-xs text-red-400 font-semibold">Evaluation Run Failed</span>
                )}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-[#131313] rounded-full h-1.5 mt-4 overflow-hidden border border-white/5">
              <div
                className="bg-[#F0A24C] h-full transition-all duration-500 rounded-full shadow-[0_0_10px_#F0A24C]"
                style={{
                  width: `${
                    runStatus === "completed"
                      ? 100
                      : Math.max(8, Math.min(100, Math.round((completedResponses / (selectedTasks.length * 4 || 1)) * 100)))
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleLaunch} className="mt-8 space-y-8">
          {/* Step 1: Provider selection */}
          <div className="rounded-2xl border border-white/10 bg-[#1D1D1D]/70 p-6 shadow-xl backdrop-blur-xl">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#F0A24C] block mb-1">
              STAGE 01 • INFERENCE PIPELINE
            </span>
            <h3 className="text-lg font-normal text-white">
              Select Model Inference Provider
            </h3>
            <p className="text-xs text-[#7D7D7D] mt-0.5 font-light">
              Choose between deterministic offline demonstration fixtures or live Gemma 4 inference server.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-5 transition-all ${
                  provider === "mock"
                    ? "border-[#F0A24C]/60 bg-[#2C241D]/60 shadow-[0_0_20px_rgba(240,162,76,0.15)]"
                    : "border-white/10 bg-[#131313]/60 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-normal text-base text-white">
                    Mock Provider
                  </span>
                  <input
                    type="radio"
                    name="provider"
                    value="mock"
                    checked={provider === "mock"}
                    onChange={() => setProvider("mock")}
                    className="h-4 w-4 accent-[#F0A24C]"
                  />
                </div>
                <p className="mt-2 text-xs text-[#ADADAD] leading-relaxed font-light">
                  Deterministic, zero-cost multilingual fixture responses. Ideal for instant demonstrations, unit validation, and testing.
                </p>
                <span className="mt-3 inline-block rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-[#ADADAD] w-fit">
                  Deterministic Fixture Data
                </span>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-5 transition-all ${
                  provider === "gemma"
                    ? "border-[#F0A24C]/60 bg-[#2C241D]/60 shadow-[0_0_20px_rgba(240,162,76,0.15)]"
                    : "border-white/10 bg-[#131313]/60 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-normal text-base text-white">
                    Gemma 4 Live Server
                  </span>
                  <input
                    type="radio"
                    name="provider"
                    value="gemma"
                    checked={provider === "gemma"}
                    onChange={() => setProvider("gemma")}
                    className="h-4 w-4 accent-[#F0A24C]"
                  />
                </div>
                <p className="mt-2 text-xs text-[#ADADAD] leading-relaxed font-light">
                  Sends live requests to your OpenAI-compatible Gemma 4 inference server (Ollama, vLLM, Google AI Studio) configured in backend environment.
                </p>
                <span className="mt-3 inline-block rounded border border-[#F0A24C]/30 bg-[#2C241D] px-2 py-0.5 text-[10px] font-mono text-[#F0A24C] w-fit">
                  Live Model Inference
                </span>
              </label>
            </div>
          </div>

          {/* Step 2: Task selection */}
          <div className="rounded-2xl border border-white/10 bg-[#1D1D1D]/70 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#F0A24C] block mb-1">
                  STAGE 02 • TASK SELECTION
                </span>
                <h3 className="text-lg font-normal text-white">
                  Benchmark Task Sets (Digital Literacy v1.0.0)
                </h3>
                <p className="text-xs text-[#7D7D7D] font-light">
                  Select matched cross-lingual prompts to evaluate across English, Hindi, Punjabi, and Odia.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllTasks}
                className="text-xs font-mono text-[#F0A24C] hover:underline"
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
                      className={`cursor-pointer rounded-xl border p-4 transition-all flex items-start gap-3 ${
                        isSelected
                          ? "border-[#F0A24C]/60 bg-[#2C241D]/40 text-white shadow-sm"
                          : "border-white/5 bg-[#131313]/60 hover:border-white/20 text-[#ADADAD]"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? "border-[#F0A24C] bg-[#F0A24C] text-black"
                            : "border-white/20 bg-transparent"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-3 text-black" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-white">
                            {task.task_id}
                          </span>
                          <span className="rounded bg-white/5 px-1.5 py-0.2 text-[9px] font-mono text-[#ADADAD]">
                            {task.difficulty}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#ADADAD] leading-tight font-light">
                          {task.canonical_intent}
                        </p>
                        <span className="mt-2 inline-block text-[10px] text-[#717171] font-mono">
                          4 matched variants: en • hi • pa • or
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Hyperparameters */}
          <div className="rounded-2xl border border-white/10 bg-[#1D1D1D]/70 p-6 shadow-xl backdrop-blur-xl">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#F0A24C] block mb-1">
              STAGE 03 • INFERENCE HYPERPARAMETERS
            </span>
            <h3 className="text-lg font-normal text-white flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[#F0A24C]" />
              Sampling Hyperparameters
            </h3>
            <p className="text-xs text-[#7D7D7D] mt-0.5 font-light">
              Parameters are applied identically across all four language variants to maintain experimental parity.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="text-white">Temperature</label>
                  <span className="font-mono text-[#F0A24C]">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[#F0A24C]"
                />
                <p className="text-[10px] text-[#717171]">Lower = deterministic & reproducible</p>
              </div>

              {/* Top P */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="text-white">Top P (Nucleus)</label>
                  <span className="font-mono text-[#F0A24C]">{topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full accent-[#F0A24C]"
                />
                <p className="text-[10px] text-[#717171]">Probability threshold for token pool</p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <label className="text-white">Max Generation Tokens</label>
                  <span className="font-mono text-[#F0A24C]">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="2048"
                  step="128"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  className="w-full accent-[#F0A24C]"
                />
                <p className="text-[10px] text-[#717171]">Sufficient budget for Indic scripts</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLaunching || selectedTasks.length === 0}
              className="btn-amber-glass w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-normal text-white shadow-xl disabled:opacity-50"
            >
              {isLaunching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#F0A24C]" />
                  <span>Dispatching Cohort...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 text-[#F0A24C]" />
                  <span>Dispatch Evaluation Cohort ({selectedTasks.length * 4} Responses)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
