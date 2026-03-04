
-- Add default_product_line_id to agent_preferences
ALTER TABLE public.agent_preferences
ADD COLUMN default_product_line_id text NOT NULL DEFAULT 'medicare';

-- Extend audit_events with product_line_id and scenario_id
ALTER TABLE public.audit_events
ADD COLUMN product_line_id text,
ADD COLUMN scenario_id text;
