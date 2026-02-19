import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import {
  calculateROI,
  VOLUME_PRESETS,
  type CallCenterParams,
  type ClaimsParams,
  type PlatformParams,
  type ROIResults,
  type VolumePreset,
} from "@/lib/roi-calculations";

export type ViewMode = "internal" | "tpa-demo";
export type DashboardTab = "contact" | "claims" | "network" | "roi";

interface DashboardState {
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  preset: VolumePreset;
  setPreset: (p: VolumePreset) => void;
  callParams: CallCenterParams;
  setCallParams: (p: CallCenterParams) => void;
  claimsParams: ClaimsParams;
  setClaimsParams: (p: ClaimsParams) => void;
  platformParams: PlatformParams;
  setPlatformParams: (p: PlatformParams) => void;
  results: ROIResults;
  lastUpdated: Date;
  drawerOpen: boolean;
  setDrawerOpen: (o: boolean) => void;
  competitiveIndexOpen: boolean;
  setCompetitiveIndexOpen: (o: boolean) => void;
  activeTab: DashboardTab;
  setActiveTab: (t: DashboardTab) => void;
  isSyncing: boolean;
}

const DashboardContext = createContext<DashboardState | null>(null);

const DEFAULT_CALL: CallCenterParams = {
  monthlyCalls: 29000,
  handleTimeMin: 8,
  agentCostHr: 22,
  providerPct: 0.4,
  eligiblePct: 0.7,
  accuracyPct: 0.92,
  aiProcessSavingsPct: 0.65,
};

const DEFAULT_CLAIMS: ClaimsParams = {
  monthlyClaims: 30000,
  manualReviewPct: 0.35,
  manualTimeMin: 12,
  fteHourlyCost: 28,
  aiLaborReductionPct: 0.55,
};

const DEFAULT_PLATFORM: PlatformParams = {
  annualPlatformCost: 180000,
};

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ViewMode>("internal");
  const [preset, setPresetRaw] = useState<VolumePreset>("medium");
  const [callParams, setCallParams] = useState(DEFAULT_CALL);
  const [claimsParams, setClaimsParams] = useState(DEFAULT_CLAIMS);
  const [platformParams, setPlatformParams] = useState(DEFAULT_PLATFORM);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [competitiveIndexOpen, setCompetitiveIndexOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState<DashboardTab>("contact");
  const [isSyncing, setIsSyncing] = useState(false);

  const triggerSync = useCallback(() => {
    setIsSyncing(true);
    setLastUpdated(new Date());
    setTimeout(() => setIsSyncing(false), 1200);
  }, []);

  const setPreset = useCallback((p: VolumePreset) => {
    setPresetRaw(p);
    const v = VOLUME_PRESETS[p];
    setCallParams((prev) => ({ ...prev, monthlyCalls: v.calls }));
    setClaimsParams((prev) => ({ ...prev, monthlyClaims: v.claims }));
    triggerSync();
  }, [triggerSync]);

  const wrappedSetCallParams = useCallback((p: CallCenterParams) => {
    setCallParams(p);
    triggerSync();
  }, [triggerSync]);

  const wrappedSetClaimsParams = useCallback((p: ClaimsParams) => {
    setClaimsParams(p);
    triggerSync();
  }, [triggerSync]);

  const wrappedSetPlatformParams = useCallback((p: PlatformParams) => {
    setPlatformParams(p);
    triggerSync();
  }, [triggerSync]);

  const results = useMemo(
    () => calculateROI(callParams, claimsParams, platformParams),
    [callParams, claimsParams, platformParams]
  );

  return (
    <DashboardContext.Provider
      value={{
        mode,
        setMode,
        preset,
        setPreset,
        callParams,
        setCallParams: wrappedSetCallParams,
        claimsParams,
        setClaimsParams: wrappedSetClaimsParams,
        platformParams,
        setPlatformParams: wrappedSetPlatformParams,
        results,
        lastUpdated,
        drawerOpen,
        setDrawerOpen,
        competitiveIndexOpen,
        setCompetitiveIndexOpen,
        activeTab,
        setActiveTab,
        isSyncing,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
