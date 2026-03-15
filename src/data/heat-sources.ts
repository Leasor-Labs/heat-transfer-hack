import type { HeatSource } from "../../shared/types";
import {
  searchPlacesByText,
  isLocationServiceConfigured,
  TOLEDO_OHIO_BBOX,
} from "./location-service";
import type { PlaceResult } from "./location-service";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";

const BASE_WASTE_HEAT_MWH = 5000;

/** Search phrases for heat sources in Toledo, OH (AWS Location Service). */
const HEAT_SOURCE_KEYWORDS = [
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
 * Fetch real Toledo heat sources from AWS: one search per keyword, aggregate and dedupe by placeId.
 */
async function getToledoHeatSourcesFromAWS(): Promise<HeatSource[]> {
  const seen = new Set<string>();
  const withKeyword: Array<{ place: PlaceResult; industry: string }> = [];
  for (const keyword of HEAT_SOURCE_KEYWORDS) {
    const places = await searchPlacesByText(keyword, {
      maxResults: 5,
      filterBBox: TOLEDO_OHIO_BBOX,
    });
    for (const p of places) {
      if (seen.has(p.placeId)) continue;
      seen.add(p.placeId);
      withKeyword.push({ place: p, industry: keyword });
    }
  }
  return withKeyword.map(({ place: p, industry }, i) => ({
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

/**
 * Returns heat sources for the backend API.
 * Prefers Ohio seed data (curated Toledo/Ohio factories) when it matches the query,
 * so the real factory list always shows. Falls back to AWS Location Service only when
 * the seed data has no matches for the search.
 */
export async function getHeatSources(options?: {
  locationSearchQuery?: string;
}): Promise<HeatSource[]> {
  const query = options?.locationSearchQuery?.trim() ?? "";
  const seedResults = filterOhioSourcesByQuery(query);
  // Prefer curated seed data (real Toledo factories, etc.) when we have matches
  if (seedResults.length > 0) return seedResults;
  if (isLocationServiceConfigured()) {
    const toledoSources = await getToledoHeatSourcesFromAWS();
    if (toledoSources.length > 0) return toledoSources;
  }
  return seedResults;
}

/**
 * Resolve a single heat source by id. Uses seed data only (stable ids).
 */
export function getHeatSourceById(id: string): HeatSource | null {
  return HEAT_SOURCES_OHIO.find((s) => s.id === id) ?? null;
}
