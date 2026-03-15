/**
 * Seeds DynamoDB HeatSources and HeatConsumers tables with the basic fallback dataset
 * (used when AWS Location Services are down). Run after tables exist.
 * Requires env: HEAT_SOURCES_TABLE, HEAT_CONSUMERS_TABLE, AWS_REGION (and AWS credentials).
 *
 * Usage: npm run seed-dynamo
 * Or: HEAT_SOURCES_TABLE=HeatSources HEAT_CONSUMERS_TABLE=HeatConsumers npx ts-node src/data/seedDynamoFromOhio.ts
 */
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, HEAT_SOURCES_TABLE, HEAT_CONSUMERS_TABLE } from "../api/dynamo";
import { FALLBACK_HEAT_SOURCES, FALLBACK_HEAT_CONSUMERS } from "./fallback-seed-data";

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
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
