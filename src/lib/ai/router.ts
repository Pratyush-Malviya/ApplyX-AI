/**
 * Task Classification & Model Router
 * Detects the task type from the prompt and routes to the best available model.
 * Falls through the routing table until a provider succeeds.
 */

import { AI_CONFIG, ROUTING_TABLE, type TaskType } from "./config";
import {
  callGroq,
  callGemini,
  callOpenRouter,
  callCerebras,
  type Message,
  type ProviderResponse,
} from "./providers";

// ─── Task Classification ─────────────────────────────────────────────────────

const TASK_SIGNALS: Record<TaskType, RegExp> = {
  resume:             /\b(resume|cv|bullet point|ats|tailor|rewrite|job description|work experience|skills section|quantif)\b/i,
  "cover-letter":     /\b(cover letter|covering letter|motivation letter|application letter|dear hiring|dear recruiter)\b/i,
  analyze:            /\b(analyze|analyse|review|evaluate|score|assess|gap analysis|match|feedback|insights|key requirements)\b/i,
  "interview-eval":   /\b(interview|question|answer|star methodology|behavioral|technical question|interview prep)\b/i,
  "company-research": /\b(company|intel|tech stack|leadership|culture|funding|briefing)\b/i,
  "salary-copilot":   /\b(salary|ctc|offer|fixed|variable|bonus|esop|negotiat|counter-offer)\b/i,
  "auto-apply":       /\b(auto-apply|batch apply|job queue)\b/i,
  general:            /.*/,
};

/**
 * Classifies the task type from the prompt text.
 * Explicit task from the caller always takes priority.
 */
export function classifyTask(prompt: string, explicitTask?: string): TaskType {
  if (explicitTask && explicitTask in ROUTING_TABLE) {
    return explicitTask as TaskType;
  }
  for (const [task, regex] of Object.entries(TASK_SIGNALS)) {
    if (task === "general") continue;
    if (regex.test(prompt)) return task as TaskType;
  }
  return "general";
}

// ─── Router ──────────────────────────────────────────────────────────────────

export interface RouterOptions {
  task?: string;
  userApiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Routes a prompt through the model priority list for the detected task.
 * Tries each provider in order — skips those with no API key.
 * Throws only if ALL providers in the chain fail.
 */
export async function route(
  messages: Message[],
  options: RouterOptions = {}
): Promise<ProviderResponse> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const taskType = classifyTask(lastUserMsg?.content ?? "", options.task);
  const chain = ROUTING_TABLE[taskType];

  console.log(
    `[AI Router] Task: ${taskType} | Chain: ${chain.map((c) => c.displayName).join(" → ")}`
  );

  const callOptions = {
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  };

  for (const entry of chain) {
    let result: ProviderResponse | null = null;

    if (entry.provider === "groq") {
      const key = options.userApiKey || AI_CONFIG.groqApiKey;
      result = await callGroq(key, entry.model, entry.displayName, messages, callOptions);
    } else if (entry.provider === "gemini") {
      const key = options.userApiKey || AI_CONFIG.geminiApiKey;
      result = await callGemini(key, entry.model, entry.displayName, messages, callOptions);
    } else if (entry.provider === "openrouter") {
      const key = AI_CONFIG.openRouterApiKey; // user key not used for OpenRouter
      result = await callOpenRouter(key, entry.model, entry.displayName, messages, callOptions);
    } else if (entry.provider === "cerebras") {
      const key = AI_CONFIG.cerebrasApiKey;
      result = await callCerebras(key, entry.model, entry.displayName, messages, callOptions);
    }

    if (result) {
      console.log(`[AI Router] ✓ Success via ${entry.displayName}`);
      return result;
    }

    console.warn(`[AI Router] ✗ ${entry.displayName} failed — trying next…`);
  }

  throw new Error(
    `All providers failed for task "${taskType}". Please check your API key configuration.`
  );
}
