import type { GetHeatConsumersResponse } from "../../../shared/api-contract";
import { getHeatConsumers } from "../../data/heat-consumers";

export async function handleGetHeatConsumers(options?: {
  locationSearchQuery?: string;
}): Promise<GetHeatConsumersResponse> {
  return getHeatConsumers(options);
}
