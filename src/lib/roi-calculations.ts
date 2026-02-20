export interface CallCenterParams {
  monthlyCalls: number;
  handleTimeMin: number;
  agentCostHr: number;
  providerPct: number;
  eligiblePct: number;
  accuracyPct: number;
  aiProcessSavingsPct: number;
}

export interface ClaimsParams {
  monthlyClaims: number;
  manualReviewPct: number;
  manualTimeMin: number;
  fteHourlyCost: number;
  aiLaborReductionPct: number;
}

export interface PlatformParams {
  annualPlatformCost: number;
}

export interface ROIResults {
  callCenter: {
    annualManualCost: number;
    annualSavings: number;
    aiCost: number;
    fteSaved: number;
    annualHoursSaved: number;
  };
  claims: {
    annualClaims: number;
    manualReviewClaims: number;
    annualManualHours: number;
    annualManualCost: number;
    annualSavings: number;
    fteSaved: number;
  };
  combined: {
    totalAnnualSavings: number;
    roi: number;
    paybackMonths: number;
  };
}

export function calculateROI(
  call: CallCenterParams,
  claims: ClaimsParams,
  platform: PlatformParams
): ROIResults {
  // Call Center
  const callAnnualManualCost =
    call.monthlyCalls * 12 * (call.handleTimeMin / 60) * call.agentCostHr;
  const callAnnualSavings =
    callAnnualManualCost *
    call.providerPct *
    call.eligiblePct *
    call.accuracyPct *
    call.aiProcessSavingsPct;
  const callAiCost = callAnnualManualCost - callAnnualSavings;
  const callAnnualHoursSaved = callAnnualSavings / call.agentCostHr;
  const callFteSaved = callAnnualHoursSaved / 2080;

  // Claims
  const annualClaims = claims.monthlyClaims * 12;
  const manualReviewClaims = annualClaims * claims.manualReviewPct;
  const claimsAnnualManualHours = manualReviewClaims * (claims.manualTimeMin / 60);
  const claimsAnnualManualCost = claimsAnnualManualHours * claims.fteHourlyCost;
  const claimsAnnualSavings = claimsAnnualManualCost * claims.aiLaborReductionPct;
  const claimsFteSaved = (claimsAnnualSavings / claims.fteHourlyCost) / 2080;

  // Combined
  const totalAnnualSavings = callAnnualSavings + claimsAnnualSavings;
  const roi = platform.annualPlatformCost > 0 ? totalAnnualSavings / platform.annualPlatformCost : 0;
  const paybackMonths =
    totalAnnualSavings > 0
      ? (platform.annualPlatformCost / totalAnnualSavings) * 12
      : 0;

  return {
    callCenter: {
      annualManualCost: callAnnualManualCost,
      annualSavings: callAnnualSavings,
      aiCost: callAiCost,
      fteSaved: callFteSaved,
      annualHoursSaved: callAnnualHoursSaved,
    },
    claims: {
      annualClaims,
      manualReviewClaims,
      annualManualHours: claimsAnnualManualHours,
      annualManualCost: claimsAnnualManualCost,
      annualSavings: claimsAnnualSavings,
      fteSaved: claimsFteSaved,
    },
    combined: {
      totalAnnualSavings,
      roi,
      paybackMonths,
    },
  };
}

export type VolumePreset = "low" | "medium" | "high";

export const VOLUME_PRESETS: Record<VolumePreset, { calls: number; claims: number; platformCost?: number }> = {
  low: { calls: 20300, claims: 21000 },        // ~70% of medium
  medium: { calls: 29000, claims: 30000 },      // baseline
  high: { calls: 40600, claims: 42000, platformCost: 420000 }, // ~140% of medium, +20% platform
};
