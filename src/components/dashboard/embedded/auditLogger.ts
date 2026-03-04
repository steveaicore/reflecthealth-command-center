import { supabase } from "@/integrations/supabase/client";

let lastHash = "";

export async function logAuditEvent(
  eventType: string,
  useCaseId: string,
  callId?: string,
  payload: Record<string, unknown> = {}
) {
  const timestamp = new Date().toISOString();
  const eventPayload = { eventType, useCaseId, callId, payload, timestamp };
  const payloadStr = JSON.stringify(eventPayload);

  // Simple hash chaining simulation using btoa (demo-grade, not crypto-grade)
  const hashInput = lastHash + payloadStr + timestamp;
  const hashCurr = btoa(hashInput).slice(0, 64);
  const hashPrev = lastHash;
  lastHash = hashCurr;

  try {
    await supabase.from("audit_events").insert({
      event_type: eventType,
      use_case_id: useCaseId,
      call_id: callId || null,
      payload: payload as any,
      hash_prev: hashPrev,
      hash_curr: hashCurr,
      actor_user_id: "demo-agent",
    });
  } catch (err) {
    console.warn("Audit log error:", err);
  }
}

export const AUDIT_EVENTS = {
  USE_CASE_SELECTED: "USE_CASE_SELECTED",
  USE_CASE_CHANGED: "USE_CASE_CHANGED",
  PRODUCT_LINE_SELECTED: "PRODUCT_LINE_SELECTED",
  PRODUCT_LINE_CHANGED: "PRODUCT_LINE_CHANGED",
  RECOMMENDATION_RENDERED: "RECOMMENDATION_RENDERED",
  RECOMMENDATION_APPLIED: "RECOMMENDATION_APPLIED",
  SCRIPT_COPIED: "SCRIPT_COPIED",
  ESCALATION_TRIGGERED: "ESCALATION_TRIGGERED",
  SCENARIO_CREATED: "SCENARIO_CREATED",
  SCRIPT_VERSION_CREATED: "SCRIPT_VERSION_CREATED",
  SIM_STARTED: "SIM_STARTED",
  SIM_EVENT_INJECTED: "SIM_EVENT_INJECTED",
  DISPOSITION_SET: "DISPOSITION_SET",
} as const;
