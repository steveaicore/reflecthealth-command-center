import { useState } from "react";
import { type UseCaseProfile } from "./useCaseProfiles";
import {
  CheckCircle2, Copy, ArrowRight, FileText, Shield, Sparkles, BarChart3,
  AlertTriangle, ChevronDown, ChevronUp, Zap
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PanelProps {
  profile: UseCaseProfile;
}

/* ── Panel A: Recommended Next Actions ── */
export function RecommendedActionsPanel({ profile }: PanelProps) {
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());

  const handleApply = (title: string) => {
    setAppliedActions(prev => new Set(prev).add(title));
    toast({ title: "Action applied", description: `"${title}" has been executed.` });
  };

  return (
    <div className="five9-card p-2.5 space-y-1.5 animate-fade-in">
      <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
        <Zap className="h-3 w-3" /> Recommended Actions
      </span>
      <div className="space-y-1">
        {profile.recommendedActions.map((action) => {
          const isApplied = appliedActions.has(action.title);
          return (
            <div key={action.title} className={`p-2 rounded border transition-all ${
              isApplied ? "bg-emerald-500/5 border-emerald-500/20" : "bg-secondary/30 border-border hover:border-primary/20"
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-foreground block">{action.title}</span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">{action.why}</span>
                  {action.requiredFields.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {action.requiredFields.map(f => (
                        <span key={f} className="text-[8px] px-1 py-0.5 rounded bg-secondary text-muted-foreground">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleApply(action.title)}
                  disabled={isApplied}
                  className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-semibold transition-colors ${
                    isApplied
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "five9-accent-bg text-white hover:opacity-90"
                  }`}
                >
                  {isApplied ? "✓ Applied" : "Apply"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Panel B: Policy + Knowledge Snippets ── */
export function PolicySnippetsPanel({ profile }: PanelProps) {
  return (
    <div className="five9-card p-2.5 space-y-1.5 animate-fade-in">
      <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
        <FileText className="h-3 w-3" /> Policy & Knowledge
      </span>
      <div className="space-y-1.5">
        {profile.policySnippets.map((snippet) => (
          <div key={snippet.title} className="p-2 rounded border border-border bg-secondary/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-foreground">{snippet.title}</span>
              <span className="text-[9px] font-mono text-primary font-semibold">{snippet.confidence}%</span>
            </div>
            <p className="text-[9px] text-muted-foreground leading-relaxed">{snippet.content}</p>
            <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-border/50">
              <span className="text-[8px] text-muted-foreground font-mono">Source: {snippet.source}</span>
              <span className="text-[8px] text-muted-foreground">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Panel C: Script + Compliance ── */
export function ScriptCompliancePanel({ profile }: PanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = [
      `Opening: ${profile.scriptTemplate.opening}`,
      ...profile.scriptTemplate.probingQuestions.map((q, i) => `Q${i + 1}: ${q}`),
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: "Copied to clipboard", description: "Script template copied." });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="five9-card p-2.5 space-y-1.5 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
          <Shield className="h-3 w-3" /> Script & Compliance
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy className="h-2.5 w-2.5" />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Opening */}
      <div className="p-2 rounded bg-primary/5 border border-primary/10">
        <span className="text-[9px] font-semibold text-primary uppercase">Opening Script</span>
        <p className="text-[10px] text-foreground mt-0.5 leading-relaxed">{profile.scriptTemplate.opening}</p>
      </div>

      {/* Probing questions */}
      <div className="space-y-0.5">
        <span className="text-[9px] font-semibold text-muted-foreground uppercase">Probing Questions</span>
        {profile.scriptTemplate.probingQuestions.map((q, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[10px] text-foreground pl-1">
            <span className="text-primary font-mono shrink-0">{i + 1}.</span>
            <span>{q}</span>
          </div>
        ))}
      </div>

      {/* Compliance phrasing */}
      <div className="space-y-1">
        <span className="text-[9px] font-semibold text-muted-foreground uppercase">Compliance Phrasing</span>
        {profile.scriptTemplate.compliancePhrasing.map((cp, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-start gap-1 text-[9px]">
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-emerald-700">{cp.compliant}</span>
            </div>
            <div className="flex items-start gap-1 text-[9px]">
              <AlertTriangle className="h-2.5 w-2.5 text-red-500 shrink-0 mt-0.5" />
              <span className="text-red-600 line-through opacity-70">{cp.avoid}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Guardrails */}
      {profile.guardrails.length > 0 && (
        <div className="pt-1 border-t border-border/50 space-y-0.5">
          <span className="text-[9px] font-semibold text-muted-foreground uppercase">Guardrails</span>
          {profile.guardrails.map((g) => (
            <div key={g.label} className="flex items-center gap-1 text-[9px]">
              <div className={`w-1.5 h-1.5 rounded-full ${
                g.type === "must_escalate" ? "bg-amber-500" : g.type === "phi_warning" ? "bg-red-500" : "bg-emerald-500"
              }`} />
              <span className="text-muted-foreground">{g.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Panel D: Workflow Timeline ── */
export function WorkflowTimelinePanel({ profile, currentStep }: PanelProps & { currentStep: number }) {
  return (
    <div className="five9-card p-2.5 space-y-1.5 animate-fade-in">
      <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
        <Sparkles className="h-3 w-3" /> Workflow Timeline
      </span>
      <div className="flex items-center gap-0.5 flex-wrap">
        {profile.workflowSteps.map((step, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          const isRequired = step.required;
          return (
            <div key={step.id} className="flex items-center gap-0.5 shrink-0">
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all duration-300 ${
                isActive
                  ? "five9-accent-bg text-white animate-pulse"
                  : isCompleted
                    ? "five9-accent-bg text-white"
                    : isRequired
                      ? "bg-secondary text-foreground"
                      : "bg-secondary/50 text-muted-foreground"
              }`}>
                {isCompleted && <CheckCircle2 className="h-2.5 w-2.5" />}
                <span>{step.label}</span>
                {!isRequired && <span className="text-[7px] opacity-60">(opt)</span>}
              </div>
              {i < profile.workflowSteps.length - 1 && (
                <ArrowRight className={`h-2 w-2 ${isCompleted ? "text-five9-accent" : "text-muted-foreground/30"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Panel E: KPI Impact ── */
export function KPIImpactPanel({ profile }: PanelProps) {
  const kpi = profile.kpiProjections;
  return (
    <div className="five9-card p-2.5 space-y-1.5 animate-fade-in">
      <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
        <BarChart3 className="h-3 w-3" /> Projected KPI Impact
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: "AHT Reduction", value: `${kpi.ahtReductionPct}%`, color: "text-primary" },
          { label: "FCR Improvement", value: `${kpi.fcrImprovementPct}%`, color: "text-emerald-600" },
          { label: "Compliance Coverage", value: `${kpi.complianceCoveragePct}%`, color: "text-foreground" },
          { label: "Cost/Call Savings", value: `$${kpi.costPerCallReduction.toFixed(2)}`, color: "text-primary" },
        ].map((item) => (
          <div key={item.label} className="p-1.5 rounded bg-secondary/30 border border-border text-center">
            <div className={`text-[14px] font-bold font-mono ${item.color}`}>{item.value}</div>
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Combined Agent Assist Panel ── */
export function AgentAssistPanels({ profile, currentWorkflowStep }: { profile: UseCaseProfile; currentWorkflowStep: number }) {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  const panels = [
    { id: "actions", label: "Actions", component: <RecommendedActionsPanel profile={profile} /> },
    { id: "policy", label: "Policy", component: <PolicySnippetsPanel profile={profile} /> },
    { id: "script", label: "Script", component: <ScriptCompliancePanel profile={profile} /> },
    { id: "workflow", label: "Workflow", component: <WorkflowTimelinePanel profile={profile} currentStep={currentWorkflowStep} /> },
    { id: "kpi", label: "KPI", component: <KPIImpactPanel profile={profile} /> },
  ];

  return (
    <div className="space-y-1.5">
      {/* Quick tabs */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {panels.map((p) => (
          <button
            key={p.id}
            onClick={() => setExpandedPanel(expandedPanel === p.id ? null : p.id)}
            className={`px-2 py-0.5 text-[9px] font-semibold rounded transition-colors ${
              expandedPanel === p.id
                ? "five9-accent-bg text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setExpandedPanel(expandedPanel === "all" ? null : "all")}
          className={`px-2 py-0.5 text-[9px] font-semibold rounded transition-colors ${
            expandedPanel === "all"
              ? "five9-accent-bg text-white"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
      </div>

      {/* Render panels */}
      {expandedPanel === "all" ? (
        panels.map((p) => <div key={p.id}>{p.component}</div>)
      ) : expandedPanel ? (
        panels.find(p => p.id === expandedPanel)?.component
      ) : (
        /* Default: show workflow + actions */
        <>
          <WorkflowTimelinePanel profile={profile} currentStep={currentWorkflowStep} />
          <RecommendedActionsPanel profile={profile} />
        </>
      )}
    </div>
  );
}
