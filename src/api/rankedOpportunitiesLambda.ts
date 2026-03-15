import { handleGetRankedOpportunities } from "./handlers/ranked-opportunities";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

type LambdaResponse = { statusCode: number; headers: Record<string, string>; body: string };

export async function handler(_event: unknown): Promise<LambdaResponse> {
  try {
    const data = await handleGetRankedOpportunities();
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify(data),
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
