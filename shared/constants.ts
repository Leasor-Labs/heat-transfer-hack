export const TEMPERATURE_CLASSES = ["low", "medium", "high"] as const;

export const DEFAULT_ASSUMPTIONS = {
  wasteHeatFraction: 0.3,
  recoveryFactor: 0.5,
  pipelineCostPerKmUsd: 1300000,
  heatValuePerMWhUsd: 50,
  emissionsFactorTonsCo2PerMWh: 0.2,
} as const;

export const METRIC_KEYS = {
  INFRASTRUCTURE_COST: "totalInfrastructureCostUsd",
  ANNUAL_SAVINGS: "annualSavingsUsd",
  EMISSIONS_REDUCTION: "emissionsReductionTonsCo2PerYear",
  FEASIBILITY_SCORE: "feasibilityScore",
} as const;
