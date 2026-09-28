"use client";

import { useState } from 'react';
import { Brain, FileText, Copy, Download, Loader2, CheckCircle } from 'lucide-react';

export default function JobEvaluator() {
  const [jobDescription, setJobDescription] = useState('');
  const [model, setModel] = useState<'gemini' | 'openrouter' | 'openai'>('gemini');
  const [cvPath, setCvPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEvaluate = async () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/career-ops/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, model, cvPath }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Evaluation failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job Evaluator</h1>
        <p className="text-slate-500 mt-1">
          Evaluate job descriptions with AI-powered structured analysis (A-H blocks, 1-5 scoring)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Evaluation Input</h2>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">AI Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white transition-all"
            >
              <option value="gemini">Gemini (Free tier available)</option>
              <option value="openrouter">OpenRouter (Free models)</option>
              <option value="openai">OpenAI-compatible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Your CV Path (optional)</label>
            <input
              type="text"
              placeholder="e.g. ../cv.md or /path/to/cv.md"
              value={cvPath}
              onChange={(e) => setCvPath(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Job Description *</label>
            <textarea
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={15}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white transition-all resize-y"
            />
          </div>

          <button
            onClick={handleEvaluate}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Evaluate Job
              </>
            )}
          </button>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Evaluation Result</h2>
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                  Score: {result.score || 'N/A'}/5
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                  Grade: {result.grade || 'N/A'}
                </span>
              </div>

              {result.blocks && (
                <div className="space-y-3">
                  {Object.entries(result.blocks).map(([key, block]: [string, any]) => (
                    <div key={key} className="p-3 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize text-slate-900">{key}</h4>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-mono">
                          {block.score}/5
                        </span>
                      </div>
                      {block.summary && (
                        <p className="text-sm text-slate-500 mt-1">{block.summary}</p>
                      )}
                      {block.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-slate-500">Show details</summary>
                          <pre className="mt-2 text-xs bg-slate-50 p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(block.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {result.raw && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-slate-500">Show raw output</summary>
                  <pre className="mt-2 text-xs bg-slate-50 p-2 rounded overflow-auto max-h-60">
                    {typeof result.raw === 'string' ? result.raw : JSON.stringify(result.raw, null, 2)}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm flex items-center gap-1"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
                <button
                  onClick={() => copyToClipboard(typeof result.raw === 'string' ? result.raw : JSON.stringify(result.raw, null, 2))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download Report
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Evaluation results will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}