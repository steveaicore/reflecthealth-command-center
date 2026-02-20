import { useState, useEffect, useRef } from "react";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { SimulationProvider } from "@/contexts/SimulationContext";
import { AudioEngineProvider } from "@/contexts/AudioEngineContext";
import { Header } from "@/components/dashboard/Header";
import { ControlsDrawer } from "@/components/dashboard/ControlsDrawer";
import { KPISidebar } from "@/components/dashboard/KPISidebar";
import { Module1 } from "@/components/dashboard/Module1";
import { Module2 } from "@/components/dashboard/Module2";
import { Module3 } from "@/components/dashboard/Module3";
import { ExecutiveROI } from "@/components/dashboard/ExecutiveROI";
import { LiveOrchestration } from "@/components/dashboard/LiveOrchestration";
import { DashboardFooter } from "@/components/dashboard/Footer";
import { Module5 } from "@/components/dashboard/Module5";
import { Five9Layout } from "@/components/dashboard/embedded/Five9Layout";
import { OpynHealthLayout } from "@/components/dashboard/opyn/OpynHealthLayout";
import { TransitionOverlay } from "@/components/dashboard/embedded/TransitionOverlay";

function DashboardContent() {
  const { activeTab, deploymentMode } = useDashboard();
  const [showTransition, setShowTransition] = useState(false);
  const prevMode = useRef(deploymentMode);

  useEffect(() => {
    if (prevMode.current !== deploymentMode) {
      setShowTransition(true);
      prevMode.current = deploymentMode;
    }
  }, [deploymentMode]);

  return (
    <SimulationProvider>
      <AudioEngineProvider>
        <TransitionOverlay mode={deploymentMode} visible={showTransition} />

        {deploymentMode === "embedded" ? (
          <Five9Layout />
        ) : deploymentMode === "opyn" ? (
          <OpynHealthLayout />
        ) : (
          <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <main className="flex-1 overflow-y-auto p-5 space-y-4">
                <LiveOrchestration />
                {activeTab === "contact" && <Module1 />}
                {activeTab === "claims" && <Module2 />}
                {activeTab === "network" && <Module3 />}
                {activeTab === "roi" && <ExecutiveROI />}
                {activeTab === "intelligence" && <Module5 />}
              </main>
              <KPISidebar />
            </div>
            <DashboardFooter />
            <ControlsDrawer />
          </div>
        )}
      </AudioEngineProvider>
    </SimulationProvider>
  );
}

const Index = () => (
  <DashboardProvider>
    <DashboardContent />
  </DashboardProvider>
);

export default Index;
