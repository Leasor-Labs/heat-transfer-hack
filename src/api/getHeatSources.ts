import type { GetHeatSourcesResponse } from "../../shared/api-contract";
import { TEMPERATURE_CLASSES } from "../../shared/constants";
import { isTemperatureClass } from "./dynamo-mappers";
import { fetchHeatSourcesFromDynamo } from "./dynamo-heat-sources";

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

    const heatSources = await fetchHeatSourcesFromDynamo({
      industry: industry || undefined,
      minWasteHeat: Number.isNaN(minWasteHeat) ? undefined : minWasteHeat,
      temperatureClass: temperatureClass || undefined,
    });

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
