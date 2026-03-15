import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { GetHeatConsumersResponse } from "../../shared/api-contract";
import type { HeatConsumer } from "../../shared/types";
import { docClient, HEAT_CONSUMERS_TABLE } from "./dynamo";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

type ApiGatewayEvent = {
  queryStringParameters?: Record<string, string> | null;
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
    const params = event.queryStringParameters ?? {};
    const category = params.category?.trim();
    const minHeatDemand = params.minHeatDemand != null ? Number(params.minHeatDemand) : NaN;

    let items: Record<string, unknown>[];

    if (category) {
      const result = await docClient.send(
        new QueryCommand({
          TableName: HEAT_CONSUMERS_TABLE,
          IndexName: "category-index",
          KeyConditionExpression: "#category = :category",
          ExpressionAttributeNames: { "#category": "category" },
          ExpressionAttributeValues: { ":category": category },
        })
      );
      items = (result.Items ?? []) as Record<string, unknown>[];
    } else {
      const scanResult = await docClient.send(
        new ScanCommand({
          TableName: HEAT_CONSUMERS_TABLE,
        })
      );
      items = (scanResult.Items ?? []) as Record<string, unknown>[];
    }

    let heatConsumers = items.map(itemToHeatConsumer);

    if (!Number.isNaN(minHeatDemand)) {
      heatConsumers = heatConsumers.filter((c) => c.annualHeatDemandMWh >= minHeatDemand);
    }

    const response: GetHeatConsumersResponse = { heatConsumers };
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
