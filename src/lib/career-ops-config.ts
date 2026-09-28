/**
 * Career-ops Configuration Loader
 * Loads environment variables with priority: .env.local > .env > .env.example > defaults
 */

import fs from 'fs';
import path from 'path';

interface CareerOpsConfig {
  // AI Providers
  GEMINI_API_KEY: string;
  OPENROUTER_API_KEY: string;
  OPENAI_API_KEY: string;
  OPENAI_BASE_URL: string;
  OPENAI_MODEL: string;
  ANTHROPIC_API_KEY: string;

  // Career-ops Data Directory
  CAREER_OPS_ROOT: string;
  CAREER_OPS_DATA_DIR: string;
  CAREER_OPS_TRACKER: string;

  // Plugins
  APIFY_TOKEN: string;
  NOTION_ACCESS_TOKEN: string;
  NOTION_PARENT_PAGE_ID: string;
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;

  // Supabase (ApplyX AI)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Derived paths
  careerOpsRoot: string;
  dataRoot: string;
  trackerPath: string;
  reportsDir: string;
  applicationsPath: string;
  pipelinePath: string;
}

const DEFAULTS: Partial<CareerOpsConfig> = {
  OPENAI_BASE_URL: 'https://api.openai.com/v1',
  OPENAI_MODEL: 'gpt-4o-mini',
  CAREER_OPS_ROOT: '',
  CAREER_OPS_DATA_DIR: '',
  CAREER_OPS_TRACKER: '',
};

function loadEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;

  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  }
  return env;
}

function resolvePath(base: string, relative: string): string {
  if (path.isAbsolute(relative)) return relative;
  return path.resolve(base, relative);
}

export function loadCareerOpsConfig(projectRoot: string = process.cwd()): CareerOpsConfig {
  // Load env files in priority order (last wins)
  const envExample = loadEnvFile(path.join(projectRoot, '.env.example'));
  const env = loadEnvFile(path.join(projectRoot, '.env'));
  const envLocal = loadEnvFile(path.join(projectRoot, '.env.local'));

  // Merge with priority: local > env > example > defaults
  const merged = {
    ...DEFAULTS,
    ...envExample,
    ...env,
    ...envLocal,
    ...process.env, // Process env has highest priority
  } as Record<string, string>;

  // Determine career-ops root
  const careerOpsRoot = merged.CAREER_OPS_ROOT
    ? resolvePath(projectRoot, merged.CAREER_OPS_ROOT)
    : path.join(projectRoot, 'career-ops');

  // Determine data root
  const dataRoot = merged.CAREER_OPS_DATA_DIR
    ? resolvePath(careerOpsRoot, merged.CAREER_OPS_DATA_DIR)
    : careerOpsRoot;

  // Determine tracker path
  const trackerPath = merged.CAREER_OPS_TRACKER
    ? resolvePath(dataRoot, merged.CAREER_OPS_TRACKER)
    : path.join(dataRoot, 'data', 'applications.md');

  return {
    GEMINI_API_KEY: merged.GEMINI_API_KEY || '',
    OPENROUTER_API_KEY: merged.OPENROUTER_API_KEY || '',
    OPENAI_API_KEY: merged.OPENAI_API_KEY || '',
    OPENAI_BASE_URL: merged.OPENAI_BASE_URL || DEFAULTS.OPENAI_BASE_URL!,
    OPENAI_MODEL: merged.OPENAI_MODEL || DEFAULTS.OPENAI_MODEL!,
    ANTHROPIC_API_KEY: merged.ANTHROPIC_API_KEY || '',
    CAREER_OPS_ROOT: careerOpsRoot,
    CAREER_OPS_DATA_DIR: merged.CAREER_OPS_DATA_DIR || '',
    CAREER_OPS_TRACKER: merged.CAREER_OPS_TRACKER || '',
    APIFY_TOKEN: merged.APIFY_TOKEN || '',
    NOTION_ACCESS_TOKEN: merged.NOTION_ACCESS_TOKEN || '',
    NOTION_PARENT_PAGE_ID: merged.NOTION_PARENT_PAGE_ID || '',
    GMAIL_CLIENT_ID: merged.GMAIL_CLIENT_ID || '',
    GMAIL_CLIENT_SECRET: merged.GMAIL_CLIENT_SECRET || '',
    GMAIL_REFRESH_TOKEN: merged.GMAIL_REFRESH_TOKEN || '',
    NEXT_PUBLIC_SUPABASE_URL: merged.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: merged.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: merged.SUPABASE_SERVICE_ROLE_KEY || '',

    // Derived paths
    careerOpsRoot,
    dataRoot,
    trackerPath,
    reportsDir: path.join(dataRoot, 'reports'),
    applicationsPath: trackerPath,
    pipelinePath: path.join(dataRoot, 'data', 'pipeline.md'),
  };
}

export const careerOpsConfig = loadCareerOpsConfig();