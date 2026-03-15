/**
 * Replaces the HEATGRID_API_BASE_URL placeholder in index.html with the value from env.
 * Used in Amplify build so the frontend gets the API Gateway URL.
 * Requires: HEATGRID_API_BASE_URL (optional; if missing, leaves empty string).
 */
const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "index.html");
const apiUrl = process.env.HEATGRID_API_BASE_URL || "";
const escaped = apiUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const line = `<script>window.HEATGRID_API_BASE_URL = "${escaped}";</script>`;

let html = fs.readFileSync(indexPath, "utf8");
html = html.replace(
  /<script>window\.HEATGRID_API_BASE_URL = "[^"]*";<\/script>/,
  line
);
fs.writeFileSync(indexPath, html);
console.log("Injected HEATGRID_API_BASE_URL into index.html");
