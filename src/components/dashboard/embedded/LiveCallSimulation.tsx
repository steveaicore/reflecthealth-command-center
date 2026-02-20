import { useState, useEffect, useCallback, useRef } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { useAudioEngine } from "@/contexts/AudioEngineContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { Bot, User, AlertTriangle, CheckCircle2, Mic, MicOff } from "lucide-react";
import { AudioControlPanel } from "./AudioControlPanel";

const CALLER_VOICE = "EXAVITQu4vr4xnSDxMaL"; // Sarah - natural human caller
const AI_VOICE = "onwK4e9ZLuTAKqWW03F9"; // Daniel - professional AI agent

interface TranscriptLine {
  id: string;
  speaker: "caller" | "ai";
  text: string;
  typing?: boolean;
}

const SCRIPTED_CALLS = [
  [
    { speaker: "caller" as const, text: "Hi, I'm calling about the status of my claim, invoice number 45621." },
    { speaker: "ai" as const, text: "I can help with that. Let me look up your claim status right away." },
    { speaker: "ai" as const, text: "I found your claim. Invoice 45621 was submitted on February 12th and is currently approved for payment." },
    { speaker: "caller" as const, text: "Great, and what about my eligibility for the specialist visit?" },
    { speaker: "ai" as const, text: "Your plan covers specialist visits with a 30 dollar copay. No prior authorization required for in-network providers." },
  ],
  [
    { speaker: "caller" as const, text: "I need to verify benefits for a member, ID number 8834." },
    { speaker: "ai" as const, text: "Sure, pulling up member 8834 now." },
    { speaker: "ai" as const, text: "Member is active on the Gold PPO plan. Deductible met. Out-of-pocket max at 60 percent." },
    { speaker: "caller" as const, text: "Does that include the behavioral health carve-out?" },
    { speaker: "ai" as const, text: "Yes, behavioral health is included through the Optum network. No separate authorization needed for outpatient visits." },
  ],
];

export function LiveCallSimulation() {
  const { events, pipeline } = useSimulation();
  const { results } = useDashboard();
  const {
    audioEnabled, isLiveSimulation, setIsLiveSimulation,
    confidenceThreshold, playTTS, stopAudio, setCurrentCallOutcome,
    isPlaying,
  } = useAudioEngine();

  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [callActive, setCallActive] = useState(false);
  const [callResolved, setCallResolved] = useState<"deflected" | "escalated" | null>(null);
  const callIndexRef = useRef(0);
  const isRunningRef = useRef(false);
  const activeEvent = events[0];

  const runCall = useCallback(async () => {
    if (isRunningRef.current || !audioEnabled) return;
    isRunningRef.current = true;
    setCallActive(true);
    setCallResolved(null);
    setTranscript([]);

    const script = SCRIPTED_CALLS[callIndexRef.current % SCRIPTED_CALLS.length];
    callIndexRef.current++;

    for (const line of script) {
      if (!isRunningRef.current) break;

      const id = `line-${Date.now()}-${Math.random()}`;

      // Show typing indicator
      setTranscript((prev) => [...prev, { id, speaker: line.speaker, text: line.text, typing: true }]);

      // Play audio
      const voiceId = line.speaker === "caller" ? CALLER_VOICE : AI_VOICE;
      await playTTS(line.text, voiceId, line.speaker === "ai" ? 0.5 : 0.35);

      // Remove typing indicator, show final text
      setTranscript((prev) =>
        prev.map((l) => (l.id === id ? { ...l, typing: false } : l))
      );

      // Small pause between lines
      await new Promise((r) => setTimeout(r, 600));
    }

    // Determine outcome based on confidence
    const conf = pipeline.confidence;
    const deflected = conf >= confidenceThreshold;
    setCallResolved(deflected ? "deflected" : "escalated");
    setCurrentCallOutcome({
      callDeflected: deflected,
      escalationAvoided: deflected,
      costAvoided: deflected ? 4.32 : 0,
      confidence: conf,
    });

    isRunningRef.current = false;
    setCallActive(false);
  }, [audioEnabled, pipeline.confidence, confidenceThreshold, playTTS, setCurrentCallOutcome]);

  // Auto-trigger calls when live simulation is on and new events arrive
  useEffect(() => {
    if (!isLiveSimulation || !audioEnabled || isRunningRef.current) return;
    const timer = setTimeout(() => runCall(), 2000);
    return () => clearTimeout(timer);
  }, [isLiveSimulation, audioEnabled, events.length, runCall]);

  return (
    <div className="p-3 space-y-3 five9-panel-bg h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-five9-muted">
          Live AI Call Simulation
        </div>
        <button
          onClick={() => {
            if (isLiveSimulation) {
              setIsLiveSimulation(false);
              stopAudio();
              isRunningRef.current = false;
            } else {
              setIsLiveSimulation(true);
            }
          }}
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

      {/* Resolution banner */}
      {callResolved && (
        <div className={`rounded p-2 flex items-center gap-2 text-[11px] font-medium ${
          callResolved === "deflected"
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700"
            : "bg-amber-500/10 border border-amber-500/20 text-amber-700"
        }`}>
          {callResolved === "deflected" ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolved by AI — No agent intervention required
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              Escalated to Agent — Confidence Below Threshold ({confidenceThreshold}%)
            </>
          )}
        </div>
      )}

      {/* Transcript */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px]">
        {transcript.length === 0 && !callActive && (
          <div className="text-[11px] text-five9-muted text-center py-8">
            {isLiveSimulation ? "Waiting for next call..." : "Enable Live Simulation to start"}
          </div>
        )}
        {transcript.map((line) => (
          <div key={line.id} className={`flex gap-2 ${line.speaker === "ai" ? "flex-row" : "flex-row-reverse"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              line.speaker === "ai" ? "bg-five9-accent/10" : "bg-secondary"
            }`}>
              {line.speaker === "ai" ? (
                <Bot className="h-3 w-3 text-five9-accent" />
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

      {/* Call outcome overlay */}
      {callResolved === "deflected" && (
        <div className="five9-card p-2 space-y-1 five9-active-border">
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
            <span className="text-five9-muted">Outcome:</span>
            <span className="font-medium text-emerald-600">Call Deflected</span>
            <span className="text-five9-muted">Confidence:</span>
            <span className="font-medium font-mono text-foreground">{pipeline.confidence}%</span>
            <span className="text-five9-muted">Cost Avoided:</span>
            <span className="font-medium font-mono text-emerald-600">+$4.32</span>
            <span className="text-five9-muted">Escalation:</span>
            <span className="font-medium text-emerald-600">Avoided</span>
          </div>
        </div>
      )}

      {/* Audio controls */}
      <AudioControlPanel />
    </div>
  );
}
