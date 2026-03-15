/**
 * Seeds DynamoDB HeatSources and HeatConsumers tables with the basic fallback dataset
 * (used when AWS Location Services are down). Run after tables exist.
 * Requires env: HEAT_SOURCES_TABLE, HEAT_CONSUMERS_TABLE, AWS_REGION (and AWS credentials).
 * .env is loaded via the npm script preload (scripts/dotenv-preload.cjs).
 *
 * Usage: npm run seed-dynamo
 * Or: HEAT_SOURCES_TABLE=HeatSources HEAT_CONSUMERS_TABLE=HeatConsumers npx ts-node src/data/seedDynamoFromOhio.ts
 */
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, HEAT_SOURCES_TABLE, HEAT_CONSUMERS_TABLE } from "../api/dynamo";
import { FALLBACK_HEAT_SOURCES, FALLBACK_HEAT_CONSUMERS } from "./fallback-seed-data";

// #region agent log
(function logSeedEntry() {
  const g = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : {};
  const f = (g as { fetch?: (u: string, o?: object) => Promise<unknown> }).fetch;
  if (typeof f === "function") {
    f("http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d3ad2d" }, body: JSON.stringify({ sessionId: "d3ad2d", location: "seedDynamoFromOhio.ts:entry", message: "seed-dynamo entry", data: { hasSourcesTable: !!HEAT_SOURCES_TABLE, hasConsumersTable: !!HEAT_CONSUMERS_TABLE, sourcesLen: HEAT_SOURCES_TABLE?.length ?? 0, consumersLen: HEAT_CONSUMERS_TABLE?.length ?? 0 }, timestamp: Date.now(), hypothesisId: "H3" }) }).catch(() => {});
  }
})();
// #endregion

declare const process: { exit(code: number): never };
declare const require: { (id: string): unknown; main?: unknown };
declare const module: unknown;

async function seedHeatSources(): Promise<void> {
  if (!HEAT_SOURCES_TABLE) {
    console.error("HEAT_SOURCES_TABLE is not set. Set it and try again.");
    process.exit(1);
  }
  for (const item of FALLBACK_HEAT_SOURCES) {
    await docClient.send(
      new PutCommand({
        TableName: HEAT_SOURCES_TABLE,
        Item: item as Record<string, unknown>,
      })
    );
  }
  console.log(`Seeded ${FALLBACK_HEAT_SOURCES.length} heat sources to ${HEAT_SOURCES_TABLE}.`);
}

async function seedHeatConsumers(): Promise<void> {
  if (!HEAT_CONSUMERS_TABLE) {
    console.error("HEAT_CONSUMERS_TABLE is not set. Set it and try again.");
    process.exit(1);
  }
  for (const item of FALLBACK_HEAT_CONSUMERS) {
    await docClient.send(
      new PutCommand({
        TableName: HEAT_CONSUMERS_TABLE,
        Item: item as Record<string, unknown>,
      })
    );
  }
  console.log(`Seeded ${FALLBACK_HEAT_CONSUMERS.length} heat consumers to ${HEAT_CONSUMERS_TABLE}.`);
}

export async function runSeed(): Promise<void> {
  await seedHeatSources();
  await seedHeatConsumers();
}

if (require.main === module) {
  runSeed()
    .then(() => {
      // #region agent log
      (globalThis as { fetch?: (u: string, o?: object) => Promise<unknown> }).fetch?.("http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d3ad2d" }, body: JSON.stringify({ sessionId: "d3ad2d", location: "seedDynamoFromOhio.ts:success", message: "seed-dynamo succeeded", data: {}, timestamp: Date.now(), hypothesisId: "H3" }) }).catch(() => {});
      // #endregion
      process.exit(0);
    })
    .catch((err) => {
      // #region agent log
      (globalThis as { fetch?: (u: string, o?: object) => Promise<unknown> }).fetch?.("http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d3ad2d" }, body: JSON.stringify({ sessionId: "d3ad2d", location: "seedDynamoFromOhio.ts:catch", message: "seed-dynamo failed", data: { error: String((err as Error)?.message ?? err) }, timestamp: Date.now(), hypothesisId: "H4" }) }).catch(() => {});
      // #endregion
      console.error(err);
      process.exit(1);
    });
}
