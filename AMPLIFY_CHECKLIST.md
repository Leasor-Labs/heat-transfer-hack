# Amplify “Do Everything” Checklist

Use this list so Amplify can build the frontend, deploy the backend (CDK), seed DynamoDB, and inject the API URL.

---

## 1. Use the repo root as the app root

- In **Amplify Console** → your app → **App settings** → **General**.
- Set **Build specification** so the build runs from the **repository root** (not a subfolder like `FrontEnd`).
- Amplify should pick up the root **`amplify.yml`** and use **Artifacts base directory** `.` so `index.html`, `script.js`, and `styles.css` are published.

If your app is today configured with “Root directory” or “Monorepo” pointing to a subfolder, change it to the repo root so the new `amplify.yml` is used.

---

## 2. Give the build permission to deploy the backend

The build runs `cdk deploy` and the seed script. The **Amplify service role** (the role used for the build) must be allowed to:

- **CloudFormation** – create/update/delete stacks (for CDK).
- **Lambda** – create/update functions, publish versions.
- **API Gateway** – create/update APIs and integrations.
- **DynamoDB** – create tables, put items (for seed).
- **IAM** – create roles and attach policies (for Lambda execution roles).
- **S3** – read/write to the CDK bootstrap bucket and Lambda asset bucket.

**Easiest (for a hackathon / single account):**

- In **Amplify Console** → **App settings** → **General** → **Service role**.
- Use an existing role that has **AdministratorAccess** (or create a new role with it and select it as the Amplify service role).

**Tighter permissions (optional):**

- Create a custom IAM policy that allows the above services and attach it to the Amplify service role.  
- You can start with AdministratorAccess and lock it down later.

---

## 3. (Optional) Set AWS region

- Amplify usually sets **AWS_REGION** in the build (e.g. the app’s region).
- If you use a non-default region, in **Amplify Console** → **Environment variables** add **AWS_REGION** = your region (e.g. `us-east-1`).
- The seed script uses this when writing to DynamoDB.

---

## 4. Save and trigger a build

- Commit and push **`amplify.yml`** (and **`.gitignore`** / **`AMPLIFY_CHECKLIST.md`** if you use them).
- In Amplify, **trigger a new build** (e.g. “Redeploy this version” or push to the connected branch).

The first build will:

1. Run `npm install` at repo root.
2. Run `cdk bootstrap` (if needed) and `cdk deploy` from `infrastructure/`.
3. Write stack outputs to `cdk-outputs.json`.
4. Run the Toledo seed script (`src/data/seedDynamoFromToledo.ts`).
5. Inject the API URL from the stack output into `index.html`.
6. Produce artifacts from the repo root (your frontend).

Later builds will reuse the existing stack and only update what changed.

---

## 5. If the build fails

- **“Access Denied” / “is not authorized”**  
  The Amplify service role is missing permissions. Add the permissions from step 2 (or use AdministratorAccess for the build role).

- **“Stack already exists” / CDK errors**  
  The stack was created in a different account or region. Either use that account/region in Amplify or delete the stack in the other account and redeploy.

- **Seed script fails**  
  Check that **HEAT_SOURCES_TABLE** and **HEAT_CONSUMERS_TABLE** match the table names in your stack (`HeatSources`, `HeatConsumers`). The build sets these in `amplify.yml`; only change them if you changed the table names in the CDK stack.

- **Frontend still shows Ohio / no data**  
  Confirm the build step that injects the API URL ran (check build logs for “Injected HEATGRID_API_BASE_URL”). If the outputs file wasn’t generated, the CDK deploy step may have failed earlier.

---

## Summary

| # | What to do |
|---|------------|
| 1 | Use repo root as app root so root `amplify.yml` is used. |
| 2 | Give Amplify build role permission to deploy CDK (e.g. AdministratorAccess or custom policy). |
| 3 | (Optional) Set **AWS_REGION** in Amplify env if not default. |
| 4 | Push and trigger a build; first run will bootstrap CDK, deploy, seed DB, and inject API URL. |
| 5 | If it fails, use build logs and the “If the build fails” section above. |

After a successful build, the hosted app will call your API Gateway for heat sources and heat consumers (Toledo data from DynamoDB).
