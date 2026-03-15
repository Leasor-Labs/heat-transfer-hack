import type { HeatConsumer } from "../../shared/types";
import { HEAT_CONSUMERS_OHIO } from "./heat-consumers-ohio";
import {
  searchPlacesByText,
  isLocationServiceConfigured,
} from "./location-service";
import { HEAT_CONSUMERS_TABLE } from "../api/dynamo";
import {
  fetchHeatConsumersFromDynamo,
  fetchHeatConsumerByIdFromDynamo,
} from "../api/dynamo-heat-consumers";

const BASE_HEAT_DEMAND_MWH = 3000;

/**
 * Returns heat consumers for the backend API.
 * When DynamoDB is configured (HEAT_CONSUMERS_TABLE), uses DynamoDB unless
 * Location search is requested and configured. Otherwise returns Ohio seed data.
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
  if (HEAT_CONSUMERS_TABLE) {
    return fetchHeatConsumersFromDynamo();
  }
  return [...HEAT_CONSUMERS_OHIO];
}

/**
 * Resolve a single heat consumer by id. Uses DynamoDB when configured, else Ohio seed.
 */
export async function getHeatConsumerById(id: string): Promise<HeatConsumer | null> {
  if (HEAT_CONSUMERS_TABLE) {
    const fromDynamo = await fetchHeatConsumerByIdFromDynamo(id);
    if (fromDynamo) return fromDynamo;
  }
  return HEAT_CONSUMERS_OHIO.find((c) => c.id === id) ?? null;
}
