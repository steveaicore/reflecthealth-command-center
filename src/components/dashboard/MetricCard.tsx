import { type ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  trend?: "positive" | "negative" | "neutral";
}

export function MetricCard({ label, value, sub, icon, trend }: MetricCardProps) {
  const trendClass =
    trend === "positive"
      ? "metric-positive"
      : trend === "negative"
      ? "metric-negative"
      : "";

  return (
    <div className="metric-card flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="metric-label">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <span className={`metric-value ${trendClass}`}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}
