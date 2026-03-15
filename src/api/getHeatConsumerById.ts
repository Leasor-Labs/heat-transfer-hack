import type { HeatConsumer } from "../../shared/types";
import { fetchHeatConsumerByIdFromDynamo } from "./dynamo-heat-consumers";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

type ApiGatewayEvent = {
  pathParameters?: Record<string, string> | null;
};

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

    const heatConsumer = await fetchHeatConsumerByIdFromDynamo(id);

    if (!heatConsumer) {
      return {
        statusCode: 404,
        headers: HEADERS,
        body: JSON.stringify({ error: "Heat consumer not found" }),
      };
    }

    const response: { heatConsumer: HeatConsumer } = { heatConsumer };
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
