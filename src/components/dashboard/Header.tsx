import { useDashboard } from "@/contexts/DashboardContext";
import { fmtTimestamp } from "@/lib/format";
import { Activity, SlidersHorizontal, Shield, Eye } from "lucide-react";
import { type VolumePreset } from "@/lib/roi-calculations";

const presetLabels: Record<VolumePreset, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function Header() {
  const { mode, setMode, preset, setPreset, lastUpdated, setDrawerOpen } = useDashboard();

  return (
    <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-card/60 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            Reflect AI <span className="text-primary">Operations</span>
          </h1>
        </div>
        <span className="text-xs text-muted-foreground hidden md:inline">
          Operational Intelligence for the Benefits Hub
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Timestamp */}
        <span className="text-[11px] text-muted-foreground font-mono hidden lg:inline">
          Data as of {fmtTimestamp(lastUpdated)}
        </span>

        {/* Volume Presets */}
        <div className="flex items-center bg-secondary rounded-lg p-0.5 gap-0.5">
          {(["low", "medium", "high"] as VolumePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                preset === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {presetLabels[p]}
            </button>
          ))}
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-secondary rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setMode("internal")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === "internal"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="h-3 w-3" />
            Internal
          </button>
          <button
            onClick={() => setMode("tpa-demo")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === "tpa-demo"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-3 w-3" />
            TPA Demo
          </button>
        </div>

        {/* Controls Drawer Toggle */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-all"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Controls
        </button>
      </div>
    </header>
  );
}
