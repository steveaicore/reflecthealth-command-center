import { useState, useEffect } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { useAudioEngine } from "@/contexts/AudioEngineContext";
import { DetailModal } from "../DetailModal";
import penguinAiLogo from "@/assets/penguin-ai-logo.png";
import penguinLogo from "@/assets/penguin-logo.png";
import {
  ArrowRight, Shield, FileText, Sparkles, AlertCircle, ChevronDown, ChevronUp,
  Database, Activity, CheckCircle2, UserCheck, Fingerprint, Search, MessageSquare, Lock, Server
} from "lucide-react";

// ── Provider-focused pipeline stages ──
const PROVIDER_PIPELINE = [
  { label: "Provider Verify", icon: UserCheck },
  { label: "Member Verify", icon: Fingerprint },
  { label: "Intent", icon: Sparkles },
  { label: "Data Retrieval", icon: Database },
  { label: "Response", icon: MessageSquare },
  { label: "Confidence", icon: Shield },
  { label: "Escalation", icon: AlertCircle },
];

// ── Data sources shown during Reflect Data Retrieval ──
const DATA_SOURCES = [
  { name: "Azure Data Lake", detail: "Eligibility + Historical Claims" },
  { name: "Core Claims System", detail: "Real-Time Status" },
  { name: "Prior Authorization System", detail: "" },
  { name: "Provider Directory Database", detail: "" },
];

// ── Simulated API calls per intent ──
const API_CALLS: Record<string, { endpoint: string; source: string; latency: number; status: number }[]> = {
  "Eligibility Verification": [
    { endpoint: "GET /eligibility", source: "Azure Data Lake", latency: 240, status: 200 },
    { endpoint: "GET /provider-verify", source: "Provider Directory Database", latency: 112, status: 200 },
  ],
  "Claim Status": [
    { endpoint: "GET /claim-status", source: "Core Claims System", latency: 180, status: 200 },
    { endpoint: "GET /eligibility", source: "Azure Data Lake", latency: 240, status: 200 },
  ],
  "Prior Authorization Status": [
    { endpoint: "GET /prior-auth-status", source: "Prior Authorization System", latency: 310, status: 200 },
    { endpoint: "GET /eligibility", source: "Azure Data Lake", latency: 240, status: 200 },
  ],
  "Benefits Verification": [
    { endpoint: "GET /eligibility", source: "Azure Data Lake", latency: 240, status: 200 },
    { endpoint: "GET /benefits-schedule", source: "Core Claims System", latency: 155, status: 200 },
  ],
};

// ── Structured response cards per intent ──
const STRUCTURED_RESPONSES: Record<string, { fields: { label: string; value: string }[]; generatedResponse: string }> = {
  "Claim Status": {
    fields: [
      { label: "Claim", value: "#CLM-90124" },
      { label: "Status", value: "Processing" },
      { label: "Expected Completion", value: "5 Business Days" },
    ],
    generatedResponse: "Claim 772451 was received February 3rd and is currently processing. Determination expected within five business days.",
  },
  "Eligibility Verification": {
    fields: [
      { label: "Plan", value: "UHC Choice Plus PPO" },
      { label: "Status", value: "Active" },
      { label: "Effective", value: "01/01/2026" },
    ],
    generatedResponse: "Eligibility confirmed. Coverage is active under the employer-sponsored PPO plan. No lapse in coverage detected.",
  },
  "Prior Authorization Status": {
    fields: [
      { label: "PA Request", value: "#PA-77291" },
      { label: "Status", value: "Under Clinical Review" },
      { label: "ETA", value: "48 Hours" },
    ],
    generatedResponse: "PA request is under clinical review. All required clinical documentation has been received. Estimated determination within 48 hours.",
  },
  "Benefits Verification": {
    fields: [
      { label: "Plan", value: "UHC Choice Plus PPO" },
      { label: "Copay", value: "$30 (Specialist)" },
      { label: "Deductible Met", value: "74% ($1,112 / $1,500)" },
    ],
    generatedResponse: "Member is active. In-network specialist copay is $30. Deductible: $1,112 of $1,500 met. Coverage confirmed through 12/31/2026.",
  },
};

export function Five9AIPanel() {
  const { pipeline, events } = useSimulation();
  const { callParams } = useDashboard();
  const { liveCallIntent } = useAudioEngine();
  const activeEvent = events[0];
  const [confidenceModalOpen, setConfidenceModalOpen] = useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [systemActivityOpen, setSystemActivityOpen] = useState(false);
  const [apiPulse, setApiPulse] = useState(false);

  const displayIntent = liveCallIntent || activeEvent?.reason || "";

  // Determine the active pipeline stage (map simulation's 0-5 to our 0-6)
  const mappedStage = Math.min(Math.floor(pipeline.activeStage * (PROVIDER_PIPELINE.length / 5)), PROVIDER_PIPELINE.length - 1);
  const isDataRetrievalActive = mappedStage === 3;

  // Pulse animation when data retrieval is active
  useEffect(() => {
    if (isDataRetrievalActive) {
      setApiPulse(true);
      const t = setTimeout(() => setApiPulse(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isDataRetrievalActive, pipeline.activeStage]);

  const apiCalls = API_CALLS[displayIntent] || API_CALLS["Eligibility Verification"];
  const structuredResp = STRUCTURED_RESPONSES[displayIntent] || STRUCTURED_RESPONSES["Eligibility Verification"];
  const isEscalated = pipeline.outcome === "Escalated";
  const isResolved = !isEscalated;

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
        <span className="type-micro text-five9-muted">Powered by Penguin AI</span>
      </div>

      {/* ── PART 1: Provider Pipeline ── */}
      <div className="five9-card p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <img src={penguinLogo} alt="" className="h-3 w-3 object-contain" />
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted">Processing Pipeline</span>
        </div>
        <div className="flex items-center gap-0.5 flex-wrap">
          {PROVIDER_PIPELINE.map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-0.5 shrink-0">
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all duration-300 ${
                i <= mappedStage
                  ? "five9-accent-bg text-white"
                  : "bg-secondary text-five9-muted"
              }`}>
                <stage.icon className="h-2.5 w-2.5" />
                <span className="hidden xl:inline">{stage.label}</span>
              </div>
              {i < PROVIDER_PIPELINE.length - 1 && (
                <ArrowRight className={`h-2 w-2 ${i < mappedStage ? "text-five9-accent" : "text-five9-muted/30"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── PART 3: Provider + Member Verification ── */}
      {(displayIntent || activeEvent) && (
        <div className="five9-card p-2.5 space-y-1.5">
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <UserCheck className="h-3 w-3" /> Verification Status
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-1 mb-0.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-700">Provider Verified</span>
              </div>
              <div className="text-[9px] text-muted-foreground space-y-0.5">
                <div>NPI: <span className="font-mono text-foreground">1456789123</span></div>
                <div>Confidence: <span className="font-mono text-foreground">99%</span></div>
              </div>
            </div>
            <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-1 mb-0.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-700">Member Verified</span>
              </div>
              <div className="text-[9px] text-muted-foreground space-y-0.5">
                <div>ID: <span className="font-mono text-foreground">BCX-8847291</span></div>
                <div>DOB Confirmed · <span className="font-mono text-foreground">98%</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PART 4: Intent Classification ── */}
      {displayIntent && (
        <div className="five9-card p-2.5 space-y-1">
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Intent Classified
          </span>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-foreground">{displayIntent}</span>
            <span className="text-[11px] font-mono font-semibold text-primary">{pipeline.confidence}%</span>
          </div>
        </div>
      )}

      {/* ── PART 2: Data Source Transparency ── */}
      <div className="five9-card p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <Database className="h-3 w-3" /> Reflect Data Retrieval
          </span>
          {isDataRetrievalActive && (
            <Activity className={`h-3 w-3 text-primary ${apiPulse ? "animate-pulse" : ""}`} />
          )}
        </div>
        <div className="space-y-0.5">
          {DATA_SOURCES.map((src) => (
            <div key={src.name} className="flex items-center gap-1.5 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-foreground font-medium">{src.name}</span>
              {src.detail && <span className="text-muted-foreground">({src.detail})</span>}
            </div>
          ))}
        </div>
        {/* API Call details */}
        <div className="mt-1.5 space-y-1 border-t border-border pt-1.5">
          {apiCalls.map((call, i) => (
            <div key={i} className="bg-secondary/50 rounded p-1.5 text-[9px] font-mono space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-foreground font-semibold">{call.endpoint}</span>
                <span className="text-emerald-600">{call.status} OK</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Source: {call.source}</span>
                <span>Latency: {call.latency}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PART 5: Structured Response Card ── */}
      {displayIntent && structuredResp && (
        <div className="five9-card p-2.5 space-y-1.5 five9-active-border">
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <FileText className="h-3 w-3" /> Structured Response
          </span>
          <div className="bg-secondary/30 rounded p-2 space-y-1">
            {structuredResp.fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-semibold text-foreground font-mono">{f.value}</span>
              </div>
            ))}
          </div>
          <div className="pt-1 border-t border-border">
            <span className="type-micro text-five9-muted block mb-0.5">Generated Response:</span>
            <p className="text-[11px] text-foreground leading-relaxed">{structuredResp.generatedResponse}</p>
          </div>
        </div>
      )}

      {/* ── PART 6: Confidence + Escalation ── */}
      <button
        onClick={() => setConfidenceModalOpen(true)}
        className="five9-card p-2.5 space-y-1.5 w-full text-left hover:border-five9-accent/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <Shield className="h-3 w-3" /> Confidence Score
          </span>
          <span className={`text-[14px] font-mono font-bold ${
            pipeline.confidence > callParams.accuracyPct * 100 ? "text-emerald-600" : "text-amber-600"
          }`}>
            {pipeline.confidence}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 five9-accent-bg" style={{ width: `${pipeline.confidence}%` }} />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Threshold: {(callParams.accuracyPct * 100).toFixed(0)}%</span>
          <span className={`font-semibold ${isResolved ? "text-emerald-600" : "text-amber-600"}`}>
            {isResolved ? "Auto-Resolved" : "Escalation Required"}
          </span>
        </div>
      </button>

      {/* Escalation banner */}
      {isEscalated && (
        <div className="five9-card p-2.5 border-amber-500/30 bg-amber-50 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700">
            <AlertCircle className="h-3 w-3" />
            Escalation Detected
          </div>
          <p className="text-[10px] text-amber-600">
            Routing to Senior Agent. Full context + transcript transferred.
          </p>
        </div>
      )}

      {/* ── Compliance ── */}
      <button
        onClick={() => setComplianceModalOpen(true)}
        className="five9-card p-2.5 space-y-1.5 w-full text-left hover:border-five9-accent/30 transition-colors"
      >
        <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
          <Lock className="h-3 w-3" /> Real-time Compliance
        </span>
        <div className="grid grid-cols-2 gap-1">
          {complianceFlags.map((flag) => (
            <div key={flag.label} className="flex items-center gap-1">
              {flag.ok ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> : <AlertCircle className="h-2.5 w-2.5 text-amber-500" />}
              <span className={`text-[10px] ${flag.ok ? "text-foreground" : "text-amber-600"}`}>{flag.label}</span>
            </div>
          ))}
        </div>
      </button>

      {/* ── PART 7: System Activity (expandable) ── */}
      <div className="five9-card overflow-hidden">
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
          <div className="px-2.5 pb-2.5 space-y-1 text-[9px] font-mono">
            {[
              { label: "Five9 Session ID", value: "F9-" + Math.random().toString(36).slice(2, 10).toUpperCase() },
              { label: "Reflect API Token", value: "●●●●●●●●" + Math.random().toString(36).slice(2, 6).toUpperCase() },
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

      {/* ── Modals ── */}
      <DetailModal open={confidenceModalOpen} onClose={() => setConfidenceModalOpen(false)} title="AI Confidence Analysis">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
              <span className="text-[9px] text-muted-foreground uppercase block">Current</span>
              <span className="text-xl font-bold font-mono text-primary">{pipeline.confidence}%</span>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
              <span className="text-[9px] text-muted-foreground uppercase block">Threshold</span>
              <span className="text-xl font-bold font-mono text-foreground">{(callParams.accuracyPct * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Signal Breakdown</span>
            {[
              { label: "Provider Match", value: 99 },
              { label: "Member Match", value: 98 },
              { label: "Intent Match", value: 96 },
              { label: "Policy Alignment", value: pipeline.confidence },
              { label: "Historical Pattern", value: 88 },
              { label: "Entity Extraction", value: 94 },
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
