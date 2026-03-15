import type { HeatExchangeOpportunity } from "../../../shared/types";
import { computeFeasibilityScore } from "./feasibility-score";

/**
 * Best Score formula: used to rank in-range (e.g. 2 km) opposing heat types.
 * This is the pluggable spot for a custom formula; default mirrors feasibility score.
 *
 * Replace the body of this function to use your own formula (e.g. distance-weighted,
 * cost-only, emissions-priority). Input is the full opportunity (distance, cost,
 * financial model, emissions). Return a number; higher = better for ranking.
 */
export function computeBestScore(
  opportunity: HeatExchangeOpportunity
): number {
  // --- Formula spot: replace or extend the logic below ---
  const feasibility = computeFeasibilityScore(opportunity);

  // Optional: add in-range-specific factors (e.g. bonus for very short distance)
  const distanceBonus =
    opportunity.distanceKm <= 2 ? 5 : opportunity.distanceKm <= 5 ? 2 : 0;

  return Math.round(
    Math.min(100, Math.max(0, feasibility + distanceBonus))
  );
}
