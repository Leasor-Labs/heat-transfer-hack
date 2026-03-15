import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { GetHeatSourcesResponse } from "../../shared/api-contract";
import type { HeatSource } from "../../shared/types";
import { TEMPERATURE_CLASSES } from "../../shared/constants";
import { docClient, HEAT_SOURCES_TABLE } from "./dynamo";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

type ApiGatewayEvent = {
  queryStringParameters?: Record<string, string> | null;
};

function isTemperatureClass(s: string): s is HeatSource["temperatureClass"] {
  return (TEMPERATURE_CLASSES as readonly string[]).includes(s);
}

function itemToHeatSource(item: Record<string, unknown>): HeatSource {
  return {
    id: item.id as string,
    name: item.name as string,
    industry: item.industry as string,
    latitude: item.latitude as number,
    longitude: item.longitude as number,
    estimatedWasteHeatMWhPerYear: item.estimatedWasteHeatMWhPerYear as number,
    recoverableHeatMWhPerYear: item.recoverableHeatMWhPerYear as number,
    temperatureClass: item.temperatureClass as HeatSource["temperatureClass"],
    operatingHoursPerYear: item.operatingHoursPerYear as number,
  };
}

export async function handler(event: ApiGatewayEvent): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  try {
    const params = event.queryStringParameters ?? {};
    const industry = params.industry?.trim();
    const minWasteHeat = params.minWasteHeat != null ? Number(params.minWasteHeat) : NaN;
    const temperatureClass = params.temperatureClass?.trim();

    if (temperatureClass !== undefined && temperatureClass !== "" && !isTemperatureClass(temperatureClass)) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: `temperatureClass must be one of: ${TEMPERATURE_CLASSES.join(", ")}` }),
      };
    }

    let items: Record<string, unknown>[];

    if (industry) {
      const result = await docClient.send(
        new QueryCommand({
          TableName: HEAT_SOURCES_TABLE,
          IndexName: "industry-index",
          KeyConditionExpression: "#industry = :industry",
          ExpressionAttributeNames: { "#industry": "industry" },
          ExpressionAttributeValues: { ":industry": industry },
        })
      );
      items = (result.Items ?? []) as Record<string, unknown>[];
    } else {
      const scanResult = await docClient.send(
        new ScanCommand({
          TableName: HEAT_SOURCES_TABLE,
        })
      );
      items = (scanResult.Items ?? []) as Record<string, unknown>[];
    }

    let heatSources = items.map(itemToHeatSource);

    if (!Number.isNaN(minWasteHeat)) {
      heatSources = heatSources.filter((s) => s.estimatedWasteHeatMWhPerYear >= minWasteHeat);
    }
    if (temperatureClass && isTemperatureClass(temperatureClass)) {
      heatSources = heatSources.filter((s) => s.temperatureClass === temperatureClass);
    }

    const response: GetHeatSourcesResponse = { heatSources };
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify(response),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: message }),
    };
  }
}
