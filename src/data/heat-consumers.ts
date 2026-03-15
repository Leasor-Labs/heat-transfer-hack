import type { HeatConsumer } from "../../shared/types";
import { HEAT_CONSUMERS_OHIO } from "./heat-consumers-ohio";
import {
  searchPlacesByText,
  isLocationServiceConfigured,
} from "./location-service";

const BASE_HEAT_DEMAND_MWH = 3000;

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
 * Returns heat consumers for the backend API.
 * If Amazon Location Service is configured, returns places from search;
 * otherwise returns Ohio seed data filtered by locationSearchQuery so only the searched area shows.
 */
export async function getHeatConsumers(options?: {
  locationSearchQuery?: string;
}): Promise<HeatConsumer[]> {
  const query = options?.locationSearchQuery?.trim() ?? "";
  if (isLocationServiceConfigured() && query) {
    const places = await searchPlacesByText(options!.locationSearchQuery!, {
      maxResults: 10,
    });
    if (places.length > 0) {
      return places.map((p, i) => ({
        id: `location-consumer-${i}-${p.placeId}`,
        name: p.label || `Consumer site ${i + 1}`,
        category: "Commercial",
        latitude: p.position[1],
        longitude: p.position[0],
        annualHeatDemandMWh: BASE_HEAT_DEMAND_MWH,
      }));
    }
  }
  return filterOhioConsumersByQuery(query);
}

/**
 * Resolve a single heat consumer by id. Uses seed data only (stable ids).
 */
export function getHeatConsumerById(id: string): HeatConsumer | null {
  return HEAT_CONSUMERS_OHIO.find((c) => c.id === id) ?? null;
}
