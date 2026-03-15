/**
 * One-time script to seed DynamoDB HeatSources and HeatConsumers tables
 * with Toledo seed data. Run after deploying the CDK stack.
 * Requires env: HEAT_SOURCES_TABLE, HEAT_CONSUMERS_TABLE, AWS_REGION.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { HEAT_SOURCES, HEAT_CONSUMERS } from "./toledoSeedData";

const HEAT_SOURCES_TABLE = process.env.HEAT_SOURCES_TABLE ?? "HeatSources";
const HEAT_CONSUMERS_TABLE = process.env.HEAT_CONSUMERS_TABLE ?? "HeatConsumers";
const region = process.env.AWS_REGION ?? "us-east-1";

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

async function seedHeatSources(): Promise<void> {
  for (const item of HEAT_SOURCES) {
    await docClient.send(
      new PutCommand({
        TableName: HEAT_SOURCES_TABLE,
        Item: item,
      })
    );
  }
  console.log(`Seeded ${HEAT_SOURCES.length} heat sources.`);
}

async function seedHeatConsumers(): Promise<void> {
  for (const item of HEAT_CONSUMERS) {
    await docClient.send(
      new PutCommand({
        TableName: HEAT_CONSUMERS_TABLE,
        Item: item,
      })
    );
  }
  console.log(`Seeded ${HEAT_CONSUMERS.length} heat consumers.`);
}

export async function runSeed(): Promise<void> {
  await seedHeatSources();
  await seedHeatConsumers();
}

if (require.main === module) {
  runSeed().then(() => process.exit(0), (err) => { console.error(err); process.exit(1); });
}
