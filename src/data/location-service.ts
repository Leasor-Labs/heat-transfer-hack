/**
 * Amazon Location Service integration for place search and geocoding.
 * Requires @aws-sdk/client-location. Configure via env:
 * - PLACE_INDEX_NAME: Place index resource name
 * - AWS_REGION: AWS region (default us-east-1)
 */

function getEnv(key: string): string | undefined {
  try {
    const p = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process;
    return p?.env?.[key];
  } catch {
    return undefined;
  }
}

const PLACE_INDEX_NAME = getEnv("PLACE_INDEX_NAME") ?? "";
const AWS_REGION = getEnv("AWS_REGION") ?? "us-east-1";

export type PlaceResult = {
  placeId: string;
  label: string;
  position: [number, number]; // [longitude, latitude] per AWS convention
};

export type ReverseGeocodeResult = {
  label: string;
  position: [number, number];
};

function getPlaceIndexName(): string {
  return PLACE_INDEX_NAME;
}

export function isLocationServiceConfigured(): boolean {
  return PLACE_INDEX_NAME.length > 0;
}

/**
 * Bounding box for City of Toledo, Ohio.
 * Format: [southwest_longitude, southwest_latitude, northeast_longitude, northeast_latitude].
 */
export const TOLEDO_OHIO_BBOX: [number, number, number, number] = [
  -83.7, 41.55, -83.45, 41.75,
];

/**
 * Search for places by text (e.g. "industrial facility Ohio").
 * Returns array of place labels and coordinates.
 * When filterBBox is provided, results are restricted to that area; do not pass biasPosition (AWS forbids both).
 */
export async function searchPlacesByText(
  text: string,
  options?: {
    maxResults?: number;
    biasPosition?: [number, number];
    filterBBox?: [number, number, number, number];
  }
): Promise<PlaceResult[]> {
  if (!isLocationServiceConfigured()) {
    return [];
  }
  try {
    const { LocationClient, SearchPlaceIndexForTextCommand } = await import(
      "@aws-sdk/client-location"
    );
    const client = new LocationClient({ region: AWS_REGION });
    const command = new SearchPlaceIndexForTextCommand({
      IndexName: getPlaceIndexName(),
      Text: text,
      MaxResults: options?.maxResults ?? 10,
      ...(options?.filterBBox
        ? { FilterBBox: options.filterBBox }
        : { BiasPosition: options?.biasPosition }),
    });
    const response = (await client.send(command)) as {
      Results?: Array<{ Place?: { PlaceId?: string; Label?: string; Geometry?: { Point?: [number, number] } } }>;
    };
    const results = response.Results ?? [];
    return results
      .filter((r) => r.Place?.Geometry?.Point !== undefined)
      .map((r, i) => ({
        placeId: r.Place?.PlaceId ?? `place-${i}`,
        label: r.Place?.Label ?? "",
        position: r.Place!.Geometry!.Point! as [number, number],
      }));
  } catch {
    return [];
  }
}

/**
 * Reverse geocode: get place label and position for coordinates.
 * Position in request is [longitude, latitude] per AWS.
 */
export async function searchPlaceByPosition(
  longitude: number,
  latitude: number
): Promise<ReverseGeocodeResult | null> {
  if (!isLocationServiceConfigured()) {
    return null;
  }
  try {
    const { LocationClient, SearchPlaceIndexForPositionCommand } = await import(
      "@aws-sdk/client-location"
    );
    const client = new LocationClient({ region: AWS_REGION });
    const command = new SearchPlaceIndexForPositionCommand({
      IndexName: getPlaceIndexName(),
      Position: [longitude, latitude],
      MaxResults: 1,
    });
    const response = (await client.send(command)) as {
      Results?: Array<{ Place?: { Label?: string; Geometry?: { Point?: [number, number] } } }>;
    };
    const place = response.Results?.[0]?.Place;
    if (!place?.Geometry?.Point) return null;
    return {
      label: place.Label ?? "",
      position: place.Geometry.Point as [number, number],
    };
  } catch {
    return null;
  }
}

/**
 * Geocode a single address or place text to coordinates.
 * Returns [longitude, latitude] or null.
 */
export async function geocodeAddress(text: string): Promise<[number, number] | null> {
  const results = await searchPlacesByText(text, { maxResults: 1 });
  return results.length > 0 ? results[0].position : null;
}

/** Place result plus the keyword that matched it (for category/industry). */
export type PlaceResultWithKeyword = { place: PlaceResult; keyword: string };

/**
 * Search for places by multiple keywords, aggregate and dedupe by placeId.
 * Returns each place with the keyword that found it. Used by heat-sources and heat-consumers.
 */
export async function searchPlacesByKeywords(
  keywords: readonly string[],
  options?: {
    maxResultsPerKeyword?: number;
    filterBBox?: [number, number, number, number];
  }
): Promise<PlaceResultWithKeyword[]> {
  if (!isLocationServiceConfigured() || keywords.length === 0) return [];
  const seen = new Set<string>();
  const results: PlaceResultWithKeyword[] = [];
  const maxResults = options?.maxResultsPerKeyword ?? 5;
  for (const keyword of keywords) {
    const places = await searchPlacesByText(keyword, {
      maxResults,
      filterBBox: options?.filterBBox,
    });
    for (const p of places) {
      if (seen.has(p.placeId)) continue;
      seen.add(p.placeId);
      results.push({ place: p, keyword });
    }
  }
  return results;
}
