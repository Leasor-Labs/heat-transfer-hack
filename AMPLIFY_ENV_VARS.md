# Amplify environment variables for SAM build and API

Add these in **Amplify Console** → your app → **App settings** → **Environment variables** (or **Build settings** → **Environment variables**).

## Required for SAM deploy (backend stack)

| Variable | Description | Example |
|----------|-------------|---------|
| **SAM_STACK_NAME** | CloudFormation stack name for the backend (API Gateway + Lambda + DynamoDB). | `heatgrid-api` |
| **AWS_REGION** | AWS region for the stack and API. | `us-east-1` |

## Optional (sensible defaults)

| Variable | Description | Default |
|----------|-------------|---------|
| **SAM_STAGE** | API Gateway stage name (template parameter). If unset, the build uses `dev`. | `dev` |

**Note:** The build uses `--resolve-s3` so SAM creates/manages the S3 bucket for Lambda artifacts; you do not need to create a bucket or set `SAM_ARTIFACTS_BUCKET`.

## Required for frontend (API base URL)

| Variable | Description | When to set |
|----------|-------------|-------------|
| **HEATGRID_API_BASE_URL** | Base URL of your API so the app can call it. Must match the **ApiUrl** output from the stack (no trailing slash). | After the **first** successful Amplify build: open CloudFormation → your stack (`SAM_STACK_NAME`) → **Outputs** → copy **ApiUrl**, then add it here and **redeploy** the Amplify app. |

Example value: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev`

## Summary: minimum to add in Amplify

1. **SAM_STACK_NAME** = `heatgrid-api` (or any name you want for the stack)
2. **AWS_REGION** = `us-east-1` (or your region)
3. **HEATGRID_API_BASE_URL** = leave empty for the first build; after the first deploy, set it to the **ApiUrl** from the stack outputs, then trigger a new build.

## Build role permissions

The Amplify **build service role** must be allowed to run SAM/CloudFormation (create/update stack, create Lambda, API Gateway, DynamoDB, S3, IAM roles). If the build fails with “access denied” on CloudFormation or Lambda, attach a policy that allows:

- `cloudformation:*`
- `lambda:*`
- `apigateway:*`
- `dynamodb:*`
- `s3:*` (for SAM deploy artifact bucket)
- `iam:PassRole`, `iam:CreateRole`, `iam:AttachRolePolicy` (for Lambda execution role)

Or use **Amplify’s “Full access” or “Administrator”**-style role for the build if this is a dev account.
