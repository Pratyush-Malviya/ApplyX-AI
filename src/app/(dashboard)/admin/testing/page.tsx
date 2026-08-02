"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Play, Loader2, Clock, Cpu, Database } from "lucide-react";

interface TestResult {
  content: string;
  provider: string;
  model: string;
  displayName: string;
  cached: boolean;
  cacheType: string | null;
  task: string;
  latencyMs: number;
}

const TASK_OPTIONS = ["general", "resume", "cover-letter", "analyze", "sales_assist", "support_assist", "research"];

export default function TestingPage() {
  const [prompt, setPrompt] = useState("");
  const [task, setTask] = useState("general");
  const [systemInstruction, setSystemInstruction] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState("");

  const runTest = async () => {
    if (!prompt.trim()) return;
    setRunning(true); setResult(null); setError("");
    try {
      const res = await fetch("/api/admin/test/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, task, systemInstruction: systemInstruction || undefined, temperature, maxTokens }),
      });
      const json = await res.json();
      if (res.ok) setResult(json);
      else setError(json.error ?? "Test failed");
    } catch (e: any) { setError(e.message); }
    setRunning(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FlaskConical size={22} className="text-rose-400" /> AI Testing Lab</h1>
        <p className="text-slate-500 text-sm mt-1">Test prompts through the full AI gateway with custom parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Test Input</h2>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Task Type</label>
              <select value={task} onChange={e => setTask(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
                {TASK_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">System Instruction (optional override)</label>
              <textarea value={systemInstruction} onChange={e => setSystemInstruction(e.target.value)}
                rows={3} placeholder="Leave blank to use active admin system prompt..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono resize-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Prompt *</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                rows={6} placeholder="Enter your test prompt here..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white resize-none" />
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Generation Parameters</h2>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400 font-medium">Temperature</label>
                <span className="text-xs text-violet-400 font-mono">{temperature}</span>
              </div>
              <input type="range" min={0} max={2} step={0.05} value={temperature} onChange={e => setTemperature(Number(e.target.value))}
                className="w-full accent-violet-500" />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>0 (Deterministic)</span><span>1.0 (Balanced)</span><span>2.0 (Creative)</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400 font-medium">Max Tokens</label>
                <span className="text-xs text-violet-400 font-mono">{maxTokens}</span>
              </div>
              <input type="range" min={128} max={8192} step={128} value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))}
                className="w-full accent-violet-500" />
            </div>
            <button onClick={runTest} disabled={running || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm text-white font-semibold transition-colors">
              {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {running ? "Running Test..." : "Run Test"}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 min-h-64">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Output</h2>
            {error && <div className="text-rose-400 text-sm bg-rose-600/10 border border-rose-500/30 rounded-lg p-3">{error}</div>}
            {running && (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 size={24} className="animate-spin mr-3" /> Running inference...
              </div>
            )}
            {result && !running && (
              <div className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                    <Clock size={14} className="mx-auto text-cyan-400 mb-1" />
                    <div className="text-sm font-semibold text-white">{result.latencyMs}ms</div>
                    <div className="text-[10px] text-slate-500">Latency</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                    <Cpu size={14} className="mx-auto text-violet-400 mb-1" />
                    <div className="text-xs font-semibold text-white truncate">{result.provider}</div>
                    <div className="text-[10px] text-slate-500">Provider</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                    <Database size={14} className="mx-auto text-emerald-400 mb-1" />
                    <div className="text-xs font-semibold text-white">{result.cached ? result.cacheType ?? "hit" : "miss"}</div>
                    <div className="text-[10px] text-slate-500">Cache</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Model: <span className="text-slate-300 font-medium">{result.displayName}</span> · Task: <span className="text-slate-300">{result.task}</span>
                </div>
                {/* Content */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{result.content}</pre>
                </div>
              </div>
            )}
            {!result && !running && !error && (
              <div className="py-12 text-center text-slate-600">
                <FlaskConical size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Enter a prompt and click Run Test</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
