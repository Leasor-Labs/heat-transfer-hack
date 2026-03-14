import type { HeatSource } from "../../shared/types";

/**
 * Ohio heat sources seed data. Coordinates can be populated or refreshed
 * using Amazon Location Service (searchPlacesByText / geocodeAddress).
 */
export const HEAT_SOURCES_OHIO: HeatSource[] = [
  {
    id: "ohio-source-1",
    name: "Cleveland Industrial Plant",
    industry: "Manufacturing",
    latitude: 41.4993,
    longitude: -81.6944,
    estimatedWasteHeatMWhPerYear: 12000,
    recoverableHeatMWhPerYear: 6000,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-2",
    name: "Columbus Data Center",
    industry: "Technology",
    latitude: 39.9612,
    longitude: -82.9988,
    estimatedWasteHeatMWhPerYear: 8000,
    recoverableHeatMWhPerYear: 4000,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-3",
    name: "Cincinnati Refinery",
    industry: "Oil & Gas",
    latitude: 39.1031,
    longitude: -84.512,
    estimatedWasteHeatMWhPerYear: 25000,
    recoverableHeatMWhPerYear: 12500,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "ohio-source-4",
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
    id: "ohio-source-5",
    name: "Akron Rubber Plant",
    industry: "Manufacturing",
    latitude: 41.0814,
    longitude: -81.519,
    estimatedWasteHeatMWhPerYear: 5000,
    recoverableHeatMWhPerYear: 2500,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
];
