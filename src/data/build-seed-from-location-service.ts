import type { HeatSource, HeatConsumer } from "../../shared/types";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";
import { searchPlacesByKeywords, isLocationServiceConfigured, TOLEDO_OHIO_BBOX } from "./location-service";
import { HEAT_SOURCE_KEYWORDS, HEAT_CONSUMER_KEYWORDS } from "./search-keywords";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, HEAT_SOURCES_TABLE, HEAT_CONSUMERS_TABLE } from "../api/dynamo";

const BASE_WASTE_HEAT_MWH = 5000;
const BASE_HEAT_DEMAND_MWH = 3000;

/**
 * Build HeatSource[] from Amazon Location Service search queries.
 * Uses shared searchPlacesByKeywords with Toledo bbox. Use when PLACE_INDEX_NAME is set.
 */
export async function buildHeatSourcesFromLocationService(
  queries: string[]
): Promise<HeatSource[]> {
  const tagged = await searchPlacesByKeywords(queries, {
    maxResultsPerKeyword: 5,
    filterBBox: TOLEDO_OHIO_BBOX,
  });
  return tagged.map(({ place: p, keyword }) => ({
    id: `location-source-${p.placeId}`,
    name: p.label || `Source ${p.placeId}`,
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
 * Uses shared searchPlacesByKeywords with Toledo bbox.
 */
export async function buildHeatConsumersFromLocationService(
  queries: string[]
): Promise<HeatConsumer[]> {
  const tagged = await searchPlacesByKeywords(queries, {
    maxResultsPerKeyword: 5,
    filterBBox: TOLEDO_OHIO_BBOX,
  });
  return tagged.map(({ place: p, keyword }) => ({
    id: `location-consumer-${p.placeId}`,
    name: p.label || `Consumer ${p.placeId}`,
    category: keyword,
    latitude: p.position[1],
    longitude: p.position[0],
    annualHeatDemandMWh: BASE_HEAT_DEMAND_MWH,
  }));
}

export type RefreshResult = {
  sourcesWritten: number;
  consumersWritten: number;
};

/**
 * Build heat sources and consumers from AWS Location Service using keyword lists,
 * then write them to DynamoDB. No-op if Location Service or DynamoDB tables are not configured.
 */
export async function refreshDynamoFromLocationService(): Promise<RefreshResult> {
  if (!isLocationServiceConfigured()) {
    return { sourcesWritten: 0, consumersWritten: 0 };
  }
  if (!HEAT_SOURCES_TABLE || !HEAT_CONSUMERS_TABLE) {
    return { sourcesWritten: 0, consumersWritten: 0 };
  }

  const [sources, consumers] = await Promise.all([
    buildHeatSourcesFromLocationService([...HEAT_SOURCE_KEYWORDS]),
    buildHeatConsumersFromLocationService([...HEAT_CONSUMER_KEYWORDS]),
  ]);

  for (const item of sources) {
    await docClient.send(
      new PutCommand({
        TableName: HEAT_SOURCES_TABLE,
        Item: item as Record<string, unknown>,
      })
    );
  }
  for (const item of consumers) {
    await docClient.send(
      new PutCommand({
        TableName: HEAT_CONSUMERS_TABLE,
        Item: item as Record<string, unknown>,
      })
    );
  }

  return { sourcesWritten: sources.length, consumersWritten: consumers.length };
}
