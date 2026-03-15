import type { HeatSource } from "../../shared/types";
import {
  searchPlacesByKeywords,
  isLocationServiceConfigured,
  TOLEDO_OHIO_BBOX,
  geocodeAddress,
} from "./location-service";
import { haversineDistanceKm } from "../lib/calculations/distance";
import { HEAT_SOURCE_KEYWORDS } from "./search-keywords";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";
import { HEAT_SOURCES_TABLE } from "../api/dynamo";
import {
  fetchHeatSourcesFromDynamo,
  fetchHeatSourceByIdFromDynamo,
} from "../api/dynamo-heat-sources";

const BASE_WASTE_HEAT_MWH = 5000;

/**
 * Fetch heat sources from AWS Location Search (keywords + Toledo bbox, deduped).
 */
async function getToledoHeatSourcesFromAWS(): Promise<HeatSource[]> {
  const tagged = await searchPlacesByKeywords(HEAT_SOURCE_KEYWORDS, {
    maxResultsPerKeyword: 5,
    filterBBox: TOLEDO_OHIO_BBOX,
  });
  return tagged.map(({ place: p, keyword: industry }, i) => ({
    id: `location-source-${i}-${p.placeId}`,
    name: p.label || `Industrial site ${i + 1}`,
    industry,
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

/** Radius (km) for "exact address" search: return sources within this distance of the geocoded point. */
const ADDRESS_SEARCH_RADIUS_KM = 50;

/**
 * Returns heat sources within radius (km) of a point. Used when search is an exact address.
 */
function filterSourcesByDistance(
  list: HeatSource[],
  centerLat: number,
  centerLon: number,
  radiusKm: number
): HeatSource[] {
  return list.filter((s) => {
    const d = haversineDistanceKm(s.latitude, s.longitude, centerLat, centerLon);
    return d <= radiusKm;
  });
}

/**
 * Returns heat sources for the backend API.
 * Uses DynamoDB when configured; when location search is used and Location Service is available,
 * tries AWS first and falls back to DynamoDB (e.g. basic dataset) on failure or empty. No table => [].
 */
export async function getHeatSources(options?: {
  locationSearchQuery?: string;
}): Promise<HeatSource[]> {
  const query = options?.locationSearchQuery?.trim() ?? "";

  if (query && isLocationServiceConfigured()) {
    const coords = await geocodeAddress(query);
    if (coords) {
      const [lng, lat] = coords;
      let candidates: HeatSource[];
      try {
        const aws = await getToledoHeatSourcesFromAWS();
        candidates = aws.length > 0 ? aws : (HEAT_SOURCES_TABLE ? await fetchHeatSourcesFromDynamo() : []);
      } catch {
        candidates = HEAT_SOURCES_TABLE ? await fetchHeatSourcesFromDynamo() : [];
      }
      return filterSourcesByDistance(candidates, coords[1], coords[0], ADDRESS_SEARCH_RADIUS_KM);
    }
  }
  if (HEAT_SOURCES_TABLE) {
    return fetchHeatSourcesFromDynamo();
  }
  return [];
}

/**
 * Resolve a single heat source by id. Uses DynamoDB when configured; no table => null.
 */
export async function getHeatSourceById(id: string): Promise<HeatSource | null> {
  if (!HEAT_SOURCES_TABLE) return null;
  return fetchHeatSourceByIdFromDynamo(id);
}
