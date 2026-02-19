import { useDashboard, type DashboardTab } from "@/contexts/DashboardContext";
import { Activity, SlidersHorizontal, Shield, Eye, RefreshCw, Phone, FileText, Globe, TrendingUp } from "lucide-react";
import { type VolumePreset } from "@/lib/roi-calculations";

const presetLabels: Record<VolumePreset, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: "contact", label: "Contact Intelligence", icon: <Phone className="h-3.5 w-3.5" /> },
  { id: "claims", label: "Claims Automation", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "network", label: "Network & Marketplace", icon: <Globe className="h-3.5 w-3.5" /> },
  { id: "roi", label: "Executive ROI", icon: <TrendingUp className="h-3.5 w-3.5" /> },
];

function SyncIndicator() {
  const { lastUpdated, isSyncing } = useDashboard();
  const time = lastUpdated.toLocaleTimeString("en-US", { hour12: false });
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
      <RefreshCw className={`h-3 w-3 ${isSyncing ? "sync-spinning text-primary" : ""}`} />
      <span>Last Sync: {time}</span>
    </div>
  );
}

export function Header() {
  const { mode, setMode, preset, setPreset, setDrawerOpen, activeTab, setActiveTab } = useDashboard();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      {/* Top bar */}
      <div className="px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground tracking-tight">
            Reflect AI <span className="text-primary">Ops</span>
          </h1>
          <span className="hidden md:inline text-[10px] text-muted-foreground border-l border-border pl-3">
            Command Center
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <SyncIndicator />

          {/* Volume Presets */}
          <div className="flex items-center bg-secondary rounded-md p-0.5 gap-0.5">
            {(["low", "medium", "high"] as VolumePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
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
          <div className="flex items-center bg-secondary rounded-md p-0.5 gap-0.5">
            <button
              onClick={() => setMode("internal")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
                mode === "internal"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="h-2.5 w-2.5" />
              Internal
            </button>
            <button
              onClick={() => setMode("tpa-demo")}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
                mode === "tpa-demo"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="h-2.5 w-2.5" />
              TPA Demo
            </button>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Controls
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="px-5 flex items-center gap-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-underline flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "text-primary active"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
