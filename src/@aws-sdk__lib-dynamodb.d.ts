declare module "@aws-sdk/lib-dynamodb" {
  export class PutCommand {
    constructor(input: { TableName: string; Item: Record<string, unknown> });
  }
}
