import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION ?? "us-east-1";

const client = new DynamoDBClient({ region });
export const docClient = DynamoDBDocumentClient.from(client);

export const HEAT_SOURCES_TABLE = process.env.HEAT_SOURCES_TABLE ?? "";
export const HEAT_CONSUMERS_TABLE = process.env.HEAT_CONSUMERS_TABLE ?? "";
