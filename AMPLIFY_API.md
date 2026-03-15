# Amplify + API Gateway + Lambda + DynamoDB

## Deploy the backend

1. **Build the Lambda bundle**
   ```bash
   npm run build:lambda
   ```
   Produces `build/index.js` (single Lambda that routes all `/api/*` requests).

2. **Deploy with SAM**
   ```bash
   sam build
   sam deploy --guided
   ```
   When prompted: choose stack name (e.g. `heatgrid-api`), region, confirm and allow SAM to create IAM roles.

3. **Note the outputs** after deploy:
   - **ApiUrl** – e.g. `https://xxxx.execute-api.region.amazonaws.com/dev`
   - **HeatSourcesTableName**, **HeatConsumersTableName**
   - **ApiKeyId** – optional; use only if you later enable API key requirement

4. **Seed DynamoDB** (once)
   Set env vars to the table names (from outputs) and run:
   ```bash
   set HEAT_SOURCES_TABLE=HeatSources
   set HEAT_CONSUMERS_TABLE=HeatConsumers
   set AWS_REGION=us-east-1
   npm run seed-dynamo
   ```
   (Use `export` on Linux/macOS.)

## Point Amplify at the API (no API key required)

- **Full list of env vars for Amplify (including SAM build):** see **[AMPLIFY_ENV_VARS.md](./AMPLIFY_ENV_VARS.md)**.

- In **Amplify Console** → your app → **Environment variables**, add at least:
  - **HEATGRID_API_BASE_URL** = the **ApiUrl** from the SAM deploy output (no trailing slash).  
    Example: `https://abc123.execute-api.us-east-1.amazonaws.com/dev`
  - **SAM_STACK_NAME** and **AWS_REGION** (required if the build runs `sam deploy`; see AMPLIFY_ENV_VARS.md).

- **Inject into the app at build time**  
  In your Amplify build spec, after the build step, run a small replace so the deployed app gets the URL:
  - Replace `window.HEATGRID_API_BASE_URL = ""` in `index.html` with  
    `window.HEATGRID_API_BASE_URL = "<your ApiUrl from env>";`  
  - Or ensure your build sets the env var and your HTML is generated with that value.

- **Redeploy** the Amplify app. The frontend will call the API at `${HEATGRID_API_BASE_URL}/api/heat-sources`, etc.

## Optional: API key

The template creates an API key and usage plan; the API is configured with **ApiKeyRequired: false**, so requests work without a key. If you later want to require a key:

1. In API Gateway console, set "API key required" on the methods or the usage plan.
2. In Amplify, add an env var (e.g. **HEATGRID_API_KEY**) and pass it in the `x-api-key` header from the frontend for API requests.

## Test the deployed API

Run the test script to verify DynamoDB, API Gateway, and Lambda work together:

```bash
API_BASE_URL=https://xxxx.execute-api.us-east-1.amazonaws.com/dev npm run test:api
```

Or manually:

```bash
# Replace BASE with your ApiUrl, e.g. https://xxxx.execute-api.us-east-1.amazonaws.com/dev
curl -s "%BASE%/api/health"
curl -s "%BASE%/api/heat-sources"
curl -s "%BASE%/api/heat-consumers"
```

You should see JSON: health with `dynamo.configured` and counts, and heat-sources/heat-consumers arrays.
