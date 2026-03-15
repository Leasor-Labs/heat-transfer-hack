import type { HeatConsumer } from "../../shared/types";
import {
  searchPlacesByKeywords,
  isLocationServiceConfigured,
  TOLEDO_OHIO_BBOX,
  geocodeAddress,
} from "./location-service";
import { searchTokens } from "./query-utils";
import { haversineDistanceKm } from "../lib/calculations/distance";

const BASE_HEAT_DEMAND_MWH = 3000;

/** Search phrases for heat consumers in Toledo, OH (AWS Location Service). Exported for tags API. */
export const HEAT_CONSUMER_KEYWORDS = [
  "Greenhouses",
  "Warehouses",
  "Food Processing",
  "Laundry",
] as const;

/**
 * Ohio heat consumers seed data. Coordinates can be populated or refreshed
 * using Amazon Location Service (searchPlacesByText / geocodeAddress).
 */
export const HEAT_CONSUMERS_OHIO: HeatConsumer[] = [
  {
    id: "ohio-consumer-1",
    name: "Cleveland District Heating Network",
    category: "District Heating",
    latitude: 41.5052,
    longitude: -81.6934,
    annualHeatDemandMWh: 15000,
  },
  {
    id: "ohio-consumer-2",
    name: "Columbus Hospital Complex",
    category: "Healthcare",
    latitude: 39.9652,
    longitude: -83.0008,
    annualHeatDemandMWh: 8000,
  },
  {
    id: "ohio-consumer-3",
    name: "Cincinnati Apartment Complex",
    category: "Residential",
    latitude: 39.1105,
    longitude: -84.505,
    annualHeatDemandMWh: 3000,
  },
  {
    id: "ohio-consumer-4",
    name: "Toledo Greenhouse Facility",
    category: "Agriculture",
    latitude: 41.6588,
    longitude: -83.5418,
    annualHeatDemandMWh: 5000,
  },
  {
    id: "ohio-consumer-5",
    name: "Akron Food Processing Plant",
    category: "Food Processing",
    latitude: 41.0865,
    longitude: -81.523,
    annualHeatDemandMWh: 4000,
  },
];

/**
 * Filter Ohio seed consumers by search query.
 * Matches if name or category contains any token (e.g. "Toledo, Oh" -> match "Toledo").
 */
function filterOhioConsumersByQuery(query: string): HeatConsumer[] {
  const tokens = searchTokens(query);
  if (tokens.length === 0 || (tokens.length === 1 && tokens[0] === "ohio"))
    return [...HEAT_CONSUMERS_OHIO];
  const nameLower = (c: HeatConsumer) => c.name.toLowerCase();
  const categoryLower = (c: HeatConsumer) => c.category.toLowerCase();
  return HEAT_CONSUMERS_OHIO.filter((c) =>
    tokens.some(
      (t) => nameLower(c).includes(t) || categoryLower(c).includes(t)
    )
  );
}

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
 * - Exact address: geocode query, then return consumers whose lat/long is within ADDRESS_SEARCH_RADIUS_KM.
 * - City/region: similar-string match on name, category, location tokens.
 * Primary: AWS Location Search. Fallback: heat-consumers.ts seed data.
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
        candidates = aws.length > 0 ? aws : [...HEAT_CONSUMERS_OHIO];
      } catch {
        candidates = [...HEAT_CONSUMERS_OHIO];
      }
      return filterConsumersByDistance(candidates, lat, lng, ADDRESS_SEARCH_RADIUS_KM);
    }
  }

  if (isLocationServiceConfigured()) {
    try {
      const awsConsumers = await getToledoHeatConsumersFromAWS();
      if (awsConsumers.length > 0) {
        if (query) {
          const tokens = searchTokens(query);
          if (tokens.length > 0) {
            const nameLower = (c: HeatConsumer) => c.name.toLowerCase();
            const categoryLower = (c: HeatConsumer) => c.category.toLowerCase();
            const filtered = awsConsumers.filter((c) =>
              tokens.some(
                (t) => nameLower(c).includes(t) || categoryLower(c).includes(t)
              )
            );
            if (filtered.length > 0) return filtered;
          }
        }
        return awsConsumers;
      }
    } catch {
      // fall through to fallback
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
