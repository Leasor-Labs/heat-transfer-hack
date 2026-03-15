import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { GetHeatSourceByIdResponse } from "../../shared/api-contract";
import type { HeatSource } from "../../shared/types";
import { docClient, HEAT_SOURCES_TABLE } from "./dynamo";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

type ApiGatewayEvent = {
  pathParameters?: Record<string, string> | null;
};

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
    const id = event.pathParameters?.id;
    if (!id) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "Missing path parameter: id" }),
      };
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: HEAT_SOURCES_TABLE,
        Key: { id },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: HEADERS,
        body: JSON.stringify({ error: "Heat source not found" }),
      };
    }

    const response: GetHeatSourceByIdResponse = {
      heatSource: itemToHeatSource(result.Item as Record<string, unknown>),
    };
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
