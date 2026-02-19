import { useDashboard } from "@/contexts/DashboardContext";
import { fmtCurrency, fmtDecimal } from "@/lib/format";
import { CountUpValue } from "./CountUpValue";
import { Download, TrendingUp, Users, DollarSign, Clock, Zap } from "lucide-react";

export function KPISidebar() {
  const { results, mode } = useDashboard();
  const { combined, callCenter, claims } = results;

  const kpis = [
    {
      label: "Total Savings",
      value: combined.totalAnnualSavings,
      formatter: fmtCurrency,
      icon: <DollarSign className="h-3 w-3" />,
      highlight: true,
    },
    {
      label: "ROI",
      value: combined.roi,
      formatter: (n: number) => `${fmtDecimal(n)}x`,
      icon: <TrendingUp className="h-3 w-3" />,
      highlight: true,
    },
    {
      label: "Payback",
      value: combined.paybackMonths,
      formatter: (n: number) => `${fmtDecimal(n)} mo`,
      icon: <Clock className="h-3 w-3" />,
    },
    {
      label: "FTE (Calls)",
      value: callCenter.fteSaved,
      formatter: (n: number) => fmtDecimal(n),
      icon: <Users className="h-3 w-3" />,
    },
    {
      label: "FTE (Claims)",
      value: claims.fteSaved,
      formatter: (n: number) => fmtDecimal(n),
      icon: <Users className="h-3 w-3" />,
    },
    {
      label: "Call Savings",
      value: callCenter.annualSavings,
      formatter: fmtCurrency,
      icon: <Zap className="h-3 w-3" />,
    },
    {
      label: "Claims Savings",
      value: claims.annualSavings,
      formatter: fmtCurrency,
      icon: <Zap className="h-3 w-3" />,
    },
  ];

  if (mode === "internal") {
    kpis.push(
      {
        label: "Manual Cost (Calls)",
        value: callCenter.annualManualCost,
        formatter: fmtCurrency,
        icon: <DollarSign className="h-3 w-3" />,
      },
      {
        label: "Manual Cost (Claims)",
        value: claims.annualManualCost,
        formatter: fmtCurrency,
        icon: <DollarSign className="h-3 w-3" />,
      }
    );
  }

  return (
    <aside className="w-[220px] border-l border-border bg-card p-3 flex flex-col gap-2 overflow-y-auto shrink-0 hidden xl:flex">
      <span className="text-[9px] font-semibold uppercase tracking-[0.15em] reflect-gradient-text mb-1">
        Live Operational Impact
      </span>

      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`flex items-start gap-1.5 py-1.5 border-b border-border/50 last:border-0 ${
            kpi.highlight ? "reflect-border" : ""
          }`}
        >
          <span className="text-primary mt-0.5">{kpi.icon}</span>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] text-muted-foreground leading-tight truncate">{kpi.label}</span>
            <CountUpValue
              value={kpi.value}
              formatter={kpi.formatter}
              className="text-xs font-semibold font-mono text-foreground"
            />
          </div>
        </div>
      ))}

      <button className="mt-auto flex items-center justify-center gap-1.5 py-2 rounded reflect-gradient text-white text-[10px] font-semibold hover:opacity-90 transition-opacity">
        <Download className="h-3 w-3" />
        {mode === "internal" ? "Export Internal" : "Export TPA"}
      </button>
    </aside>
  );
}
