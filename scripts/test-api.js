/**
 * Small test for deployed API: health, heat-sources, heat-consumers.
 * Usage: node scripts/test-api.js [BASE_URL]
 * Example: node scripts/test-api.js https://xxxx.execute-api.us-east-1.amazonaws.com/dev
 * Or set API_BASE_URL env var.
 */
const base = process.env.API_BASE_URL || process.argv[2] || "http://localhost:3000";

async function fetchJson(path) {
  const url = `${base.replace(/\/$/, "")}${path}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${path}: invalid JSON`);
  }
}

async function main() {
  const out = { passed: 0, failed: 0, errors: [] };

  try {
    const health = await fetchJson("/api/health");
    if (health.ok !== true) throw new Error("health.ok !== true");
    if (health.dynamo == null) throw new Error("health.dynamo missing");
    out.passed++;
    console.log("GET /api/health OK (dynamo.configured =", health.dynamo.configured + ")");
  } catch (e) {
    out.failed++;
    out.errors.push("/api/health: " + (e.message || e));
    console.error("GET /api/health FAIL:", e.message);
  }

  try {
    const sources = await fetchJson("/api/heat-sources");
    if (!Array.isArray(sources.heatSources)) throw new Error("heatSources not an array");
    out.passed++;
    console.log("GET /api/heat-sources OK (count =", sources.heatSources.length + ")");
  } catch (e) {
    out.failed++;
    out.errors.push("/api/heat-sources: " + (e.message || e));
    console.error("GET /api/heat-sources FAIL:", e.message);
  }

  try {
    const consumers = await fetchJson("/api/heat-consumers");
    if (!Array.isArray(consumers.heatConsumers)) throw new Error("heatConsumers not an array");
    out.passed++;
    console.log("GET /api/heat-consumers OK (count =", consumers.heatConsumers.length + ")");
  } catch (e) {
    out.failed++;
    out.errors.push("/api/heat-consumers: " + (e.message || e));
    console.error("GET /api/heat-consumers FAIL:", e.message);
  }

  console.log("\nResult:", out.passed, "passed,", out.failed, "failed");
  process.exit(out.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
