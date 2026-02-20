import { useState, useEffect } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { useAudioEngine } from "@/contexts/AudioEngineContext";
import { DetailModal } from "../DetailModal";
import penguinAiLogo from "@/assets/penguin-ai-logo.png";
import penguinLogo from "@/assets/penguin-logo.png";
import { ArrowRight, Shield, FileText, Sparkles, AlertCircle } from "lucide-react";

const PIPELINE_STAGES = [
  { label: "Intent", icon: Sparkles },
  { label: "Policy", icon: FileText },
  { label: "Query", icon: Shield },
  { label: "Response", icon: ArrowRight },
];

const INTENT_RESPONSES: Record<string, string> = {
  "Benefits Verification": "Member is active under UHC Choice Plus PPO. In-network specialist copay is $30. Deductible: $1,112 of $1,500 met (74%). No balance issues. Coverage confirmed through 12/31/2026.",
  "Eligibility Check": "Eligibility confirmed. Plan status: Active under employer-sponsored PPO plan. Effective date: 01/01/2026. PCP assignment on file. No lapse in coverage detected.",
  "Claim Status": "Claim #772451 received February 3rd. Currently in processing. Determination expected within five business days. No additional documentation required at this time.",
  "Prior Authorization Status": "PA request is under clinical review. Estimated determination within 48 hours. All required clinical documentation has been received.",
  "Underpaid Claim Review": "This claim requires manual review by a claims specialist. The case has been flagged for secondary review due to payment discrepancy. Routing to senior claims analyst.",
  "COB Verification": "COB verified. Primary: UHC. Secondary: Aetna. Primary processes first, then secondary covers remaining balance up to plan limits. Standard COB rules apply.",
  "Claim Reprocessing Request": "Claim #554102 reprocessing initiated. Original submission had incorrect procedure code. Updated determination expected within 7 business days.",
  "Appeal Status Inquiry": "Appeal #AP-20241 is currently under secondary review. A determination letter will be issued within 10 business days per regulatory requirements.",
  "Timely Filing Question": "Timely filing limit for Cigna PPO: 90 days from date of service. Electronic submissions must be received by the 90-day mark. Extensions require written documentation.",
  "Claims Status": "Your claim has been processed and approved. Payment was issued on February 15th to the provider on file. EOB available in member portal.",
  "ID Card Replacement": "A new ID card has been requested. It will arrive within 7-10 business days. A digital copy has been sent to the email on file and is available in the mobile app.",
  "Deductible / OOP Inquiry": "Individual deductible: $1,200 of $2,000 met (60%). Out-of-pocket maximum remaining: $4,200. All amounts reflect claims processed through today.",
};

export function Five9AIPanel() {
  const { pipeline, events } = useSimulation();
  const { callParams } = useDashboard();
  const { liveCallIntent } = useAudioEngine();
  const activeEvent = events[0];
  const [draftPopulated, setDraftPopulated] = useState(false);
  const [confidenceModalOpen, setConfidenceModalOpen] = useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [draftSent, setDraftSent] = useState(false);

  // Reset draft state when active event or live call changes
  useEffect(() => {
    setDraftPopulated(false);
    setDraftSent(false);
  }, [activeEvent?.id, liveCallIntent]);

  // Use the live call intent if available, otherwise fall back to simulation event
  const displayIntent = liveCallIntent || activeEvent?.reason || "";
  const suggestedResponse = INTENT_RESPONSES[displayIntent]
    || (displayIntent ? `Based on policy guidelines, the ${displayIntent.toLowerCase()} request has been verified. All documentation is in order. No further action required.` : "");

  const complianceFlags = [
    { label: "HIPAA Compliant", ok: true },
    { label: "PII Masked", ok: true },
    { label: "Audit Logged", ok: true },
    { label: "Escalation Policy", ok: pipeline.outcome !== "Escalated" },
  ];

  return (
    <div className="p-3 space-y-3 five9-panel-bg h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <img src={penguinAiLogo} alt="Penguin AI" className="h-3.5" />
          <span className="type-h3 text-foreground">Penguin AI Orchestration</span>
        </div>
        <span className="type-micro text-five9-muted">Powered by Penguin AI</span>
      </div>

      {/* Pipeline */}
      <div className="five9-card p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <img src={penguinLogo} alt="Penguin AI" className="h-3 w-3 object-contain" />
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted">
            Processing Pipeline
          </span>
        </div>
        <div className="flex items-center gap-1">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-1">
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all duration-300 ${
                i <= Math.min(pipeline.activeStage, 3)
                  ? "five9-accent-bg text-white"
                  : "bg-secondary text-five9-muted"
              }`}>
                <stage.icon className="h-2.5 w-2.5" />
                {stage.label}
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <ArrowRight className={`h-2 w-2 ${i < pipeline.activeStage ? "text-five9-accent" : "text-five9-muted/30"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Confidence - Clickable */}
      <button
        onClick={() => setConfidenceModalOpen(true)}
        className="five9-card p-2.5 space-y-2 w-full text-left hover:border-five9-accent/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src={penguinLogo} alt="Penguin AI" className="h-3 w-3 object-contain" />
            <span className="type-micro uppercase tracking-[0.12em] text-five9-muted">Confidence</span>
          </div>
          <span className={`type-confidence ${
            pipeline.confidence > callParams.accuracyPct * 100 ? "text-emerald-600" : "text-amber-600"
          }`}>
            {pipeline.confidence}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 five9-accent-bg"
            style={{ width: `${pipeline.confidence}%` }}
          />
        </div>
      </button>

      {/* Recommended Response */}
      {(displayIntent || activeEvent) && suggestedResponse && (
        <div className="five9-card p-2.5 space-y-2 five9-active-border">
          <div className="flex items-center gap-1.5">
            <img src={penguinLogo} alt="Penguin AI" className="h-4 w-4 object-contain" />
            <span className="type-micro uppercase tracking-[0.12em] text-five9-muted">
              Recommended Response
            </span>
          </div>
          <p className="type-body-lg text-foreground" style={{ lineHeight: 1.6 }}>{suggestedResponse}</p>
        </div>
      )}


      <button
        onClick={() => setComplianceModalOpen(true)}
        className="five9-card p-2.5 space-y-2 w-full text-left hover:border-five9-accent/30 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <img src={penguinLogo} alt="Penguin AI" className="h-3 w-3 object-contain" />
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted">
            Real-time Compliance
          </span>
        </div>
        <div className="space-y-1">
          {complianceFlags.map((flag) => (
            <div key={flag.label} className="flex items-center gap-1.5">
              {flag.ok ? (
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              ) : (
                <AlertCircle className="h-3 w-3 text-amber-500" />
              )}
              <span className={`type-body ${flag.ok ? "text-foreground" : "text-amber-600"}`}>{flag.label}</span>
            </div>
          ))}
        </div>
      </button>

      {/* Escalation Detection */}
      {activeEvent && pipeline.outcome === "Escalated" && (
        <div className="five9-card p-2.5 border-amber-500/30 bg-amber-50 space-y-1">
          <div className="flex items-center gap-1.5 type-micro font-semibold text-amber-700">
            <AlertCircle className="h-3 w-3" />
            Escalation Detected
          </div>
          <p className="type-body text-amber-600">
            Confidence below threshold. Routing to senior agent with full context transfer.
          </p>
        </div>
      )}

      {/* Confidence Analysis Modal */}
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

      {/* Compliance Detail Modal */}
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
                {flag.label === "PII Masked" && "Social Security numbers, DOBs, and member IDs masked in all AI processing pipelines."}
                {flag.label === "Audit Logged" && "Complete interaction audit trail maintained with timestamp, agent ID, and AI decision rationale."}
                {flag.label === "Escalation Policy" && (flag.ok ? "Confidence above threshold. Automated resolution permitted." : "Confidence below threshold. Escalation required per policy.")}
              </p>
            </div>
          ))}
        </div>
      </DetailModal>
    </div>
  );
}
