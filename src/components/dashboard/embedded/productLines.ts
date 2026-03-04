export interface ProductLine {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string; // emoji
}

export const PRODUCT_LINES: ProductLine[] = [
  { id: "commercial", name: "Commercial Health Insurance", shortName: "Commercial", description: "Employer-sponsored and individual market health plans", icon: "🏥" },
  { id: "medicare", name: "Medicare (MA + FFS)", shortName: "Medicare", description: "Medicare Advantage and Fee-for-Service programs", icon: "🏛️" },
  { id: "medicaid", name: "Medicaid / Managed Medicaid", shortName: "Medicaid", description: "State Medicaid and managed care programs", icon: "🤝" },
  { id: "dual-eligible", name: "Dual Eligible (D-SNP)", shortName: "D-SNP", description: "Dual Special Needs Plans for Medicare-Medicaid enrollees", icon: "🔗" },
  { id: "workers-comp", name: "Workers' Comp (Medical + UR)", shortName: "Workers' Comp", description: "Workplace injury medical claims and utilization review", icon: "🦺" },
  { id: "pnc-bi", name: "P&C Bodily Injury + Medical Billing", shortName: "P&C / BI", description: "Auto/GL bodily injury with medical bill review", icon: "🚗" },
  { id: "disability", name: "Disability Insurance (STD/LTD)", shortName: "Disability", description: "Short-term and long-term disability claims", icon: "♿" },
  { id: "accident-health", name: "Accident & Health / Supplemental", shortName: "A&H", description: "Supplemental accident and health benefit plans", icon: "🩹" },
  { id: "life", name: "Life Insurance (EOI / APS / Labs)", shortName: "Life", description: "Life underwriting, evidence of insurability, and APS", icon: "📋" },
  { id: "vision", name: "Vision Insurance", shortName: "Vision", description: "Vision benefits including frames, lenses, and contacts", icon: "👁️" },
  { id: "dental", name: "Dental Insurance", shortName: "Dental", description: "Dental benefits including preventive, basic, major, and ortho", icon: "🦷" },
  { id: "travel", name: "Travel Insurance (Medical)", shortName: "Travel", description: "Emergency medical claims, evacuation, and provider bills", icon: "✈️" },
  { id: "stop-loss", name: "Stop-Loss / Reinsurance", shortName: "Stop-Loss", description: "High-cost claim adjudication and reinsurance support", icon: "🛡️" },
  { id: "group-benefits", name: "Group Benefits (Bundle)", shortName: "Group", description: "Bundled Dental/Vision/Disability/Life employer plans", icon: "👥" },
  { id: "employer-tpa", name: "Employer Health Plans / TPA", shortName: "TPA", description: "Third-party administrator operations for employer plans", icon: "🏢" },
  { id: "wc-pbm", name: "Workers' Comp PBM / Pharmacy", shortName: "WC Pharmacy", description: "Clinical prior auth, step therapy, and formulary management", icon: "💊" },
  { id: "specialty-bm", name: "Specialty Benefit Managers", shortName: "Specialty BM", description: "Radiology, Cardiology, PT, Lab benefit management", icon: "🔬" },
  { id: "pharmacy-benefit", name: "Pharmacy Benefit (PBM)", shortName: "Pharmacy", description: "Formulary management, pharmacy PA, step therapy, specialty Rx", icon: "💊" },
  { id: "medicare-part-d", name: "Medicare Part D", shortName: "Part D", description: "Medicare prescription drug plan coverage and formulary", icon: "🏛️" },
  { id: "medicaid-rx", name: "Medicaid Rx", shortName: "Medicaid Rx", description: "State Medicaid pharmacy benefit and preferred drug lists", icon: "🤝" },
];

export const DEFAULT_PRODUCT_LINE_ID = "medicare";

export function getProductLineById(id: string): ProductLine | undefined {
  return PRODUCT_LINES.find(p => p.id === id);
}
