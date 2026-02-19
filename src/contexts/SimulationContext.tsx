import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useDashboard } from "./DashboardContext";

export type EventStatus = "ai-routed" | "escalated" | "resolved" | "in-progress";
export type CallerType = "Provider" | "Member" | "Broker";

export interface SimEvent {
  id: string;
  timestamp: Date;
  callerType: CallerType;
  reason: string;
  payer: string;
  status: EventStatus;
  aiConfidence: number;
  resolutionTimeSec: number;
}

interface PipelineState {
  activeStage: number; // 0-5
  confidence: number;
  resolutionTime: number;
  outcome: string;
}

interface SimulationState {
  events: SimEvent[];
  pipeline: PipelineState;
  counters: {
    callsDeflected: number;
    manualMinutesSaved: number;
    costAvoided: number;
    fteEquivalent: number;
  };
  isRunning: boolean;
  audioEnabled: boolean;
  setAudioEnabled: (v: boolean) => void;
  shouldPlayAudio: boolean; // true every 6th call
  lastAudioText: string;
}

const SimulationContext = createContext<SimulationState | null>(null);

const CALLER_TYPES: CallerType[] = ["Provider", "Member", "Broker"];
const REASONS = [
  "Claims Status", "ID Card Request", "PA Status", "Eligibility Inquiry",
  "Benefits Verification", "Referral Check", "COB Verification", "Claim Appeal"
];
const PAYERS = ["BCBS", "Aetna", "UHC", "Cigna", "Humana", "Anthem", "Kaiser"];
const AUDIO_TEXTS = [
  "Your claim status for invoice 45621 has been processed and approved.",
  "Your prior authorization request has been received and is under review.",
  "Eligibility has been confirmed for the requested procedure.",
  "Your referral has been approved and forwarded to the specialist.",
  "The benefits inquiry shows full coverage under your current plan.",
  "Your ID card request has been processed and will arrive within 5 business days.",
];

function generateEvent(eligiblePct: number, accuracyPct: number): SimEvent {
  const callerType = CALLER_TYPES[Math.floor(Math.random() * CALLER_TYPES.length)];
  const reason = REASONS[Math.floor(Math.random() * REASONS.length)];
  const payer = PAYERS[Math.floor(Math.random() * PAYERS.length)];
  const aiResolved = Math.random() < (eligiblePct * accuracyPct);
  const confidence = aiResolved ? 85 + Math.random() * 13 : 40 + Math.random() * 30;

  let status: EventStatus;
  if (aiResolved) {
    status = Math.random() > 0.3 ? "ai-routed" : "resolved";
  } else {
    status = Math.random() > 0.5 ? "escalated" : "in-progress";
  }

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date(),
    callerType,
    reason,
    payer,
    status,
    aiConfidence: Math.round(confidence),
    resolutionTimeSec: aiResolved ? 2 + Math.random() * 5 : 30 + Math.random() * 60,
  };
}

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const { preset, callParams, mode } = useDashboard();
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [pipeline, setPipeline] = useState<PipelineState>({
    activeStage: 0, confidence: 92, resolutionTime: 4.2, outcome: "Deflected",
  });
  const [counters, setCounters] = useState({
    callsDeflected: 0, manualMinutesSaved: 0, costAvoided: 0, fteEquivalent: 0,
  });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [shouldPlayAudio, setShouldPlayAudio] = useState(false);
  const [lastAudioText, setLastAudioText] = useState("");
  const callCount = useRef(0);
  const pipelineTimer = useRef<ReturnType<typeof setTimeout>>();

  const intervalMs = preset === "low" ? 7000 : preset === "medium" ? 5000 : 3000;

  const animatePipeline = useCallback((event: SimEvent) => {
    const stages = [0, 1, 2, 3, 4, 5];
    let i = 0;
    const step = () => {
      if (i < stages.length) {
        setPipeline({
          activeStage: stages[i],
          confidence: event.aiConfidence,
          resolutionTime: parseFloat(event.resolutionTimeSec.toFixed(1)),
          outcome: event.status === "ai-routed" || event.status === "resolved" ? "Deflected" : "Escalated",
        });
        i++;
        pipelineTimer.current = setTimeout(step, 300);
      }
    };
    step();
  }, []);

  useEffect(() => {
    if (mode !== "tpa-demo" && mode !== "internal") return;

    const timer = setInterval(() => {
      const event = generateEvent(callParams.eligiblePct, callParams.accuracyPct);
      setEvents(prev => [event, ...prev].slice(0, 50));
      animatePipeline(event);

      const isDeflected = event.status === "ai-routed" || event.status === "resolved";
      if (isDeflected) {
        const minutesSaved = callParams.handleTimeMin * callParams.aiProcessSavingsPct;
        const costSaved = (callParams.handleTimeMin / 60) * callParams.agentCostHr * callParams.aiProcessSavingsPct;

        setCounters(prev => ({
          callsDeflected: prev.callsDeflected + 1,
          manualMinutesSaved: prev.manualMinutesSaved + minutesSaved,
          costAvoided: prev.costAvoided + costSaved,
          fteEquivalent: (prev.callsDeflected + 1) * minutesSaved / (8 * 60),
        }));
      }

      callCount.current += 1;
      if (callCount.current % 6 === 0 && audioEnabled && isDeflected) {
        setShouldPlayAudio(true);
        setLastAudioText(AUDIO_TEXTS[Math.floor(Math.random() * AUDIO_TEXTS.length)]);
        setTimeout(() => setShouldPlayAudio(false), 500);
      }
    }, intervalMs);

    return () => {
      clearInterval(timer);
      if (pipelineTimer.current) clearTimeout(pipelineTimer.current);
    };
  }, [mode, intervalMs, callParams, audioEnabled, animatePipeline]);

  return (
    <SimulationContext.Provider value={{
      events, pipeline, counters, isRunning: true,
      audioEnabled, setAudioEnabled, shouldPlayAudio, lastAudioText,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
