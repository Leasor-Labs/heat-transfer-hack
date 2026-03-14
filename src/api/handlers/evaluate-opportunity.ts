import type {
  EvaluateOpportunityRequest,
  EvaluateOpportunityResponse,
} from "../../../shared/api-contract";
import { getHeatSourceById } from "../../data/heat-sources";
import { getHeatConsumerById } from "../../data/heat-consumers";
import { evaluateOpportunity } from "../../lib/integration/evaluate-opportunity";

export async function handleEvaluateOpportunity(
  body: EvaluateOpportunityRequest
): Promise<EvaluateOpportunityResponse | null> {
  const { sourceId, consumerId } = body;
  if (!sourceId || !consumerId) return null;
  const source = getHeatSourceById(sourceId);
  const consumer = getHeatConsumerById(consumerId);
  if (!source || !consumer) return null;
  const opportunityId = `opp-${sourceId}-${consumerId}`;
  const opportunity = evaluateOpportunity(source, consumer, opportunityId);
  return { opportunity };
}
