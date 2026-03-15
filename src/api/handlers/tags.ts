import { HEAT_SOURCES_OHIO, HEAT_SOURCE_KEYWORDS } from "../../data/heat-sources";
import { HEAT_CONSUMERS_OHIO, HEAT_CONSUMER_KEYWORDS } from "../../data/heat-consumers";

export type GetTagsResponse = {
  industries: string[];
  categories: string[];
};

/**
 * Returns all unique tags (industries and categories) from the database system
 * for use in search autocomplete and filtering.
 */
export function handleGetTags(): GetTagsResponse {
  const industries = new Set<string>([
    ...HEAT_SOURCE_KEYWORDS,
    ...HEAT_SOURCES_OHIO.map((s) => s.industry).filter(Boolean),
  ]);
  const categories = new Set<string>([
    ...HEAT_CONSUMER_KEYWORDS,
    ...HEAT_CONSUMERS_OHIO.map((c) => c.category).filter(Boolean),
  ]);
  return {
    industries: Array.from(industries).sort(),
    categories: Array.from(categories).sort(),
  };
}
