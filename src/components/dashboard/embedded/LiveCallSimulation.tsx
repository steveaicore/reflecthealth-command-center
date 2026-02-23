import { useState, useEffect, useCallback, useRef } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { useAudioEngine } from "@/contexts/AudioEngineContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { User, AlertTriangle, CheckCircle2, Mic, MicOff, Timer } from "lucide-react";
import { AudioControlPanel } from "./AudioControlPanel";
import penguinLogo from "@/assets/penguin-logo.png";

const CALLER_VOICE = "EXAVITQu4vr4xnSDxMaL";
const AI_VOICE = "onwK4e9ZLuTAKqWW03F9";

// ── Call template pool ──
interface CallTemplate {
  intent: string;
  confidenceRange: [number, number];
  script: { speaker: "caller" | "ai"; text: string }[];
}

// Weighted script pool: 75% Provider, 25% Member
const PROVIDER_TEMPLATES: CallTemplate[] = [
  {
    intent: "Benefits Verification",
    confidenceRange: [90, 95],
    script: [
      { speaker: "caller", text: "This is Northgate Orthopedic calling to verify benefits." },
      { speaker: "ai", text: "Thank you. Can I have your NPI number please?" },
      { speaker: "caller", text: "NPI 1456789123." },
      { speaker: "ai", text: "Provider verified. Northgate Orthopedic, NPI 1456789123. Please provide the member ID." },
      { speaker: "caller", text: "Member ID BCX-8847291, date of birth January 14, 1986." },
      { speaker: "ai", text: "Member verified. To confirm, you are calling from Northgate Orthopedic, NPI 1456789123, regarding member BCX-8847291. Is that correct?" },
      { speaker: "caller", text: "That's correct." },
      { speaker: "ai", text: "Coverage is active under UHC Choice Plus PPO. Specialist visits are covered with a thirty-dollar copay. Deductible is seventy-four percent met. No prior authorization required for in-network providers." },
      { speaker: "ai", text: "Is there anything else I can help with today?" },
      { speaker: "caller", text: "No, that's all. Thank you." },
      { speaker: "ai", text: "Thank you for calling. This verification has been completed and logged." },
    ],
  },
  {
    intent: "Eligibility Verification",
    confidenceRange: [90, 94],
    script: [
      { speaker: "caller", text: "Calling to confirm eligibility for a patient." },
      { speaker: "ai", text: "I'd be happy to help. May I have your NPI number?" },
      { speaker: "caller", text: "NPI 1456789123." },
      { speaker: "ai", text: "Provider verified. Please provide the member ID." },
      { speaker: "caller", text: "Member 8824102." },
      { speaker: "ai", text: "Member verified. Eligibility confirmed. Coverage is active under the employer-sponsored PPO plan effective January 1st, 2026. No lapse detected." },
    ],
  },
  {
    intent: "Claim Status",
    confidenceRange: [88, 92],
    script: [
      { speaker: "caller", text: "I'm calling to check on a claim." },
      { speaker: "ai", text: "Of course. May I have your NPI?" },
      { speaker: "caller", text: "NPI 1456789123." },
      { speaker: "ai", text: "Provider verified. Which claim are you inquiring about?" },
      { speaker: "caller", text: "Claim number 772451, submitted February 3rd, for member BCX-8847291." },
      { speaker: "ai", text: "Member verified. Claim 772451 was received February 3rd and is currently processing. Determination expected within five business days. No additional documentation required." },
    ],
  },
  {
    intent: "Prior Authorization Status",
    confidenceRange: [85, 90],
    script: [
      { speaker: "caller", text: "Checking on a prior authorization request." },
      { speaker: "ai", text: "May I have your NPI number?" },
      { speaker: "caller", text: "NPI 1456789123." },
      { speaker: "ai", text: "Provider verified. Please provide the member ID or PA reference number." },
      { speaker: "caller", text: "Member BCX-8847291." },
      { speaker: "ai", text: "Member verified. The PA request is under clinical review. All required documentation has been received. Estimated determination within forty-eight hours." },
    ],
  },
  {
    intent: "Claim Status",
    confidenceRange: [65, 78],
    script: [
      { speaker: "caller", text: "We believe claim 554102 was underpaid and need review." },
      { speaker: "ai", text: "May I have your NPI for verification?" },
      { speaker: "caller", text: "NPI 1456789123." },
      { speaker: "ai", text: "Provider verified. This claim requires manual review by a senior claims analyst. I'm routing you now with full context transfer." },
    ],
  },
];

const MEMBER_TEMPLATES: CallTemplate[] = [
  {
    intent: "Claims Status",
    confidenceRange: [90, 96],
    script: [
      { speaker: "caller", text: "I'd like to check the status of a recent claim." },
      { speaker: "ai", text: "Please provide your member ID." },
      { speaker: "caller", text: "It's 5529103." },
      { speaker: "ai", text: "Your claim was processed and approved. Payment was issued on February 15th." },
    ],
  },
  {
    intent: "ID Card Replacement",
    confidenceRange: [92, 98],
    script: [
      { speaker: "caller", text: "I need a replacement ID card." },
      { speaker: "ai", text: "A new ID card has been requested. It will arrive within seven to ten business days. A digital copy has also been sent to the email on file." },
    ],
  },
  {
    intent: "Deductible / OOP Inquiry",
    confidenceRange: [90, 96],
    script: [
      { speaker: "caller", text: "Can you tell me how much of my deductible I've met so far?" },
      { speaker: "ai", text: "Please provide your member ID." },
      { speaker: "caller", text: "Member 6641028." },
      { speaker: "ai", text: "You have met twelve hundred of your two-thousand-dollar individual deductible. Your out-of-pocket maximum balance remaining is four thousand two hundred dollars." },
    ],
  },
];

function pickWeightedTemplate(): CallTemplate {
  const r = Math.random();
  if (r < 0.75) {
    return PROVIDER_TEMPLATES[Math.floor(Math.random() * PROVIDER_TEMPLATES.length)];
  }
  return MEMBER_TEMPLATES[Math.floor(Math.random() * MEMBER_TEMPLATES.length)];
}

type CallStatus = "idle" | "incoming" | "processing" | "resolved" | "escalated";

interface TranscriptLine {
  id: string;
  speaker: "caller" | "ai";
  text: string;
  typing?: boolean;
}

export function LiveCallSimulation() {
  const { pipeline } = useSimulation();
  const { results } = useDashboard();
  const {
    audioEnabled, setAudioEnabled, isLiveSimulation, setIsLiveSimulation,
    confidenceThreshold, playTTS, stopAudio, setCurrentCallOutcome,
    isPlaying, setLiveCallIntent,
  } = useAudioEngine();

  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [currentIntent, setCurrentIntent] = useState<string>("");
  const [callConfidence, setCallConfidence] = useState(0);
  const [callCount, setCallCount] = useState(0);
  const [metrics, setMetrics] = useState({ deflected: 0, escalated: 0, minutesSaved: 0, costAvoided: 0 });

  const callIndexRef = useRef(0);
  const isRunningRef = useRef(false);
  const abortRef = useRef(false);

  const runCall = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    abortRef.current = false;

    const template = pickWeightedTemplate();
    callIndexRef.current++;

    // Generate confidence from template range
    const [lo, hi] = template.confidenceRange;
    const conf = Math.floor(lo + Math.random() * (hi - lo));

    setCurrentIntent(template.intent);
    setLiveCallIntent(template.intent);
    setCallConfidence(conf);
    setCallStatus("incoming");
    setTranscript([]);

    // Brief "incoming" visual
    await new Promise((r) => setTimeout(r, 800));
    if (abortRef.current) { isRunningRef.current = false; return; }

    setCallStatus("processing");

    for (const line of template.script) {
      if (abortRef.current) break;

      const id = `line-${Date.now()}-${Math.random()}`;

      // Show line with typing indicator
      setTranscript((prev) => [...prev, { id, speaker: line.speaker, text: line.text, typing: true }]);

      // Play audio (awaits completion — mutex in engine prevents overlap)
      const voiceId = line.speaker === "caller" ? CALLER_VOICE : AI_VOICE;
      await playTTS(line.text, voiceId, line.speaker === "ai" ? 0.5 : 0.35);

      if (abortRef.current) break;

      // Remove typing indicator
      setTranscript((prev) => prev.map((l) => (l.id === id ? { ...l, typing: false } : l)));

      // 300ms buffer between speakers
      await new Promise((r) => setTimeout(r, 300));
    }

    if (abortRef.current) { isRunningRef.current = false; return; }

    // Determine outcome
    const deflected = conf >= confidenceThreshold;
    const outcome = deflected ? "resolved" as const : "escalated" as const;
    setCallStatus(outcome);
    setCallCount((c) => c + 1);

    const costSaved = deflected ? 4.32 : 0;
    const minSaved = deflected ? 6 : 0;

    setMetrics((prev) => ({
      deflected: prev.deflected + (deflected ? 1 : 0),
      escalated: prev.escalated + (deflected ? 0 : 1),
      minutesSaved: prev.minutesSaved + minSaved,
      costAvoided: +(prev.costAvoided + costSaved).toFixed(2),
    }));

    setCurrentCallOutcome({
      callDeflected: deflected,
      escalationAvoided: deflected,
      costAvoided: costSaved,
      confidence: conf,
    });

    isRunningRef.current = false;
  }, [confidenceThreshold, playTTS, setCurrentCallOutcome]);

  // Auto-advance: after resolved/escalated, wait then start next call
  useEffect(() => {
    if (!isLiveSimulation || !audioEnabled) return;
    if (callStatus === "resolved" || callStatus === "escalated") {
      const timer = setTimeout(() => {
        if (isLiveSimulation && audioEnabled) runCall();
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (callStatus === "idle") {
      const timer = setTimeout(() => {
        if (isLiveSimulation && audioEnabled) runCall();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [callStatus, isLiveSimulation, audioEnabled, runCall]);

  const handleToggle = () => {
    if (isLiveSimulation) {
      setIsLiveSimulation(false);
      abortRef.current = true;
      stopAudio();
      isRunningRef.current = false;
      setCallStatus("idle");
    } else {
      setIsLiveSimulation(true);
      setCallStatus("idle");
    }
  };

  return (
    <div className="p-3 space-y-3 five9-panel-bg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="type-h3 text-foreground">
            Live AI Call Simulation
          </div>
          {currentIntent && callStatus !== "idle" && (
            <div className="type-body mt-0.5">
              {currentIntent} · Confidence {callConfidence}%
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {callCount > 0 && (
            <span className="type-micro font-mono text-five9-muted">#{callCount}</span>
          )}
          <div className="flex items-center bg-secondary rounded-md p-0.5 gap-0.5">
            <button
              onClick={handleToggle}
              className={`flex items-center gap-1 px-2 py-1 type-micro font-semibold rounded transition-all ${
                isLiveSimulation
                  ? "five9-accent-bg text-white"
                  : "text-five9-muted hover:text-foreground"
              }`}
            >
              {isLiveSimulation ? <Mic className="h-2.5 w-2.5" /> : <MicOff className="h-2.5 w-2.5" />}
              {isLiveSimulation ? "LIVE" : "OFF"}
            </button>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex items-center gap-1 px-2 py-1 type-micro font-semibold rounded transition-all ${
                audioEnabled
                  ? "bg-emerald-500/30 text-emerald-300"
                  : "text-five9-muted hover:text-foreground"
              }`}
            >
              {audioEnabled ? "🔊" : "🔇"}
              {audioEnabled ? "Audio" : "Muted"}
            </button>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {callStatus === "incoming" && (
        <div className="rounded p-2 flex items-center gap-2 type-body font-medium bg-primary/10 border border-primary/20 text-primary animate-pulse">
          <Timer className="h-3.5 w-3.5" />
          Incoming Call — {currentIntent}
        </div>
      )}

      {callStatus === "resolved" && (
        <div className="rounded p-2 flex items-center gap-2 type-body font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolved by AI — No agent intervention required
        </div>
      )}

      {callStatus === "escalated" && (
        <div className="rounded p-2 flex items-center gap-2 type-body font-medium bg-amber-500/10 border border-amber-500/20 text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Escalated to Agent — Confidence {callConfidence}% &lt; {confidenceThreshold}%
        </div>
      )}

      {/* Transcript */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px]">
        {transcript.length === 0 && callStatus === "idle" && (
          <div className="type-body text-five9-muted text-center py-8">
            {isLiveSimulation ? "Starting next call..." : "Enable Live Simulation to start"}
          </div>
        )}
        {transcript.map((line) => (
          <div key={line.id} className={`flex gap-2 ${line.speaker === "ai" ? "flex-row" : "flex-row-reverse"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              line.speaker === "ai" ? "bg-five9-accent/10" : "bg-secondary"
            }`}>
              {line.speaker === "ai" ? (
                <img src={penguinLogo} alt="Penguin AI" className="h-4 w-4 object-contain" />
              ) : (
                <User className="h-3 w-3 text-five9-muted" />
              )}
            </div>
            <div className={`five9-card p-2 max-w-[80%] ${line.speaker === "ai" ? "five9-active-border" : ""}`}>
              <p className="type-body-lg text-foreground" style={{ fontSize: "13px", lineHeight: 1.55 }}>
                {line.typing ? (
                  <span className="inline-flex items-center gap-1">
                    {line.text}
                    <span className="animate-pulse text-five9-accent">●</span>
                  </span>
                ) : (
                  line.text
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Outcome details */}
      {callStatus === "resolved" && (
        <div className="five9-card p-2 space-y-1 five9-active-border">
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span className="type-body">Outcome:</span>
            <span className="type-body font-medium text-emerald-600">Call Deflected</span>
            <span className="type-body">Confidence:</span>
            <span className="type-body font-medium font-mono text-foreground">{callConfidence}%</span>
            <span className="type-body">Cost Impact:</span>
            <span className="type-body font-medium font-mono text-emerald-600">+$4.32</span>
            <span className="type-body">Minutes Saved:</span>
            <span className="type-body font-medium font-mono text-emerald-600">+6 min</span>
          </div>
        </div>
      )}

      {/* Running metrics */}
      {(metrics.deflected > 0 || metrics.escalated > 0) && (
        <div className="five9-card p-2">
          <div className="type-micro uppercase tracking-[0.12em] text-five9-muted mb-1.5">Session Metrics</div>
          <div className="grid grid-cols-4 gap-1">
            <div className="text-center">
              <div className="text-[16px] font-semibold font-mono text-emerald-600">{metrics.deflected}</div>
              <div className="type-micro text-five9-muted">Deflected</div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-semibold font-mono text-amber-600">{metrics.escalated}</div>
              <div className="type-micro text-five9-muted">Escalated</div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-semibold font-mono text-foreground">{metrics.minutesSaved}</div>
              <div className="type-micro text-five9-muted">Min Saved</div>
            </div>
            <div className="text-center">
              <div className="text-[16px] font-semibold font-mono text-emerald-600">${metrics.costAvoided}</div>
              <div className="type-micro text-five9-muted">Avoided</div>
            </div>
          </div>
        </div>
      )}

      {/* Audio controls */}
      <AudioControlPanel />
    </div>
  );
}
