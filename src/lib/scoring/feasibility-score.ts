import type { HeatExchangeOpportunity } from "../../../shared/types";

/**
 * Feasibility Score must be computed after the financial model (cost, savings, emissions).
 * Composite of payback, savings, emissions, distance and recoverable heat.
 * Returns a 0–100 score; higher = more feasible.
 */
export function computeFeasibilityScore(
  opportunity: Omit<
    HeatExchangeOpportunity,
    "feasibilityScore"
  >
): number {
  const payback = opportunity.financialModel.paybackYears;
  const savings = opportunity.financialModel.annualSavingsUsd;
  const cost = opportunity.infrastructureCost.totalInfrastructureCostUsd;
  const emissions =
    opportunity.environmentalImpact.emissionsReductionTonsCo2PerYear;
  const distanceKm = opportunity.distanceKm;
  const recoverable = opportunity.recoverableHeatMWhPerYear;

  let score = 50;
  if (payback > 0 && payback < 20) score += Math.max(0, 25 - payback);
  if (savings > 0) score += Math.min(15, savings / 100000);
  if (cost > 0 && savings / cost > 0.05) score += 10;
  if (emissions > 0) score += Math.min(10, emissions / 100);
  if (distanceKm < 10) score += 5;
  if (recoverable > 1000) score += 5;
  return Math.round(Math.min(100, Math.max(0, score)));
}
