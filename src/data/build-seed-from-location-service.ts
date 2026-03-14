import type { HeatSource, HeatConsumer } from "../../shared/types";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";
import { searchPlacesByText, isLocationServiceConfigured } from "./location-service";

const BASE_WASTE_HEAT_MWH = 5000;
const BASE_HEAT_DEMAND_MWH = 3000;

/**
 * Build HeatSource[] from Amazon Location Service search queries.
 * Use when PLACE_INDEX_NAME is set. Assigns stable ids from index.
 */
export async function buildHeatSourcesFromLocationService(
  queries: string[]
): Promise<HeatSource[]> {
  if (!isLocationServiceConfigured()) return [];
  const out: HeatSource[] = [];
  let idx = 0;
  for (const query of queries) {
    const places = await searchPlacesByText(query, { maxResults: 5 });
    for (const p of places) {
      out.push({
        id: `built-source-${idx}`,
        name: p.label || `Source ${idx}`,
        industry: "Industrial",
        latitude: p.position[1],
        longitude: p.position[0],
        estimatedWasteHeatMWhPerYear:
          BASE_WASTE_HEAT_MWH * DEFAULT_ASSUMPTIONS.wasteHeatFraction,
        recoverableHeatMWhPerYear:
          BASE_WASTE_HEAT_MWH *
          DEFAULT_ASSUMPTIONS.wasteHeatFraction *
          DEFAULT_ASSUMPTIONS.recoveryFactor,
        temperatureClass: "medium",
        operatingHoursPerYear: 8760,
      });
      idx += 1;
    }
  }
  return out;
}

/**
 * Build HeatConsumer[] from Amazon Location Service search queries.
 */
export async function buildHeatConsumersFromLocationService(
  queries: string[]
): Promise<HeatConsumer[]> {
  if (!isLocationServiceConfigured()) return [];
  const out: HeatConsumer[] = [];
  let idx = 0;
  for (const query of queries) {
    const places = await searchPlacesByText(query, { maxResults: 5 });
    for (const p of places) {
      out.push({
        id: `built-consumer-${idx}`,
        name: p.label || `Consumer ${idx}`,
        category: "Commercial",
        latitude: p.position[1],
        longitude: p.position[0],
        annualHeatDemandMWh: BASE_HEAT_DEMAND_MWH,
      });
      idx += 1;
    }
  }
  return out;
}
