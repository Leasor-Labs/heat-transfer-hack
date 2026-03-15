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
  let tagged = await searchPlacesByKeywords(queries, {
    maxResultsPerKeyword: 5,
    filterBBox: TOLEDO_OHIO_BBOX,
  });
  // If nothing found within the Toledo bbox, retry without a bbox to widen the search area.
  if (tagged.length === 0) {
    tagged = await searchPlacesByKeywords(queries, {
      maxResultsPerKeyword: 5,
    });
  }
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
  let tagged = await searchPlacesByKeywords(queries, {
    maxResultsPerKeyword: 5,
    filterBBox: TOLEDO_OHIO_BBOX,
  });
  // If nothing found within the Toledo bbox, retry without a bbox to widen the search area.
  if (tagged.length === 0) {
    tagged = await searchPlacesByKeywords(queries, {
      maxResultsPerKeyword: 5,
    });
  }
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
  // #region agent log
  const locConfigured = isLocationServiceConfigured();
  fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1f167'},body:JSON.stringify({sessionId:'e1f167',location:'build-seed-from-location-service.ts:69',message:'refresh entry',data:{isLocationServiceConfigured:locConfigured,hasSourcesTable:!!HEAT_SOURCES_TABLE,hasConsumersTable:!!HEAT_CONSUMERS_TABLE},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1f167'},body:JSON.stringify({sessionId:'e1f167',location:'build-seed-from-location-service.ts:70',message:'refresh entry tables',data:{HEAT_SOURCES_TABLE:HEAT_SOURCES_TABLE||'(empty)',HEAT_CONSUMERS_TABLE:HEAT_CONSUMERS_TABLE||'(empty)'},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  if (!isLocationServiceConfigured()) {
    return { sourcesWritten: 0, consumersWritten: 0 };
  }
  if (!HEAT_SOURCES_TABLE || !HEAT_CONSUMERS_TABLE) {
    return { sourcesWritten: 0, consumersWritten: 0 };
  }

  let sources: HeatSource[];
  let consumers: HeatConsumer[];
  try {
    [sources, consumers] = await Promise.all([
      buildHeatSourcesFromLocationService([...HEAT_SOURCE_KEYWORDS]),
      buildHeatConsumersFromLocationService([...HEAT_CONSUMER_KEYWORDS]),
    ]);
  } catch (buildErr) {
    // #region agent log
    fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1f167'},body:JSON.stringify({sessionId:'e1f167',location:'build-seed-from-location-service.ts:86',message:'build failed',data:{error:String((buildErr as Error)?.message||buildErr)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    throw buildErr;
  }
  // #region agent log
  fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1f167'},body:JSON.stringify({sessionId:'e1f167',location:'build-seed-from-location-service.ts:90',message:'build result',data:{sourcesCount:sources.length,consumersCount:consumers.length},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion

  try {
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
  } catch (writeErr) {
    // #region agent log
    fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1f167'},body:JSON.stringify({sessionId:'e1f167',location:'build-seed-from-location-service.ts:118',message:'DynamoDB write failed',data:{error:String((writeErr as Error)?.message||writeErr)},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    throw writeErr;
  }

  return { sourcesWritten: sources.length, consumersWritten: consumers.length };
}
