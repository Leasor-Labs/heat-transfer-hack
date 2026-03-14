import type {
  HeatSource,
  HeatConsumer,
  HeatExchangeOpportunity,
} from "../../../shared/types";
import { haversineDistanceKm } from "../calculations/distance";
import { estimateInfrastructureCost } from "../calculations/infrastructure-cost";
import { computeFinancialModel } from "../calculations/financial-model";
import { estimateEmissionsReduction } from "../calculations/emissions";
import { computeFeasibilityScore } from "../scoring/feasibility-score";

/**
 * Builds a full HeatExchangeOpportunity from source and consumer.
 * Order: distance → infrastructure cost → financial model → emissions → feasibility score.
 */
export function evaluateOpportunity(
  source: HeatSource,
  consumer: HeatConsumer,
  opportunityId: string
): HeatExchangeOpportunity {
  const distanceKm = haversineDistanceKm(
    source.latitude,
    source.longitude,
    consumer.latitude,
    consumer.longitude
  );
  const infrastructureCost = estimateInfrastructureCost(distanceKm);
  const financialModel = computeFinancialModel(
    source.recoverableHeatMWhPerYear,
    consumer.annualHeatDemandMWh,
    infrastructureCost.totalInfrastructureCostUsd
  );
  const environmentalImpact = estimateEmissionsReduction(
    financialModel.annualEnergyRecoveredMWh
  );
  const opportunityWithoutScore: Omit<
    HeatExchangeOpportunity,
    "feasibilityScore"
  > = {
    id: opportunityId,
    sourceId: source.id,
    consumerId: consumer.id,
    distanceKm,
    estimatedWasteHeatMWhPerYear: source.estimatedWasteHeatMWhPerYear,
    recoverableHeatMWhPerYear: source.recoverableHeatMWhPerYear,
    infrastructureCost,
    financialModel,
    environmentalImpact,
  };
  const feasibilityScore = computeFeasibilityScore(opportunityWithoutScore);
  return { ...opportunityWithoutScore, feasibilityScore };
}
