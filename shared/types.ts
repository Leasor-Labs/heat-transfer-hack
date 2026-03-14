export type TemperatureClass = "low" | "medium" | "high";

export type HeatSource = {
  id: string;
  name: string;
  industry: string;
  latitude: number;
  longitude: number;
  estimatedWasteHeatMWhPerYear: number;
  recoverableHeatMWhPerYear: number;
  temperatureClass: TemperatureClass;
  operatingHoursPerYear: number;
};

export type HeatConsumer = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  annualHeatDemandMWh: number;
};

export type InfrastructureCostBreakdown = {
  pipelineCostUsd: number;
  heatExchangerCostUsd: number;
  pumpCostUsd: number;
  integrationCostUsd: number;
  totalInfrastructureCostUsd: number;
};

export type FinancialModel = {
  annualEnergyRecoveredMWh: number;
  annualSavingsUsd: number;
  paybackYears: number;
};

export type EnvironmentalImpact = {
  emissionsReductionTonsCo2PerYear: number;
};

export type HeatExchangeOpportunity = {
  id: string;
  sourceId: string;
  consumerId: string;
  distanceKm: number;
  estimatedWasteHeatMWhPerYear: number;
  recoverableHeatMWhPerYear: number;
  infrastructureCost: InfrastructureCostBreakdown;
  financialModel: FinancialModel;
  environmentalImpact: EnvironmentalImpact;
  feasibilityScore: number;
};

export type OpportunityRanking = {
  rank: number;
  opportunity: HeatExchangeOpportunity;
};

export type CalculationAssumptions = {
  wasteHeatFraction: number;
  recoveryFactor: number;
  pipelineCostPerKmUsd: number;
  heatValuePerMWhUsd: number;
  emissionsFactorTonsCo2PerMWh: number;
};
