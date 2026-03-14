import type { EnvironmentalImpact } from "../../../shared/types";
import type { CalculationAssumptions } from "../../../shared/types";
import { DEFAULT_ASSUMPTIONS } from "../../../shared/constants";

/**
 * Emissions reduction from recovered heat displacing conventional heat.
 */
export function estimateEmissionsReduction(
  annualEnergyRecoveredMWh: number,
  assumptions: CalculationAssumptions = DEFAULT_ASSUMPTIONS
): EnvironmentalImpact {
  const emissionsReductionTonsCo2PerYear =
    annualEnergyRecoveredMWh * assumptions.emissionsFactorTonsCo2PerMWh;
  return { emissionsReductionTonsCo2PerYear };
}
