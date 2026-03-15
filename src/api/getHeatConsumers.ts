import type { GetHeatConsumersResponse } from "../../shared/api-contract";
import { fetchHeatConsumersFromDynamo } from "./dynamo-heat-consumers";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

type ApiGatewayEvent = {
  queryStringParameters?: Record<string, string> | null;
};

export async function handler(event: ApiGatewayEvent): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  try {
    const params = event.queryStringParameters ?? {};
    const category = params.category?.trim();
    const minHeatDemand = params.minHeatDemand != null ? Number(params.minHeatDemand) : NaN;

    const heatConsumers = await fetchHeatConsumersFromDynamo({
      category: category || undefined,
      minHeatDemand: Number.isNaN(minHeatDemand) ? undefined : minHeatDemand,
    });

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
