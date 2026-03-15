/**
 * Shared query parsing for location search (used by heat-sources and heat-consumers).
 */

/**
 * Extract meaningful location tokens from a search query (e.g. "Toledo, Oh" -> ["toledo", "oh"]).
 * Used to match against name/category/industry in seed data.
 */
export function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length > 0 && t !== "oh");
}
