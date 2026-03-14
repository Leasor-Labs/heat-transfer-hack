import type { HeatConsumer } from "../../shared/types";
import { HEAT_CONSUMERS_OHIO } from "./heat-consumers-ohio";
import {
  searchPlacesByText,
  isLocationServiceConfigured,
} from "./location-service";

const BASE_HEAT_DEMAND_MWH = 3000;

/**
 * Filter Ohio seed consumers by search query (name/category contains query).
 * If query is "ohio" (or empty after trim), returns all; otherwise filters by substring match.
 */
function filterOhioConsumersByQuery(query: string): HeatConsumer[] {
  const q = query.trim().toLowerCase();
  if (!q || q === "ohio") return [...HEAT_CONSUMERS_OHIO];
  return HEAT_CONSUMERS_OHIO.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
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
