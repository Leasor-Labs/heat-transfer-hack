import type {
  RankedOpportunitiesInRangeRequest,
  RankedOpportunitiesInRangeResponse,
} from "../../../shared/api-contract";
import type { OpportunityRanking } from "../../../shared/types";
import { getHeatSourceById } from "../../data/heat-sources";
import { getHeatConsumerById } from "../../data/heat-consumers";
import { evaluateOpportunity } from "../../lib/integration/evaluate-opportunity";
import { computeBestScore } from "../../lib/scoring/best-score";

/**
 * Returns ranked opportunities for a single source + list of consumers, or a single
 * consumer + list of sources. Uses the Best Score formula for ranking (see
 * computeBestScore). Used by the frontend for in-range (e.g. 2 km) opposing pairs.
 */
export async function handleRankedOpportunitiesInRange(
  body: RankedOpportunitiesInRangeRequest
): Promise<RankedOpportunitiesInRangeResponse> {
  const pairs: { sourceId: string; consumerId: string }[] = [];

  if (body.sourceId && body.consumerIds?.length) {
    for (const consumerId of body.consumerIds) {
      pairs.push({ sourceId: body.sourceId, consumerId });
    }
  } else if (body.consumerId && body.sourceIds?.length) {
    for (const sourceId of body.sourceIds) {
      pairs.push({ sourceId, consumerId: body.consumerId });
    }
  }

  const rankings: OpportunityRanking[] = [];

  for (const { sourceId, consumerId } of pairs) {
    const source = await getHeatSourceById(sourceId);
    const consumer = await getHeatConsumerById(consumerId);
    if (!source || !consumer) continue;

    const opportunityId = `opp-${sourceId}-${consumerId}`;
    const opportunity = evaluateOpportunity(source, consumer, opportunityId);
    const bestScore = computeBestScore(opportunity);
    rankings.push({ rank: 0, opportunity, bestScore });
  }

  rankings.sort(
    (a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0)
  );
  rankings.forEach((r, i) => {
    r.rank = i + 1;
  });

  return { rankings };
}
