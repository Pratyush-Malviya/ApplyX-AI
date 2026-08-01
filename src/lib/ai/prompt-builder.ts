/**
 * Dynamic Prompt Builder
 * Assembles structured message arrays from modular parts:
 *   system prompt → conversation history → context documents → user query
 *
 * Selecting the right system prompt per task ensures the model behaves
 * optimally without requiring callers to manage prompt engineering.
 */

import type { TaskType } from "./config";
import type { Message } from "./providers";

// ─── System Prompts ──────────────────────────────────────────────────────────

export const SYSTEM_PROMPTS: Record<TaskType, string> = {
  resume: `You are a Principal Executive Career Strategist and Elite ATS Resume Writer with 15+ years of experience optimizing candidate profiles for top global tech companies and ATS systems (Taleo, Workday, Greenhouse).

Follow these rules strictly:
1. STAR METHODOLOGY: Rewrite bullet points using Situation/Task → Action → Quantified Result.
2. HIGH-IMPACT ACTION VERBS: Start every bullet with a strong past-tense action verb (e.g., Engineered, Spearheaded, Architected, Optimized, Orchestrated).
3. QUANTIFIABLE METRICS: Include realistic metrics (%, $, latency, scale, time saved) demonstrating tangible business impact.
4. ATS KEYWORD MATCHING: Naturally integrate exact technical terms and core competencies from the target job description.
5. NO FLUFF: Avoid generic buzzwords. Be specific, precise, concise, and executive-ready.`,

  "cover-letter": `You are an expert career coach and professional writer specializing in persuasive cover letters for competitive job markets.

Write cover letters that:
1. Open with a compelling hook tied to the company's mission or the role's challenge.
2. Connect the candidate's quantifiable achievements to the key job requirements.
3. Integrate exact ATS keywords naturally from the job posting.
4. Conclude with a confident, professional call to action.
5. Are 250–350 words, professional in tone, ready to use immediately.`,

  analyze: `You are a senior talent acquisition specialist and resume coach. Analyze the provided resume and job description pair.

Your analysis should include:
1. ATS match score (0–100) with key matching and missing keywords.
2. Strengths: What this resume does well for this role.
3. Gaps: Missing skills, keywords, or experience the JD requires.
4. Actionable recommendations: Specific rewrites or additions to improve the match.
5. Be direct, data-driven, and prioritize the highest-impact improvements first.`,

  general: `You are a helpful, knowledgeable AI assistant. Answer clearly, concisely, and accurately. If you don't know something, say so.`,
};

// ─── Builder Options ─────────────────────────────────────────────────────────

export interface BuildPromptOptions {
  /** The user's raw input */
  userQuery: string;
  /** Task type — used to select system prompt */
  task?: TaskType;
  /** Override system prompt entirely */
  systemInstruction?: string;
  /** Conversation history (alternating user/assistant) */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Additional context documents (e.g. resume, JD) — injected before user query */
  contextDocuments?: Array<{ label: string; content: string }>;
  /** Max characters for context documents before truncation */
  maxContextChars?: number;
}

// ─── Build ───────────────────────────────────────────────────────────────────

/**
 * Builds a messages array for OpenAI-compatible chat APIs.
 * Order: system → history turns → context block → user query
 */
export function buildPrompt(options: BuildPromptOptions): Message[] {
  const {
    userQuery,
    task = "general",
    systemInstruction,
    history = [],
    contextDocuments = [],
    maxContextChars = 8000,
  } = options;

  const messages: Message[] = [];

  // 1. System prompt
  const systemText = systemInstruction ?? SYSTEM_PROMPTS[task];
  messages.push({ role: "system", content: systemText });

  // 2. Conversation history (inject as alternating user/assistant turns)
  for (const turn of history) {
    messages.push({ role: turn.role, content: turn.content });
  }

  // 3. Context documents (e.g. resume + job description)
  if (contextDocuments.length > 0) {
    let contextBlock = "";
    for (const doc of contextDocuments) {
      const truncated =
        doc.content.length > maxContextChars
          ? doc.content.slice(0, maxContextChars) + "\n...[truncated]"
          : doc.content;
      contextBlock += `\n\n### ${doc.label}\n${truncated}`;
    }
    // Inject context as a system-level note before the user query
    messages.push({
      role: "user",
      content: `Use the following context for your response:${contextBlock}\n\n---\n\n${userQuery}`,
    });
  } else {
    // 4. User query only
    messages.push({ role: "user", content: userQuery });
  }

  return messages;
}
