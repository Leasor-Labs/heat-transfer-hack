import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, HEAT_SOURCES_TABLE, HEAT_CONSUMERS_TABLE } from "./dynamo";

export type DynamoStatus = {
  configured: boolean;
  heatSourcesTable: string;
  heatConsumersTable: string;
  heatSourcesCount: number | null;
  heatConsumersCount: number | null;
  error?: string;
};

/**
 * Returns DynamoDB configuration and item counts for health checks.
 * If tables are not set, configured is false and counts are null.
 * If a scan fails, error is set and that table's count is null.
 */
export async function getDynamoStatus(): Promise<DynamoStatus> {
  const configured = Boolean(HEAT_SOURCES_TABLE && HEAT_CONSUMERS_TABLE);
  const out: DynamoStatus = {
    configured,
    heatSourcesTable: HEAT_SOURCES_TABLE || "(not set)",
    heatConsumersTable: HEAT_CONSUMERS_TABLE || "(not set)",
    heatSourcesCount: null,
    heatConsumersCount: null,
  };

  if (!configured) return out;

  try {
    const [sourcesRes, consumersRes] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: HEAT_SOURCES_TABLE, Select: "COUNT" })),
      docClient.send(new ScanCommand({ TableName: HEAT_CONSUMERS_TABLE, Select: "COUNT" })),
    ]);
    out.heatSourcesCount = sourcesRes.Count ?? 0;
    out.heatConsumersCount = consumersRes.Count ?? 0;
  } catch (err) {
    out.error = err instanceof Error ? err.message : String(err);
  }
  return out;
}
