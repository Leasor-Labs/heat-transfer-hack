import type { HeatSource } from "../../shared/types";
import {
  searchPlacesByKeywords,
  isLocationServiceConfigured,
  TOLEDO_OHIO_BBOX,
  geocodeAddress,
} from "./location-service";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";
import { HEAT_SOURCES_TABLE } from "../api/dynamo";
import {
  fetchHeatSourcesFromDynamo,
  fetchHeatSourceByIdFromDynamo,
} from "../api/dynamo-heat-sources";

const BASE_WASTE_HEAT_MWH = 5000;

/** Search phrases for heat sources in Toledo, OH (AWS Location Service). Exported for tags API. */
export const HEAT_SOURCE_KEYWORDS = [
  "Factory",
  "Manufacturing",
  "Data Centers",
  "Steel Mills",
  "Glass Manufacturing",
  "Cold Storage",
  "Waste Water Treatment",
] as const;

/**
 * Ohio heat sources seed data. Coordinates can be populated or refreshed
 * using Amazon Location Service (searchPlacesByText / geocodeAddress).
 */
export const HEAT_SOURCES_OHIO: HeatSource[] = [
  {
    id: "ohio-source-1",
    name: "Cleveland Industrial Plant",
    industry: "Manufacturing",
    latitude: 41.4993,
    longitude: -81.6944,
    estimatedWasteHeatMWhPerYear: 12000,
    recoverableHeatMWhPerYear: 6000,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-2",
    name: "Columbus Data Center",
    industry: "Technology",
    latitude: 39.9612,
    longitude: -82.9988,
    estimatedWasteHeatMWhPerYear: 8000,
    recoverableHeatMWhPerYear: 4000,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-3",
    name: "Cincinnati Refinery",
    industry: "Oil & Gas",
    latitude: 39.1031,
    longitude: -84.512,
    estimatedWasteHeatMWhPerYear: 25000,
    recoverableHeatMWhPerYear: 12500,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-4",
    name: "Toledo Glass Factory",
    industry: "Manufacturing",
    latitude: 41.6528,
    longitude: -83.5378,
    estimatedWasteHeatMWhPerYear: 6000,
    recoverableHeatMWhPerYear: 3000,
    temperatureClass: "high",
    operatingHoursPerYear: 7200,
  },
  {
    id: "ohio-source-5",
    name: "Akron Rubber Plant",
    industry: "Manufacturing",
    latitude: 41.0814,
    longitude: -81.519,
    estimatedWasteHeatMWhPerYear: 5000,
    recoverableHeatMWhPerYear: 2500,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  // Toledo, OH area factories
  {
    id: "ohio-source-6",
    name: "Stellantis Toledo Assembly Complex (Jeep)",
    industry: "Automotive",
    latitude: 41.6422,
    longitude: -83.5389,
    estimatedWasteHeatMWhPerYear: 18000,
    recoverableHeatMWhPerYear: 9000,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-7",
    name: "Marathon Petroleum Toledo Refinery",
    industry: "Oil & Gas",
    latitude: 41.6367,
    longitude: -83.3683,
    estimatedWasteHeatMWhPerYear: 22000,
    recoverableHeatMWhPerYear: 11000,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-8",
    name: "First Solar Perrysburg",
    industry: "Manufacturing",
    latitude: 41.537,
    longitude: -83.6289,
    estimatedWasteHeatMWhPerYear: 7000,
    recoverableHeatMWhPerYear: 3500,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-9",
    name: "Libbey Inc.",
    industry: "Glass Manufacturing",
    latitude: 41.6581,
    longitude: -83.5386,
    estimatedWasteHeatMWhPerYear: 8000,
    recoverableHeatMWhPerYear: 4000,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-10",
    name: "Owens Corning Toledo",
    industry: "Manufacturing",
    latitude: 41.6517,
    longitude: -83.5353,
    estimatedWasteHeatMWhPerYear: 9000,
    recoverableHeatMWhPerYear: 4500,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-11",
    name: "NSG Pilkington",
    industry: "Glass Manufacturing",
    latitude: 41.6489,
    longitude: -83.5217,
    estimatedWasteHeatMWhPerYear: 7500,
    recoverableHeatMWhPerYear: 3750,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-12",
    name: "Owens-Illinois Inc.",
    industry: "Glass Manufacturing",
    latitude: 41.6528,
    longitude: -83.5378,
    estimatedWasteHeatMWhPerYear: 8500,
    recoverableHeatMWhPerYear: 4250,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-13",
    name: "Toledo Molding & Die",
    industry: "Manufacturing",
    latitude: 41.6233,
    longitude: -83.5622,
    estimatedWasteHeatMWhPerYear: 5500,
    recoverableHeatMWhPerYear: 2750,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-14",
    name: "Whirlpool Corporation Toledo Region",
    industry: "Manufacturing",
    latitude: 41.6189,
    longitude: -83.5817,
    estimatedWasteHeatMWhPerYear: 10000,
    recoverableHeatMWhPerYear: 5000,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-15",
    name: "Eaton Toledo",
    industry: "Manufacturing",
    latitude: 41.6411,
    longitude: -83.5489,
    estimatedWasteHeatMWhPerYear: 6000,
    recoverableHeatMWhPerYear: 3000,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-16",
    name: "Johns Manville Toledo",
    industry: "Manufacturing",
    latitude: 41.6356,
    longitude: -83.5028,
    estimatedWasteHeatMWhPerYear: 6500,
    recoverableHeatMWhPerYear: 3250,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-17",
    name: "Clarios (Holland OH)",
    industry: "Manufacturing",
    latitude: 41.6217,
    longitude: -83.7111,
    estimatedWasteHeatMWhPerYear: 5500,
    recoverableHeatMWhPerYear: 2750,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
];

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
 * When DynamoDB is configured (HEAT_SOURCES_TABLE), uses DynamoDB unless
 * Location search is requested and configured. Otherwise returns Ohio seed data.
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
        candidates = aws.length > 0 ? aws : [...HEAT_SOURCES_OHIO];
      } catch {
        candidates = [...HEAT_SOURCES_OHIO];
      }
      return filterSourcesByDistance(candidates, lat, lng, ADDRESS_SEARCH_RADIUS_KM);
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
