import { HEAT_SOURCES_OHIO, HEAT_SOURCE_KEYWORDS } from "../../data/heat-sources";
import { HEAT_CONSUMERS_OHIO, HEAT_CONSUMER_KEYWORDS } from "../../data/heat-consumers";
import { HEAT_SOURCES_TABLE, HEAT_CONSUMERS_TABLE } from "../dynamo";
import { fetchHeatSourcesFromDynamo } from "../dynamo-heat-sources";
import { fetchHeatConsumersFromDynamo } from "../dynamo-heat-consumers";

export type GetTagsResponse = {
  industries: string[];
  categories: string[];
};

/**
 * Returns all unique tags (industries and categories) from the database system
 * for use in search autocomplete and filtering. Uses DynamoDB when configured,
 * otherwise Ohio seed data.
 */
export async function handleGetTags(): Promise<GetTagsResponse> {
  let industries = new Set<string>(HEAT_SOURCE_KEYWORDS);
  let categories = new Set<string>(HEAT_CONSUMER_KEYWORDS);

  if (HEAT_SOURCES_TABLE) {
    const sources = await fetchHeatSourcesFromDynamo();
    sources.forEach((s) => s.industry && industries.add(s.industry));
  } else {
    HEAT_SOURCES_OHIO.forEach((s) => s.industry && industries.add(s.industry));
  }

  if (HEAT_CONSUMERS_TABLE) {
    const consumers = await fetchHeatConsumersFromDynamo();
    consumers.forEach((c) => c.category && categories.add(c.category));
  } else {
    HEAT_CONSUMERS_OHIO.forEach((c) => c.category && categories.add(c.category));
  }

  return {
    industries: Array.from(industries).sort(),
    categories: Array.from(categories).sort(),
  };
}
