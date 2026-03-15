const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

declare const process: { env: Record<string, string | undefined> };

const OSM_FALLBACK_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    { id: "osm-tiles", type: "raster" as const, source: "osm", minzoom: 0, maxzoom: 19 },
  ],
};

export async function handler(): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  const apiKey = process.env.MAP_API_KEY;
  const region = process.env.AWS_REGION || "us-east-1";
  if (apiKey) {
    const mapStyle = process.env.MAP_STYLE || "Standard";
    const styleUrl = `https://maps.geo.${region}.amazonaws.com/v2/styles/${mapStyle}/descriptor?key=${apiKey}`;
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ styleUrl }) };
  }
  return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ style: OSM_FALLBACK_STYLE }) };
}
