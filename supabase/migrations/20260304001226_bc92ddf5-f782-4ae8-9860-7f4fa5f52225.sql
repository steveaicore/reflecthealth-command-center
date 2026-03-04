
-- Add default_org_type_id to agent_preferences
ALTER TABLE public.agent_preferences ADD COLUMN IF NOT EXISTS default_org_type_id text NOT NULL DEFAULT 'payer';
