import type {
  HeatSource,
  HeatConsumer,
  HeatExchangeOpportunity,
  OpportunityRanking,
} from "./types";

export type GetHeatSourcesResponse = {
  heatSources: HeatSource[];
  /** Set to 25 when the request could not communicate with AWS Location Service. */
  errorCode?: number;
};

export type GetHeatConsumersResponse = {
  heatConsumers: HeatConsumer[];
  /** Set to 25 when the request could not communicate with AWS Location Service. */
  errorCode?: number;
};

export type EvaluateOpportunityRequest = {
  sourceId: string;
  consumerId: string;
};

export type EvaluateOpportunityResponse = {
  opportunity: HeatExchangeOpportunity;
};

export type GetRankedOpportunitiesResponse = {
  rankings: OpportunityRanking[];
};
