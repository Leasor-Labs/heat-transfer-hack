import { QueryCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { HeatConsumer } from "../../shared/types";
import { docClient, HEAT_CONSUMERS_TABLE } from "./dynamo";
import { itemToHeatConsumer } from "./dynamo-mappers";

export type FetchHeatConsumersOptions = {
  category?: string;
  minHeatDemand?: number;
};

export async function fetchHeatConsumersFromDynamo(
  options?: FetchHeatConsumersOptions
): Promise<HeatConsumer[]> {
  if (!HEAT_CONSUMERS_TABLE) return [];

  const category = options?.category?.trim();

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
    ) as { Items?: unknown[] };
    items = (result.Items ?? []) as Record<string, unknown>[];
  } else {
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: HEAT_CONSUMERS_TABLE,
      })
    ) as { Items?: unknown[] };
    items = (scanResult.Items ?? []) as Record<string, unknown>[];
  }

  let heatConsumers = items.map((item) => itemToHeatConsumer(item));

  const minHeatDemand = options?.minHeatDemand;
  if (minHeatDemand != null && !Number.isNaN(minHeatDemand)) {
    heatConsumers = heatConsumers.filter((c) => c.annualHeatDemandMWh >= minHeatDemand);
  }

  return heatConsumers;
}

export async function fetchHeatConsumerByIdFromDynamo(id: string): Promise<HeatConsumer | null> {
  if (!HEAT_CONSUMERS_TABLE) return null;

  const result = await docClient.send(
    new GetCommand({
      TableName: HEAT_CONSUMERS_TABLE,
      Key: { id },
    })
  ) as { Item?: Record<string, unknown> };

  if (!result.Item) return null;
  return itemToHeatConsumer(result.Item as Record<string, unknown>);
}
