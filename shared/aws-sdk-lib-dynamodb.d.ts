declare module "@aws-sdk/lib-dynamodb" {
  export class DynamoDBDocumentClient {
    static from(client: { constructor: unknown }): DynamoDBDocumentClient;
    send(command: unknown): Promise<unknown>;
  }
  export class PutCommand {
    constructor(input: { TableName: string; Item: Record<string, unknown> });
  }
  export class GetCommand {
    constructor(input: { TableName: string; Key: Record<string, unknown> });
  }
  export class QueryCommand {
    constructor(input: {
      TableName: string;
      IndexName?: string;
      KeyConditionExpression?: string;
      ExpressionAttributeNames?: Record<string, string>;
      ExpressionAttributeValues?: Record<string, unknown>;
    });
  }
  export class ScanCommand {
    constructor(input: {
      TableName: string;
      Select?: string;
    });
  }
}
