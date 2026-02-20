import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Zap, CheckCircle, Activity, Search, Calendar, ArrowRight, X, Clock, MapPin, Star, Stethoscope } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import penguinLogo from "@/assets/penguin-logo-pink.png";

interface ChatMessage {
  role: "member" | "ai";
  content: string;
  extras?: React.ReactNode;
}

const SIM_MESSAGES: { role: "member" | "ai"; text: string; delay: number }[] = [
  { role: "member", text: "I need a knee replacement. Can you help me understand costs?", delay: 0 },
  { role: "ai", text: "Absolutely! I'm pulling your plan details and checking in-network providers now…", delay: 1400 },
  { role: "member", text: "Is Dr. Martinez in my network?", delay: 3200 },
  { role: "ai", text: "Yes! Dr. Sarah Martinez at Valley Orthopedic Center is in-network. She has a 4.8★ rating with 12+ years of experience in total joint replacement.", delay: 4800 },
  { role: "member", text: "What's my out-of-pocket going to be?", delay: 7000 },
  { role: "ai", text: "Based on your remaining deductible of $650 and 20% coinsurance, your estimated out-of-pocket for in-network would be ~$7,762. You'll hit your OOP max at $8,000. Want me to schedule a consultation?", delay: 8800 },
];

const SIM_INTELLIGENCE: { label: string; value: string; delay: number }[] = [
  { label: "Intent Detected", value: "Benefit Inquiry → Cost Estimation", delay: 800 },
  { label: "Plan Loaded", value: "Blue Cross PPO Gold — Active", delay: 1600 },
  { label: "Provider Search", value: "In-Network Match Found", delay: 3600 },
  { label: "Cost Engine", value: "Accumulator + Coinsurance Calculated", delay: 7400 },
  { label: "Compliance", value: "HIPAA Verified • PHI Access Logged", delay: 8000 },
  { label: "Recommendation", value: "Schedule CTA Generated", delay: 9200 },
];

export function MemberBenefitAssistant() {
  const [simulating, setSimulating] = useState(false);
  const [simMessages, setSimMessages] = useState<ChatMessage[]>([]);
  const [intel, setIntel] = useState<{ label: string; value: string }[]>([]);
  const [simDone, setSimDone] = useState(false);

  const runSimulation = useCallback(() => {
    setSimulating(true);
    setSimMessages([]);
    setIntel([]);
    setSimDone(false);

    SIM_MESSAGES.forEach((msg) => {
      setTimeout(() => {
        setSimMessages((prev) => [...prev, { role: msg.role, content: msg.text }]);
      }, msg.delay);
    });

    SIM_INTELLIGENCE.forEach((item) => {
      setTimeout(() => {
        setIntel((prev) => [...prev, { label: item.label, value: item.value }]);
      }, item.delay);
    });

    setTimeout(() => {
      setSimDone(true);
      setTimeout(() => setSimulating(false), 500);
    }, 11000);
  }, []);

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
          {simulating ? "Running…" : "Simulate Portal Interaction"}
        </button>
      </div>

      {/* Static chat (when not simulating) */}
      {!simulating && !simDone && <StaticChat />}

      {/* Live simulation */}
      {(simulating || simDone) && (
        <div className="grid grid-cols-5 gap-3">
          {/* Chat panel */}
          <div className="col-span-3 rounded-2xl border border-border bg-card p-4 space-y-3 max-h-[340px] overflow-y-auto">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <MessageCircle className="h-3.5 w-3.5 text-[hsl(var(--opyn-purple))]" />
              <span className="text-xs font-medium">Live Conversation</span>
              {simulating && <span className="ml-auto flex items-center gap-1 text-[9px] text-[hsl(var(--opyn-green))]"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--opyn-green))] animate-pulse" /> Live</span>}
            </div>
            <div className="space-y-3">
              {simMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "member" ? "justify-end" : "gap-2"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  {msg.role === "ai" && <img src={penguinLogo} alt="AI" className="h-5 w-5 mt-1 object-contain" />}
                  <div className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] ${
                    msg.role === "member"
                      ? "bg-[hsl(var(--opyn-purple-light))] rounded-br-sm"
                      : "bg-[hsl(var(--opyn-green-light))] rounded-bl-sm"
                  }`}>
                    <p className="text-[11px] text-foreground">{msg.content}</p>
                    {msg.extras}
                  </div>
                </div>
              ))}
              {simulating && simMessages.length > 0 && simMessages[simMessages.length - 1].role === "member" && (
                <div className="flex gap-2">
                  <img src={penguinLogo} alt="AI" className="h-5 w-5 mt-1 object-contain" />
                  <div className="bg-[hsl(var(--opyn-green-light))] rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Intelligence feed */}
          <div className="col-span-2 rounded-2xl border border-[hsl(var(--opyn-purple)/0.3)] bg-[hsl(var(--opyn-purple-light))] p-4 space-y-2 max-h-[340px] overflow-y-auto">
            <p className="text-[10px] font-semibold text-[hsl(var(--opyn-purple))]">
              AI Orchestration Pipeline
            </p>
            {intel.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] animate-in fade-in slide-in-from-right-2 duration-300">
                <CheckCircle className="h-3 w-3 text-[hsl(var(--opyn-green))] mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-foreground">{item.label}</span>
                  <p className="text-muted-foreground">{item.value}</p>
                </div>
              </div>
            ))}
            {simulating && (
              <div className="flex items-center gap-2 text-[10px]">
                <Activity className="h-3 w-3 text-[hsl(var(--opyn-purple))] animate-pulse" />
                <span className="text-muted-foreground">Processing…</span>
              </div>
            )}
            {simDone && (
              <div className="mt-2 pt-2 border-t border-[hsl(var(--opyn-purple)/0.2)] space-y-1">
                <p className="text-[10px] font-semibold text-[hsl(var(--opyn-green))]">✓ Simulation Complete</p>
                <p className="text-[9px] text-muted-foreground">6 pipeline stages • 0 escalations • 98% confidence</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StaticChat() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <MessageCircle className="h-3.5 w-3.5 text-[hsl(var(--opyn-purple))]" />
        <span className="text-xs font-medium">Help with my benefits</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="bg-[hsl(var(--opyn-purple-light))] rounded-2xl rounded-br-sm px-3.5 py-2.5 max-w-[85%]">
            <p className="text-[11px] text-foreground">Have I met my deductible? What will I pay for a knee replacement?</p>
          </div>
        </div>
        <div className="flex gap-2">
          <img src={penguinLogo} alt="AI" className="h-6 w-6 mt-1 object-contain" />
          <div className="bg-[hsl(var(--opyn-green-light))] rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[85%] space-y-2">
            <p className="text-[11px] text-foreground">Great question! Based on your Blue Cross PPO plan, here's your current status:</p>
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
              <p className="text-[10px] text-muted-foreground">Plan: Blue Cross PPO Gold • Network: First Health • Eff: 01/01/2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
