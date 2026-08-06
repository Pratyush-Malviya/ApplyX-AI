# ApplyX AI (India)

AI-powered job application assistant for Indian job seekers. Auto-fill forms, tailor resumes, generate cover letters, and track applications.

## Features

- **Resume Parser** - Upload PDF/DOCX, extract text and sections automatically
- **AI Resume Tailor** - Rewrite your resume to match any job description (ATS-optimized)
- **Cover Letter Generator** - Generate personalized cover letters using advanced AI routing (Gemini 2.5 Pro, Qwen3, DeepSeek)
- **Job Analysis** - Extract key requirements, ATS keywords, and insights from any posting
- **Chrome Extension** - Auto-detect and fill job application forms on any site
- **Application Tracker** - Kanban board to track saved → applied → interview → offer → rejected
- **Multi-language** - English + Hindi support with one-click toggle
- **Dashboard** - Centralized hub for all your job search activities

## Tech Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS v4
- **Database/Auth:** Supabase (PostgreSQL, Auth, Storage)
- **AI Gateway & Routing:** Task-based intelligent routing using multiple free-tier LLMs:
  - **Models:** Gemini 2.5 Pro/Flash, DeepSeek V3/R1, Qwen3 235B, LLaMA 3.3 70B
  - **Providers:** Gemini, OpenRouter, Groq, Cerebras
  - **Caching:** Exact-match (Upstash Redis) and Semantic (Qdrant) prompt caching
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
4. Add them to `.env.local` (see the Environment Variables section below)

### 3. Configure Environment Variables

Create a `.env.local` file in the project root. **Never commit this file to Git.**

```env
# ✅ SAFE — These are public keys. They are embedded in the browser bundle.
# The NEXT_PUBLIC_ prefix is what causes Next.js to expose them client-side.
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 🔒 SECRET — Server-side only. Never prefix these with NEXT_PUBLIC_.
# These are ONLY accessible inside /api/... route handlers, never sent to the browser.
# Anyone with DevTools CANNOT see these — they never leave the server.
GEMINI_API_KEY=your-gemini-key
OPENROUTER_API_KEY=your-openrouter-key
GROQ_API_KEY=your-groq-key
CEREBRAS_API_KEY=your-cerebras-key
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# 🔒 SECRET — Supabase service role key (bypasses RLS — use only server-side for admin tasks)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **IMPORTANT:** Keys without the `NEXT_PUBLIC_` prefix **must stay in `.env.local`** (server-side only).
> Never commit them. Never reference them in browser code. All AI calls are made through
> `/api/...` server-side routes — the browser only receives the final AI response, not the key.

### 4. Get AI API Keys (Free Tiers)
The app uses an intelligent AI gateway that routes to the best free model per task. You don't need all keys — missing providers are skipped automatically:

1. **Gemini (Primary):** [Google AI Studio](https://aistudio.google.com/) → Create API key
2. **OpenRouter (DeepSeek, Qwen3):** [openrouter.ai](https://openrouter.ai/) → 50+ free models
3. **Groq (Fast Fallback):** [console.groq.com](https://console.groq.com) → 6,000 req/day free
4. **Cerebras (Ultra-Fast):** [inference.cerebras.ai](https://inference.cerebras.ai/) → 2,000+ tokens/sec
5. **Upstash Redis (Caching):** [upstash.com](https://upstash.com) → 10,000 req/day free

### 5. Run the Web App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 6. Install Chrome Extension (Dev Mode)
1. Open Chrome → `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

---

## Security Setup (Required for Production)

### Row-Level Security (RLS)

By default, anyone with your `NEXT_PUBLIC_SUPABASE_ANON_KEY` can query all rows in your database. **RLS prevents this** — each user can only read, write, and delete their own data.

Run the following in Supabase Dashboard → SQL Editor:

```sql
-- Enable RLS on all user data tables
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

-- Resumes: users see and manage only their own
CREATE POLICY "Users select own resumes"  ON resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own resumes"  ON resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own resumes"  ON resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own resumes"  ON resumes FOR DELETE USING (auth.uid() = user_id);

-- Applications: same pattern
CREATE POLICY "Users select own applications"  ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own applications"  ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own applications"  ON applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own applications"  ON applications FOR DELETE USING (auth.uid() = user_id);

-- Cover letters: same pattern
CREATE POLICY "Users select own cover letters"  ON cover_letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cover letters"  ON cover_letters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cover letters"  ON cover_letters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cover letters"  ON cover_letters FOR DELETE USING (auth.uid() = user_id);
```

To verify RLS is working: log in as User A, try to query User B's resume ID — it should return 0 rows.

### API Authentication & Rate Limiting

Every `/api/ai/...` route verifies authentication and enforces per-user rate limits before touching any AI provider key:

```typescript
// Pattern used in all /api/ai/... routes
export async function POST(req: NextRequest) {
  // 1. Verify the user is authenticated — reject anonymous requests
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limit: 10 AI requests per user per hour
  const key = `ratelimit:${session.user.id}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3600);
  if (count > 10) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // 3. AI provider keys are accessed here — server-side only
  // They are NEVER sent back to the client
}
```

### AI Key Management

All provider keys are centralized in `src/lib/ai/config.ts` and accessed exclusively in server-side route handlers. The key rotation logic is in `src/lib/ai/router.ts` — if a provider fails, the next is tried automatically without ever exposing keys to the client.

### Data Isolation

- Every resume and application row has a `user_id` column
- RLS policies enforce `auth.uid() = user_id` on every query
- Chrome Extension autofill re-verifies the user session server-side before fetching profile data
- Supabase Storage buckets for resumes are private (not public URLs)

---

## Project Structure

```
jobapply-ai/
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js           # Service worker
│   ├── content.js              # Form field detection & autofill
│   ├── popup.html / popup.js
│   └── store-assets/           # Chrome Web Store listing assets
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Protected pages (require auth)
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── resumes/        # Upload & parse resumes
│   │   │   ├── tailor/         # AI resume tailoring
│   │   │   ├── cover-letters/  # AI cover letter generator
│   │   │   ├── analyze/        # Job posting analysis
│   │   │   └── applications/   # Kanban tracker
│   │   ├── auth/               # Login, signup, callback
│   │   └── api/
│   │       ├── ai/             # Unified AI Gateway (auth + rate limiting enforced)
│   │       ├── fetch-jd/       # Job description scraper
│   │       └── admin/          # Admin-only config endpoints
│   ├── lib/
│   │   ├── ai/                 # AI Gateway system
│   │   │   ├── config.ts       # Model routing table & API keys (server-only)
│   │   │   ├── router.ts       # Provider failover logic
│   │   │   ├── providers.ts    # HTTP clients for Gemini, OpenRouter, Groq, Cerebras
│   │   │   ├── prompt-builder.ts
│   │   │   └── cache.ts        # Redis (exact) + Qdrant (semantic) caching
│   │   ├── supabase/           # Supabase client, server, hook
│   │   ├── i18n/               # Multi-language (en, hi)
│   │   └── resume-parser.ts    # PDF/DOCX/TXT parser
│   ├── components/
│   └── proxy.ts                # Route protection middleware
├── ARCHITECTURE.md             # Full system architecture diagrams
├── vercel.json
└── package.json
```

---

## Deploy to Vercel

1. Push to GitHub (**ensure `.env.local` is in `.gitignore`**)
2. Import project at [vercel.com](https://vercel.com)
3. Add ALL environment variables in Vercel Dashboard → Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `OPENROUTER_API_KEY` *(optional)*
   - `GROQ_API_KEY`
   - `CEREBRAS_API_KEY` *(optional)*
   - `UPSTASH_REDIS_REST_URL` *(optional — enables prompt caching)*
   - `UPSTASH_REDIS_REST_TOKEN` *(optional)*
   - `SUPABASE_SERVICE_ROLE_KEY` *(optional — for admin tasks)*
4. Deploy

### ✅ Production Checklist

Before going live, verify each of the following:

- [ ] RLS enabled on: `resumes`, `applications`, `cover_letters`, and all other user data tables
- [ ] `.env.local` is listed in `.gitignore` and never committed to GitHub
- [ ] All `/api/ai/...` routes verify `session.user` before processing any request
- [ ] Rate limiting is active on all AI endpoints (via Upstash Redis)
- [ ] `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY` are **only** used inside `/api/...` routes — never in browser/client code
- [ ] Supabase Storage bucket for resumes is set to **Private** (not public)
- [ ] Chrome Extension re-verifies the user session server-side on each autofill attempt
- [ ] Error monitoring configured (Sentry or equivalent) to track AI provider failures and auth errors
- [ ] Verified: a logged-in user **cannot** read another user's resume via direct Supabase query

---

## Pricing Model

| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0 | 5 applications/mo, basic resume edits |
| Basic | ₹299/mo | Unlimited tailoring, cover letters |
| Premium | ₹599/mo | Priority support, advanced analytics |
| Enterprise | Custom | Multi-seat for colleges/agencies |

## License

MIT