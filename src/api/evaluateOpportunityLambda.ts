import { handleEvaluateOpportunity } from "./handlers/evaluate-opportunity";

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

type LambdaResponse = { statusCode: number; headers: Record<string, string>; body: string };

export async function handler(event: { body?: string | null }): Promise<LambdaResponse> {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const data = await handleEvaluateOpportunity({
      sourceId: body.sourceId,
      consumerId: body.consumerId,
    });
    if (data === null) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "Invalid source or consumer id" }),
      };
    }
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
