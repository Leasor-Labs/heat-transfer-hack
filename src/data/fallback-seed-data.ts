/**
 * Minimal HeatSource and HeatConsumer data used to seed DynamoDB when
 * AWS Location Services are unavailable. Seeded via seed script; runtime
 * falls back to DynamoDB (which contains this data) instead of in-memory.
 */
import type { HeatSource } from "../../shared/types";
import type { HeatConsumer } from "../../shared/types";

/** Basic heat sources for fallback when Location Service is down (Toledo, OH area). */
export const FALLBACK_HEAT_SOURCES: HeatSource[] = [
  {
    id: "fallback-source-1",
    name: "Toledo Glass Factory",
    industry: "Manufacturing",
    latitude: 41.6528,
    longitude: -83.5378,
    estimatedWasteHeatMWhPerYear: 6000,
    recoverableHeatMWhPerYear: 3000,
    temperatureClass: "high",
    operatingHoursPerYear: 7200,
  },
  {
    id: "fallback-source-2",
    name: "Toledo Industrial Plant",
    industry: "Manufacturing",
    latitude: 41.6422,
    longitude: -83.5389,
    estimatedWasteHeatMWhPerYear: 5000,
    recoverableHeatMWhPerYear: 2500,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  {
    id: "fallback-source-3",
    name: "Toledo Data Center",
    industry: "Technology",
    latitude: 41.6581,
    longitude: -83.5386,
    estimatedWasteHeatMWhPerYear: 4000,
    recoverableHeatMWhPerYear: 2000,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
];

/** Basic heat consumers for fallback when Location Service is down (Toledo, OH area). */
export const FALLBACK_HEAT_CONSUMERS: HeatConsumer[] = [
  {
    id: "fallback-consumer-1",
    name: "Toledo Greenhouse Facility",
    category: "Agriculture",
    latitude: 41.6588,
    longitude: -83.5418,
    annualHeatDemandMWh: 5000,
  },
  {
    id: "fallback-consumer-2",
    name: "Toledo District Heating",
    category: "District Heating",
    latitude: 41.6528,
    longitude: -83.5378,
    annualHeatDemandMWh: 8000,
  },
  {
    id: "fallback-consumer-3",
    name: "Toledo Food Processing",
    category: "Food Processing",
    latitude: 41.6411,
    longitude: -83.5489,
    annualHeatDemandMWh: 3000,
  },
];
