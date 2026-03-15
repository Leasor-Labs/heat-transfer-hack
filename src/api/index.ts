/**
 * Backend API handlers. Use with your HTTP server or Lambda.
 * Contract: shared/api-contract.ts
 */
export { handleGetHeatSources } from "./handlers/heat-sources";
export { handleGetHeatConsumers } from "./handlers/heat-consumers";
export { handleEvaluateOpportunity } from "./handlers/evaluate-opportunity";
// Future Feature: export { handleGetRankedOpportunities } from "./handlers/ranked-opportunities";
export { handleGetTags } from "./handlers/tags";
