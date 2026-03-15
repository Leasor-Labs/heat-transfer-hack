import { HEAT_SOURCE_KEYWORDS, HEAT_CONSUMER_KEYWORDS } from "../../data/search-keywords";
import { HEAT_SOURCES_TABLE, HEAT_CONSUMERS_TABLE } from "../dynamo";
import { fetchHeatSourcesFromDynamo } from "../dynamo-heat-sources";
import { fetchHeatConsumersFromDynamo } from "../dynamo-heat-consumers";

export type GetTagsResponse = {
  industries: string[];
  categories: string[];
};

/**
 * Returns all unique tags (industries and categories) from DynamoDB
 * for use in search autocomplete and filtering. Seeds with shared keywords as base.
 */
export async function handleGetTags(): Promise<GetTagsResponse> {
  const industries = new Set<string>(HEAT_SOURCE_KEYWORDS);
  const categories = new Set<string>(HEAT_CONSUMER_KEYWORDS);

  if (HEAT_SOURCES_TABLE) {
    const sources = await fetchHeatSourcesFromDynamo();
    sources.forEach((s) => s.industry && industries.add(s.industry));
  }

  if (HEAT_CONSUMERS_TABLE) {
    const consumers = await fetchHeatConsumersFromDynamo();
    consumers.forEach((c) => c.category && categories.add(c.category));
  }

  return {
    industries: Array.from(industries).sort(),
    categories: Array.from(categories).sort(),
  };
}
