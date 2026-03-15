/**
 * HTTP server that exposes the backend API for the HeatGrid frontend.
 * Serves API routes and optionally static files (index.html, script.js, styles.css).
 * Run: npm run dev then open http://localhost:3000
 */
/// <reference path="../shared/node-path.d.ts" />
/// <reference path="../shared/express.d.ts" />
import path from "path";
import express from "express";
import {
  handleGetHeatSources,
  handleGetHeatConsumers,
  handleEvaluateOpportunity,
  // Future Feature: handleGetRankedOpportunities,
  handleGetTags,
} from "./api";
import { getDynamoStatus } from "./api/dynamo-status";
import { refreshDynamoFromLocationService } from "./data/build-seed-from-location-service";

declare const process: { env: Record<string, string | undefined> };
declare const __dirname: string;

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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
    if (locationSearchQuery?.trim()) {
      // #region agent log
      fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1f167'},body:JSON.stringify({sessionId:'e1f167',location:'server.ts:46',message:'trigger refresh',data:{locationSearchQuery:locationSearchQuery?.trim()},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      refreshDynamoFromLocationService()
        .then((result) => {
          // #region agent log
          fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1f167'},body:JSON.stringify({sessionId:'e1f167',location:'server.ts:52',message:'refresh completed',data:result,timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
          // #endregion
        })
        .catch((err) => {
          // #region agent log
          fetch('http://127.0.0.1:7528/ingest/59cacce0-7747-4658-a89b-976b0f7d76a2',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e1f167'},body:JSON.stringify({sessionId:'e1f167',location:'server.ts:56',message:'refresh failed',data:{error:String(err?.message||err)},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
          // #endregion
          console.error("Refresh seed from location failed", err);
        });
    }
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
    if (locationSearchQuery?.trim()) {
      refreshDynamoFromLocationService().catch((err) =>
        console.error("Refresh seed from location failed", err)
      );
    }
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

// Future Feature: ranked-opportunities API
// app.get("/api/ranked-opportunities", async (_req, res) => {
//   try {
//     const data = await handleGetRankedOpportunities();
//     res.json(data);
//   } catch (err) {
//     console.error("GET /api/ranked-opportunities", err);
//     res.status(500).json({ error: "Failed to fetch ranked opportunities" });
//   }
// });

// Refresh DynamoDB from AWS Location Service (keywords). Called on page load and when search is used.
app.get("/api/refresh-seed-from-location", async (_req, res) => {
  try {
    const result = await refreshDynamoFromLocationService();
    res.json({ ok: true, sourcesWritten: result.sourcesWritten, consumersWritten: result.consumersWritten });
  } catch (err) {
    console.error("GET /api/refresh-seed-from-location", err);
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "Internal server error" });
  }
});

// Health and DynamoDB status (for testing that data is in DynamoDB and reachable)
app.get("/api/health", async (_req, res) => {
  try {
    const dynamo = await getDynamoStatus();
    res.json({ ok: true, dynamo });
  } catch (err) {
    console.error("GET /api/health", err);
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : "Internal server error" });
  }
});

app.get("/api/tags", async (_req, res) => {
  try {
    const data = await handleGetTags();
    res.json(data);
  } catch (err) {
    console.error("GET /api/tags", err);
    res.status(500).json({ error: "Failed to fetch tags" });
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
