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

/** Request ranked opportunities for a fixed source + list of consumers (or consumer + list of sources). */
export type RankedOpportunitiesInRangeRequest = {
  /** When set, rank (source, consumer) for each consumer in consumerIds */
  sourceId?: string;
  consumerIds?: string[];
  /** When set, rank (source, consumer) for each source in sourceIds */
  consumerId?: string;
  sourceIds?: string[];
};

export type RankedOpportunitiesInRangeResponse = GetRankedOpportunitiesResponse;
