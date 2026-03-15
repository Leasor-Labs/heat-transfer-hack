import { QueryCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { HeatSource } from "../../shared/types";
import { docClient, HEAT_SOURCES_TABLE } from "./dynamo";
import { itemToHeatSource, isTemperatureClass } from "./dynamo-mappers";

export type FetchHeatSourcesOptions = {
  industry?: string;
  minWasteHeat?: number;
  temperatureClass?: string;
};

export async function fetchHeatSourcesFromDynamo(
  options?: FetchHeatSourcesOptions
): Promise<HeatSource[]> {
  if (!HEAT_SOURCES_TABLE) return [];

  const industry = options?.industry?.trim();
  const minWasteHeat = options?.minWasteHeat;
  const temperatureClass = options?.temperatureClass?.trim();

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
    ) as { Items?: unknown[] };
    items = (result.Items ?? []) as Record<string, unknown>[];
  } else {
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: HEAT_SOURCES_TABLE,
      })
    ) as { Items?: unknown[] };
    items = (scanResult.Items ?? []) as Record<string, unknown>[];
  }

  let heatSources = items.map((item) => itemToHeatSource(item));

  if (minWasteHeat != null && !Number.isNaN(minWasteHeat)) {
    heatSources = heatSources.filter((s) => s.estimatedWasteHeatMWhPerYear >= minWasteHeat);
  }
  if (temperatureClass && isTemperatureClass(temperatureClass)) {
    heatSources = heatSources.filter((s) => s.temperatureClass === temperatureClass);
  }

  return heatSources;
}

export async function fetchHeatSourceByIdFromDynamo(id: string): Promise<HeatSource | null> {
  if (!HEAT_SOURCES_TABLE) return null;

  const result = await docClient.send(
    new GetCommand({
      TableName: HEAT_SOURCES_TABLE,
      Key: { id },
    })
  ) as { Item?: Record<string, unknown> };

  if (!result.Item) return null;
  return itemToHeatSource(result.Item as Record<string, unknown>);
}
