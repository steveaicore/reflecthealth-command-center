import { useState, useEffect, useRef } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { useAudioEngine, type Five9Phase } from "@/contexts/AudioEngineContext";
import { DetailModal } from "../DetailModal";
import penguinAiLogo from "@/assets/penguin-ai-logo.png";
import penguinLogo from "@/assets/penguin-logo.png";
import {
  ArrowRight, Shield, FileText, Sparkles, AlertCircle, ChevronDown, ChevronUp,
  Database, Activity, CheckCircle2, UserCheck, Fingerprint, MessageSquare, Lock, Server, Loader2
} from "lucide-react";

// ── Provider-focused pipeline stages ──
const PIPELINE_STAGES = [
  { label: "Provider Verify", icon: UserCheck, phases: ["provider-verifying", "provider-verified"] as Five9Phase[] },
  { label: "Member Verify", icon: Fingerprint, phases: ["member-verifying", "member-verified"] as Five9Phase[] },
  { label: "Intent", icon: Sparkles, phases: ["intent-classifying", "intent-classified"] as Five9Phase[] },
  { label: "Data Retrieval", icon: Database, phases: ["data-retrieving", "data-retrieved"] as Five9Phase[] },
  { label: "Response", icon: MessageSquare, phases: ["response-generating", "response-ready"] as Five9Phase[] },
  { label: "Confidence", icon: Shield, phases: ["confidence-check"] as Five9Phase[] },
  { label: "Escalation", icon: AlertCircle, phases: ["escalation", "resolved"] as Five9Phase[] },
];

// ── Data sources ──
const DATA_SOURCES = [
  { name: "Azure Data Lake", detail: "Eligibility + Historical Claims" },
  { name: "Core Claims System", detail: "Real-Time Status" },
  { name: "Prior Authorization System", detail: "" },
  { name: "Provider Directory Database", detail: "" },
];

// Map phase to pipeline stage index
function phaseToStageIndex(phase: Five9Phase): number {
  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    if (PIPELINE_STAGES[i].phases.includes(phase)) return i;
  }
  if (phase === "resolved" || phase === "escalation") return 6;
  return -1;
}

// Animated latency counter
function LatencyCounter({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    startTime.current = performance.now();
    setValue(0);
    const duration = Math.min(target * 2, 800);
    let frame: number;
    const animate = () => {
      const elapsed = performance.now() - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.floor(target * progress));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <span>{value}ms</span>;
}

export function Five9AIPanel() {
  const { pipeline } = useSimulation();
  const { callParams } = useDashboard();
  const { five9Phase, five9Session, liveCallIntent } = useAudioEngine();
  const [confidenceModalOpen, setConfidenceModalOpen] = useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [systemActivityOpen, setSystemActivityOpen] = useState(false);

  const session = five9Session;
  const phase = five9Phase;
  const activeStageIdx = phaseToStageIndex(phase);
  const isIdle = phase === "idle";
  const isAwaiting = phase === "awaiting";

  const displayIntent = session?.intent || liveCallIntent || "";
  const isEscalated = session?.escalated || false;
  const confidenceScore = session?.confidenceScore || pipeline.confidence;
  const isDataPhase = phase === "data-retrieving" || phase === "data-retrieved";

  // Check which phases have been reached
  const isProviderVerified = activeStageIdx >= 0 && (
    phase === "provider-verified" || activeStageIdx > 0
  );
  const isMemberVerified = activeStageIdx >= 1 && (
    phase === "member-verified" || activeStageIdx > 1
  );
  const isIntentClassified = activeStageIdx >= 2 && (
    phase === "intent-classified" || activeStageIdx > 2
  );
  const hasResponse = activeStageIdx >= 4 && (
    phase === "response-ready" || activeStageIdx > 4
  );

  const complianceFlags = [
    { label: "HIPAA Compliant", ok: true },
    { label: "PII Masked", ok: true },
    { label: "Audit Logged", ok: true },
    { label: "Escalation Policy", ok: !isEscalated },
  ];

  return (
    <div className="p-3 space-y-2.5 five9-panel-bg h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <img src={penguinAiLogo} alt="Penguin AI" className="h-3.5" />
          <span className="type-h3 text-foreground">Provider Orchestration</span>
        </div>
        <span className="type-micro text-five9-muted">
          {session ? `Session: ${session.sessionId.slice(0, 12)}` : "Powered by Penguin AI"}
        </span>
      </div>

      {/* Awaiting state */}
      {isAwaiting && (
        <div className="five9-card p-3 flex items-center gap-2 animate-pulse">
          <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
          <span className="text-[11px] text-muted-foreground">Awaiting Caller Input…</span>
        </div>
      )}

      {/* Idle state */}
      {isIdle && (
        <div className="five9-card p-4 text-center">
          <span className="text-[11px] text-muted-foreground">Enable Live Simulation to begin orchestration</span>
        </div>
      )}

      {/* ── PIPELINE ── */}
      {!isIdle && (
        <div className="five9-card p-2.5 space-y-2 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <img src={penguinLogo} alt="" className="h-3 w-3 object-contain" />
            <span className="type-micro uppercase tracking-[0.12em] text-five9-muted">Processing Pipeline</span>
          </div>
          <div className="flex items-center gap-0.5 flex-wrap">
            {PIPELINE_STAGES.map((stage, i) => {
              const isActive = i === activeStageIdx;
              const isCompleted = i < activeStageIdx;
              return (
                <div key={stage.label} className="flex items-center gap-0.5 shrink-0">
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all duration-300 ${
                    isActive
                      ? "five9-accent-bg text-white animate-pulse"
                      : isCompleted
                        ? "five9-accent-bg text-white"
                        : "bg-secondary text-five9-muted"
                  }`}>
                    <stage.icon className="h-2.5 w-2.5" />
                    <span className="hidden xl:inline">{stage.label}</span>
                  </div>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <ArrowRight className={`h-2 w-2 ${isCompleted ? "text-five9-accent" : "text-five9-muted/30"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VERIFICATION STATUS ── */}
      {session && !isIdle && !isAwaiting && (
        <div className="five9-card p-2.5 space-y-1.5 animate-fade-in">
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <UserCheck className="h-3 w-3" /> Verification Status
          </span>
          <div className="grid grid-cols-2 gap-2">
            {/* Provider */}
            <div className={`p-2 rounded border transition-all duration-500 ${
              isProviderVerified
                ? "bg-emerald-500/5 border-emerald-500/20"
                : phase === "provider-verifying"
                  ? "bg-primary/5 border-primary/20 animate-pulse"
                  : "bg-secondary/30 border-border"
            }`}>
              <div className="flex items-center gap-1 mb-0.5">
                {phase === "provider-verifying" ? (
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                ) : isProviderVerified ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                )}
                <span className={`text-[10px] font-semibold ${isProviderVerified ? "text-emerald-700" : "text-muted-foreground"}`}>
                  {phase === "provider-verifying" ? "Verifying…" : isProviderVerified ? "Provider Verified" : "Provider Pending"}
                </span>
              </div>
              {isProviderVerified && (
                <div className="text-[9px] text-muted-foreground space-y-0.5 animate-fade-in">
                  <div>NPI: <span className="font-mono text-foreground">{session.providerNpi}</span></div>
                  <div>Confidence: <span className="font-mono text-foreground">{session.providerConfidence}%</span></div>
                </div>
              )}
            </div>
            {/* Member */}
            <div className={`p-2 rounded border transition-all duration-500 ${
              isMemberVerified
                ? "bg-emerald-500/5 border-emerald-500/20"
                : phase === "member-verifying"
                  ? "bg-primary/5 border-primary/20 animate-pulse"
                  : "bg-secondary/30 border-border"
            }`}>
              <div className="flex items-center gap-1 mb-0.5">
                {phase === "member-verifying" ? (
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                ) : isMemberVerified ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                )}
                <span className={`text-[10px] font-semibold ${isMemberVerified ? "text-emerald-700" : "text-muted-foreground"}`}>
                  {phase === "member-verifying" ? "Verifying…" : isMemberVerified ? "Member Verified" : "Member Pending"}
                </span>
              </div>
              {isMemberVerified && (
                <div className="text-[9px] text-muted-foreground space-y-0.5 animate-fade-in">
                  <div>ID: <span className="font-mono text-foreground">{session.memberId}</span></div>
                  <div>DOB Confirmed · <span className="font-mono text-foreground">{session.memberConfidence}%</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── INTENT CLASSIFICATION ── */}
      {session && isIntentClassified && (
        <div className="five9-card p-2.5 space-y-1 animate-fade-in">
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Intent Classified
          </span>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-foreground">{displayIntent}</span>
            <span className="text-[11px] font-mono font-semibold text-primary">{confidenceScore}%</span>
          </div>
        </div>
      )}

      {/* Intent classifying loading */}
      {phase === "intent-classifying" && (
        <div className="five9-card p-2.5 space-y-1 animate-pulse">
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Classifying Intent…
          </span>
          <div className="h-3 bg-secondary rounded animate-pulse w-3/4" />
        </div>
      )}

      {/* ── DATA RETRIEVAL ── */}
      {session && activeStageIdx >= 3 && !isAwaiting && (
        <div className="five9-card p-2.5 space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
              <Database className="h-3 w-3" /> Reflect Data Retrieval
            </span>
            {isDataPhase && (
              <Activity className="h-3 w-3 text-primary animate-pulse" />
            )}
          </div>
          <div className="space-y-0.5">
            {DATA_SOURCES.map((src) => (
              <div key={src.name} className="flex items-center gap-1.5 text-[10px]">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  isDataPhase ? "bg-primary animate-pulse" : "bg-emerald-500"
                }`} />
                <span className="text-foreground font-medium">{src.name}</span>
                {src.detail && <span className="text-muted-foreground">({src.detail})</span>}
              </div>
            ))}
          </div>
          {/* Dynamic API calls */}
          <div className="mt-1.5 space-y-1 border-t border-border pt-1.5">
            {session.apiCalls.map((call, i) => (
              <div key={i} className="bg-secondary/50 rounded p-1.5 text-[9px] font-mono space-y-0.5 animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-semibold">{call.endpoint}</span>
                  <span className="text-emerald-600">{call.status} OK</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Source: {call.source}</span>
                  <span>Latency: <LatencyCounter target={call.latency} /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STRUCTURED RESPONSE ── */}
      {session?.structuredResponse && hasResponse && (
        <div className="five9-card p-2.5 space-y-1.5 five9-active-border animate-fade-in">
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <FileText className="h-3 w-3" /> Structured Response
          </span>
          <div className="bg-secondary/30 rounded p-2 space-y-1">
            {session.structuredResponse.fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-semibold text-foreground font-mono">{f.value}</span>
              </div>
            ))}
          </div>
          <div className="pt-1 border-t border-border">
            <span className="type-micro text-five9-muted block mb-0.5">Generated Response:</span>
            <p className="text-[11px] text-foreground leading-relaxed">{session.structuredResponse.generatedResponse}</p>
          </div>
        </div>
      )}

      {/* ── CONFIDENCE + ESCALATION ── */}
      {session && activeStageIdx >= 5 && (
        <button
          onClick={() => setConfidenceModalOpen(true)}
          className="five9-card p-2.5 space-y-1.5 w-full text-left hover:border-five9-accent/30 transition-colors animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
              <Shield className="h-3 w-3" /> Confidence Score
            </span>
            <span className={`text-[14px] font-mono font-bold ${
              confidenceScore > callParams.accuracyPct * 100 ? "text-emerald-600" : "text-amber-600"
            }`}>
              {confidenceScore}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 five9-accent-bg"
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Threshold: {(callParams.accuracyPct * 100).toFixed(0)}%</span>
            <span className={`font-semibold ${!isEscalated ? "text-emerald-600" : "text-amber-600"}`}>
              {!isEscalated ? "Auto-Resolved" : "Escalation Required"}
            </span>
          </div>
        </button>
      )}

      {/* Escalation banner */}
      {isEscalated && activeStageIdx >= 5 && (
        <div className="five9-card p-2.5 border-amber-500/30 bg-amber-50 space-y-1 animate-fade-in">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 animate-pulse">
            <AlertCircle className="h-3 w-3" />
            Escalation Detected
          </div>
          <p className="text-[10px] text-amber-600">
            {session?.escalationReason || "Confidence Below Threshold"}. Routing to Senior Agent. Full context + transcript transferred.
          </p>
        </div>
      )}

      {/* ── COMPLIANCE ── */}
      {session && activeStageIdx >= 3 && (
        <button
          onClick={() => setComplianceModalOpen(true)}
          className="five9-card p-2.5 space-y-1.5 w-full text-left hover:border-five9-accent/30 transition-colors animate-fade-in"
        >
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <Lock className="h-3 w-3" /> Real-time Compliance
          </span>
          <div className="grid grid-cols-2 gap-1">
            {complianceFlags.map((flag) => (
              <div key={flag.label} className="flex items-center gap-1">
                {flag.ok ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ) : (
                  <AlertCircle className="h-2.5 w-2.5 text-amber-500" />
                )}
                <span className={`text-[10px] ${flag.ok ? "text-foreground" : "text-amber-600"}`}>{flag.label}</span>
              </div>
            ))}
          </div>
        </button>
      )}

      {/* ── SYSTEM ACTIVITY ── */}
      {session && (
        <div className="five9-card overflow-hidden animate-fade-in">
          <button
            onClick={() => setSystemActivityOpen(!systemActivityOpen)}
            className="w-full p-2.5 flex items-center justify-between hover:bg-secondary/30 transition-colors"
          >
            <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
              <Server className="h-3 w-3" /> System Activity
            </span>
            {systemActivityOpen ? <ChevronUp className="h-3 w-3 text-five9-muted" /> : <ChevronDown className="h-3 w-3 text-five9-muted" />}
          </button>
          {systemActivityOpen && (
            <div className="px-2.5 pb-2.5 space-y-1 text-[9px] font-mono animate-fade-in">
              {[
                { label: "Five9 Session ID", value: session.sessionId },
                { label: "Reflect API Token", value: "●●●●●●●●" + session.sessionId.slice(-4) },
                { label: "Caller Type", value: session.callerType },
                { label: "Audit Log", value: "Created" },
                { label: "Transcript", value: "Stored" },
                { label: "Access Logged", value: "Yes" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-0.5 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <DetailModal open={confidenceModalOpen} onClose={() => setConfidenceModalOpen(false)} title="AI Confidence Analysis">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
              <span className="text-[9px] text-muted-foreground uppercase block">Current</span>
              <span className="text-xl font-bold font-mono text-primary">{confidenceScore}%</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
              <span className="text-[9px] text-muted-foreground uppercase block">Threshold</span>
              <span className="text-xl font-bold font-mono text-foreground">{(callParams.accuracyPct * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Signal Breakdown</span>
            {[
              { label: "Provider Match", value: session?.providerConfidence || 99 },
              { label: "Member Match", value: session?.memberConfidence || 98 },
              { label: "Intent Match", value: confidenceScore },
              { label: "Policy Alignment", value: Math.min(confidenceScore + 2, 99) },
              { label: "Historical Pattern", value: Math.max(confidenceScore - 4, 82) },
              { label: "Entity Extraction", value: Math.min(confidenceScore + 1, 97) },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{s.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full five9-accent-bg" style={{ width: `${s.value}%` }} />
                  </div>
                  <span className="font-mono font-medium text-foreground">{s.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DetailModal>

      <DetailModal open={complianceModalOpen} onClose={() => setComplianceModalOpen(false)} title="Compliance Detail">
        <div className="space-y-3">
          {complianceFlags.map(flag => (
            <div key={flag.label} className="p-3 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-1">
                {flag.ok ? <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                <span className="text-[11px] font-semibold text-foreground">{flag.label}</span>
                <span className={`text-[9px] font-medium ml-auto ${flag.ok ? "text-emerald-600" : "text-amber-600"}`}>{flag.ok ? "PASS" : "WARNING"}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {flag.label === "HIPAA Compliant" && "All PHI/PII data encrypted in transit and at rest. Access logged per HIPAA §164.312."}
                {flag.label === "PII Masked" && "SSNs, DOBs, and member IDs masked in all AI processing pipelines."}
                {flag.label === "Audit Logged" && "Complete interaction audit trail maintained with timestamp, agent ID, and AI decision rationale."}
                {flag.label === "Escalation Policy" && (flag.ok ? "Confidence above threshold. Automated resolution permitted." : "Below threshold. Escalation required per policy.")}
              </p>
            </div>
          ))}
        </div>
      </DetailModal>
    </div>
  );
}
