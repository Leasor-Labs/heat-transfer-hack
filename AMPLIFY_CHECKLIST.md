# Amplify checklist (no CDK)

The app uses **DynamoDB + Lambda + API Gateway** via **AWS SAM** (`template.yaml`). Amplify only builds the frontend, seeds DynamoDB (if env is set), and injects the API URL. The backend is **not** deployed by Amplify.

---

## 1. Deploy the backend once (SAM)

From your machine (see **BACKEND_DEPLOY.md**):

```bash
sam build
sam deploy --guided
```

Note the **ApiUrl** output.

---

## 2. Amplify environment variables

In **Amplify Console** → your app → **Environment variables**, add:

| Name | Value |
|------|--------|
| **REACT_APP_API_URL** | The ApiUrl from SAM deploy (e.g. `https://xxx.execute-api.us-east-1.amazonaws.com/dev`) – no trailing slash |
| **HEAT_SOURCES_TABLE** | `HeatSources` (optional; used for seed) |
| **HEAT_CONSUMERS_TABLE** | `HeatConsumers` (optional; used for seed) |
| **AWS_REGION** | e.g. `us-east-1` (optional) |

---

## 3. Build permissions (for seed only)

The Amplify build runs the **seed script** (writes to DynamoDB). The Amplify **service role** needs:

- **DynamoDB** – `PutItem` (or similar) on the HeatSources and HeatConsumers tables.

No CloudFormation, CDK bootstrap, or Lambda deploy is done by Amplify.

---

## 4. Trigger a build

Push to the connected branch or click **Redeploy**. The build will:

1. Run `npm install`
2. Run the Toledo seed script (if table env vars are set; failures are ignored)
3. Inject **REACT_APP_API_URL** into `index.html` if set

---

## Summary

| Step | Action |
|------|--------|
| 1 | Deploy backend once: `sam build && sam deploy --guided` (see BACKEND_DEPLOY.md) |
| 2 | In Amplify env vars, set **REACT_APP_API_URL** (and optional table names / region) |
| 3 | Ensure Amplify service role can write to DynamoDB (for seed) |
| 4 | Push or redeploy so the frontend uses the new API URL |
