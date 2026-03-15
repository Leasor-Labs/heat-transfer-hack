# Backend deploy (SAM – no CDK)

The backend is **DynamoDB + Lambda + API Gateway**, defined in **`template.yaml`** and deployed with **AWS SAM**. There is no CDK or bootstrap.

## One-time backend deploy

1. **Install AWS SAM CLI** (one time on your machine):  
   https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

2. **From the repo root** (where `template.yaml` is):

   ```bash
   sam build
   sam deploy --guided
   ```

   When prompted:

   - Stack name: e.g. `heat-transfer-api`
   - AWS Region: e.g. `us-east-1`
   - Confirm changes before deploy: **Y**
   - Allow SAM CLI IAM role creation: **Y**
   - Disable rollback: **N**
   - Save arguments to config: **Y**

3. **Note the outputs** after deploy:

   - **ApiUrl** – base URL for the API (e.g. `https://xxx.execute-api.us-east-1.amazonaws.com/dev`)
   - **HeatSourcesTableName** – `HeatSources`
   - **HeatConsumersTableName** – `HeatConsumers`

## Connect Amplify to the backend

1. In **Amplify Console** → your app → **Environment variables**, add:

   - **REACT_APP_API_URL** = the **ApiUrl** from the SAM deploy output (no trailing slash)
   - (Optional) **HEAT_SOURCES_TABLE** = `HeatSources`
   - (Optional) **HEAT_CONSUMERS_TABLE** = `HeatConsumers`
   - (Optional) **AWS_REGION** = e.g. `us-east-1`

2. **Redeploy** the Amplify app. The build will:

   - Seed DynamoDB with Toledo data (if the tables exist and env is set).
   - Inject **REACT_APP_API_URL** into `index.html` so the frontend calls your API.

## What’s in the stack

- **DynamoDB**: `HeatSources` (partition key `id`, GSI `industry-index`), `HeatConsumers` (partition key `id`, GSI `category-index`).
- **Lambda**: Four Node.js 20.x functions (getHeatSources, getHeatSourceById, getHeatConsumers, getHeatConsumerById), built with esbuild from `src/api/*.ts`.
- **API Gateway**: REST API with `GET /api/heat-sources`, `GET /api/heat-sources/{id}`, `GET /api/heat-consumers`, `GET /api/heat-consumers/{id}` and CORS.

No S3 is used for the API; the frontend is hosted by Amplify.
