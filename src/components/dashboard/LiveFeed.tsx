import { useState, useEffect } from "react";
import { Phone, FileText, Zap } from "lucide-react";

const CALL_TYPES = [
  "Eligibility verification — BlueCross PPO",
  "Prior auth status — Aetna HMO",
  "Benefits inquiry — UHC Choice Plus",
  "Claim status follow-up — Cigna OAP",
  "Provider credentialing — Humana Gold",
  "Member ID card request — BCBS",
  "Referral authorization — Aetna",
  "COB verification — UHC",
];

const CLAIMS_ACTIVITY = [
  "Auto-adjudicated: Dental claim #DC-4821",
  "AI flagged: Duplicate billing #CB-1193",
  "Processed: DME authorization #DM-7744",
  "Completed: Pharmacy override #PH-3391",
  "Auto-routed: Out-of-network #ON-5582",
  "Verified: Pre-cert renewal #PC-2207",
];

function useRotatingFeed(items: string[], intervalMs: number) {
  const [current, setCurrent] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
      setKey((k) => k + 1);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, intervalMs]);

  return { item: items[current], key };
}

export function CallTicker() {
  const { item, key } = useRotatingFeed(CALL_TYPES, 3500);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded bg-secondary/50 border border-border">
      <Phone className="h-3 w-3 text-primary shrink-0" />
      <span key={key} className="text-[10px] text-muted-foreground feed-item-enter truncate">
        <span className="text-primary font-medium">Incoming:</span> {item}
      </span>
    </div>
  );
}

export function ClaimsFeed() {
  const { item, key } = useRotatingFeed(CLAIMS_ACTIVITY, 4200);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded bg-secondary/50 border border-border">
      <FileText className="h-3 w-3 text-primary shrink-0" />
      <span key={key} className="text-[10px] text-muted-foreground feed-item-enter truncate">
        {item}
      </span>
    </div>
  );
}

export function InsightCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded bg-secondary/40 border border-border">
      <Zap className="h-3 w-3 text-primary shrink-0 mt-0.5" />
      <span className="text-[10px] text-muted-foreground leading-relaxed">{children}</span>
    </div>
  );
}
