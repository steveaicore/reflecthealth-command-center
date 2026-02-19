import { useDashboard } from "@/contexts/DashboardContext";
import { fmtCurrency, fmtDecimal, fmtNumber, fmtPct } from "@/lib/format";
import { MetricCard } from "./MetricCard";
import { FileText, Clock, Users, DollarSign } from "lucide-react";

export function Module2() {
  const { results, claimsParams, mode } = useDashboard();
  const { claims } = results;

  return (
    <div className="module-panel">
      <div className="module-header">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Module 2: Claims Automation & Margin Optimization
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="status-dot" />
          <span className="text-[10px] text-muted-foreground">Active</span>
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Annual Claims"
          value={fmtNumber(claims.annualClaims)}
          sub={`${fmtNumber(claims.manualReviewClaims)} manual review`}
          icon={<FileText className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="Annual Savings"
          value={fmtCurrency(claims.annualSavings)}
          trend="positive"
          icon={<DollarSign className="h-3.5 w-3.5" />}
        />
        <MetricCard
          label="FTE Saved"
          value={fmtDecimal(claims.fteSaved)}
          sub={`${fmtNumber(claims.annualManualHours)} hrs eliminated`}
          trend="positive"
          icon={<Users className="h-3.5 w-3.5" />}
        />
        {mode === "internal" ? (
          <MetricCard
            label="Annual Manual Cost"
            value={fmtCurrency(claims.annualManualCost)}
            sub={`@ $${claimsParams.fteHourlyCost}/hr`}
            icon={<Clock className="h-3.5 w-3.5" />}
          />
        ) : (
          <MetricCard
            label="AI Reduction Rate"
            value={fmtPct(claimsParams.aiLaborReductionPct)}
            sub="Labor automation"
            trend="positive"
            icon={<Clock className="h-3.5 w-3.5" />}
          />
        )}
      </div>

      <div className="px-5 pb-4">
        <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground leading-relaxed">
          <span className="font-mono text-foreground">{fmtPct(claimsParams.manualReviewPct)}</span> of
          claims flagged for manual review are processed at{" "}
          <span className="font-mono text-foreground">{claimsParams.manualTimeMin} min</span> per claim.
          Reflect AI reduces labor burden by{" "}
          <span className="font-mono text-foreground">{fmtPct(claimsParams.aiLaborReductionPct)}</span>,
          eliminating redundant adjudication cycles.
        </div>
      </div>
    </div>
  );
}
