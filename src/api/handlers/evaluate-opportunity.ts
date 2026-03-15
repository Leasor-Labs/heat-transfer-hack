import type { EvaluateOpportunityResponse } from "../../../shared/api-contract";
import { getHeatSourceById } from "../../data/heat-sources";
import { getHeatConsumerById } from "../../data/heat-consumers";
import { evaluateOpportunity } from "../../lib/integration/evaluate-opportunity";

export async function handleEvaluateOpportunity(
  body: { sourceId?: string; consumerId?: string }
): Promise<EvaluateOpportunityResponse | null> {
  const { sourceId, consumerId } = body;
  if (!sourceId || !consumerId) return null;
  const source = await getHeatSourceById(sourceId);
  const consumer = await getHeatConsumerById(consumerId);
  if (!source || !consumer) return null;
  const opportunityId = `opp-${sourceId}-${consumerId}`;
  const opportunity = evaluateOpportunity(source, consumer, opportunityId);
  return { opportunity };
}
