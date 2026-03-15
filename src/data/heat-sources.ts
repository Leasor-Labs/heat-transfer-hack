import type { GetHeatSourcesResponse } from "../../shared/api-contract";
import type { HeatSource } from "../../shared/types";
import {
  searchPlacesByText,
  isLocationServiceConfigured,
  TOLEDO_OHIO_BBOX,
  geocodeAddress,
  searchPlacesByKeywords,
} from "./location-service";
import { haversineDistanceKm } from "../lib/calculations/distance";
import { HEAT_SOURCE_KEYWORDS } from "./search-keywords";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";
import { HEAT_SOURCES_TABLE } from "../api/dynamo";
import {
  fetchHeatSourcesFromDynamo,
  fetchHeatSourceByIdFromDynamo,
} from "../api/dynamo-heat-sources";
import { FALLBACK_HEAT_SOURCES } from "./fallback-seed-data";

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

/** Convert AWS Location place results to HeatSource with default heat values. */
function placesToHeatSources(
  places: Array<{ placeId: string; label: string; position: [number, number] }>,
  industry = "Industrial"
): HeatSource[] {
  return places.map((p, i) => ({
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

/** Filter backup heat sources by keyword (name or industry). */
function filterFallbackSourcesByKeyword(
  keyword: string,
  list: HeatSource[] = FALLBACK_HEAT_SOURCES
): HeatSource[] {
  const k = keyword.trim().toLowerCase();
  if (!k) return list;
  return list.filter(
    (s) =>
      (s.name && s.name.toLowerCase().includes(k)) ||
      (s.industry && s.industry.toLowerCase().includes(k))
  );
}

async function getHeatSourcesFromDynamoOrFallback(
  query: string | undefined
): Promise<HeatSource[]> {
  if (HEAT_SOURCES_TABLE) {
    try {
      const fromDynamo = await fetchHeatSourcesFromDynamo();
      if (fromDynamo.length > 0) {
        return fromDynamo;
      }
    } catch {
      // ignore and fall through to in-memory fallback
    }
  }
  return query ? filterFallbackSourcesByKeyword(query) : FALLBACK_HEAT_SOURCES;
}

/**
 * Returns heat sources for the backend API.
 * When search query is present and AWS Location is configured: searches places by keyword;
 * on communication failure returns errorCode 25. When AWS is not configured, filters backup data by keyword.
 */
export async function getHeatSources(options?: {
  locationSearchQuery?: string;
}): Promise<GetHeatSourcesResponse> {
  const query = options?.locationSearchQuery?.trim() ?? "";

  if (query && isLocationServiceConfigured()) {
    try {
      const places = await searchPlacesByText(query, {
        maxResults: 20,
        filterBBox: TOLEDO_OHIO_BBOX,
      });
      if (places.length > 0) {
        const heatSources = placesToHeatSources(places, query);
        return { heatSources };
      }
      const coords = await geocodeAddress(query);
      if (coords) {
        const aws = await getToledoHeatSourcesFromAWS();
        const candidates =
          aws.length > 0
            ? aws
            : HEAT_SOURCES_TABLE
              ? await fetchHeatSourcesFromDynamo()
              : [];
        const heatSources = filterSourcesByDistance(
          candidates,
          coords[1],
          coords[0],
          ADDRESS_SEARCH_RADIUS_KM
        );
        return { heatSources };
      }
      return { heatSources: [] };
    } catch {
      const heatSources = await getHeatSourcesFromDynamoOrFallback(query);
      return { heatSources, errorCode: 25 };
    }
  }

  if (query && !isLocationServiceConfigured()) {
    const heatSources = filterFallbackSourcesByKeyword(query);
    return { heatSources };
  }

  const heatSources = await getHeatSourcesFromDynamoOrFallback(undefined);
  return { heatSources };
}

/**
 * Resolve a single heat source by id. Uses DynamoDB when configured; no table => null.
 */
export async function getHeatSourceById(id: string): Promise<HeatSource | null> {
  if (!HEAT_SOURCES_TABLE) return null;
  return fetchHeatSourceByIdFromDynamo(id);
}
