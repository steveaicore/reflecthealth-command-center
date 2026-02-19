import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { Header } from "@/components/dashboard/Header";
import { ControlsDrawer } from "@/components/dashboard/ControlsDrawer";
import { KPISidebar } from "@/components/dashboard/KPISidebar";
import { Module1 } from "@/components/dashboard/Module1";
import { Module2 } from "@/components/dashboard/Module2";
import { Module3 } from "@/components/dashboard/Module3";
import { ExecutiveROI } from "@/components/dashboard/ExecutiveROI";

function DashboardContent() {
  const { activeTab } = useDashboard();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-5">
          {activeTab === "contact" && <Module1 />}
          {activeTab === "claims" && <Module2 />}
          {activeTab === "network" && <Module3 />}
          {activeTab === "roi" && <ExecutiveROI />}
        </main>
        <KPISidebar />
      </div>
      <ControlsDrawer />
    </div>
  );
}

const Index = () => (
  <DashboardProvider>
    <DashboardContent />
  </DashboardProvider>
);

export default Index;
