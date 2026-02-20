import { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, Zap, CheckCircle, Activity, Volume2, Headphones } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import penguinLogo from "@/assets/penguin-logo-pink.png";
import { useAudioEngine } from "@/contexts/AudioEngineContext";

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

const VOICE_STEPS = [
  { text: "Welcome to your Opyn Health benefit assistant.", voiceId: "EXAVITQu4vr4xnSDxMaL", highlight: null },
  { text: "Based on your Blue Cross PPO Gold plan, you have met seventy-four percent of your deductible.", voiceId: "EXAVITQu4vr4xnSDxMaL", highlight: "deductible" },
  { text: "If you choose an in-network surgical center of excellence, your estimated out-of-pocket cost is eight thousand dollars.", voiceId: "EXAVITQu4vr4xnSDxMaL", highlight: "network" },
  { text: "This provider is AI recommended based on cost, quality, and network alignment.", voiceId: "EXAVITQu4vr4xnSDxMaL", highlight: "provider" },
  { text: "All eligibility and cost validation has been pre-confirmed.", voiceId: "EXAVITQu4vr4xnSDxMaL", highlight: "compliance" },
];

export function MemberBenefitAssistant() {
  const [simulating, setSimulating] = useState(false);
  const [simMessages, setSimMessages] = useState<ChatMessage[]>([]);
  const [intel, setIntel] = useState<{ label: string; value: string }[]>([]);
  const [simDone, setSimDone] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceStep, setVoiceStep] = useState(-1);
  const [highlight, setHighlight] = useState<string | null>(null);
  const audioEngine = useAudioEngine();
  const voiceCancelled = useRef(false);

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

  const runVoiceWalkthrough = useCallback(async () => {
    voiceCancelled.current = false;
    setVoiceActive(true);
    setVoiceStep(-1);
    setHighlight(null);

    for (let i = 0; i < VOICE_STEPS.length; i++) {
      if (voiceCancelled.current) break;
      const step = VOICE_STEPS[i];
      setVoiceStep(i);
      setHighlight(step.highlight);
      try {
        await audioEngine.playTTS(step.text, step.voiceId, 0.6);
      } catch {
        // TTS failed, continue with delays
        await new Promise(r => setTimeout(r, 2500));
      }
      if (voiceCancelled.current) break;
      await new Promise(r => setTimeout(r, 400));
    }

    setVoiceActive(false);
    setVoiceStep(-1);
    setHighlight(null);
  }, [audioEngine]);

  const stopVoice = useCallback(() => {
    voiceCancelled.current = true;
    audioEngine.stopAudio();
    setVoiceActive(false);
    setVoiceStep(-1);
    setHighlight(null);
  }, [audioEngine]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Member Benefit Assistant</h2>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-muted-foreground">AI-Driven Benefit Guidance</p>
            {voiceActive && (
              <span className="flex items-center gap-1 text-[9px] font-medium text-[hsl(var(--opyn-purple))] bg-[hsl(var(--opyn-purple-light))] px-2 py-0.5 rounded-full">
                <Headphones className="h-2.5 w-2.5" />
                AI Guided Experience
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={voiceActive ? stopVoice : runVoiceWalkthrough}
            disabled={simulating}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg transition-all disabled:opacity-50 ${
              voiceActive
                ? "bg-[hsl(var(--opyn-purple))] text-white animate-pulse"
                : "border border-[hsl(var(--opyn-purple)/0.3)] text-[hsl(var(--opyn-purple))] hover:bg-[hsl(var(--opyn-purple-light))]"
            }`}
          >
            <Volume2 className="h-3 w-3" />
            {voiceActive ? "Stop Voice" : "Voice Walkthrough"}
          </button>
          <button
            onClick={runSimulation}
            disabled={simulating || voiceActive}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg bg-[hsl(var(--opyn-purple))] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Zap className="h-3 w-3" />
            {simulating ? "Running…" : "Simulate Portal Interaction"}
          </button>
        </div>
      </div>

      {/* Static chat (when not simulating) */}
      {!simulating && !simDone && <StaticChat highlight={highlight} voiceStep={voiceStep} />}

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

      {/* Live Member Inquiries */}
      <LiveMemberInquiries />
    </div>
  );
}

function StaticChat({ highlight, voiceStep }: { highlight: string | null; voiceStep: number }) {
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
              <div className={`rounded-lg p-1.5 transition-all duration-500 ${highlight === "deductible" ? "ring-2 ring-[hsl(var(--opyn-purple))] bg-[hsl(var(--opyn-purple-light))]" : ""}`}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Individual Deductible</span>
                  <span className="font-semibold">$1,850 / $2,500</span>
                </div>
                <Progress value={74} className="h-1.5 bg-[hsl(var(--opyn-green-light))]" />
              </div>
              <div className={`rounded-lg p-1.5 transition-all duration-500 ${highlight === "network" ? "ring-2 ring-[hsl(var(--opyn-purple))] bg-[hsl(var(--opyn-purple-light))]" : ""}`}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Out-of-Pocket Max</span>
                  <span className="font-semibold">$3,200 / $8,000</span>
                </div>
                <Progress value={40} className="h-1.5 bg-[hsl(var(--opyn-green-light))]" />
              </div>
            </div>
            <div className={`pt-1 border-t border-border/50 rounded-lg p-1.5 transition-all duration-500 ${highlight === "provider" ? "ring-2 ring-[hsl(var(--opyn-green))] bg-[hsl(var(--opyn-green-light))]" : ""}`}>
              <p className="text-[10px] text-muted-foreground">Plan: Blue Cross PPO Gold • Network: First Health • Eff: 01/01/2026</p>
            </div>
            {highlight === "compliance" && (
              <div className="flex items-center gap-1.5 text-[9px] text-[hsl(var(--opyn-green))] font-medium animate-in fade-in duration-300">
                <CheckCircle className="h-3 w-3" />
                All eligibility pre-confirmed
              </div>
            )}
          </div>
        </div>
      </div>
      {voiceStep >= 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= voiceStep ? "w-6 bg-[hsl(var(--opyn-purple))]" : "w-3 bg-border"}`} />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground ml-auto">Step {voiceStep + 1} of 5</span>
        </div>
      )}
    </div>
  );
}

/* ─── PART 3: Live Member Inquiries ─── */
const MEMBER_INQUIRIES = [
  { q: "Am I covered for physical therapy?", answer: "Yes — 30 visits/year, $40 copay", status: "resolved" as const },
  { q: "What's my deductible remaining?", answer: "$650 remaining of $2,500", status: "resolved" as const },
  { q: "Is Dr. Patel in-network?", answer: "Yes — First Health Network", status: "resolved" as const },
  { q: "Why was my claim denied?", answer: "Escalated to claims specialist", status: "escalated" as const },
  { q: "Can I get a referral for dermatology?", answer: "Referral generated — sent to PCP", status: "resolved" as const },
  { q: "What's my copay for an ER visit?", answer: "$250 copay after deductible", status: "resolved" as const },
  { q: "I need to add my newborn to my plan", answer: "Routed to enrollment specialist", status: "escalated" as const },
  { q: "How much is generic Metformin?", answer: "$10 copay — Tier 1 formulary", status: "resolved" as const },
  { q: "When does my plan renew?", answer: "Open enrollment Oct 15 – Nov 15", status: "resolved" as const },
  { q: "Is telehealth covered?", answer: "Yes — $0 copay via MDLive", status: "resolved" as const },
];

function LiveMemberInquiries() {
  const [inquiries, setInquiries] = useState<{ q: string; answer: string; status: "resolved" | "escalated" | "processing"; time: string }[]>([]);

  useEffect(() => {
    let idx = 0;
    const add = () => {
      const src = MEMBER_INQUIRIES[idx % MEMBER_INQUIRIES.length];
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const newItem: { q: string; answer: string; status: "resolved" | "escalated" | "processing"; time: string } = { q: src.q, answer: "", status: "processing", time: now };
      setInquiries(prev => [newItem, ...prev].slice(0, 8));

      setTimeout(() => {
        setInquiries(prev => prev.map((item, i) =>
          i === 0 ? { ...item, answer: src.answer, status: src.status as "resolved" | "escalated" } : item
        ));
      }, 1800 + Math.random() * 1200);

      idx++;
    };

    add();
    const iv = setInterval(add, 5000 + Math.random() * 3000);
    return () => clearInterval(iv);
  }, []);

  const resolved = inquiries.filter(i => i.status === "resolved").length;
  const escalated = inquiries.filter(i => i.status === "escalated").length;
  const processing = inquiries.filter(i => i.status === "processing").length;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5 text-[hsl(var(--opyn-green))]" />
          <span className="text-xs font-medium">Live Member Inquiries</span>
          <span className="flex items-center gap-1 text-[9px] text-[hsl(var(--opyn-green))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--opyn-green))] animate-pulse" /> Active
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="text-[hsl(var(--opyn-green))] font-semibold">Auto-Resolved: {resolved}</span>
          <span className="text-[hsl(var(--opyn-purple))] font-semibold">Escalated: {escalated}</span>
          {processing > 0 && <span className="text-muted-foreground font-semibold">Pending: {processing}</span>}
        </div>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {inquiries.map((item, i) => (
          <div key={`${item.q}-${item.time}-${i}`} className="flex items-center gap-3 text-[10px] py-1.5 border-b border-border last:border-0 feed-item-enter">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">"{item.q}"</p>
              {item.answer && <p className="text-muted-foreground truncate mt-0.5">{item.answer}</p>}
            </div>
            <span className="text-[8px] text-muted-foreground shrink-0">{item.time}</span>
            <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
              item.status === "resolved" ? "bg-[hsl(var(--opyn-green-light))] text-[hsl(var(--opyn-green))]" :
              item.status === "escalated" ? "bg-[hsl(var(--opyn-purple-light))] text-[hsl(var(--opyn-purple))]" :
              "bg-secondary text-muted-foreground"
            }`}>
              {item.status === "processing" ? "Processing…" : item.status === "resolved" ? "Auto-Resolved" : "Escalated"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
