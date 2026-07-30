"use me";
"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does ApplyX AI ensure my resume passes ATS scanners?",
      answer:
        "ApplyX AI analyzes target job descriptions to extract required hard skills, domain keywords, and key action metrics. It subtly aligns your work experience bullet points and skills section with exact phrases used by ATS parsers (like Workday, Greenhouse, Taleo, and Lever) while maintaining 100% human readability.",
    },
    {
      question: "Will AI fabricate fake experience on my resume?",
      answer:
        "No! ApplyX AI never invents fake job titles or fabricated experience. It takes your real background and rephrases your achievements using target keywords, stronger action verbs, and quantifiable impact metrics to present your authentic background in the best possible light.",
    },
    {
      question: "Which job portals work with the Chrome Extension auto-fill?",
      answer:
        "Our Chrome Extension seamlessly clips job listings and auto-fills application forms across LinkedIn, Naukri.com, Indeed, Glassdoor, Workday Career portals, and Greenhouse jobs.",
    },
    {
      question: "What file formats can I export my tailored resumes in?",
      answer:
        "You can export your tailored resumes directly as standard ATS-optimized PDF documents or fully editable DOCX files.",
    },
    {
      question: "Is my personal data and resume information private and secure?",
      answer:
        "Yes, absolutely. Your resumes, contact details, and career history are encrypted. We never sell your data or share it with recruiters without your explicit permission.",
    },
    {
      question: "Can I try ApplyX AI for free without entering a credit card?",
      answer:
        "Yes! Our free plan gives you 5 free AI resume tailoring credits every month without needing to enter any credit card details.",
    },
  ];

  return (
    <section id="faq" className="py-20 lg:py-28 bg-slate-950 border-t border-slate-800/80 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1.5 text-xs font-semibold text-indigo-300">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Everything you need to know about ApplyX AI, ATS optimization, and subscription options.
          </p>
        </div>

        {/* Accordions */}
        <div className="mt-12 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className="text-base sm:text-lg font-bold text-white pr-4">
                    {faq.question}
                  </span>
                  <div className={`h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 transition-transform ${
                    isOpen ? "rotate-180 bg-violet-600/20 text-violet-300" : ""
                  }`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
