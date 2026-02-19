import { useDashboard } from "@/contexts/DashboardContext";
import { fmtCurrency, fmtDecimal } from "@/lib/format";
import { BarChart3, X } from "lucide-react";

const BENCHMARKS = [
  { name: "Legacy TPA Manual", savingsMultiple: 0, paybackMonths: Infinity, roiMultiple: 0 },
  { name: "Basic RPA Tools", savingsMultiple: 0.25, paybackMonths: 18, roiMultiple: 1.2 },
  { name: "Point AI Solutions", savingsMultiple: 0.5, paybackMonths: 10, roiMultiple: 2.5 },
];

export function CompetitiveIndex() {
  const { competitiveIndexOpen, setCompetitiveIndexOpen, results } = useDashboard();
  const { combined } = results;

  if (!competitiveIndexOpen) {
    return (
      <button
        onClick={() => setCompetitiveIndexOpen(true)}
        className="module-panel p-4 flex items-center gap-2 hover:bg-secondary/50 transition-colors cursor-pointer w-full"
      >
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">TPA Competitive Index</span>
        <span className="text-[10px] text-muted-foreground ml-auto">Click to expand</span>
      </button>
    );
  }

  return (
    <div className="module-panel">
      <div className="module-header">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">TPA Competitive Index</h2>
        </div>
        <button onClick={() => setCompetitiveIndexOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5">
        <div className="space-y-3">
          {/* Reflect row */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex-1">
              <span className="text-sm font-semibold text-primary">Reflect AI Platform</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-semibold text-foreground">
                {fmtCurrency(combined.totalAnnualSavings)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {fmtDecimal(combined.roi)}x ROI · {fmtDecimal(combined.paybackMonths)} mo payback
              </div>
            </div>
          </div>

          {BENCHMARKS.map((b) => (
            <div key={b.name} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="flex-1">
                <span className="text-sm text-muted-foreground">{b.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-muted-foreground">
                  {b.savingsMultiple === 0
                    ? "$0"
                    : fmtCurrency(combined.totalAnnualSavings * b.savingsMultiple)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {b.roiMultiple}x ROI · {b.paybackMonths === Infinity ? "N/A" : `${b.paybackMonths} mo`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
