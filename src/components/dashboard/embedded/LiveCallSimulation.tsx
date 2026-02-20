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

const CALL_TEMPLATES: CallTemplate[] = [
  {
    intent: "Benefits Verification",
    confidenceRange: [88, 96],
    script: [
      { speaker: "caller", text: "Hi, I need to verify benefits for a member before scheduling a specialist visit." },
      { speaker: "ai", text: "Of course. Can you provide the member ID and date of birth?" },
      { speaker: "caller", text: "Member ID 4578921. Date of birth January 14, 1986." },
      { speaker: "ai", text: "The member has active coverage. Specialist visits are covered with a thirty dollar copay. No prior auth required for in-network providers." },
    ],
  },
  {
    intent: "COB Verification",
    confidenceRange: [82, 94],
    script: [
      { speaker: "caller", text: "I'm calling to verify coordination of benefits for a dual-coverage member." },
      { speaker: "ai", text: "I can help with that. What's the member ID?" },
      { speaker: "caller", text: "Member ID 7823456." },
      { speaker: "ai", text: "This member has primary coverage through UHC and secondary through Aetna. UHC processes first, then Aetna covers the remaining balance up to plan limits." },
    ],
  },
  {
    intent: "Claim Status",
    confidenceRange: [90, 97],
    script: [
      { speaker: "caller", text: "I'm calling about the status of claim number 45621." },
      { speaker: "ai", text: "Let me look that up. Claim 45621 was submitted on February 12th and is currently approved for payment." },
      { speaker: "caller", text: "When should we expect the payment?" },
      { speaker: "ai", text: "Payment is scheduled for processing within five business days. The approved amount is four hundred and twelve dollars." },
    ],
  },
  {
    intent: "Prior Auth Status",
    confidenceRange: [78, 90],
    script: [
      { speaker: "caller", text: "I need to check the status of a prior authorization for an MRI." },
      { speaker: "ai", text: "Sure. Can you provide the authorization reference number?" },
      { speaker: "caller", text: "It's PA-2024-88341." },
      { speaker: "ai", text: "That authorization was approved yesterday. The MRI is cleared for scheduling at any in-network imaging facility. Valid for ninety days." },
    ],
  },
  {
    intent: "ID Card Request",
    confidenceRange: [92, 98],
    script: [
      { speaker: "caller", text: "A member is requesting a replacement ID card." },
      { speaker: "ai", text: "I can process that. What is the member ID?" },
      { speaker: "caller", text: "Member 5529103." },
      { speaker: "ai", text: "A new ID card has been requested and will be mailed within seven to ten business days. I've also sent a digital copy to the member's email on file." },
    ],
  },
];

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
    audioEnabled, isLiveSimulation, setIsLiveSimulation,
    confidenceThreshold, playTTS, stopAudio, setCurrentCallOutcome,
    isPlaying,
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

    const template = CALL_TEMPLATES[callIndexRef.current % CALL_TEMPLATES.length];
    callIndexRef.current++;

    // Generate confidence from template range
    const [lo, hi] = template.confidenceRange;
    const conf = Math.floor(lo + Math.random() * (hi - lo));

    setCurrentIntent(template.intent);
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
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-five9-muted">
            Live AI Call Simulation
          </div>
          {currentIntent && callStatus !== "idle" && (
            <div className="text-[9px] text-five9-muted mt-0.5">
              {currentIntent} · Confidence {callConfidence}%
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {callCount > 0 && (
            <span className="text-[9px] font-mono text-five9-muted">#{callCount}</span>
          )}
          <button
            onClick={handleToggle}
            className={`flex items-center gap-1 px-2 py-1 text-[9px] font-semibold rounded transition-all ${
              isLiveSimulation
                ? "five9-accent-bg text-white"
                : "bg-secondary text-five9-muted hover:text-foreground"
            }`}
          >
            {isLiveSimulation ? <Mic className="h-2.5 w-2.5" /> : <MicOff className="h-2.5 w-2.5" />}
            {isLiveSimulation ? "LIVE" : "OFF"}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {callStatus === "incoming" && (
        <div className="rounded p-2 flex items-center gap-2 text-[11px] font-medium bg-primary/10 border border-primary/20 text-primary animate-pulse">
          <Timer className="h-3.5 w-3.5" />
          Incoming Call — {currentIntent}
        </div>
      )}

      {callStatus === "resolved" && (
        <div className="rounded p-2 flex items-center gap-2 text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolved by AI — No agent intervention required
        </div>
      )}

      {callStatus === "escalated" && (
        <div className="rounded p-2 flex items-center gap-2 text-[11px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          Escalated to Agent — Confidence {callConfidence}% &lt; {confidenceThreshold}%
        </div>
      )}

      {/* Transcript */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px]">
        {transcript.length === 0 && callStatus === "idle" && (
          <div className="text-[11px] text-five9-muted text-center py-8">
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
              <p className="text-[11px] text-foreground leading-relaxed">
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
            <span className="text-five9-muted">Outcome:</span>
            <span className="font-medium text-emerald-600">Call Deflected</span>
            <span className="text-five9-muted">Confidence:</span>
            <span className="font-medium font-mono text-foreground">{callConfidence}%</span>
            <span className="text-five9-muted">Cost Avoided:</span>
            <span className="font-medium font-mono text-emerald-600">+$4.32</span>
            <span className="text-five9-muted">Minutes Saved:</span>
            <span className="font-medium font-mono text-emerald-600">+6 min</span>
          </div>
        </div>
      )}

      {/* Running metrics */}
      {(metrics.deflected > 0 || metrics.escalated > 0) && (
        <div className="five9-card p-2">
          <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted mb-1">Session Metrics</div>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <div className="text-center">
              <div className="font-bold font-mono text-emerald-600">{metrics.deflected}</div>
              <div className="text-five9-muted">Deflected</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-mono text-amber-600">{metrics.escalated}</div>
              <div className="text-five9-muted">Escalated</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-mono text-foreground">{metrics.minutesSaved}</div>
              <div className="text-five9-muted">Min Saved</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-mono text-emerald-600">${metrics.costAvoided}</div>
              <div className="text-five9-muted">Avoided</div>
            </div>
          </div>
        </div>
      )}

      {/* Audio controls */}
      <AudioControlPanel />
    </div>
  );
}
