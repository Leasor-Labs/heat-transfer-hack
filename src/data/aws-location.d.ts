declare module "@aws-sdk/client-location" {
  export class LocationClient {
    constructor(config: { region: string });
    send(command: unknown): Promise<unknown>;
  }
  export class SearchPlaceIndexForTextCommand {
    constructor(params: unknown);
  }
  export class SearchPlaceIndexForPositionCommand {
    constructor(params: unknown);
  }
}
