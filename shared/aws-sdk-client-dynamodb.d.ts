declare module "@aws-sdk/client-dynamodb" {
  export class DynamoDBClient {
    constructor(config?: { region?: string });
  }
}
