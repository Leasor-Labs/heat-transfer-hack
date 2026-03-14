/**
 * Amazon Location Service integration for place search and geocoding.
 * Requires @aws-sdk/client-location. Configure via env:
 * - PLACE_INDEX_NAME: Place index resource name
 * - AWS_REGION: AWS region (default us-east-1)
 */

const PLACE_INDEX_NAME = process.env.PLACE_INDEX_NAME ?? "";
const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";

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
 * Search for places by text (e.g. "industrial facility Ohio").
 * Returns array of place labels and coordinates.
 */
export async function searchPlacesByText(
  text: string,
  options?: { maxResults?: number; biasPosition?: [number, number] }
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
      BiasPosition: options?.biasPosition,
    });
    const response = await client.send(command);
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
    const response = await client.send(command);
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
