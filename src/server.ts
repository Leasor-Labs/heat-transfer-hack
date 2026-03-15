/**
 * HTTP server that exposes the backend API for the HeatGrid frontend.
 * Serves API routes and optionally static files (index.html, script.js, styles.css).
 * Run: npm run dev then open http://localhost:3000
 */

import path from "path";
import express from "express";
import {
  handleGetHeatSources,
  handleGetHeatConsumers,
  handleEvaluateOpportunity,
  handleGetRankedOpportunities,
} from "./api";

const app = express();
const PORT = process.env.PORT ?? 3000;

// CORS: allow frontend from any origin (file://, localhost, etc.)
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

// API routes
app.get("/api/heat-sources", async (req, res) => {
  try {
    const locationSearchQuery = req.query.locationSearchQuery as string | undefined;
    const data = await handleGetHeatSources({ locationSearchQuery });
    res.json(data);
  } catch (err) {
    console.error("GET /api/heat-sources", err);
    res.status(500).json({ error: "Failed to fetch heat sources" });
  }
});

app.get("/api/heat-consumers", async (req, res) => {
  try {
    const locationSearchQuery = req.query.locationSearchQuery as string | undefined;
    const data = await handleGetHeatConsumers({ locationSearchQuery });
    res.json(data);
  } catch (err) {
    console.error("GET /api/heat-consumers", err);
    res.status(500).json({ error: "Failed to fetch heat consumers" });
  }
});

app.post("/api/evaluate-opportunity", async (req, res) => {
  try {
    const body = req.body as { sourceId?: string; consumerId?: string };
    const data = await handleEvaluateOpportunity(body);
    if (data === null) {
      res.status(400).json({ error: "Invalid source or consumer id" });
      return;
    }
    res.json(data);
  } catch (err) {
    console.error("POST /api/evaluate-opportunity", err);
    res.status(500).json({ error: "Failed to evaluate opportunity" });
  }
});

app.get("/api/ranked-opportunities", async (req, res) => {
  try {
    const locationSearchQuery =
      typeof req.query.locationSearchQuery === "string"
        ? req.query.locationSearchQuery
        : undefined;
    const data = await handleGetRankedOpportunities({ locationSearchQuery });
    res.json(data);
  } catch (err) {
    console.error("GET /api/ranked-opportunities", err);
    res.status(500).json({ error: "Failed to fetch ranked opportunities" });
  }
});

// Map style: AWS Location Service when configured, otherwise same-origin OSM fallback (no CORS).
const OSM_FALLBACK_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

app.get("/api/map-style", (req, res) => {
  const apiKey = process.env.MAP_API_KEY;
  const region = process.env.AWS_REGION || "us-east-1";
  if (apiKey) {
    const mapStyle = process.env.MAP_STYLE || "Standard";
    const styleUrl = `https://maps.geo.${region}.amazonaws.com/v2/styles/${mapStyle}/descriptor?key=${apiKey}`;
    res.json({ styleUrl });
    return;
  }
  res.json({ style: OSM_FALLBACK_STYLE });
});

// Serve static files from project root so GET / returns index.html
app.use(express.static(path.join(__dirname, "..")));

app.listen(PORT, () => {
  console.log(`HeatGrid API and static files: http://localhost:${PORT}`);
});
