import { useState } from "react";
import { CheckCircle, Shield, Search, Activity, FileText, Clock, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import penguinLogo from "@/assets/penguin-logo-pink.png";

export function ProviderPortalView() {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(true);
  const [claimLookup, setClaimLookup] = useState(false);
  const [claimStep, setClaimStep] = useState(0);
  const [priorAuthFlow, setPriorAuthFlow] = useState(false);
  const [authStep, setAuthStep] = useState(0);

  const runVerification = () => {
    setVerifying(true);
    setVerified(false);
    setTimeout(() => {
      setVerified(true);
      setVerifying(false);
    }, 2000);
  };

  const runClaimLookup = () => {
    setClaimLookup(true);
    setClaimStep(0);
    let s = 0;
    const iv = setInterval(() => {
      s++;
      setClaimStep(s);
      if (s >= 4) clearInterval(iv);
    }, 700);
  };

  const runPriorAuth = () => {
    setPriorAuthFlow(true);
    setAuthStep(0);
    let s = 0;
    const iv = setInterval(() => {
      s++;
      setAuthStep(s);
      if (s >= 5) clearInterval(iv);
    }, 600);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Provider Eligibility Verification</h2>
          <p className="text-[10px] text-muted-foreground">Real-time coverage confirmation</p>
        </div>
        <button
          onClick={runVerification}
          disabled={verifying}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg bg-[hsl(var(--opyn-purple))] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${verifying ? "animate-spin" : ""}`} />
          {verifying ? "Verifying…" : "Re-Verify Eligibility"}
        </button>
      </div>

      {/* Member info card */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div><span className="text-muted-foreground text-[10px]">Member ID</span><p className="font-mono font-semibold">BCX-8847291</p></div>
          <div><span className="text-muted-foreground text-[10px]">Plan</span><p className="font-semibold">Blue Cross PPO Gold</p></div>
          <div><span className="text-muted-foreground text-[10px]">Network</span><p className="font-semibold">First Health</p></div>
          <div><span className="text-muted-foreground text-[10px]">Effective Dates</span><p className="font-semibold">01/01/2026 – 12/31/2026</p></div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          {verifying ? (
            <span className="text-[10px] font-semibold text-[hsl(var(--opyn-purple))] bg-[hsl(var(--opyn-purple-light))] px-2.5 py-1 rounded-full flex items-center gap-1">
              <Activity className="h-3 w-3 animate-pulse" />
              Verifying…
            </span>
          ) : verified ? (
            <span className="text-[10px] font-semibold text-[hsl(var(--opyn-green))] bg-[hsl(var(--opyn-green-light))] px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Coverage Active
            </span>
          ) : null}
          <span className="text-[9px] text-muted-foreground ml-auto">Last checked: just now</span>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground">Prior Authorization</p>
            <button onClick={runPriorAuth} className="text-[9px] text-[hsl(var(--opyn-purple))] hover:underline">Submit New</button>
          </div>
          <p className="text-xs font-semibold text-[hsl(var(--opyn-green))]">Approved</p>
          <p className="text-[10px] text-muted-foreground">Auth #PA-44821 • Exp 03/15/2026</p>
          {priorAuthFlow && (
            <div className="mt-2 pt-2 border-t border-border space-y-1.5">
              <p className="text-[9px] font-semibold text-[hsl(var(--opyn-purple))]">New PA Submission</p>
              {["Validating CPT codes…", "Checking medical necessity…", "Reviewing plan guidelines…", "Submitting to payer…", "Authorization approved"].map((s, i) => (
                <div key={i} className={`flex items-center gap-1.5 text-[9px] transition-opacity duration-300 ${authStep >= i ? "opacity-100" : "opacity-30"}`}>
                  {authStep > i ? <CheckCircle className="h-2.5 w-2.5 text-[hsl(var(--opyn-green))]" /> : authStep === i ? <div className="h-2.5 w-2.5 rounded-full border border-[hsl(var(--opyn-purple))] border-t-transparent animate-spin" /> : <div className="h-2.5 w-2.5 rounded-full border border-border" />}
                  <span>{s}</span>
                </div>
              ))}
              {authStep >= 5 && <p className="text-[9px] font-semibold text-[hsl(var(--opyn-green))]">✓ PA-44823 Approved</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground">Claims Status</p>
            <button onClick={runClaimLookup} className="text-[9px] text-[hsl(var(--opyn-purple))] hover:underline">Look Up</button>
          </div>
          <p className="text-xs font-semibold text-[hsl(var(--opyn-purple))]">Processing</p>
          <p className="text-[10px] text-muted-foreground">Claim #CLM-90124 • Est. 5 days</p>
          {claimLookup && (
            <div className="mt-2 pt-2 border-t border-border space-y-1.5">
              <p className="text-[9px] font-semibold text-[hsl(var(--opyn-purple))]">Claim Trace</p>
              {["Claim received by payer", "Initial review complete", "Medical review in progress", "Adjudication pending"].map((s, i) => (
                <div key={i} className={`flex items-center gap-1.5 text-[9px] transition-opacity duration-300 ${claimStep >= i ? "opacity-100" : "opacity-30"}`}>
                  {claimStep > i ? <CheckCircle className="h-2.5 w-2.5 text-[hsl(var(--opyn-green))]" /> : claimStep === i ? <div className="h-2.5 w-2.5 rounded-full border border-[hsl(var(--opyn-purple))] border-t-transparent animate-spin" /> : <div className="h-2.5 w-2.5 rounded-full border border-border" />}
                  <span>{s}</span>
                </div>
              ))}
              {claimStep >= 4 && (
                <div className="rounded-lg bg-[hsl(var(--opyn-green-light))] p-2 mt-1">
                  <p className="text-[9px] font-semibold text-[hsl(var(--opyn-green))]">Est. Payment: $27,562</p>
                  <p className="text-[8px] text-muted-foreground">Expected disbursement: 5 business days</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Validation badge */}
      <div className="rounded-2xl border border-[hsl(var(--opyn-purple)/0.2)] bg-[hsl(var(--opyn-purple-light))] p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={penguinLogo} alt="" className="h-5 w-5 object-contain" />
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
