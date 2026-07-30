# ApplyX AI (India)

AI-powered job application assistant for Indian job seekers. Auto-fill forms, tailor resumes, generate cover letters, and track applications.

## Features

- **Resume Parser** - Upload PDF/DOCX, extract text and sections automatically
- **AI Resume Tailor** - Rewrite your resume to match any job description (ATS-optimized)
- **Cover Letter Generator** - Generate personalized cover letters using Groq AI (free Llama 3)
- **Job Analysis** - Extract key requirements, ATS keywords, and insights from any posting
- **Chrome Extension** - Auto-detect and fill job application forms on any site
- **Application Tracker** - Kanban board to track saved → applied → interview → offer → rejected
- **Multi-language** - English + Hindi support with one-click toggle
- **Dashboard** - Centralized hub for all your job search activities

## Tech Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS v4
- **Database/Auth:** Supabase (PostgreSQL, Auth, Storage)
- **AI:** Groq API (free Llama 3 / Mistral inference) - NO API key cost
- **Extension:** Chrome Manifest V3
- **Deployment:** Vercel (free tier)

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd jobapply-ai
npm install
```

### 2. Set Up Supabase (Free)
1. Create an account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key from Settings → API
4. Add them to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=gsk_your-groq-key
```

### 3. Get Groq API Key (Free)
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key (free tier: 30 req/min, 1440 req/day)
3. Add to `.env.local` as above

### 4. Run the Web App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Install Chrome Extension (Dev Mode)
1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

## Project Structure

```
jobapply-ai/
├── extension/                  # Chrome Extension
│   ├── manifest.json
│   ├── background.js
│   ├── content.js              # Form field detection & autofill
│   ├── popup.html / popup.js
│   ├── icons/
│   └── store-assets/           # Chrome Web Store listing assets
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Protected pages
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── resumes/        # Upload & parse resumes
│   │   │   ├── tailor/         # AI resume tailoring
│   │   │   ├── cover-letters/  # AI cover letter generator
│   │   │   ├── analyze/        # Job posting analysis
│   │   │   └── applications/   # Kanban tracker
│   │   ├── auth/               # Login, signup, callback
│   │   └── api/groq/           # Groq API proxy
│   ├── lib/
│   │   ├── supabase/           # Client, server, hook
│   │   ├── i18n/               # Multi-language (en, hi)
│   │   └── resume-parser.ts    # PDF/DOCX/TXT parser
│   ├── components/
│   └── proxy.ts                # Auth middleware
├── vercel.json
└── package.json
```

## Deploy to Vercel

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY`
4. Deploy

## Pricing Model (from Business Plan)

| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0 | 5 applications/mo, basic resume edits |
| Basic | ₹299/mo | Unlimited tailoring, cover letters |
| Premium | ₹599/mo | Priority support, advanced analytics |
| Enterprise | Custom | Multi-seat for colleges/agencies |

## License

MIT