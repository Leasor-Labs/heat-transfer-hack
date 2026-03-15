import type { GetRankedOpportunitiesResponse } from "../../../shared/api-contract";
import type { OpportunityRanking } from "../../../shared/types";
import { HEAT_SOURCES_OHIO } from "../../data/heat-sources-ohio";
import { HEAT_CONSUMERS_OHIO } from "../../data/heat-consumers-ohio";
import { filterOhioByQuery } from "../../data/filter-ohio-by-query";
import { evaluateOpportunity } from "../../lib/integration/evaluate-opportunity";

/**
 * Returns opportunities from seed sources and consumers, ranked by feasibility score (desc).
 * Optional locationSearchQuery filters to sources/consumers whose name contains the query.
 */
export async function handleGetRankedOpportunities(options?: {
  locationSearchQuery?: string;
}): Promise<GetRankedOpportunitiesResponse> {
  const sources = filterOhioByQuery(
    HEAT_SOURCES_OHIO,
    options?.locationSearchQuery
  );
  const consumers = filterOhioByQuery(
    HEAT_CONSUMERS_OHIO,
    options?.locationSearchQuery
  );
  const opportunities: OpportunityRanking[] = [];
  for (const source of sources) {
    for (const consumer of consumers) {
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
