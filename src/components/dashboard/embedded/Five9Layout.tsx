import { useState } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { Five9Sidebar } from "./Five9Sidebar";
import { Five9Header } from "./Five9Header";
import { Five9AgentPanel } from "./Five9AgentPanel";
import { Five9AIPanel } from "./Five9AIPanel";
import { Five9TranscriptPanel } from "./Five9TranscriptPanel";
import { FloatingROIWidget } from "./FloatingROIWidget";
import { Five9SupervisorView } from "./Five9SupervisorView";

export type Five9Tab = "agent" | "supervisor";

export function Five9Layout() {
  const [activeTab, setActiveTab] = useState<Five9Tab>("agent");

  return (
    <div className="min-h-screen flex flex-col five9-bg">
      <Five9Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        <Five9Sidebar />
        <div className="flex-1 overflow-hidden">
          {activeTab === "agent" ? (
            <div className="grid grid-cols-12 gap-0 h-full">
              <div className="col-span-3 border-r five9-border overflow-y-auto">
                <Five9AgentPanel />
              </div>
              <div className="col-span-5 border-r five9-border overflow-y-auto">
                <Five9TranscriptPanel />
              </div>
              <div className="col-span-4 overflow-y-auto">
                <Five9AIPanel />
              </div>
            </div>
          ) : (
            <Five9SupervisorView />
          )}
        </div>
      </div>
      <FloatingROIWidget />
    </div>
  );
}
