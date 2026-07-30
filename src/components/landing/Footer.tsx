import Link from "next/link";
import { Sparkles, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs sm:text-sm py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-slate-800/80">
          
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                ApplyX <span className="text-indigo-400">AI</span>
              </span>
            </Link>
            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              ApplyX AI (by JobApply AI) is the ultimate AI copilot for modern job seekers. Tailor resumes, craft cover letters, pass ATS filters, and track applications effortlessly.
            </p>
            <div className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} ApplyX AI. All rights reserved.
            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  ATS Resume Tailor
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Cover Letter Writer
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Application Tracker
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Chrome Extension
                </a>
              </li>
              <li>
                <a href="#interactive-demo" className="hover:text-white transition-colors">
                  Live Interactive Demo
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  FAQ & ATS Guide
                </a>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-white transition-colors">
                  Member Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">Legal & Support</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Security & Data Safety
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Built with <Heart className="inline h-3.5 w-3.5 text-rose-500 fill-rose-500 mx-0.5" /> for ambitious job seekers.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-300">Twitter / X</a>
            <a href="#" className="hover:text-slate-300">LinkedIn</a>
            <a href="#" className="hover:text-slate-300">GitHub</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
