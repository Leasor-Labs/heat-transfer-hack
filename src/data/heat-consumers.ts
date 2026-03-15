import type { HeatConsumer } from "../../shared/types";
import {
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

/**
 * Returns heat consumers for the backend API.
 * Uses DynamoDB when configured; when location search is used and Location Service is available,
 * tries AWS first and falls back to DynamoDB (e.g. basic dataset) on failure or empty. No table => [].
 */
export async function getHeatConsumers(options?: {
  locationSearchQuery?: string;
}): Promise<HeatConsumer[]> {
  const query = options?.locationSearchQuery?.trim() ?? "";

  if (query && isLocationServiceConfigured()) {
    const coords = await geocodeAddress(query);
    if (coords) {
      const [lng, lat] = coords;
      let candidates: HeatConsumer[];
      try {
        const aws = await getToledoHeatConsumersFromAWS();
        candidates = aws.length > 0 ? aws : (HEAT_CONSUMERS_TABLE ? await fetchHeatConsumersFromDynamo() : []);
      } catch {
        candidates = HEAT_CONSUMERS_TABLE ? await fetchHeatConsumersFromDynamo() : [];
      }
      return filterConsumersByDistance(candidates, coords[1], coords[0], ADDRESS_SEARCH_RADIUS_KM);
    }
  }
  if (HEAT_CONSUMERS_TABLE) {
    return fetchHeatConsumersFromDynamo();
  }
  return [];
}

/**
 * Resolve a single heat consumer by id. Uses DynamoDB when configured; no table => null.
 */
export async function getHeatConsumerById(id: string): Promise<HeatConsumer | null> {
  if (!HEAT_CONSUMERS_TABLE) return null;
  return fetchHeatConsumerByIdFromDynamo(id);
}
