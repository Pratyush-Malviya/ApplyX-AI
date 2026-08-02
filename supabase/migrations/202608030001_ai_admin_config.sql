-- ============================================================
-- Admin Panel: Complete Database Schema
-- Migration: 202608030001_ai_admin_config.sql
-- ============================================================

-- ─── 1. ADMIN ROLE HELPER ────────────────────────────────────────────────────

-- Function to check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
end;
$$ language plpgsql security definer stable;

-- ─── 2. AI PROMPT TEMPLATES ─────────────────────────────────────────────────

create table if not exists public.ai_prompt_templates (
  id            uuid default gen_random_uuid() primary key,
  name          text not null,
  prompt_type   text not null check (prompt_type in ('system','developer','task','persona','industry','output_format','policy','tool_use','guardrail')),
  task_type     text not null default 'general' check (task_type in ('resume','cover-letter','analyze','general','sales_assist','support_assist','research','structured_json','long_form')),
  segment       text not null default 'all' check (segment in ('all','b2b','b2c')),
  content       text not null,
  variables     jsonb not null default '[]',
  environment   text not null default 'production' check (environment in ('development','staging','production')),
  publish_status text not null default 'draft' check (publish_status in ('draft','published','archived')),
  version       integer not null default 1,
  parent_id     uuid references public.ai_prompt_templates(id) on delete set null,
  description   text,
  tags          text[] default '{}',
  created_by    uuid references auth.users on delete set null,
  updated_by    uuid references auth.users on delete set null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

alter table public.ai_prompt_templates enable row level security;

create policy "Admins manage prompt templates"
  on public.ai_prompt_templates for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "All users read published prompt templates"
  on public.ai_prompt_templates for select
  using (publish_status = 'published');

-- ─── 3. AI MODEL ROUTES ────────────────────────────────────────────────────

create table if not exists public.ai_model_routes (
  id              uuid default gen_random_uuid() primary key,
  name            text not null,
  description     text,
  task_type       text not null check (task_type in ('resume','cover-letter','analyze','general','sales_assist','support_assist','research','structured_json','long_form','chat','summarization','content_generation','classification')),
  segment         text not null default 'all' check (segment in ('all','b2b','b2c')),
  priority        integer not null default 10,
  enabled         boolean not null default true,
  conditions      jsonb not null default '{}',
  primary_model   jsonb not null,
  fallback_models jsonb not null default '[]',
  temperature     numeric(3,2) default 0.7 check (temperature >= 0 and temperature <= 2),
  top_p           numeric(3,2) default 0.95 check (top_p >= 0 and top_p <= 1),
  max_tokens      integer default 4096,
  presence_penalty  numeric(3,2) default 0,
  frequency_penalty numeric(3,2) default 0,
  stop_sequences  text[] default '{}',
  timeout_ms      integer default 30000,
  retry_count     integer default 2,
  publish_status  text not null default 'draft' check (publish_status in ('draft','published','archived')),
  version         integer not null default 1,
  created_by      uuid references auth.users on delete set null,
  updated_by      uuid references auth.users on delete set null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

alter table public.ai_model_routes enable row level security;

create policy "Admins manage model routes"
  on public.ai_model_routes for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "All users read enabled published routes"
  on public.ai_model_routes for select
  using (publish_status = 'published' and enabled = true);

-- ─── 4. AI GENERATION POLICIES ─────────────────────────────────────────────

create table if not exists public.ai_generation_policies (
  id                uuid default gen_random_uuid() primary key,
  name              text not null,
  description       text,
  segment           text not null default 'all' check (segment in ('all','b2b','b2c')),
  task_type         text default 'all',
  tone              text default 'professional' check (tone in ('formal','friendly','concise','assertive','technical','professional','casual','expert','sales','support')),
  length            text default 'medium' check (length in ('short','medium','long')),
  style             text default 'paragraph' check (style in ('bullet','paragraph','table','json','markdown','mixed')),
  creativity        integer default 5 check (creativity >= 1 and creativity <= 10),
  reading_level     text default 'professional' check (reading_level in ('simple','standard','professional','expert')),
  verbosity_ceiling integer default 800,
  emoji_allowed     boolean default false,
  brand_voice       text,
  force_headings        boolean default false,
  force_structured      boolean default false,
  force_disclaimers     boolean default false,
  force_summary_first   boolean default false,
  force_action_items    boolean default false,
  force_citations       boolean default false,
  force_concise_chat    boolean default false,
  cache_enabled     boolean default true,
  cache_ttl_seconds integer default 86400,
  cache_scope       text default 'global' check (cache_scope in ('session','user','tenant','global')),
  publish_status    text not null default 'draft' check (publish_status in ('draft','published','archived')),
  version           integer not null default 1,
  created_by        uuid references auth.users on delete set null,
  updated_by        uuid references auth.users on delete set null,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

alter table public.ai_generation_policies enable row level security;

create policy "Admins manage generation policies"
  on public.ai_generation_policies for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 5. AI AGENT PROFILES ─────────────────────────────────────────────────

create table if not exists public.ai_agent_profiles (
  id                    uuid default gen_random_uuid() primary key,
  name                  text not null unique,
  role                  text not null,
  goal                  text,
  audience              text,
  segment               text default 'all',
  domain_specialization text,
  tone                  text,
  strengths             text[],
  constraints           text[],
  allowed_actions       text[],
  disallowed_actions    text[],
  default_context_sources text[],
  preferred_output_format text,
  escalation_behavior   text,
  system_prompt_override text,
  publish_status        text not null default 'draft' check (publish_status in ('draft','published','archived')),
  version               integer not null default 1,
  cloned_from           uuid references public.ai_agent_profiles(id) on delete set null,
  created_by            uuid references auth.users on delete set null,
  updated_by            uuid references auth.users on delete set null,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

alter table public.ai_agent_profiles enable row level security;

create policy "Admins manage agent profiles"
  on public.ai_agent_profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "All users read published agent profiles"
  on public.ai_agent_profiles for select
  using (publish_status = 'published');

-- ─── 6. AI GUARDRAIL RULES ────────────────────────────────────────────────

create table if not exists public.ai_guardrail_rules (
  id                uuid default gen_random_uuid() primary key,
  name              text not null,
  category          text not null check (category in ('language','content_refusal','legal_disclaimer','pii_handling','sensitive_data','hallucination','brand_safety','spam_abuse','restricted_topic','custom')),
  description       text,
  rule_text         text not null,
  severity          text not null default 'medium' check (severity in ('low','medium','high','critical')),
  enabled           boolean not null default true,
  refusal_template  text,
  escalate_to_human boolean default false,
  applies_to        text[] default '{all}',
  created_by        uuid references auth.users on delete set null,
  updated_by        uuid references auth.users on delete set null,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

alter table public.ai_guardrail_rules enable row level security;

create policy "Admins manage guardrail rules"
  on public.ai_guardrail_rules for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 7. AI AUDIT LOGS ──────────────────────────────────────────────────────

create table if not exists public.ai_audit_logs (
  id          uuid default gen_random_uuid() primary key,
  entity_type text not null,
  entity_id   uuid,
  action      text not null check (action in ('create','update','delete','publish','rollback','cache_purge','test_run')),
  before_data jsonb,
  after_data  jsonb,
  actor_id    uuid references auth.users on delete set null,
  actor_email text,
  ip_address  text,
  metadata    jsonb default '{}',
  created_at  timestamptz default now() not null
);

alter table public.ai_audit_logs enable row level security;

create policy "Admins read audit logs"
  on public.ai_audit_logs for select
  using (public.is_admin());

create policy "System inserts audit logs"
  on public.ai_audit_logs for insert
  with check (true);

-- ─── 8. USER MANAGEMENT EXTENSIONS ──────────────────────────────────────────

-- Extend profiles with admin-relevant fields
alter table public.profiles
  add column if not exists role          text not null default 'user' check (role in ('user','admin','moderator')),
  add column if not exists plan          text not null default 'free' check (plan in ('free','pro','enterprise')),
  add column if not exists plan_expires_at timestamptz,
  add column if not exists status        text not null default 'active' check (status in ('active','suspended','banned')),
  add column if not exists notes         text,
  add column if not exists email         text,
  add column if not exists country       text,
  add column if not exists ai_calls_used integer not null default 0,
  add column if not exists ai_calls_limit integer not null default 50,
  add column if not exists last_seen_at  timestamptz,
  add column if not exists signup_source text;

-- Admin can read all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- ─── 9. PAYMENT / SUBSCRIPTION MANAGEMENT ────────────────────────────────────

create table if not exists public.subscriptions (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references auth.users on delete cascade not null,
  plan              text not null check (plan in ('free','pro','enterprise')),
  status            text not null default 'active' check (status in ('active','cancelled','past_due','trialing','paused')),
  provider          text not null default 'manual' check (provider in ('manual','razorpay','stripe','paddle','lemonsqueezy')),
  provider_sub_id   text,
  provider_customer_id text,
  amount_inr        numeric(10,2),
  amount_usd        numeric(10,2),
  currency          text default 'INR',
  billing_cycle     text default 'monthly' check (billing_cycle in ('monthly','yearly','lifetime','one_time')),
  trial_ends_at     timestamptz,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancelled_at      timestamptz,
  cancel_reason     text,
  metadata          jsonb default '{}',
  created_by        uuid references auth.users on delete set null,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Admins can view all subscriptions"
  on public.subscriptions for select
  using (public.is_admin());

create policy "Admins can manage all subscriptions"
  on public.subscriptions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 10. PAYMENT TRANSACTIONS ────────────────────────────────────────────────

create table if not exists public.payment_transactions (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references auth.users on delete cascade not null,
  subscription_id     uuid references public.subscriptions on delete set null,
  provider            text not null,
  provider_payment_id text,
  provider_order_id   text,
  amount              numeric(10,2) not null,
  currency            text not null default 'INR',
  status              text not null check (status in ('pending','success','failed','refunded','disputed')),
  plan                text,
  description         text,
  metadata            jsonb default '{}',
  refund_amount       numeric(10,2),
  refund_reason       text,
  refunded_at         timestamptz,
  created_at          timestamptz default now() not null
);

alter table public.payment_transactions enable row level security;

create policy "Users can view own transactions"
  on public.payment_transactions for select
  using (auth.uid() = user_id);

create policy "Admins can view all transactions"
  on public.payment_transactions for select
  using (public.is_admin());

create policy "Admins can manage all transactions"
  on public.payment_transactions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 11. FEATURE FLAGS ───────────────────────────────────────────────────────

create table if not exists public.feature_flags (
  id          uuid default gen_random_uuid() primary key,
  key         text not null unique,
  name        text not null,
  description text,
  enabled     boolean not null default false,
  applies_to  text[] default '{all}',
  rollout_pct integer default 100 check (rollout_pct >= 0 and rollout_pct <= 100),
  metadata    jsonb default '{}',
  created_by  uuid references auth.users on delete set null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table public.feature_flags enable row level security;

create policy "Admins manage feature flags"
  on public.feature_flags for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "All users read enabled flags"
  on public.feature_flags for select
  using (enabled = true);

-- ─── 12. ADMIN ANNOUNCEMENT / BANNERS ────────────────────────────────────────

create table if not exists public.admin_announcements (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  message     text not null,
  type        text not null default 'info' check (type in ('info','warning','success','error','maintenance')),
  enabled     boolean not null default true,
  target      text not null default 'all' check (target in ('all','users','admins','free','pro','enterprise')),
  starts_at   timestamptz,
  ends_at     timestamptz,
  cta_label   text,
  cta_url     text,
  created_by  uuid references auth.users on delete set null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table public.admin_announcements enable row level security;

create policy "Admins manage announcements"
  on public.admin_announcements for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "All users read active announcements"
  on public.admin_announcements for select
  using (enabled = true);

-- ─── 13. AI USAGE TRACKING ───────────────────────────────────────────────────

create table if not exists public.ai_usage_logs (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users on delete cascade,
  task_type       text,
  provider        text,
  model           text,
  prompt_version  text,
  config_version  text,
  cached          boolean default false,
  cache_type      text,
  tokens_used     integer,
  latency_ms      integer,
  cost_usd        numeric(10,6),
  success         boolean default true,
  error_message   text,
  fallback_used   boolean default false,
  created_at      timestamptz default now() not null
);

alter table public.ai_usage_logs enable row level security;

create policy "Users can view own usage logs"
  on public.ai_usage_logs for select
  using (auth.uid() = user_id);

create policy "Admins can view all usage logs"
  on public.ai_usage_logs for select
  using (public.is_admin());

create policy "System inserts usage logs"
  on public.ai_usage_logs for insert
  with check (true);

-- ─── 14. INDEXES ──────────────────────────────────────────────────────────────

create index if not exists idx_ai_prompt_templates_task_type on public.ai_prompt_templates(task_type, segment, publish_status);
create index if not exists idx_ai_model_routes_task_type on public.ai_model_routes(task_type, priority, enabled, publish_status);
create index if not exists idx_ai_audit_logs_entity on public.ai_audit_logs(entity_type, entity_id, created_at desc);
create index if not exists idx_ai_usage_logs_user on public.ai_usage_logs(user_id, created_at desc);
create index if not exists idx_ai_usage_logs_created on public.ai_usage_logs(created_at desc);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id, status);
create index if not exists idx_payment_transactions_user on public.payment_transactions(user_id, created_at desc);
create index if not exists idx_profiles_role on public.profiles(role, status);

-- ─── 15. SEED: DEFAULT FEATURE FLAGS ─────────────────────────────────────────

insert into public.feature_flags (key, name, description, enabled, applies_to) values
  ('ai_prompt_versioning',    'Prompt Versioning',        'Enable versioned prompt management',           true,  '{all}'),
  ('ai_model_routing',        'Admin Model Routing',      'Use DB routing rules instead of static config', false, '{all}'),
  ('ai_cache_bypass',         'Cache Bypass Mode',        'Skip all caches and call model directly',      false, '{admin}'),
  ('ai_semantic_cache',       'Semantic Cache (Qdrant)',  'Enable vector similarity caching',             false, '{all}'),
  ('beta_output_format',      'Beta Output Templates',    'Use new structured output templates',          false, '{pro,enterprise}'),
  ('experimental_routing',    'Experimental Routing',     'A/B test new model routing strategies',        false, '{admin}'),
  ('ai_usage_tracking',       'AI Usage Tracking',        'Log every AI call for analytics',              true,  '{all}')
on conflict (key) do nothing;
