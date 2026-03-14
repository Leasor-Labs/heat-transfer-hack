import type { HeatConsumer } from "../../shared/types";
import { HEAT_CONSUMERS_OHIO } from "./heat-consumers-ohio";
import {
  searchPlacesByText,
  isLocationServiceConfigured,
} from "./location-service";

const BASE_HEAT_DEMAND_MWH = 3000;

/**
 * Returns heat consumers for the backend API.
 * If Amazon Location Service is configured and a search query is provided,
 * augments with places from search; otherwise returns Ohio seed data.
 */
export async function getHeatConsumers(options?: {
  locationSearchQuery?: string;
}): Promise<HeatConsumer[]> {
  if (
    isLocationServiceConfigured() &&
    options?.locationSearchQuery?.trim()
  ) {
    const places = await searchPlacesByText(options.locationSearchQuery, {
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
  return [...HEAT_CONSUMERS_OHIO];
}

/**
 * Resolve a single heat consumer by id. Uses seed data only (stable ids).
 */
export function getHeatConsumerById(id: string): HeatConsumer | null {
  return HEAT_CONSUMERS_OHIO.find((c) => c.id === id) ?? null;
}
