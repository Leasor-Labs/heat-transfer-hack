import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

const REPO_ROOT = path.join(__dirname, "..", "..");

export class HeatTransferStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. HeatSources table + industry-index GSI
    const heatSourcesTable = new dynamodb.Table(this, "HeatSources", {
      tableName: "HeatSources",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    heatSourcesTable.addGlobalSecondaryIndex({
      indexName: "industry-index",
      partitionKey: { name: "industry", type: dynamodb.AttributeType.STRING },
    });

    // 2. HeatConsumers table + category-index GSI
    const heatConsumersTable = new dynamodb.Table(this, "HeatConsumers", {
      tableName: "HeatConsumers",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    heatConsumersTable.addGlobalSecondaryIndex({
      indexName: "category-index",
      partitionKey: { name: "category", type: dynamodb.AttributeType.STRING },
    });

    const lambdaEnv = {
      HEAT_SOURCES_TABLE: heatSourcesTable.tableName,
      HEAT_CONSUMERS_TABLE: heatConsumersTable.tableName,
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
    };

    const nodejsFunctionProps: Partial<lambdaNodejs.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
      },
    };

    // 3. Four Lambda functions (Node.js 20.x), least-privilege IAM
    const getHeatSourcesFn = new lambdaNodejs.NodejsFunction(this, "GetHeatSources", {
      ...nodejsFunctionProps,
      entry: path.join(REPO_ROOT, "src", "api", "getHeatSources.ts"),
      handler: "handler",
      projectRoot: REPO_ROOT,
    });
    heatSourcesTable.grantReadData(getHeatSourcesFn);

    const getHeatSourceByIdFn = new lambdaNodejs.NodejsFunction(this, "GetHeatSourceById", {
      ...nodejsFunctionProps,
      entry: path.join(REPO_ROOT, "src", "api", "getHeatSourceById.ts"),
      handler: "handler",
      projectRoot: REPO_ROOT,
    });
    heatSourcesTable.grantReadData(getHeatSourceByIdFn);

    const getHeatConsumersFn = new lambdaNodejs.NodejsFunction(this, "GetHeatConsumers", {
      ...nodejsFunctionProps,
      entry: path.join(REPO_ROOT, "src", "api", "getHeatConsumers.ts"),
      handler: "handler",
      projectRoot: REPO_ROOT,
    });
    heatConsumersTable.grantReadData(getHeatConsumersFn);

    const getHeatConsumerByIdFn = new lambdaNodejs.NodejsFunction(this, "GetHeatConsumerById", {
      ...nodejsFunctionProps,
      entry: path.join(REPO_ROOT, "src", "api", "getHeatConsumerById.ts"),
      handler: "handler",
      projectRoot: REPO_ROOT,
    });
    heatConsumersTable.grantReadData(getHeatConsumerByIdFn);

    // 4. API Gateway REST API — heat-transfer-api, 4 routes + OPTIONS CORS
    const api = new apigateway.RestApi(this, "HeatTransferApi", {
      restApiName: "heat-transfer-api",
      deployOptions: {
        stageName: "dev",
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    // Paths under /api so frontend (script.js) can use same paths when pointing to API Gateway (Amplify)
    const apiResource = api.root.addResource("api");
    const heatSources = apiResource.addResource("heat-sources");
    heatSources.addMethod("GET", new apigateway.LambdaIntegration(getHeatSourcesFn));
    const heatSourceById = heatSources.addResource("{id}");
    heatSourceById.addMethod("GET", new apigateway.LambdaIntegration(getHeatSourceByIdFn));

    const heatConsumers = apiResource.addResource("heat-consumers");
    heatConsumers.addMethod("GET", new apigateway.LambdaIntegration(getHeatConsumersFn));
    const heatConsumerById = heatConsumers.addResource("{id}");
    heatConsumerById.addMethod("GET", new apigateway.LambdaIntegration(getHeatConsumerByIdFn));

    // 5. CfnOutput for invoke URL (include /api so frontend base URL is stage root)
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "Heat Transfer API invoke URL",
      exportName: "HeatTransferApiUrl",
    });
  }
}
