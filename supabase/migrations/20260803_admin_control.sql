-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: system_prompts
-- Governs the system instructions for various AI agents (resume parser, tailor, cover letter)
CREATE TABLE IF NOT EXISTS public.system_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL, -- e.g., 'resume_tailor_v1'
    description TEXT,
    prompt_text TEXT NOT NULL,
    temperature NUMERIC(3,2) DEFAULT 0.7,
    is_active BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Table: routing_rules
-- Governs which user tiers get which models
CREATE TABLE IF NOT EXISTS public.routing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_tier VARCHAR(50) UNIQUE NOT NULL, -- 'free', 'premium'
    primary_model VARCHAR(255) NOT NULL, -- e.g., 'gemini-flash'
    fallback_model VARCHAR(255) NOT NULL, -- e.g., 'gemini-pro'
    max_tokens INTEGER DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: ai_audit_logs
-- Observability table to track token usage and cache performance
CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    prompt_slug VARCHAR(255) REFERENCES public.system_prompts(slug),
    model_used VARCHAR(255) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    latency_ms INTEGER,
    cache_hit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at trigger for system_prompts
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_prompts_modtime
    BEFORE UPDATE ON public.system_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- RLS Policies
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read active prompts & rules (used by edge functions)
CREATE POLICY "Enable read access for authenticated users" ON public.system_prompts
    FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Enable read access for authenticated users" ON public.routing_rules
    FOR SELECT TO authenticated USING (true);

-- Users can only read their own audit logs
CREATE POLICY "Users can view own logs" ON public.ai_audit_logs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Only service role / admin can insert/update (this requires custom admin role logic in production, defaulting to service_role for now)
