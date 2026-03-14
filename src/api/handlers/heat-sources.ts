import type { GetHeatSourcesResponse } from "../../../shared/api-contract";
import { getHeatSources } from "../../data/heat-sources";

export async function handleGetHeatSources(options?: {
  locationSearchQuery?: string;
}): Promise<GetHeatSourcesResponse> {
  const heatSources = await getHeatSources(options);
  return { heatSources };
}
