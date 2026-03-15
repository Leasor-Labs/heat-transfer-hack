/**
 * Single source of truth for Location Service search phrases and tags base lists.
 * Used by heat-sources, heat-consumers, and tags handler.
 */

/** Search phrases for heat sources (AWS Location Service + tags industries base). */
export const HEAT_SOURCE_KEYWORDS = [
  "Factory",
  "Manufacturing",
  "Data Centers",
  "Steel Mills",
  "Glass Manufacturing",
  "Cold Storage",
  "Waste Water Treatment",
] as const;

/** Search phrases for heat consumers (AWS Location Service + tags categories base). */
export const HEAT_CONSUMER_KEYWORDS = [
  "Greenhouses",
  "Warehouses",
  "Food Processing",
  "Laundry",
] as const;
