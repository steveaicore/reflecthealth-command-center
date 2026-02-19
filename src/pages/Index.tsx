import { DashboardProvider } from "@/contexts/DashboardContext";
import { Header } from "@/components/dashboard/Header";
import { ControlsDrawer } from "@/components/dashboard/ControlsDrawer";
import { KPISidebar } from "@/components/dashboard/KPISidebar";
import { Module1 } from "@/components/dashboard/Module1";
import { Module2 } from "@/components/dashboard/Module2";
import { Module3 } from "@/components/dashboard/Module3";
import { CompetitiveIndex } from "@/components/dashboard/CompetitiveIndex";

const Index = () => {
  return (
    <DashboardProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6 space-y-5">
            <Module1 />
            <Module2 />
            <Module3 />
            <CompetitiveIndex />
          </main>
          {/* KPI Sidebar */}
          <KPISidebar />
        </div>
        <ControlsDrawer />
      </div>
    </DashboardProvider>
  );
};

export default Index;
