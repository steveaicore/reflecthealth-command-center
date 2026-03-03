
-- Agent preferences for persisting selected use case
CREATE TABLE public.agent_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_user_id TEXT NOT NULL UNIQUE,
  default_use_case_id TEXT NOT NULL DEFAULT 'claims-status',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agent_preferences"
  ON public.agent_preferences FOR SELECT
  USING (true);

CREATE POLICY "Public insert agent_preferences"
  ON public.agent_preferences FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update agent_preferences"
  ON public.agent_preferences FOR UPDATE
  USING (true);

-- Immutable audit events with hash chaining
CREATE TABLE public.audit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  actor_user_id TEXT NOT NULL DEFAULT 'demo-agent',
  call_id TEXT,
  event_type TEXT NOT NULL,
  use_case_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  hash_prev TEXT DEFAULT '',
  hash_curr TEXT DEFAULT ''
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read audit_events"
  ON public.audit_events FOR SELECT
  USING (true);

CREATE POLICY "Public insert audit_events"
  ON public.audit_events FOR INSERT
  WITH CHECK (true);

-- Index for fast call_id lookups
CREATE INDEX idx_audit_events_call_id ON public.audit_events(call_id);
CREATE INDEX idx_audit_events_event_type ON public.audit_events(event_type);
