import { useDashboard } from "@/contexts/DashboardContext";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { VolumePreset } from "@/lib/roi-calculations";

interface Scenario {
  label: string;
  preset: VolumePreset;
  description: string;
}

const SCENARIOS: Scenario[] = [
  { label: "Large Regional TPA", preset: "high", description: "40.6K calls, 42K claims/mo" },
  { label: "Reflect Baseline", preset: "medium", description: "29K calls, 30K claims/mo" },
  { label: "Cost-Constrained Client", preset: "low", description: "20.3K calls, 21K claims/mo" },
];

export function ScenarioSelector() {
  const { setPreset } = useDashboard();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded bg-secondary text-muted-foreground hover:text-foreground transition-all"
      >
        Scenarios
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground px-2">
              Simulate Client Scenario
            </span>
          </div>
          {SCENARIOS.map(s => (
            <button
              key={s.label}
              onClick={() => { setPreset(s.preset); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors"
            >
              <span className="text-[11px] font-medium text-foreground block">{s.label}</span>
              <span className="text-[9px] text-muted-foreground">{s.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
