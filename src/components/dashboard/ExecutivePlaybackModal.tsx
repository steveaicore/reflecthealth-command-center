import { useState, useCallback } from "react";
import { useAudioEngine } from "@/contexts/AudioEngineContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { fmtCurrency, fmtDecimal } from "@/lib/format";
import { Play, X, Bot, User, CheckCircle2, ShieldCheck, DollarSign, TrendingUp } from "lucide-react";

const CALLER_VOICE = "EXAVITQu4vr4xnSDxMaL";
const AI_VOICE = "onwK4e9ZLuTAKqWW03F9";

const EXECUTIVE_SCRIPT = [
  { speaker: "caller" as const, text: "Hi, I'm calling to check the status of my prior authorization for the MRI." },
  { speaker: "ai" as const, text: "Of course. I'm pulling up your authorization now. I can see it was approved yesterday. Your MRI is cleared for scheduling." },
  { speaker: "caller" as const, text: "That's great. And can you confirm my copay for the imaging center?" },
  { speaker: "ai" as const, text: "Your plan covers diagnostic imaging at 80 percent after deductible. Your estimated out-of-pocket is 120 dollars at an in-network facility. Would you like me to help locate one?" },
];

const CALL_OVERLAYS = [
  { timestamp: 0, label: "AI Handling", icon: Bot, color: "text-primary" },
  { timestamp: 1, label: "Call Deflected", icon: CheckCircle2, color: "text-emerald-600" },
  { timestamp: 2, label: "Escalation Avoided", icon: ShieldCheck, color: "text-emerald-600" },
  { timestamp: 3, label: "+$4.32 Cost Avoided", icon: DollarSign, color: "text-emerald-600" },
];

interface TranscriptLine {
  id: string;
  speaker: "caller" | "ai";
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ExecutivePlaybackModal({ open, onClose }: Props) {
  const { playTTS, stopAudio, isMuted } = useAudioEngine();
  const { results } = useDashboard();
  const { combined, callCenter } = results;

  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activeOverlays, setActiveOverlays] = useState<number[]>([]);

  const runPlayback = useCallback(async () => {
    setPlaying(true);
    setCompleted(false);
    setTranscript([]);
    setActiveOverlays([]);

    for (let i = 0; i < EXECUTIVE_SCRIPT.length; i++) {
      const line = EXECUTIVE_SCRIPT[i];
      const id = `exec-${i}`;
      setTranscript((prev) => [...prev, { id, speaker: line.speaker, text: line.text }]);

      // Show overlay callout
      if (i < CALL_OVERLAYS.length) {
        setActiveOverlays((prev) => [...prev, i]);
      }

      const voiceId = line.speaker === "caller" ? CALLER_VOICE : AI_VOICE;
      await playTTS(line.text, voiceId, 0.5);
      await new Promise((r) => setTimeout(r, 400));
    }

    setPlaying(false);
    setCompleted(true);
  }, [playTTS]);

  const handleClose = () => {
    stopAudio();
    setPlaying(false);
    setTranscript([]);
    setCompleted(false);
    setActiveOverlays([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Interaction — Executive Playback</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Scripted demonstration of AI call resolution</p>
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Play button */}
          {!playing && !completed && (
            <button
              onClick={runPlayback}
              className="w-full py-3 rounded-lg reflect-gradient text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Play className="h-4 w-4" />
              Play AI Interaction Example
            </button>
          )}

          {/* Transcript */}
          {transcript.length > 0 && (
            <div className="space-y-2">
              {transcript.map((line) => (
                <div key={line.id} className={`flex gap-2 ${line.speaker === "ai" ? "flex-row" : "flex-row-reverse"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    line.speaker === "ai" ? "bg-primary/10" : "bg-secondary"
                  }`}>
                    {line.speaker === "ai" ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className={`rounded-lg p-2.5 max-w-[80%] border ${
                    line.speaker === "ai" ? "border-primary/20 bg-primary/5" : "border-border bg-secondary/50"
                  }`}>
                    <p className="text-[11px] text-foreground leading-relaxed">{line.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overlays */}
          {activeOverlays.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {activeOverlays.map((idx) => {
                const overlay = CALL_OVERLAYS[idx];
                return (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-card text-[10px] font-medium">
                    <overlay.icon className={`h-3 w-3 ${overlay.color}`} />
                    <span className={overlay.color}>{overlay.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Confidence indicator */}
          {playing && (
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-mono font-semibold text-primary">92%</span>
              <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full reflect-gradient" style={{ width: "92%" }} />
              </div>
            </div>
          )}

          {/* Completion summary */}
          {completed && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Impact of Similar Calls at Scale
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase block">Annual Call Savings</span>
                  <span className="text-sm font-bold font-mono text-foreground">{fmtCurrency(callCenter.annualSavings)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase block">FTE Reduction</span>
                  <span className="text-sm font-bold font-mono text-foreground">{fmtDecimal(callCenter.fteSaved, 1)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase block">ROI Contribution</span>
                  <span className="text-sm font-bold font-mono text-foreground">
                    {fmtDecimal(combined.roi > 0 ? (callCenter.annualSavings / (callCenter.annualSavings + results.claims.annualSavings)) * combined.roi : 0, 1)}× of {fmtDecimal(combined.roi, 2)}×
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase block">Payback Period</span>
                  <span className="text-sm font-bold font-mono text-foreground">{fmtDecimal(combined.paybackMonths, 1)} mo</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
