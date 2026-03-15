import type { GetHeatConsumersResponse } from "../../shared/api-contract";
import type { HeatConsumer } from "../../shared/types";
import {
  searchPlacesByText,
  searchPlacesByKeywords,
  isLocationServiceConfigured,
  TOLEDO_OHIO_BBOX,
  geocodeAddress,
} from "./location-service";
import { HEAT_CONSUMERS_TABLE } from "../api/dynamo";
import {
  fetchHeatConsumersFromDynamo,
  fetchHeatConsumerByIdFromDynamo,
} from "../api/dynamo-heat-consumers";
import { haversineDistanceKm } from "../lib/calculations/distance";
import { HEAT_CONSUMER_KEYWORDS } from "./search-keywords";
import { FALLBACK_HEAT_CONSUMERS } from "./fallback-seed-data";

const BASE_HEAT_DEMAND_MWH = 3000;

/**
 * Fetch heat consumers from AWS Location Search (keywords + Toledo bbox, deduped).
 */
async function getToledoHeatConsumersFromAWS(): Promise<HeatConsumer[]> {
  const tagged = await searchPlacesByKeywords(HEAT_CONSUMER_KEYWORDS, {
    maxResultsPerKeyword: 5,
    filterBBox: TOLEDO_OHIO_BBOX,
  });
  return tagged.map(({ place: p, keyword: category }, i) => ({
    id: `location-consumer-${i}-${p.placeId}`,
    name: p.label || `Consumer site ${i + 1}`,
    category,
    latitude: p.position[1],
    longitude: p.position[0],
    annualHeatDemandMWh: BASE_HEAT_DEMAND_MWH,
  }));
}

/** Radius (km) for "exact address" search: return consumers within this distance of the geocoded point. */
const ADDRESS_SEARCH_RADIUS_KM = 50;

/**
 * Returns heat consumers within radius (km) of a point. Used when search is an exact address.
 */
function filterConsumersByDistance(
  list: HeatConsumer[],
  centerLat: number,
  centerLon: number,
  radiusKm: number
): HeatConsumer[] {
  return list.filter((c) => {
    const d = haversineDistanceKm(c.latitude, c.longitude, centerLat, centerLon);
    return d <= radiusKm;
  });
}

/** Convert AWS Location place results to HeatConsumer with default demand. */
function placesToHeatConsumers(
  places: Array<{ placeId: string; label: string; position: [number, number] }>,
  category = "Building"
): HeatConsumer[] {
  return places.map((p, i) => ({
    id: `location-consumer-${i}-${p.placeId}`,
    name: p.label || `Consumer site ${i + 1}`,
    category,
    latitude: p.position[1],
    longitude: p.position[0],
    annualHeatDemandMWh: BASE_HEAT_DEMAND_MWH,
  }));
}

/** Filter backup heat consumers by keyword (name or category). */
function filterFallbackConsumersByKeyword(
  keyword: string,
  list: HeatConsumer[] = FALLBACK_HEAT_CONSUMERS
): HeatConsumer[] {
  const k = keyword.trim().toLowerCase();
  if (!k) return list;
  return list.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(k)) ||
      (c.category && c.category.toLowerCase().includes(k))
  );
}

/**
 * Returns heat consumers for the backend API.
 * When search query is present and AWS Location is configured: searches places by keyword;
 * on communication failure returns errorCode 25. When AWS is not configured, filters backup data by keyword.
 */
export async function getHeatConsumers(options?: {
  locationSearchQuery?: string;
}): Promise<GetHeatConsumersResponse> {
  const query = options?.locationSearchQuery?.trim() ?? "";

  if (query && isLocationServiceConfigured()) {
    try {
      const places = await searchPlacesByText(query, {
        maxResults: 20,
        filterBBox: TOLEDO_OHIO_BBOX,
      });
      if (places.length > 0) {
        const heatConsumers = placesToHeatConsumers(places, query);
        return { heatConsumers };
      }
      const coords = await geocodeAddress(query);
      if (coords) {
        const aws = await getToledoHeatConsumersFromAWS();
        const candidates =
          aws.length > 0
            ? aws
            : HEAT_CONSUMERS_TABLE
              ? await fetchHeatConsumersFromDynamo()
              : [];
        const heatConsumers = filterConsumersByDistance(
          candidates,
          coords[1],
          coords[0],
          ADDRESS_SEARCH_RADIUS_KM
        );
        return { heatConsumers };
      }
      return { heatConsumers: [] };
    } catch {
      return { heatConsumers: [], errorCode: 25 };
    }
  }

  if (query && !isLocationServiceConfigured()) {
    const heatConsumers = filterFallbackConsumersByKeyword(query);
    return { heatConsumers };
  }

  if (HEAT_CONSUMERS_TABLE) {
    const heatConsumers = await fetchHeatConsumersFromDynamo();
    return { heatConsumers };
  }
  return { heatConsumers: [] };
}

/**
 * Resolve a single heat consumer by id. Uses DynamoDB when configured; no table => null.
 */
export async function getHeatConsumerById(id: string): Promise<HeatConsumer | null> {
  if (!HEAT_CONSUMERS_TABLE) return null;
  return fetchHeatConsumerByIdFromDynamo(id);
}
