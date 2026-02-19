import { useDashboard } from "@/contexts/DashboardContext";
import { fmtCurrency, fmtDecimal } from "@/lib/format";
import { MetricCard } from "./MetricCard";
import { Globe, TrendingUp, Clock, DollarSign } from "lucide-react";

export function Module3() {
  const { results, platformParams } = useDashboard();
  const { combined } = results;

  return (
    <div className="module-panel">
      <div className="module-header">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Module 3: Network & Marketplace Connectivity
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="status-dot" />
          <span className="text-[10px] text-muted-foreground">Active</span>
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Annual Savings"
          value={fmtCurrency(combined.totalAnnualSavings)}
          trend="positive"
          icon={<DollarSign className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="ROI Multiple"
          value={`${fmtDecimal(combined.roi)}x`}
          sub={`On ${fmtCurrency(platformParams.annualPlatformCost)} investment`}
          trend="positive"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Payback Period"
          value={`${fmtDecimal(combined.paybackMonths)} mo`}
          sub="Time to full recovery"
          trend="positive"
          icon={<Clock className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Platform Cost"
          value={fmtCurrency(platformParams.annualPlatformCost)}
          sub="Annual investment"
          icon={<DollarSign className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="px-5 pb-4">
        <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground leading-relaxed">
          Combined call center and claims automation delivers{" "}
          <span className="font-mono text-foreground">{fmtDecimal(combined.roi)}x</span> ROI
          with full payback in{" "}
          <span className="font-mono text-foreground">{fmtDecimal(combined.paybackMonths)}</span> months.
          No rip-and-replace — deploys within existing TPA workflows.
        </div>
      </div>
    </div>
  );
}
