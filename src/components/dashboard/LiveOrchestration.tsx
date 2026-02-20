import { useState } from "react";
import { useSimulation, type EventStatus } from "@/contexts/SimulationContext";
import { CountUpValue } from "./CountUpValue";
import { fmtCurrency, fmtDecimal } from "@/lib/format";
import { Phone, Zap, Users, DollarSign, ArrowRight } from "lucide-react";
import { InteractionDetailModal } from "./InteractionDetailModal";
import type { SimEvent } from "@/contexts/SimulationContext";

const STATUS_CONFIG: Record<EventStatus, { label: string; className: string }> = {
  "ai-routed": { label: "Routed to AI", className: "text-primary bg-primary/10" },
  "escalated": { label: "Escalated", className: "text-amber-600 bg-amber-50" },
  "resolved": { label: "Resolved", className: "text-emerald-600 bg-emerald-50" },
  "in-progress": { label: "In Progress", className: "text-muted-foreground bg-secondary" },
};

const PIPELINE_STAGES = [
  "Incoming", "Intent Classification", "Policy Validation",
  "System Query", "Response Generation", "Resolved"
];

function EventFeed() {
  const { events } = useSimulation();
  const [selectedEvent, setSelectedEvent] = useState<SimEvent | null>(null);

  return (
    <div className="flex flex-col gap-1 overflow-hidden max-h-[200px]">
      <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">
        Live Event Feed
      </span>
      {events.slice(0, 6).map((evt) => {
        const status = STATUS_CONFIG[evt.status];
        return (
          <button
            key={evt.id}
            onClick={() => setSelectedEvent(evt)}
            className="feed-item-enter flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border border-border bg-card hover:border-primary/30 transition-colors text-left w-full"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[10px] text-foreground truncate">
                <span className="text-muted-foreground">Incoming:</span> {evt.callerType} — {evt.reason} — {evt.payer}
              </span>
            </div>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${status.className}`}>
              {status.label}
            </span>
          </button>
        );
      })}
      <InteractionDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

function AIPipeline() {
  const { pipeline } = useSimulation();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        AI Orchestration Flow
      </span>
      <div className="flow-bg rounded-lg p-3 border border-border relative">
        <div className="flex items-center gap-1 overflow-x-auto">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-1 shrink-0">
              <div className={`px-2 py-1 rounded text-[9px] font-medium transition-all duration-300 ${
                i <= pipeline.activeStage
                  ? "reflect-gradient text-white"
                  : "bg-secondary text-muted-foreground"
              }`}>
                {stage}
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <ArrowRight className={`h-2.5 w-2.5 shrink-0 transition-colors ${
                  i < pipeline.activeStage ? "text-primary" : "text-muted-foreground/30"
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px]">
          <span className="text-muted-foreground">
            Confidence: <span className="font-mono text-foreground font-semibold">{pipeline.confidence}%</span>
          </span>
          <span className="text-muted-foreground">
            Resolution: <span className="font-mono text-foreground font-semibold">{pipeline.resolutionTime}s</span>
          </span>
          <span className="text-muted-foreground">
            Outcome: <span className={`font-semibold ${pipeline.outcome === "Deflected" ? "text-primary" : "text-amber-600"}`}>
              {pipeline.outcome}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function LiveImpactCounters() {
  const { counters } = useSimulation();

  const items = [
    { label: "Calls Deflected", value: counters.callsDeflected, formatter: (n: number) => Math.round(n).toString(), icon: <Zap className="h-3 w-3" /> },
    { label: "Minutes Saved", value: counters.manualMinutesSaved, formatter: (n: number) => fmtDecimal(n, 0), icon: <Phone className="h-3 w-3" /> },
    { label: "Cost Avoided", value: counters.costAvoided, formatter: fmtCurrency, icon: <DollarSign className="h-3 w-3" /> },
    { label: "FTE Impact", value: counters.fteEquivalent, formatter: (n: number) => fmtDecimal(n, 2), icon: <Users className="h-3 w-3" /> },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Live Impact (Today)
      </span>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="metric-card flex flex-col gap-1 p-2.5 reflect-border">
            <div className="flex items-center gap-1.5">
              <span className="text-primary">{item.icon}</span>
              <span className="text-[9px] text-muted-foreground">{item.label}</span>
            </div>
            <CountUpValue
              value={item.value}
              formatter={item.formatter}
              className="text-sm font-bold font-mono text-foreground"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveOrchestration() {
  return (
    <div className="module-panel p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="status-dot" />
        <span className="text-xs font-semibold text-foreground">Live Operational Stream</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <EventFeed />
        <AIPipeline />
        <LiveImpactCounters />
      </div>
    </div>
  );
}
