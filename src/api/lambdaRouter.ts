/**
 * Single Lambda entrypoint for API Gateway. Routes by path and method to existing handlers.
 * Use with API Gateway REST API (proxy or proxy+ resource).
 */
import { handler as getHeatSources } from "./getHeatSources";
import { handler as getHeatConsumers } from "./getHeatConsumers";
import { handler as getHeatSourceById } from "./getHeatSourceById";
import { handler as getHeatConsumerById } from "./getHeatConsumerById";
import { handler as evaluateOpportunity } from "./evaluateOpportunityLambda";
// Future Feature: import { handler as rankedOpportunities } from "./rankedOpportunitiesLambda";
import { handler as health } from "./healthLambda";
import { handler as mapStyle } from "./mapStyleLambda";
import { handler as refreshSeedFromLocation } from "./refreshSeedFromLocationLambda";

type ApiGatewayEvent = {
  path?: string;
  httpMethod?: string;
  queryStringParameters?: Record<string, string> | null;
  pathParameters?: Record<string, string> | null;
  body?: string | null;
};

type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

function optionsResponse(): LambdaResponse {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: "",
  };
}

export async function handler(event: ApiGatewayEvent): Promise<LambdaResponse> {
  const path = event.path ?? "";
  const method = (event.httpMethod ?? "GET").toUpperCase();

  if (method === "OPTIONS") {
    return optionsResponse();
  }

  const pathParts = path.replace(/^\/+/, "").split("/").filter(Boolean);
  const apiIndex = pathParts.indexOf("api");
  const afterApi = apiIndex >= 0 ? pathParts.slice(apiIndex + 1) : pathParts;
  const sub = afterApi[0];
  const id = afterApi[1];
  const normalizedPath = apiIndex >= 0 ? `/api/${sub ?? ""}${id != null ? `/${id}` : ""}` : path;

  const eventWithParams = {
    queryStringParameters: event.queryStringParameters ?? undefined,
    pathParameters: id != null ? { id } : event.pathParameters,
    body: event.body,
  };

  try {
    if (normalizedPath === "/api/heat-sources" && method === "GET") {
      return await getHeatSources(eventWithParams);
    }
    if (normalizedPath.startsWith("/api/heat-sources/") && method === "GET") {
      return await getHeatSourceById(eventWithParams);
    }
    if (normalizedPath === "/api/heat-consumers" && method === "GET") {
      return await getHeatConsumers(eventWithParams);
    }
    if (normalizedPath.startsWith("/api/heat-consumers/") && method === "GET") {
      return await getHeatConsumerById(eventWithParams);
    }
    if (normalizedPath === "/api/evaluate-opportunity" && method === "POST") {
      return await evaluateOpportunity(eventWithParams);
    }
    // Future Feature: if (normalizedPath === "/api/ranked-opportunities" && method === "GET") {
    //   return await rankedOpportunities(eventWithParams);
    // }
    if (normalizedPath === "/api/health" && method === "GET") {
      return await health();
    }
    if (normalizedPath === "/api/map-style" && method === "GET") {
      return await mapStyle();
    }
    if (normalizedPath === "/api/refresh-seed-from-location" && method === "GET") {
      return await refreshSeedFromLocation();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: message }),
    };
  }

  return {
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: "Not found" }),
  };
}
