import type { HeatConsumer } from "../../shared/types";
import { HEAT_CONSUMERS_OHIO } from "./heat-consumers-ohio";
import {
  searchPlacesByText,
  isLocationServiceConfigured,
  TOLEDO_OHIO_BBOX,
} from "./location-service";
import type { PlaceResult } from "./location-service";

const BASE_HEAT_DEMAND_MWH = 3000;

/** Search phrases for heat consumers in Toledo, OH (AWS Location Service). */
const HEAT_CONSUMER_KEYWORDS = [
  "Greenhouses",
  "Warehouses",
  "Food Processing",
  "Laundry",
] as const;

/**
 * Extract meaningful location tokens from a search query (e.g. "Toledo, Oh" -> ["toledo", "oh"]).
 */
function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length > 0 && t !== "oh");
}

/**
 * Filter Ohio seed consumers by search query.
 * Matches if name or category contains any token (e.g. "Toledo, Oh" -> match "Toledo").
 */
function filterOhioConsumersByQuery(query: string): HeatConsumer[] {
  const tokens = searchTokens(query);
  if (tokens.length === 0 || (tokens.length === 1 && tokens[0] === "ohio"))
    return [...HEAT_CONSUMERS_OHIO];
  const nameLower = (c: HeatConsumer) => c.name.toLowerCase();
  const categoryLower = (c: HeatConsumer) => c.category.toLowerCase();
  return HEAT_CONSUMERS_OHIO.filter((c) =>
    tokens.some(
      (t) => nameLower(c).includes(t) || categoryLower(c).includes(t)
    )
  );
}

/**
 * Fetch real Toledo heat consumers from AWS: one search per keyword, aggregate and dedupe by placeId.
 */
async function getToledoHeatConsumersFromAWS(): Promise<HeatConsumer[]> {
  const seen = new Set<string>();
  const withKeyword: Array<{ place: PlaceResult; category: string }> = [];
  for (const keyword of HEAT_CONSUMER_KEYWORDS) {
    const places = await searchPlacesByText(keyword, {
      maxResults: 5,
      filterBBox: TOLEDO_OHIO_BBOX,
    });
    for (const p of places) {
      if (seen.has(p.placeId)) continue;
      seen.add(p.placeId);
      withKeyword.push({ place: p, category: keyword });
    }
  }
  return withKeyword.map(({ place: p, category }, i) => ({
    id: `location-consumer-${i}-${p.placeId}`,
    name: p.label || `Consumer site ${i + 1}`,
    category,
    latitude: p.position[1],
    longitude: p.position[0],
    annualHeatDemandMWh: BASE_HEAT_DEMAND_MWH,
  }));
}

/**
 * Returns heat consumers for the backend API.
 * If Amazon Location Service is configured, returns real Toledo places from keyword searches;
 * otherwise returns Ohio seed data filtered by locationSearchQuery.
 */
export async function getHeatConsumers(options?: {
  locationSearchQuery?: string;
}): Promise<HeatConsumer[]> {
  const query = options?.locationSearchQuery?.trim() ?? "";
  if (isLocationServiceConfigured()) {
    const toledoConsumers = await getToledoHeatConsumersFromAWS();
    if (toledoConsumers.length > 0) return toledoConsumers;
  }
  return filterOhioConsumersByQuery(query);
}

/**
 * Resolve a single heat consumer by id. Uses seed data only (stable ids).
 */
export function getHeatConsumerById(id: string): HeatConsumer | null {
  return HEAT_CONSUMERS_OHIO.find((c) => c.id === id) ?? null;
}
