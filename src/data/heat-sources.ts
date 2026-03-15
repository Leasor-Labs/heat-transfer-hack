import type { HeatSource } from "../../shared/types";
import { HEAT_SOURCES_OHIO } from "./heat-sources-ohio";
import { filterOhioByQuery } from "./filter-ohio-by-query";
import {
  searchPlacesByText,
  isLocationServiceConfigured,
} from "./location-service";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";

const BASE_WASTE_HEAT_MWH = 5000;

/**
 * Returns heat sources for the backend API.
 * If Amazon Location Service is configured (PLACE_INDEX_NAME), optionally
 * augments with places from a search; otherwise returns Ohio seed data.
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
  return filterOhioByQuery(HEAT_SOURCES_OHIO, options?.locationSearchQuery);
}

/**
 * Resolve a single heat source by id. Uses seed data only (stable ids).
 */
export function getHeatSourceById(id: string): HeatSource | null {
  return HEAT_SOURCES_OHIO.find((s) => s.id === id) ?? null;
}
