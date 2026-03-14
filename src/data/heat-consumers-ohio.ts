import type { HeatConsumer } from "../../shared/types";

/**
 * Ohio heat consumers seed data. Coordinates can be populated or refreshed
 * using Amazon Location Service (searchPlacesByText / geocodeAddress).
 */
export const HEAT_CONSUMERS_OHIO: HeatConsumer[] = [
  {
    id: "ohio-consumer-1",
    name: "Cleveland District Heating Network",
    category: "District Heating",
    latitude: 41.5052,
    longitude: -81.6934,
    annualHeatDemandMWh: 15000,
  },
  {
    id: "ohio-consumer-2",
    name: "Columbus Hospital Complex",
    category: "Healthcare",
    latitude: 39.9652,
    longitude: -83.0008,
    annualHeatDemandMWh: 8000,
  },
  {
    id: "ohio-consumer-3",
    name: "Cincinnati Apartment Complex",
    category: "Residential",
    latitude: 39.1105,
    longitude: -84.505,
    annualHeatDemandMWh: 3000,
  },
  {
    id: "ohio-consumer-4",
    name: "Toledo Greenhouse Facility",
    category: "Agriculture",
    latitude: 41.6588,
    longitude: -83.5418,
    annualHeatDemandMWh: 5000,
  },
  {
    id: "ohio-consumer-5",
    name: "Akron Food Processing Plant",
    category: "Food Processing",
    latitude: 41.0865,
    longitude: -81.523,
    annualHeatDemandMWh: 4000,
  },
];
