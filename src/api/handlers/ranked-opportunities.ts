import type { GetRankedOpportunitiesResponse } from "../../../shared/api-contract";
import type { OpportunityRanking } from "../../../shared/types";
import { getHeatSources } from "../../data/heat-sources";
import { getHeatConsumers } from "../../data/heat-consumers";
import { evaluateOpportunity } from "../../lib/integration/evaluate-opportunity";
import { haversineDistanceKm } from "../../lib/calculations/distance";

/**
 * Returns all opportunities from heat sources and consumers (DynamoDB when configured, else Ohio seed), ranked by feasibility score (desc).
 */
export async function handleGetRankedOpportunities(): Promise<GetRankedOpportunitiesResponse> {
  const [sourcesList, consumersList] = await Promise.all([
    getHeatSources(),
    getHeatConsumers(),
  ]);
  const sources = sourcesList;
  const consumers = consumersList;
  const opportunities: OpportunityRanking[] = [];
  const MAX_DISTANCE_KM = 50;
  for (const source of sources) {
    for (const consumer of consumers) {
      // Only consider pairs within 50 km
      const dist = haversineDistanceKm(
        source.latitude,
        source.longitude,
        consumer.latitude,
        consumer.longitude
      );
      if (dist > MAX_DISTANCE_KM) continue;
      const opportunityId = `opp-${source.id}-${consumer.id}`;
      const opportunity = evaluateOpportunity(source, consumer, opportunityId);
      opportunities.push({ rank: 0, opportunity });
    }
  }
  opportunities.sort(
    (a, b) => b.opportunity.feasibilityScore - a.opportunity.feasibilityScore
  );
  opportunities.forEach((o, i) => {
    o.rank = i + 1;
  });
  return { rankings: opportunities };
}
