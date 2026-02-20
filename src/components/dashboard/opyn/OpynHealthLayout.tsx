import { useState } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { Monitor, User, Building2, MessageCircle, Search, Shield, Activity, ChevronRight, CheckCircle, AlertTriangle, Zap, Phone } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import penguinLogo from "@/assets/penguin-logo-pink.png";

type OpynMode = "member" | "provider";

function MemberBenefitAssistant() {
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);

  const runSimulation = () => {
    setSimulating(true);
    setSimStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setSimStep(step);
      if (step >= 4) {
        clearInterval(interval);
        setTimeout(() => setSimulating(false), 2000);
      }
    }, 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Member Benefit Assistant</h2>
          <p className="text-[10px] text-muted-foreground">AI-Driven Benefit Guidance</p>
        </div>
        <button
          onClick={runSimulation}
          disabled={simulating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg bg-[hsl(var(--opyn-purple))] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Zap className="h-3 w-3" />
          Simulate Portal Interaction
        </button>
      </div>

      {/* Chat simulation */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <MessageCircle className="h-3.5 w-3.5 text-[hsl(var(--opyn-purple))]" />
          <span className="text-xs font-medium">Help with my benefits</span>
        </div>

        <div className="space-y-3">
          {/* Member message */}
          <div className="flex justify-end">
            <div className="bg-[hsl(var(--opyn-purple-light))] rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[85%]">
              <p className="text-[11px] text-foreground">
                Have I met my deductible? What will I pay for a knee replacement?
              </p>
            </div>
          </div>

          {/* AI response */}
          <div className="flex gap-2">
            <img src={penguinLogo} alt="AI" className="h-5 w-5 mt-1 rounded-full" />
            <div className="bg-[hsl(var(--opyn-green-light))] rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[85%] space-y-2">
              <p className="text-[11px] text-foreground">
                Great question! Based on your Blue Cross PPO plan, here's your current status:
              </p>
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">Individual Deductible</span>
                    <span className="font-semibold">$1,850 / $2,500</span>
                  </div>
                  <Progress value={74} className="h-1.5 bg-[hsl(var(--opyn-green-light))]" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">Out-of-Pocket Max</span>
                    <span className="font-semibold">$3,200 / $8,000</span>
                  </div>
                  <Progress value={40} className="h-1.5 bg-[hsl(var(--opyn-green-light))]" />
                </div>
              </div>
              <div className="pt-1 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground">
                  Plan: Blue Cross PPO Gold • Network: First Health • Eff: 01/01/2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation overlay */}
      {simulating && (
        <div className="rounded-2xl border border-[hsl(var(--opyn-purple)/0.3)] bg-[hsl(var(--opyn-purple-light))] p-4 space-y-2">
          <p className="text-[10px] font-semibold text-[hsl(var(--opyn-purple))]">
            Simulating Portal Interaction…
          </p>
          {["Member asks question", "AI processes intent & validates policy", "Coverage data retrieved from backend", "Personalized response delivered"].map((step, i) => (
            <div key={i} className={`flex items-center gap-2 text-[10px] transition-opacity duration-500 ${simStep >= i ? "opacity-100" : "opacity-30"}`}>
              {simStep > i ? (
                <CheckCircle className="h-3 w-3 text-[hsl(var(--opyn-green))]" />
              ) : simStep === i ? (
                <Activity className="h-3 w-3 text-[hsl(var(--opyn-purple))] animate-pulse" />
              ) : (
                <div className="h-3 w-3 rounded-full border border-border" />
              )}
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CostTransparencyPanel() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Cost Transparency & Provider Search</h2>
        <p className="text-[10px] text-muted-foreground">Total Knee Replacement — Procedure Comparison</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* In-Network */}
        <div className="rounded-2xl border-2 border-[hsl(var(--opyn-green)/0.4)] bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[hsl(var(--opyn-green))] bg-[hsl(var(--opyn-green-light))] px-2 py-0.5 rounded-full">In-Network</span>
            <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--opyn-green))]" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-foreground">$35,562</p>
            <p className="text-[10px] text-muted-foreground">Facility + Surgeon + Anesthesia</p>
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-[10px] text-muted-foreground">Your Estimated Cost</p>
            <p className="text-lg font-bold text-[hsl(var(--opyn-green))] font-mono">$8,000</p>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <img src={penguinLogo} alt="" className="h-3 w-3" />
            <span className="text-[9px] font-medium text-[hsl(var(--opyn-purple))]">AI Recommended Provider</span>
          </div>
          <button className="w-full py-2 text-[11px] font-semibold rounded-lg bg-[hsl(var(--opyn-green))] text-white hover:opacity-90 transition-opacity">
            Schedule Appointment
          </button>
        </div>

        {/* Out-of-Network */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 opacity-80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.1)] px-2 py-0.5 rounded-full">Out-of-Network</span>
            <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-foreground">$54,232</p>
            <p className="text-[10px] text-muted-foreground">Facility + Surgeon + Anesthesia</p>
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-[10px] text-muted-foreground">Your Estimated Cost</p>
            <p className="text-lg font-bold text-[hsl(var(--accent))] font-mono">$44,502</p>
          </div>
          <div className="pt-1">
            <span className="text-[9px] text-muted-foreground">Higher out-of-pocket expense</span>
          </div>
          <button className="w-full py-2 text-[11px] font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
            View Details
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 justify-center">
        <img src={penguinLogo} alt="" className="h-3 w-3 opacity-60" />
        <span className="text-[9px] text-muted-foreground">Orchestrated by Penguin AI</span>
      </div>
    </div>
  );
}

function ProviderPortalView() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Provider Eligibility Verification</h2>
        <p className="text-[10px] text-muted-foreground">Real-time coverage confirmation</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <span className="text-muted-foreground text-[10px]">Member ID</span>
            <p className="font-mono font-semibold">BCX-8847291</p>
          </div>
          <div>
            <span className="text-muted-foreground text-[10px]">Plan</span>
            <p className="font-semibold">Blue Cross PPO Gold</p>
          </div>
          <div>
            <span className="text-muted-foreground text-[10px]">Network</span>
            <p className="font-semibold">First Health</p>
          </div>
          <div>
            <span className="text-muted-foreground text-[10px]">Effective Dates</span>
            <p className="font-semibold">01/01/2026 – 12/31/2026</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <span className="text-[10px] font-semibold text-[hsl(var(--opyn-green))] bg-[hsl(var(--opyn-green-light))] px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Coverage Active
          </span>
        </div>
      </div>

      {/* Prior Auth & Claims */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground">Prior Authorization</p>
          <p className="text-xs font-semibold text-[hsl(var(--opyn-green))]">Approved</p>
          <p className="text-[10px] text-muted-foreground">Auth #PA-44821 • Exp 03/15/2026</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground">Claims Status</p>
          <p className="text-xs font-semibold text-[hsl(var(--opyn-purple))]">Processing</p>
          <p className="text-[10px] text-muted-foreground">Claim #CLM-90124 • Est. 5 days</p>
        </div>
      </div>

      {/* AI Validation badge */}
      <div className="rounded-2xl border border-[hsl(var(--opyn-purple)/0.2)] bg-[hsl(var(--opyn-purple-light))] p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={penguinLogo} alt="" className="h-4 w-4" />
          <div>
            <p className="text-[10px] font-semibold">AI Pre-Validated Response</p>
            <p className="text-[9px] text-muted-foreground">Confidence: 98% • Escalation: Not Required</p>
          </div>
        </div>
        <Shield className="h-4 w-4 text-[hsl(var(--opyn-purple))]" />
      </div>
    </div>
  );
}

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

          <img src={penguinLogo} alt="Penguin AI" className="h-4 opacity-40" />
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
