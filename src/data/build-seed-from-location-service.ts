import type { HeatSource, HeatConsumer } from "../../shared/types";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";
import { searchPlacesByKeywords } from "./location-service";

const BASE_WASTE_HEAT_MWH = 5000;
const BASE_HEAT_DEMAND_MWH = 3000;

/**
 * Build HeatSource[] from Amazon Location Service search queries.
 * Uses shared searchPlacesByKeywords (no bbox). Use when PLACE_INDEX_NAME is set.
 */
export async function buildHeatSourcesFromLocationService(
  queries: string[]
): Promise<HeatSource[]> {
  const tagged = await searchPlacesByKeywords(queries, {
    maxResultsPerKeyword: 5,
  });
  return tagged.map(({ place: p, keyword }, idx) => ({
    id: `built-source-${idx}`,
    name: p.label || `Source ${idx}`,
    industry: keyword,
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
 * Build HeatConsumer[] from Amazon Location Service search queries.
 * Uses shared searchPlacesByKeywords (no bbox).
 */
export async function buildHeatConsumersFromLocationService(
  queries: string[]
): Promise<HeatConsumer[]> {
  const tagged = await searchPlacesByKeywords(queries, {
    maxResultsPerKeyword: 5,
  });
  return tagged.map(({ place: p, keyword }, idx) => ({
    id: `built-consumer-${idx}`,
    name: p.label || `Consumer ${idx}`,
    category: keyword,
    latitude: p.position[1],
    longitude: p.position[0],
    annualHeatDemandMWh: BASE_HEAT_DEMAND_MWH,
  }));
}
