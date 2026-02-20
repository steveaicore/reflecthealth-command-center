import { useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { Monitor, User, Building2, Activity, CheckCircle, Phone } from "lucide-react";
import penguinLogo from "@/assets/penguin-logo-pink.png";
import { MemberBenefitAssistant } from "./MemberBenefitAssistant";
import { CostTransparencyPanel } from "./CostTransparencyPanel";
import { ProviderPortalView } from "./ProviderPortalView";

type OpynMode = "member" | "provider";

function OrchestrationSidebar() {
  const metrics = [
    { label: "Member Inquiries Resolved", value: "72%", sub: "automated" },
    { label: "Provider Eligibility Checks", value: "85%", sub: "automated" },
    { label: "Call Deflection Impact", value: "-31%", sub: "vs. baseline" },
    { label: "Escalations Prevented", value: "+24%", sub: "improvement" },
    { label: "Annualized Cost Impact", value: "$1.2M", sub: "savings" },
  ];

  return (
    <div className="w-64 border-l border-border bg-card p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-[hsl(var(--opyn-purple))]" />
        <h3 className="text-[11px] font-semibold">AI Orchestration Activity</h3>
      </div>
      <p className="text-[9px] text-muted-foreground -mt-2">Portal Automation Metrics</p>

      <div className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border p-3 space-y-1">
            <p className="text-[9px] text-muted-foreground font-medium">{m.label}</p>
            <p className="text-lg font-bold font-mono text-foreground">{m.value}</p>
            <p className="text-[9px] text-muted-foreground">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <p className="text-[9px] font-semibold text-muted-foreground">COMPLIANCE</p>
        {["HIPAA Check: Passed", "Data Access: Logged", "Transcript: Stored", "Decision Tree: Logged"].map((item) => (
          <div key={item} className="flex items-center gap-1.5 text-[10px]">
            <CheckCircle className="h-3 w-3 text-[hsl(var(--opyn-green))]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpynHealthLayout() {
  const { setDeploymentMode } = useDashboard();
  const [portalMode, setPortalMode] = useState<OpynMode>("member");

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--opyn-bg))]">
      {/* Header */}
      <header className="px-5 py-3 flex items-center justify-between border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--opyn-green))] to-[hsl(var(--opyn-purple))] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">O</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Opyn Health Portal</h1>
              <p className="text-[9px] text-muted-foreground">Powered by Penguin AI Orchestration</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Member / Provider toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setPortalMode("member")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                portalMode === "member"
                  ? "bg-[hsl(var(--opyn-green))] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-3 w-3" />
              Member Mode
            </button>
            <button
              onClick={() => setPortalMode("provider")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                portalMode === "provider"
                  ? "bg-[hsl(var(--opyn-purple))] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-3 w-3" />
              Provider Mode
            </button>
          </div>

          <div className="h-5 w-px bg-border" />

          <button
            onClick={() => setDeploymentMode("white-label")}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Monitor className="h-2.5 w-2.5" />
            White-Label
          </button>
          <button
            onClick={() => setDeploymentMode("embedded")}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-2.5 w-2.5" />
            Five9 Voice
          </button>

          <img src={penguinLogo} alt="Penguin AI" className="h-5 object-contain opacity-40" />
        </div>
      </header>

      {/* Subtitle bar */}
      <div className="px-5 py-2 border-b border-border bg-gradient-to-r from-[hsl(var(--opyn-purple-light))] to-[hsl(var(--opyn-green-light))]">
        <p className="text-[10px] font-medium text-[hsl(var(--opyn-purple))]">
          Embedded AI Orchestration Layer for Member & Provider Experience
        </p>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-5">
          {portalMode === "member" ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <MemberBenefitAssistant />
              <CostTransparencyPanel />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <ProviderPortalView />
            </div>
          )}
        </main>
        <OrchestrationSidebar />
      </div>
    </div>
  );
}
