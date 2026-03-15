# Amplify environment variables for backend stack (no SAM)

The build uses **plain CloudFormation** (`template-cfn.yaml`) and the AWS CLI only—no SAM CLI. Add these in **Amplify Console** → your app → **App settings** → **Environment variables** (or **Build settings** → **Environment variables**).

## Required for deploy (backend stack)

| Variable | Description | Example |
|----------|-------------|---------|
| **SAM_STACK_NAME** | CloudFormation stack name for the backend (API Gateway + Lambda + DynamoDB). | `heatgrid-api` |
| **AWS_REGION** | AWS region for the stack and API. | `us-east-1` |
| **LAMBDA_ARTIFACTS_BUCKET** | S3 bucket where the build uploads the Lambda zip. Create a bucket in the same account/region (e.g. `heatgrid-lambda-artifacts-yourname`) and set this to the bucket name. | `heatgrid-lambda-artifacts-abc123` |

## Optional (sensible defaults)

| Variable | Description | Default |
|----------|-------------|---------|
| **SAM_STAGE** | API Gateway stage name (template parameter). If unset, the build uses `dev`. | `dev` |

## Required for frontend (API base URL)

| Variable | Description | When to set |
|----------|-------------|-------------|
| **HEATGRID_API_BASE_URL** | Base URL of your API so the app can call it. Must match the **ApiUrl** output from the stack (no trailing slash). | After the **first** successful Amplify build: open CloudFormation → your stack (`SAM_STACK_NAME`) → **Outputs** → copy **ApiUrl**, then add it here and **redeploy** the Amplify app. |

Example value: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev`

## Summary: minimum to add in Amplify

1. **SAM_STACK_NAME** = `heatgrid-api` (or any name you want for the stack)
2. **AWS_REGION** = `us-east-1` (or your region)
3. **LAMBDA_ARTIFACTS_BUCKET** = an S3 bucket you create (e.g. in the S3 console) in the same account/region; the build will upload the Lambda zip here.
4. **HEATGRID_API_BASE_URL** = leave empty for the first build; after the first deploy, set it to the **ApiUrl** from the stack outputs, then trigger a new build.

## Build role permissions

The Amplify **build service role** must be allowed to run CloudFormation and upload to S3. If the build fails with “access denied” on CloudFormation or Lambda, attach a policy that allows:

- `cloudformation:*`
- `lambda:*`
- `apigateway:*`
- `dynamodb:*`
- `s3:PutObject`, `s3:GetObject` (for **LAMBDA_ARTIFACTS_BUCKET**)
- `iam:PassRole`, `iam:CreateRole`, `iam:AttachRolePolicy` (for Lambda execution role)

Or use **Amplify’s “Full access” or “Administrator”**-style role for the build if this is a dev account.

## Troubleshooting: ROLLBACK_FAILED

If the build fails with **StackCreateComplete failed** and status **ROLLBACK_FAILED** (or **CREATE_FAILED**):

1. **Find the real error**
   - In **AWS Console** go to **CloudFormation** → select the stack (same name as **SAM_STACK_NAME**).
   - Open the **Events** tab and look for the event with status **CREATE_FAILED** or **ROLLBACK_FAILED**. The **Status reason** column shows the error (e.g. permission denied, resource limit, name already in use).

2. **Delete the failed stack before retrying**
   - In CloudFormation, select the stack → **Delete**. If it won't delete (e.g. some resources retained), use the **Resources** tab to see what's left; you may need to remove dependencies or delete resources manually in their service consoles (Lambda, API Gateway, DynamoDB) then delete the stack again.

3. **Typical causes**
   - **IAM:** Amplify build role missing `iam:PassRole`, `iam:CreateRole`, or `iam:AttachRolePolicy` for the Lambda execution role. Add those to the build role and redeploy.
   - **DynamoDB:** Tables **HeatSources** or **HeatConsumers** already exist in the same account/region (e.g. from a previous run). Delete those tables or use a different **SAM_STACK_NAME** (this template uses fixed table names; if you hit conflicts, you'd need to parameterize table names).
   - **API Gateway / Lambda:** Quota or region limits. Try another region or request a limit increase.

After fixing the cause and deleting the failed stack, trigger a new Amplify build so the stack can be created again.
