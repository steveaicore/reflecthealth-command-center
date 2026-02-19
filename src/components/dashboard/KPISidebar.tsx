import { useDashboard } from "@/contexts/DashboardContext";
import { fmtCurrency, fmtDecimal, fmtNumber } from "@/lib/format";
import { Download, TrendingUp, Users, DollarSign, Clock, Zap } from "lucide-react";

export function KPISidebar() {
  const { results, mode } = useDashboard();
  const { combined, callCenter, claims } = results;

  const kpis = [
    {
      label: "Total Annual Savings",
      value: fmtCurrency(combined.totalAnnualSavings),
      icon: <DollarSign className="h-3.5 w-3.5" />,
    },
    {
      label: "ROI Multiple",
      value: `${fmtDecimal(combined.roi)}x`,
      icon: <TrendingUp className="h-3.5 w-3.5" />,
    },
    {
      label: "Payback Period",
      value: `${fmtDecimal(combined.paybackMonths)} mo`,
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    {
      label: "FTE Reduction (Calls)",
      value: fmtDecimal(callCenter.fteSaved),
      icon: <Users className="h-3.5 w-3.5" />,
    },
    {
      label: "FTE Reduction (Claims)",
      value: fmtDecimal(claims.fteSaved),
      icon: <Users className="h-3.5 w-3.5" />,
    },
    {
      label: "Call Center Savings",
      value: fmtCurrency(callCenter.annualSavings),
      icon: <Zap className="h-3.5 w-3.5" />,
    },
    {
      label: "Claims Savings",
      value: fmtCurrency(claims.annualSavings),
      icon: <Zap className="h-3.5 w-3.5" />,
    },
  ];

  // Internal mode shows margin data
  if (mode === "internal") {
    kpis.push({
      label: "Annual Manual Cost (Calls)",
      value: fmtCurrency(callCenter.annualManualCost),
      icon: <DollarSign className="h-3.5 w-3.5" />,
    });
    kpis.push({
      label: "Annual Manual Cost (Claims)",
      value: fmtCurrency(claims.annualManualCost),
      icon: <DollarSign className="h-3.5 w-3.5" />,
    });
  }

  return (
    <aside className="w-[260px] border-l border-border bg-card/40 p-4 flex flex-col gap-3 overflow-y-auto shrink-0 hidden xl:flex">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">KPI Snapshot</span>
      </div>

      {kpis.map((kpi) => (
        <div key={kpi.label} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
          <span className="text-primary mt-0.5">{kpi.icon}</span>
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground leading-tight">{kpi.label}</span>
            <span className="text-sm font-semibold font-mono text-foreground">{kpi.value}</span>
          </div>
        </div>
      ))}

      <button className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
        <Download className="h-3.5 w-3.5" />
        {mode === "internal" ? "Export Internal Report" : "Export TPA Summary"}
      </button>
    </aside>
  );
}
