"use client";

import { useState, useEffect } from 'react';
import { Loader2, FileText, Eye, Download, Search, X, CheckCircle } from 'lucide-react';

interface Report {
  id: string;
  company: string;
  role: string;
  score: number;
  grade: string;
  date: string;
}

export default function ReportsViewer() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/career-ops/reports?limit=100');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      const parsed = parseReportsList(data.data);
      setReports(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const parseReportsList = (data: any): Report[] => {
    if (Array.isArray(data)) return data;
    if (data?.reports) return data.reports;
    if (data?.stdout) {
      return data.stdout.split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const parts = line.split('|').map(p => p.trim());
          return {
            id: parts[0] || '',
            company: parts[1] || '',
            role: parts[2] || '',
            score: parseFloat(parts[3]) || 0,
            grade: parts[4] || '',
            date: parts[5] || '',
          };
        });
    }
    return [];
  };

  const fetchReportContent = async (id: string) => {
    setLoadingReport(true);
    try {
      const response = await fetch(`/api/career-ops/reports?id=${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReportContent(data.data?.content || '');
      setSelectedReport(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoadingReport(false);
    }
  };

  const copyReport = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReport = () => {
    const report = reports.find(r => r.id === selectedReport);
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report?.company}-${report?.role}-${report?.date}.md`;
    a.click();
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r =>
    r.company.toLowerCase().includes(search.toLowerCase()) ||
    r.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evaluation Reports</h1>
          <p className="text-slate-500 mt-1">
            View detailed job evaluation reports from career-ops
          </p>
        </div>
        <div className="w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Reports ({filteredReports.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reports found. Run evaluations to generate reports.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{report.company}</td>
                    <td className="px-6 py-4 text-slate-700">{report.role}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-sm font-mono ${
                        report.score >= 4 ? 'bg-green-100 text-green-800' :
                        report.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.score.toFixed(1)}/5
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                        {report.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{report.date}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => fetchReportContent(report.id)}
                        disabled={loadingReport}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loadingReport && selectedReport === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                Report: {reports.find(r => r.id === selectedReport)?.company}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyReport}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm flex items-center gap-1"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <FileText className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={downloadReport}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800">{reportContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}