import { useSimulation } from "@/contexts/SimulationContext";
import { useDashboard } from "@/contexts/DashboardContext";
import penguinLogo from "@/assets/penguin-ai-logo.png";
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

  const suggestedResponse = activeEvent
    ? `Based on policy section 7.4, the ${activeEvent.reason.toLowerCase()} for ${activeEvent.payer} is confirmed. ${
        activeEvent.status === "ai-routed" || activeEvent.status === "resolved"
          ? "No further action needed."
          : "Recommend agent review for edge case."
      }`
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
          <img src={penguinLogo} alt="Penguin AI" className="h-3.5" />
          <span className="text-[10px] font-semibold text-foreground">Penguin AI Orchestration</span>
        </div>
        <span className="text-[8px] text-five9-muted">Powered by Penguin AI</span>
      </div>

      {/* Pipeline */}
      <div className="five9-card p-2.5 space-y-2">
        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">
          Processing Pipeline
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

      {/* Confidence */}
      <div className="five9-card p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">Confidence</span>
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
      </div>

      {/* Suggested Response */}
      {activeEvent && (
        <div className="five9-card p-2.5 space-y-2 five9-active-border">
          <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">
            Recommended Response
          </div>
          <p className="text-[11px] text-foreground leading-relaxed">{suggestedResponse}</p>
          <button className="w-full py-1.5 rounded text-[10px] font-medium five9-accent-bg text-white transition-opacity hover:opacity-90">
            Auto-populate Draft
          </button>
        </div>
      )}

      {/* Compliance */}
      <div className="five9-card p-2.5 space-y-2">
        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">
          Real-time Compliance
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
      </div>

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
    </div>
  );
}
