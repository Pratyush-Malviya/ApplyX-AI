/**
 * Career-ops API Wrapper
 * Executes career-ops CLI scripts and returns structured results
 */

import { spawn, SpawnOptions } from 'child_process';
import { careerOpsConfig } from './career-ops-config';
import path from 'path';

export interface CareerOpsResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

interface ScriptOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  args?: string[];
}

function runScript(scriptName: string, options: ScriptOptions = {}): Promise<CareerOpsResult> {
  const scriptPath = path.join(careerOpsConfig.careerOpsRoot, scriptName);
  const cwd = options.cwd || careerOpsConfig.careerOpsRoot;
  const timeout = options.timeout || 120000; // 2 minutes default

  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath, ...(options.args || [])], {
      cwd,
      env: { ...process.env, ...careerOpsConfig, ...options.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      resolve({
        success: false,
        error: `Script timed out after ${timeout}ms`,
        stdout,
        stderr,
        exitCode: -1,
      });
    }, timeout);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      if (timedOut) return;

      resolve({
        success: code === 0,
        stdout,
        stderr,
        exitCode: code || 0,
        data: stdout ? parseOutput(stdout) : undefined,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: err.message,
        exitCode: -1,
      });
    });
  });
}

function parseOutput(output: string): unknown {
  try {
    // Try to parse as JSON first
    return JSON.parse(output);
  } catch {
    // Return raw output for non-JSON scripts
    return output.trim();
  }
}

// ── Career-ops Script Wrappers ──────────────────────────────────────────────

export async function scanJobs(options: {
  query?: string;
  location?: string;
  limit?: number;
  providers?: string[];
  output?: string;
} = {}): Promise<CareerOpsResult> {
  const args = ['scan.mjs'];
  if (options.query) args.push('--query', options.query);
  if (options.location) args.push('--location', options.location);
  if (options.limit) args.push('--limit', options.limit.toString());
  if (options.providers) args.push('--providers', options.providers.join(','));
  if (options.output) args.push('--output', options.output);

  return runScript('scan.mjs', { args });
}

export async function evaluateOffer(jobDescription: string, options: {
  model?: 'gemini' | 'openrouter' | 'openai';
  cvPath?: string;
  output?: string;
} = {}): Promise<CareerOpsResult> {
  const scriptMap = {
    gemini: 'gemini-eval.mjs',
    openrouter: 'openrouter-runner.mjs',
    openai: 'openai-eval.mjs',
  };
  const script = scriptMap[options.model || 'gemini'];

  const args = [script, jobDescription];
  if (options.cvPath) args.push('--cv', options.cvPath);
  if (options.output) args.push('--output', options.output);

  return runScript(script, { args, timeout: 180000 }); // 3 min for eval
}

export async function generateCV(options: {
  jobDescription?: string;
  cvPath?: string;
  template?: string;
  output?: string;
  format?: 'html' | 'latex' | 'pdf';
} = {}): Promise<CareerOpsResult> {
  const args = ['build-cv-html.mjs'];
  if (options.jobDescription) args.push('--jd', options.jobDescription);
  if (options.cvPath) args.push('--cv', options.cvPath);
  if (options.template) args.push('--template', options.template);
  if (options.output) args.push('--output', options.output);

  return runScript('build-cv-html.mjs', { args, timeout: 120000 });
}

export async function generateCoverLetter(options: {
  jobDescription: string;
  cvPath?: string;
  output?: string;
}): Promise<CareerOpsResult> {
  const args = ['cover-letter.mjs', options.jobDescription];
  if (options.cvPath) args.push('--cv', options.cvPath);
  if (options.output) args.push('--output', options.output);

  return runScript('cover-letter.mjs', { args, timeout: 120000 });
}

export async function trackApplication(options: {
  action: 'add' | 'update' | 'list' | 'remove';
  id?: string;
  company?: string;
  role?: string;
  status?: string;
  url?: string;
  notes?: string;
}): Promise<CareerOpsResult> {
  const args = ['tracker.mjs', options.action];
  if (options.id) args.push('--id', options.id);
  if (options.company) args.push('--company', options.company);
  if (options.role) args.push('--role', options.role);
  if (options.status) args.push('--status', options.status);
  if (options.url) args.push('--url', options.url);
  if (options.notes) args.push('--notes', options.notes);

  return runScript('tracker.mjs', { args });
}

export async function listReports(options: {
  limit?: number;
  status?: string;
}): Promise<CareerOpsResult> {
  const args = ['list-reports.mjs'];
  if (options.limit) args.push('--limit', options.limit.toString());
  if (options.status) args.push('--status', options.status);

  return runScript('list-reports.mjs', { args });
}

export async function batchEvaluate(options: {
  inputFile: string;
  model?: 'gemini' | 'openrouter' | 'openai';
  concurrency?: number;
  output?: string;
}): Promise<CareerOpsResult> {
  const scriptMap = {
    gemini: 'batch-evaluate-gemini.mjs',
    openrouter: 'batch-evaluate-openrouter.mjs',
    openai: 'batch-evaluate-openai.mjs',
  };
  const script = scriptMap[options.model || 'gemini'];

  const args = [script, options.inputFile];
  if (options.concurrency) args.push('--concurrency', options.concurrency.toString());
  if (options.output) args.push('--output', options.output);

  return runScript(script, { args, timeout: 600000 }); // 10 min for batch
}

export async function runDoctor(): Promise<CareerOpsResult> {
  return runScript('doctor.mjs', { args: ['doctor.mjs'] });
}

// ── Utility Functions ────────────────────────────────────────────────────────

export function getModesPath(): string {
  return path.join(careerOpsConfig.careerOpsRoot, 'modes');
}

export function getTemplatesPath(): string {
  return path.join(careerOpsConfig.careerOpsRoot, 'templates');
}

export function getProvidersPath(): string {
  return path.join(careerOpsConfig.careerOpsRoot, 'providers');
}

export function getDataRoot(): string {
  return careerOpsConfig.dataRoot;
}

export function getReportsDir(): string {
  return careerOpsConfig.reportsDir;
}

export function getTrackerPath(): string {
  return careerOpsConfig.trackerPath;
}