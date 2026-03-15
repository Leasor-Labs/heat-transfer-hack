import { getDynamoStatus } from "./dynamo-status";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export async function handler(): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  try {
    const dynamo = await getDynamoStatus();
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ ok: true, dynamo }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ ok: false, error: message }),
    };
  }
}
