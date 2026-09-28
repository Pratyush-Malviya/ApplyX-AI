"use client";

import { useState } from 'react';
import { Search, Briefcase, FileText, Loader2, ExternalLink } from 'lucide-react';

export default function JobScanner() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [limit, setLimit] = useState('20');
  const [providers, setProviders] = useState<string[]>(['greenhouse', 'lever', 'ashby', 'bamboohr']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const allProviders = [
    'greenhouse', 'lever', 'ashby', 'bamboohr', 'teamtailor', 'workday', 'breezy',
    'smartrecruiters', 'jobvite', 'icims', 'recruitee', 'personio', 'comeet'
  ];

  const handleScan = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/career-ops/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, limit: parseInt(limit), providers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      setResults(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderToggle = (provider: string) => {
    setProviders(prev =>
      prev.includes(provider)
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job Scanner</h1>
        <p className="text-slate-500 mt-1">
          Scan job boards for relevant positions using career-ops providers
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">Search Configuration</h2>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Search Query *</label>
          <input
            type="text"
            placeholder="e.g. Senior Software Engineer React TypeScript"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Location</label>
            <input
              type="text"
              placeholder="e.g. San Francisco, CA or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Results Limit</label>
            <select
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white transition-all"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700">Job Providers</label>
          <div className="flex flex-wrap gap-2">
            {allProviders.map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleProviderToggle(provider)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  providers.includes(provider)
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleScan}
          disabled={loading}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Scan Jobs
            </>
          )}
        </button>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</div>
        )}
      </div>

      {results && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">
              Results ({results.jobs?.length || 0} jobs found)
            </h2>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.jobs?.map((job: any, index: number) => (
              <div
                key={job.id || index}
                className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-slate-900">{job.title}</h3>
                    <p className="text-slate-500">{job.company}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-sm">
                      {job.location && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full">{job.location}</span>
                      )}
                      {job.provider && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{job.provider}</span>
                      )}
                      {job.posted && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">{job.posted}</span>
                      )}
                    </div>
                    {job.description && (
                      <p className="mt-2 text-sm text-slate-500 line-clamp-2">{job.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      Evaluate
                    </button>
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1"
                      >
                        View Original
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}