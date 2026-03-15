import type { HeatSource } from "../../shared/types";
import { HEAT_SOURCES_OHIO } from "./heat-sources-ohio";
import {
  searchPlacesByText,
  isLocationServiceConfigured,
} from "./location-service";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";
import { HEAT_SOURCES_TABLE } from "../api/dynamo";
import {
  fetchHeatSourcesFromDynamo,
  fetchHeatSourceByIdFromDynamo,
} from "../api/dynamo-heat-sources";

const BASE_WASTE_HEAT_MWH = 5000;

/**
 * Returns heat sources for the backend API.
 * When DynamoDB is configured (HEAT_SOURCES_TABLE), uses DynamoDB unless
 * Location search is requested and configured. Otherwise returns Ohio seed data.
 */
export async function getHeatSources(options?: {
  locationSearchQuery?: string;
}): Promise<HeatSource[]> {
  if (
    isLocationServiceConfigured() &&
    options?.locationSearchQuery?.trim()
  ) {
    const places = await searchPlacesByText(options.locationSearchQuery, {
      maxResults: 10,
    });
    if (places.length > 0) {
      return places.map((p, i) => ({
        id: `location-source-${i}-${p.placeId}`,
        name: p.label || `Industrial site ${i + 1}`,
        industry: "Industrial",
        latitude: p.position[1],
        longitude: p.position[0],
        estimatedWasteHeatMWhPerYear:
          BASE_WASTE_HEAT_MWH * DEFAULT_ASSUMPTIONS.wasteHeatFraction,
        recoverableHeatMWhPerYear:
          BASE_WASTE_HEAT_MWH *
          DEFAULT_ASSUMPTIONS.wasteHeatFraction *
          DEFAULT_ASSUMPTIONS.recoveryFactor,
        temperatureClass: "medium" as const,
        operatingHoursPerYear: 8760,
      }));
    }
  }
  if (HEAT_SOURCES_TABLE) {
    return fetchHeatSourcesFromDynamo();
  }
  return [...HEAT_SOURCES_OHIO];
}

/**
 * Resolve a single heat source by id. Uses DynamoDB when configured, else Ohio seed.
 */
export async function getHeatSourceById(id: string): Promise<HeatSource | null> {
  if (HEAT_SOURCES_TABLE) {
    const fromDynamo = await fetchHeatSourceByIdFromDynamo(id);
    if (fromDynamo) return fromDynamo;
  }
  return HEAT_SOURCES_OHIO.find((s) => s.id === id) ?? null;
}
