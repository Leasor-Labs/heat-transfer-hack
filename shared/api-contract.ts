import type {
  HeatSource,
  HeatConsumer,
  HeatExchangeOpportunity,
  OpportunityRanking,
} from "./types";

export type GetHeatSourcesResponse = {
  heatSources: HeatSource[];
};

export type GetHeatConsumersResponse = {
  heatConsumers: HeatConsumer[];
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
