import type { HeatConsumer } from "../../shared/types";
import {
  searchPlacesByKeywords,
  isLocationServiceConfigured,
  TOLEDO_OHIO_BBOX,
} from "./location-service";
import { searchTokens } from "./query-utils";

const BASE_HEAT_DEMAND_MWH = 3000;

/** Search phrases for heat consumers in Toledo, OH (AWS Location Service). */
const HEAT_CONSUMER_KEYWORDS = [
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

/**
 * Returns heat consumers for the backend API.
 * Primary: AWS Location Search. Fallback: heat-consumers.ts seed data when AWS is unavailable or returns no results.
 */
export async function getHeatConsumers(options?: {
  locationSearchQuery?: string;
}): Promise<HeatConsumer[]> {
  const query = options?.locationSearchQuery?.trim() ?? "";
  if (isLocationServiceConfigured()) {
    try {
      const awsConsumers = await getToledoHeatConsumersFromAWS();
      if (awsConsumers.length > 0) return awsConsumers;
    } catch {
      // fall through to fallback
    }
  }
  const seedResults = filterOhioConsumersByQuery(query);
  return seedResults;
}

/**
 * Resolve a single heat consumer by id. Uses seed data only (stable ids).
 */
export function getHeatConsumerById(id: string): HeatConsumer | null {
  return HEAT_CONSUMERS_OHIO.find((c) => c.id === id) ?? null;
}
