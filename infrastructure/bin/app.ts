#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { HeatTransferStack } from "../lib/heat-transfer-stack";

const app = new cdk.App();
new HeatTransferStack(app, "HeatTransferStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
});
