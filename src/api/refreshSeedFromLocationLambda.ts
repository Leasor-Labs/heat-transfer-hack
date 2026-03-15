import { refreshDynamoFromLocationService } from "../data/build-seed-from-location-service";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

export async function handler(): Promise<LambdaResponse> {
  try {
    const result = await refreshDynamoFromLocationService();
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        sourcesWritten: result.sourcesWritten,
        consumersWritten: result.consumersWritten,
      }),
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

