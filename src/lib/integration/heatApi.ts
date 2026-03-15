import type {
  GetHeatSourcesResponse,
  GetHeatConsumersResponse,
  GetHeatSourceByIdResponse,
  GetHeatConsumerByIdResponse,
} from "../../../shared/api-contract";

const BASE_URL = process.env.REACT_APP_API_URL ?? "";

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = (body as { error?: string }).error ?? res.statusText;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetch all heat sources. Optional filters: industry, minWasteHeat, temperatureClass.
 */
export async function fetchHeatSources(params?: {
  industry?: string;
  minWasteHeat?: number;
  temperatureClass?: string;
}): Promise<GetHeatSourcesResponse> {
  const qs = buildQueryString({
    industry: params?.industry,
    minWasteHeat: params?.minWasteHeat,
    temperatureClass: params?.temperatureClass,
  });
  const url = `${BASE_URL}/api/heat-sources${qs}`;
  return getJson<GetHeatSourcesResponse>(url);
}

/**
 * Fetch a single heat source by id.
 */
export async function fetchHeatSourceById(id: string): Promise<GetHeatSourceByIdResponse> {
  const url = `${BASE_URL}/api/heat-sources/${encodeURIComponent(id)}`;
  return getJson<GetHeatSourceByIdResponse>(url);
}

/**
 * Fetch all heat consumers. Optional filters: category, minHeatDemand.
 */
export async function fetchHeatConsumers(params?: {
  category?: string;
  minHeatDemand?: number;
}): Promise<GetHeatConsumersResponse> {
  const qs = buildQueryString({
    category: params?.category,
    minHeatDemand: params?.minHeatDemand,
  });
  const url = `${BASE_URL}/api/heat-consumers${qs}`;
  return getJson<GetHeatConsumersResponse>(url);
}

/**
 * Fetch a single heat consumer by id.
 */
export async function fetchHeatConsumerById(id: string): Promise<GetHeatConsumerByIdResponse> {
  const url = `${BASE_URL}/api/heat-consumers/${encodeURIComponent(id)}`;
  return getJson<GetHeatConsumerByIdResponse>(url);
}

const DEBOUNCE_MS = 300;

/**
 * Debounced fetch for map-bounds triggered calls. Call the returned function
 * with the same params you would pass to fetchHeatSources; it will wait 300ms
 * after the last call before executing.
 */
export function debouncedFetchHeatSources(): (
  params?: Parameters<typeof fetchHeatSources>[0]
) => Promise<GetHeatSourcesResponse> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (params) => {
    return new Promise((resolve, reject) => {
      if (timeoutId != null) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        fetchHeatSources(params).then(resolve, reject);
      }, DEBOUNCE_MS);
    });
  };
}

/**
 * Debounced fetch for map-bounds triggered calls. Call the returned function
 * with the same params you would pass to fetchHeatConsumers; it will wait 300ms
 * after the last call before executing.
 */
export function debouncedFetchHeatConsumers(): (
  params?: Parameters<typeof fetchHeatConsumers>[0]
) => Promise<GetHeatConsumersResponse> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (params) => {
    return new Promise((resolve, reject) => {
      if (timeoutId != null) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        fetchHeatConsumers(params).then(resolve, reject);
      }, DEBOUNCE_MS);
    });
  };
}
