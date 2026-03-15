# DynamoDB: seeding and testing

## 1. Prerequisites

- DynamoDB tables **HeatSources** and **HeatConsumers** exist (e.g. created by `sam deploy` from `template.yaml`, or manually in the AWS console with partition key `id` and GSIs `industry-index` / `category-index` if you use filters).
- AWS credentials configured (env vars, `~/.aws/credentials`, or IAM role when running on AWS).
- Env vars set:
  - `HEAT_SOURCES_TABLE` (e.g. `HeatSources`)
  - `HEAT_CONSUMERS_TABLE` (e.g. `HeatConsumers`)
  - `AWS_REGION` (e.g. `us-east-1`) — optional, defaults to `us-east-1`.

## 2. Put data into DynamoDB

From the project root:

```bash
npm run seed-dynamo
```

Or with env vars inline (Windows PowerShell):

```powershell
$env:HEAT_SOURCES_TABLE="HeatSources"; $env:HEAT_CONSUMERS_TABLE="HeatConsumers"; $env:AWS_REGION="us-east-1"; npm run seed-dynamo
```

This writes the Ohio seed data (5 heat sources, 5 heat consumers) into the two tables.

## 3. Access and test that it’s running

### Start the server

```bash
npm run dev
```

Set the same env vars as above if you want the server to read from DynamoDB.

### Check health and DynamoDB status

```bash
curl http://localhost:3000/api/health
```

Example response when DynamoDB is configured and reachable:

```json
{
  "ok": true,
  "dynamo": {
    "configured": true,
    "heatSourcesTable": "HeatSources",
    "heatConsumersTable": "HeatConsumers",
    "heatSourcesCount": 5,
    "heatConsumersCount": 5
  }
}
```

If `configured` is `false`, the table env vars are not set and the API uses Ohio seed in memory. If `error` is set, DynamoDB returned an error (e.g. missing tables or permissions).

### Read map data from DynamoDB

- **Heat sources:**  
  `GET http://localhost:3000/api/heat-sources`  
  (e.g. `curl http://localhost:3000/api/heat-sources`)
- **Heat consumers:**  
  `GET http://localhost:3000/api/heat-consumers`  
  (e.g. `curl http://localhost:3000/api/heat-consumers`)

When `HEAT_SOURCES_TABLE` and `HEAT_CONSUMERS_TABLE` are set, these endpoints return data from DynamoDB (the same data you seeded). The map UI uses these endpoints.

### Quick test flow

1. `npm run seed-dynamo` (with table env vars and AWS credentials).
2. `npm run dev` (with the same env vars).
3. Open or `curl` `http://localhost:3000/api/health` — confirm `dynamo.configured` and counts.
4. Open or `curl` `http://localhost:3000/api/heat-sources` and `http://localhost:3000/api/heat-consumers` — confirm the seeded records.

## 4. Test the API (local or deployed)

Run the small test script against the API base URL:

```bash
# Local server (after npm run dev)
npm run test:api

# Or against a deployed API Gateway URL
API_BASE_URL=https://xxxx.execute-api.us-east-1.amazonaws.com/dev npm run test:api
# Or: node scripts/test-api.js https://xxxx.execute-api.us-east-1.amazonaws.com/dev
```

The script checks `GET /api/health`, `GET /api/heat-sources`, and `GET /api/heat-consumers` and exits 0 if all pass. Use it to confirm DynamoDB, API Gateway, and Lambda work together after deploy (see [AMPLIFY_API.md](AMPLIFY_API.md)).
