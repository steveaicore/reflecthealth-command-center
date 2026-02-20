import { useState, useEffect } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { useDashboard } from "@/contexts/DashboardContext";
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

export function Five9AIPanel() {
  const { pipeline, events } = useSimulation();
  const { callParams } = useDashboard();
  const activeEvent = events[0];
  const [draftPopulated, setDraftPopulated] = useState(false);
  const [confidenceModalOpen, setConfidenceModalOpen] = useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [draftSent, setDraftSent] = useState(false);

  // Reset draft state when active event changes
  useEffect(() => {
    setDraftPopulated(false);
    setDraftSent(false);
  }, [activeEvent?.id]);

  const REASON_RESPONSES: Record<string, string> = {
    "Benefits Verification": `Member is active under ${activeEvent?.payer || "BCBS"} PPO. In-network specialist copay is $30. Deductible: $1,112 of $1,500 met (74%). No balance issues. Coverage confirmed through 12/31/2026.`,
    "Eligibility Inquiry": `Eligibility confirmed for ${activeEvent?.payer || "BCBS"}. Plan status: Active. Effective date: 01/01/2026. PCP assignment on file. No lapse in coverage detected.`,
    "Claim Status": `Claim processed and paid on 2/12/2026. Allowed amount: $285.00. ${activeEvent?.payer || "BCBS"} paid $228.00 (80%). Member responsibility: $57.00 copay. EOB mailed 2/14/2026.`,
    "Prior Authorization Verification": `PA #PA-2026-44821 approved for CPT 27447. Valid through 04/15/2026. In-network facility required. No step therapy needed. Member cost share: $8,000 estimated OOP.`,
    "Coordination of Benefits Verification": `COB verified. Primary: ${activeEvent?.payer || "BCBS"}. Secondary: Medicare Part B. Primary pays 80% of allowed amount. Submit EOB to secondary for remaining balance.`,
    "Referral Validation": `Referral #RF-8821 on file from PCP Dr. Martinez. Valid for 3 specialist visits through 06/30/2026. In-network orthopedic providers only. No additional referral needed.`,
    "Appeal Status Inquiry": `Appeal #AP-2026-1193 received 2/10/2026. Currently under medical director review. Expected determination by 2/25/2026. Original denial reason: CO-18 (Duplicate Claim).`,
    "Timely Filing Question": `Timely filing limit for ${activeEvent?.payer || "BCBS"}: 180 days from date of service. Claims submitted after deadline require written exception with supporting documentation.`,
    "Claim Reprocessing Request": `Claim reprocessing initiated for #CLM-4821. Original denial: incorrect modifier. Corrected claim submitted with modifier -59. Expected turnaround: 5-7 business days.`,
    "Claims Status": `Your claim for date of service 1/28/2026 has been processed. ${activeEvent?.payer || "BCBS"} paid $195.00. Your responsibility: $30.00 copay. Payment issued to provider on 2/10/2026.`,
    "ID Card Request": `New ID card has been ordered and will arrive within 5-7 business days. In the meantime, a digital ID card is available in the ${activeEvent?.payer || "BCBS"} member portal and mobile app.`,
    "Deductible / OOP Balance Inquiry": `Current deductible status: $1,112 of $1,500 met (74%). Out-of-pocket maximum: $2,840 of $6,500 applied (44%). All amounts reflect claims processed through today.`,
    "Pharmacy Coverage Question": `Prescription is covered under your ${activeEvent?.payer || "BCBS"} formulary. Tier 2 — Preferred Brand. Copay: $35 for 30-day supply. Mail order (90-day): $70. No prior auth required.`,
  };

  const suggestedResponse = activeEvent
    ? REASON_RESPONSES[activeEvent.reason] || `Based on policy guidelines, the ${activeEvent.reason.toLowerCase()} request for ${activeEvent.payer} has been verified. All documentation is in order. No further action required.`
    : "";

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
          <span className="text-[10px] font-semibold text-foreground">Penguin AI Orchestration</span>
        </div>
        <span className="text-[8px] text-five9-muted">Powered by Penguin AI</span>
      </div>

      {/* Pipeline */}
      <div className="five9-card p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <img src={penguinLogo} alt="Penguin AI" className="h-3 w-3 object-contain" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">
            Processing Pipeline
          </span>
        </div>
        <div className="flex items-center gap-1">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-1">
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-all duration-300 ${
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
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">Confidence</span>
          </div>
          <span className={`text-sm font-bold font-mono ${
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
      {activeEvent && (
        <div className="five9-card p-2.5 space-y-2 five9-active-border">
          <div className="flex items-center gap-1.5">
            <img src={penguinLogo} alt="Penguin AI" className="h-4 w-4 object-contain" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">
              Recommended Response
            </span>
          </div>
          <p className="text-[11px] text-foreground leading-relaxed">{suggestedResponse}</p>
        </div>
      )}


      <button
        onClick={() => setComplianceModalOpen(true)}
        className="five9-card p-2.5 space-y-2 w-full text-left hover:border-five9-accent/30 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <img src={penguinLogo} alt="Penguin AI" className="h-3 w-3 object-contain" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">
            Real-time Compliance
          </span>
        </div>
        <div className="space-y-1">
          {complianceFlags.map((flag) => (
            <div key={flag.label} className="flex items-center gap-1.5 text-[10px]">
              {flag.ok ? (
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              ) : (
                <AlertCircle className="h-3 w-3 text-amber-500" />
              )}
              <span className={flag.ok ? "text-foreground" : "text-amber-600"}>{flag.label}</span>
            </div>
          ))}
        </div>
      </button>

      {/* Escalation Detection */}
      {activeEvent && pipeline.outcome === "Escalated" && (
        <div className="five9-card p-2.5 border-amber-500/30 bg-amber-50 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700">
            <AlertCircle className="h-3 w-3" />
            Escalation Detected
          </div>
          <p className="text-[10px] text-amber-600">
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
