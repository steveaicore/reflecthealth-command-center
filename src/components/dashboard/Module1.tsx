import { useDashboard } from "@/contexts/DashboardContext";
import { fmtCurrency, fmtDecimal, fmtNumber, fmtPct } from "@/lib/format";
import { MetricCard } from "./MetricCard";
import { Phone, Users, Zap, TrendingDown } from "lucide-react";

export function Module1() {
  const { results, callParams, mode } = useDashboard();
  const { callCenter } = results;

  return (
    <div className="module-panel">
      <div className="module-header">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Module 1: Member & Provider Contact Intelligence
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="status-dot" />
          <span className="text-[10px] text-muted-foreground">Active</span>
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Monthly Calls"
          value={fmtNumber(callParams.monthlyCalls)}
          icon={<Phone className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Annual Savings"
          value={fmtCurrency(callCenter.annualSavings)}
          trend="positive"
          icon={<Zap className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="FTE Saved"
          value={fmtDecimal(callCenter.fteSaved)}
          sub={`${fmtNumber(callCenter.annualHoursSaved)} hrs/yr`}
          trend="positive"
          icon={<Users className="h-3.5 w-3.5" />}
        />
        {mode === "internal" ? (
          <MetricCard
            label="Annual Manual Cost"
            value={fmtCurrency(callCenter.annualManualCost)}
            sub={`AI Cost: ${fmtCurrency(callCenter.aiCost)}`}
            icon={<TrendingDown className="h-3.5 w-3.5" />}
          />
        ) : (
          <MetricCard
            label="Efficiency Gain"
            value={fmtPct(callParams.aiProcessSavingsPct)}
            sub="AI automation rate"
            trend="positive"
            icon={<Zap className="h-3.5 w-3.5" />}
          />
        )}
      </div>

      <div className="px-5 pb-4">
        <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground leading-relaxed">
          Provider-directed calls are filtered for eligibility, verified at{" "}
          <span className="font-mono text-foreground">{fmtPct(callParams.accuracyPct)}</span> accuracy,
          and processed through Reflect's AI engine at{" "}
          <span className="font-mono text-foreground">{fmtPct(callParams.aiProcessSavingsPct)}</span>{" "}
          automation yield. Handle time reduced from{" "}
          <span className="font-mono text-foreground">{callParams.handleTimeMin} min</span> baseline.
        </div>
      </div>
    </div>
  );
}
