import type { HeatSource } from "../../shared/types";
import { HEAT_SOURCES_OHIO } from "./heat-sources-ohio";
import {
  searchPlacesByText,
  isLocationServiceConfigured,
} from "./location-service";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";

const BASE_WASTE_HEAT_MWH = 5000;

/**
 * Extract meaningful location tokens from a search query (e.g. "Toledo, Oh" -> ["toledo", "oh"]).
 * Used to match against source name/industry so "Toledo, Oh" matches "Toledo Glass Factory".
 */
function searchTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((t) => t.length > 0 && t !== "oh");
}

/**
 * Filter Ohio seed sources by search query.
 * Matches if name or industry contains any token from the query (e.g. "Toledo, Oh" -> match "Toledo").
 * If query is empty or only "ohio", returns all.
 */
function filterOhioSourcesByQuery(query: string): HeatSource[] {
  const tokens = searchTokens(query);
  if (tokens.length === 0 || (tokens.length === 1 && tokens[0] === "ohio"))
    return [...HEAT_SOURCES_OHIO];
  const nameLower = (s: HeatSource) => s.name.toLowerCase();
  const industryLower = (s: HeatSource) => s.industry.toLowerCase();
  return HEAT_SOURCES_OHIO.filter((s) =>
    tokens.some(
      (t) => nameLower(s).includes(t) || industryLower(s).includes(t)
    )
  );
}

/**
 * Returns heat sources for the backend API.
 * If Amazon Location Service is configured (PLACE_INDEX_NAME), returns places from search;
 * otherwise returns Ohio seed data filtered by locationSearchQuery so only the searched area shows.
 */
export async function getHeatSources(options?: {
  locationSearchQuery?: string;
}): Promise<HeatSource[]> {
  const query = options?.locationSearchQuery?.trim() ?? "";
  if (isLocationServiceConfigured() && query) {
    const places = await searchPlacesByText(options!.locationSearchQuery!, {
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
  return filterOhioSourcesByQuery(query);
}

/**
 * Resolve a single heat source by id. Uses seed data only (stable ids).
 */
export function getHeatSourceById(id: string): HeatSource | null {
  return HEAT_SOURCES_OHIO.find((s) => s.id === id) ?? null;
}
