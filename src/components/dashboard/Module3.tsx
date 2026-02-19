import { useDashboard } from "@/contexts/DashboardContext";
import { fmtCurrency, fmtDecimal } from "@/lib/format";
import { MetricCard } from "./MetricCard";
import { InsightCard } from "./LiveFeed";
import { CompetitiveIndex } from "./CompetitiveIndex";
import { TrendingUp, Clock, DollarSign } from "lucide-react";

export function Module3() {
  const { results, platformParams } = useDashboard();
  const { combined } = results;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      <InsightCard>
        Combined ROI of <span className="font-mono text-foreground">{fmtDecimal(combined.roi)}x</span> with 
        payback in <span className="font-mono text-foreground">{fmtDecimal(combined.paybackMonths)}</span> months — 
        no rip-and-replace required
      </InsightCard>

      <CompetitiveIndex />
    </div>
  );
}
