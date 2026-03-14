import type { InfrastructureCostBreakdown } from "../../../shared/types";
import type { CalculationAssumptions } from "../../../shared/types";
import { DEFAULT_ASSUMPTIONS } from "../../../shared/constants";

/**
 * Estimate infrastructure cost from distance and assumptions.
 * Pipeline cost = distanceKm * pipelineCostPerKmUsd; rest split from a fixed ratio.
 */
export function estimateInfrastructureCost(
  distanceKm: number,
  assumptions: CalculationAssumptions = DEFAULT_ASSUMPTIONS
): InfrastructureCostBreakdown {
  const pipelineCostUsd = distanceKm * assumptions.pipelineCostPerKmUsd;
  const heatExchangerCostUsd = pipelineCostUsd * 0.4;
  const pumpCostUsd = pipelineCostUsd * 0.2;
  const integrationCostUsd = pipelineCostUsd * 0.3;
  const totalInfrastructureCostUsd =
    pipelineCostUsd + heatExchangerCostUsd + pumpCostUsd + integrationCostUsd;
  return {
    pipelineCostUsd,
    heatExchangerCostUsd,
    pumpCostUsd,
    integrationCostUsd,
    totalInfrastructureCostUsd,
  };
}
