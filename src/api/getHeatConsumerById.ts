import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { GetHeatConsumerByIdResponse } from "../../shared/api-contract";
import type { HeatConsumer } from "../../shared/types";
import { docClient, HEAT_CONSUMERS_TABLE } from "./dynamo";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

type ApiGatewayEvent = {
  pathParameters?: Record<string, string> | null;
};

function itemToHeatConsumer(item: Record<string, unknown>): HeatConsumer {
  return {
    id: item.id as string,
    name: item.name as string,
    category: item.category as string,
    latitude: item.latitude as number,
    longitude: item.longitude as number,
    annualHeatDemandMWh: item.annualHeatDemandMWh as number,
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
        TableName: HEAT_CONSUMERS_TABLE,
        Key: { id },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: HEADERS,
        body: JSON.stringify({ error: "Heat consumer not found" }),
      };
    }

    const response: GetHeatConsumerByIdResponse = {
      heatConsumer: itemToHeatConsumer(result.Item as Record<string, unknown>),
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
