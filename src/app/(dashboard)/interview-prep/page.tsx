"use client";

import { useState } from "react";
import { MessageSquare, Sparkles, Send, CheckCircle2, Mic, MicOff, RefreshCw, Award, ArrowRight, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function InterviewPrepPage() {
  const [targetRole, setTargetRole] = useState("Senior Full Stack Engineer");
  const [questions, setQuestions] = useState<string[]>([
    "Tell me about a time you led a complex technical migration under a tight deadline.",
    "How do you handle architectural disagreements between senior team members?",
    "Describe a situation where a production service went down. How did you diagnose and resolve it?",
    "Walk me through how you optimize web performance for high-traffic applications.",
  ]);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  // Web Speech API Voice Dictation Handler
  const handleToggleRecord = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported by your browser. Please type your answer.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setAnswerText((prev) => (prev ? prev + " " + transcript : transcript));
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  const handleEvaluate = async () => {
    if (!answerText.trim()) return;

    setLoading(true);
    setEvaluation(null);

    try {
      const res = await fetch("/api/ai/interview-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[selectedQuestion],
          answer: answerText,
          targetRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate answer");

      setEvaluation(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200 inline-block mb-2">
            ⭐ Buzz Feature — AI Interview Coach
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-violet-600" /> Interactive Interview Practice
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Simulate role-specific interviews with voice/text responses & real-time STAR framework scoring.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Target Role Selector */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider block">
          Target Role Profile
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            placeholder="e.g. Senior Full Stack Engineer, Product Manager"
          />
        </div>
      </div>

      {/* Main Grid: Question Selection + Answer Recorder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Questions List */}
        <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
            Practice Questions ({questions.length})
          </h3>

          <div className="space-y-2">
            {questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedQuestion(idx);
                  setAnswerText("");
                  setEvaluation(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedQuestion === idx
                    ? "bg-violet-50 text-violet-900 border-violet-300 font-bold shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-[10px] text-violet-600 uppercase font-extrabold">
                  <span>Question #{idx + 1}</span>
                </div>
                <p className="line-clamp-2">{q}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Active Question & Answer Box */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
              <span>Active Scenario — Question #{selectedQuestion + 1}</span>
              <span className="px-2.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-700 text-[10px]">
                STAR Framework Audit
              </span>
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">
              &quot;{questions[selectedQuestion]}&quot;
            </h2>
          </div>

          {/* Response Textarea + Voice Dictation */}
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                Your Answer (Voice or Text)
              </label>

              {/* Speech Recognition Toggle */}
              <button
                type="button"
                onClick={handleToggleRecord}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 text-violet-600" />}
                {isRecording ? "Listening... (Click to Stop)" : "Record Voice Answer"}
              </button>
            </div>

            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="w-full min-h-[160px] p-4 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:outline-none"
              placeholder="Structure your answer using STAR (Situation, Task, Action, Result)... e.g. In my previous role at XYZ company, we faced a high DB load..."
            />

            <div className="flex justify-end">
              <button
                onClick={handleEvaluate}
                disabled={loading || !answerText.trim()}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> AI Analyzing STAR Response...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Evaluate Answer with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Feedback & Score Output */}
          {evaluation && (
            <div className="bg-white p-6 rounded-2xl border shadow-lg space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-extrabold">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">AI Evaluation Feedback</h3>
                    <p className="text-xs text-gray-500">
                      Evaluated via {evaluation.displayName || "Google Gemini 2.5 Pro"} ({evaluation.latencyMs}ms)
                    </p>
                  </div>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed p-4 rounded-xl bg-slate-50 border">
                <ReactMarkdown>{evaluation.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
