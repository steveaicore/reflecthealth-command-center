import { useState, useEffect, useCallback } from "react";
import { useDashboard } from "@/contexts/DashboardContext";
import { Five9Sidebar } from "./Five9Sidebar";
import { Five9Header } from "./Five9Header";
import { Five9AgentPanel } from "./Five9AgentPanel";
import { Five9AIPanel } from "./Five9AIPanel";
import { LiveCallSimulation } from "./LiveCallSimulation";
import { FloatingROIWidget } from "./FloatingROIWidget";
import { Five9SupervisorView } from "./Five9SupervisorView";
import { Five9EmailView } from "./Five9EmailView";
import { Five9ChatView } from "./Five9ChatView";
import { Five9HistoryView } from "./Five9HistoryView";
import { DEFAULT_USE_CASE_ID, USE_CASE_PROFILES } from "./useCaseProfiles";
import { DEFAULT_PRODUCT_LINE_ID } from "./productLines";
import { getUseCasesForProductLine } from "./useCasesByProductLine";
import { supabase } from "@/integrations/supabase/client";

export type Five9Tab = "agent" | "supervisor";
export type Five9SidebarTab = "calls" | "email" | "chat" | "history" | "supervisor";

export function Five9Layout() {
  const [activeTab, setActiveTab] = useState<Five9Tab>("agent");
  const [sidebarTab, setSidebarTab] = useState<Five9SidebarTab>("calls");
  const [selectedUseCaseId, setSelectedUseCaseId] = useState(DEFAULT_USE_CASE_ID);
  const [selectedProductLineId, setSelectedProductLineId] = useState(DEFAULT_PRODUCT_LINE_ID);

  // Load persisted preferences
  useEffect(() => {
    supabase.from("agent_preferences").select("*").eq("agent_user_id", "demo-agent").maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSelectedUseCaseId(data.default_use_case_id);
          if ((data as any).default_product_line_id) {
            setSelectedProductLineId((data as any).default_product_line_id);
          }
        }
      });
  }, []);

  // Persist preferences
  const persistPrefs = useCallback((useCaseId: string, productLineId: string) => {
    supabase.from("agent_preferences").upsert({
      agent_user_id: "demo-agent",
      default_use_case_id: useCaseId,
      default_product_line_id: productLineId,
    } as any, { onConflict: "agent_user_id" }).then(() => {});
  }, []);

  const handleProductLineChange = (newId: string) => {
    setSelectedProductLineId(newId);
    // Reset use case to first available for new product line
    const cases = getUseCasesForProductLine(newId, USE_CASE_PROFILES);
    const firstId = cases[0]?.id || DEFAULT_USE_CASE_ID;
    setSelectedUseCaseId(firstId);
    persistPrefs(firstId, newId);
  };

  const handleUseCaseChange = (newId: string) => {
    setSelectedUseCaseId(newId);
    persistPrefs(newId, selectedProductLineId);
  };

  const handleSidebarTab = (tab: Five9SidebarTab) => {
    setSidebarTab(tab);
    if (tab === "supervisor") {
      setActiveTab("supervisor");
    } else {
      setActiveTab("agent");
    }
  };

  const renderContent = () => {
    if (activeTab === "supervisor") {
      return <Five9SupervisorView />;
    }

    switch (sidebarTab) {
      case "email":
        return <Five9EmailView />;
      case "chat":
        return <Five9ChatView />;
      case "history":
        return <Five9HistoryView />;
      default:
        return (
          <div className="grid grid-cols-12 gap-0 h-full">
            <div className="col-span-3 border-r five9-border overflow-y-auto">
              <Five9AgentPanel />
            </div>
            <div className="col-span-5 border-r five9-border overflow-y-auto">
              <LiveCallSimulation />
            </div>
            <div className="col-span-4 overflow-y-auto">
              <Five9AIPanel selectedUseCaseId={selectedUseCaseId} selectedProductLineId={selectedProductLineId} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col five9-bg">
      <Five9Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedUseCaseId={selectedUseCaseId}
        setSelectedUseCaseId={handleUseCaseChange}
        selectedProductLineId={selectedProductLineId}
        setSelectedProductLineId={handleProductLineChange}
      />
      <div className="flex flex-1 overflow-hidden">
        <Five9Sidebar activeTab={sidebarTab} setActiveTab={handleSidebarTab} />
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
      <FloatingROIWidget />
    </div>
  );
}
