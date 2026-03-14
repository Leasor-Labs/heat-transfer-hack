import type { FinancialModel } from "../../../shared/types";
import type { CalculationAssumptions } from "../../../shared/types";
import { DEFAULT_ASSUMPTIONS } from "../../../shared/constants";

/**
 * Annual energy recovered is capped by consumer demand and source recoverable heat.
 */
export function computeFinancialModel(
  recoverableHeatMWhPerYear: number,
  consumerDemandMWh: number,
  totalInfrastructureCostUsd: number,
  assumptions: CalculationAssumptions = DEFAULT_ASSUMPTIONS
): FinancialModel {
  const annualEnergyRecoveredMWh = Math.min(
    recoverableHeatMWhPerYear,
    consumerDemandMWh
  );
  const annualSavingsUsd =
    annualEnergyRecoveredMWh * assumptions.heatValuePerMWhUsd;
  const paybackYears =
    annualSavingsUsd > 0
      ? totalInfrastructureCostUsd / annualSavingsUsd
      : Infinity;
  return {
    annualEnergyRecoveredMWh,
    annualSavingsUsd,
    paybackYears: Number.isFinite(paybackYears) ? paybackYears : 0,
  };
}
