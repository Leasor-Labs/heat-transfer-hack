/**
 * Default HeatSource and HeatConsumer data used when AWS Location Services are unavailable.
 * Most locations are within ~50 km of Toledo, Ohio; a few are in Columbus, Ohio.
 * Seeded via seed script; runtime falls back to DynamoDB (which contains this data).
 */
import type { HeatSource } from "../../shared/types";
import type { HeatConsumer } from "../../shared/types";

/** Base heat sources for fallback: Toledo area (~50 km) + a few in Columbus. */
const FALLBACK_HEAT_SOURCES_BASE: HeatSource[] = [
  // Toledo area (~50 km)
  {
    id: "fallback-source-1",
    name: "Toledo Glass Factory",
    industry: "Glass Manufacturing",
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
  {
    id: "fallback-source-4",
    name: "Perrysburg Manufacturing",
    industry: "Manufacturing",
    latitude: 41.537,
    longitude: -83.6289,
    estimatedWasteHeatMWhPerYear: 7000,
    recoverableHeatMWhPerYear: 3500,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "fallback-source-5",
    name: "Maumee Refinery",
    industry: "Oil & Gas",
    latitude: 41.5636,
    longitude: -83.6539,
    estimatedWasteHeatMWhPerYear: 12000,
    recoverableHeatMWhPerYear: 6000,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "fallback-source-6",
    name: "Oregon OH Steel Mill",
    industry: "Manufacturing",
    latitude: 41.6436,
    longitude: -83.4869,
    estimatedWasteHeatMWhPerYear: 9000,
    recoverableHeatMWhPerYear: 4500,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "fallback-source-7",
    name: "Sylvania Industrial",
    industry: "Manufacturing",
    latitude: 41.7189,
    longitude: -83.7028,
    estimatedWasteHeatMWhPerYear: 4500,
    recoverableHeatMWhPerYear: 2250,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  {
    id: "fallback-source-8",
    name: "Toledo Automotive Plant",
    industry: "Automotive",
    latitude: 41.6367,
    longitude: -83.3683,
    estimatedWasteHeatMWhPerYear: 11000,
    recoverableHeatMWhPerYear: 5500,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
  {
    id: "fallback-source-9",
    name: "Toledo Cold Storage",
    industry: "Cold Storage",
    latitude: 41.6233,
    longitude: -83.5622,
    estimatedWasteHeatMWhPerYear: 3500,
    recoverableHeatMWhPerYear: 1750,
    temperatureClass: "low",
    operatingHoursPerYear: 8760,
  },
  {
    id: "fallback-source-10",
    name: "Toledo Waste Water Treatment",
    industry: "Waste Water Treatment",
    latitude: 41.6189,
    longitude: -83.5817,
    estimatedWasteHeatMWhPerYear: 2800,
    recoverableHeatMWhPerYear: 1400,
    temperatureClass: "low",
    operatingHoursPerYear: 8760,
  },
  // Columbus area
  {
    id: "fallback-source-11",
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
    id: "fallback-source-12",
    name: "Columbus Industrial Plant",
    industry: "Manufacturing",
    latitude: 39.9652,
    longitude: -83.0008,
    estimatedWasteHeatMWhPerYear: 5500,
    recoverableHeatMWhPerYear: 2750,
    temperatureClass: "medium",
    operatingHoursPerYear: 8760,
  },
  {
    id: "fallback-source-13",
    name: "Columbus Refinery",
    industry: "Oil & Gas",
    latitude: 39.9589,
    longitude: -82.9889,
    estimatedWasteHeatMWhPerYear: 14000,
    recoverableHeatMWhPerYear: 7000,
    temperatureClass: "high",
    operatingHoursPerYear: 8760,
  },
];

/** Heat sources for fallback (expanded to ~100 synthetic entries). */
export const FALLBACK_HEAT_SOURCES: HeatSource[] = Array.from(
  { length: 100 },
  (_v, i) => {
    const base = FALLBACK_HEAT_SOURCES_BASE[i % FALLBACK_HEAT_SOURCES_BASE.length];
    const copyIndex = Math.floor(i / FALLBACK_HEAT_SOURCES_BASE.length);
    return {
      ...base,
      id: copyIndex === 0 ? base.id : `${base.id}-copy-${copyIndex + 1}`,
      name: copyIndex === 0 ? base.name : `${base.name} (${copyIndex + 1})`,
    };
  }
);

/** Base heat consumers for fallback: Toledo area (~50 km) + a few in Columbus. */
const FALLBACK_HEAT_CONSUMERS_BASE: HeatConsumer[] = [
  // Toledo area (~50 km)
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
  {
    id: "fallback-consumer-4",
    name: "Perrysburg Greenhouse",
    category: "Agriculture",
    latitude: 41.5422,
    longitude: -83.6217,
    annualHeatDemandMWh: 4200,
  },
  {
    id: "fallback-consumer-5",
    name: "Maumee District Heating",
    category: "District Heating",
    latitude: 41.5653,
    longitude: -83.6511,
    annualHeatDemandMWh: 6500,
  },
  {
    id: "fallback-consumer-6",
    name: "Oregon OH Hospital",
    category: "Healthcare",
    latitude: 41.6467,
    longitude: -83.4922,
    annualHeatDemandMWh: 7200,
  },
  {
    id: "fallback-consumer-7",
    name: "Sylvania Residential Complex",
    category: "Residential",
    latitude: 41.7156,
    longitude: -83.6989,
    annualHeatDemandMWh: 2400,
  },
  {
    id: "fallback-consumer-8",
    name: "Toledo Warehouse Complex",
    category: "Warehouses",
    latitude: 41.6289,
    longitude: -83.5556,
    annualHeatDemandMWh: 3800,
  },
  {
    id: "fallback-consumer-9",
    name: "Toledo Laundry Facility",
    category: "Laundry",
    latitude: 41.6356,
    longitude: -83.5028,
    annualHeatDemandMWh: 2100,
  },
  {
    id: "fallback-consumer-10",
    name: "Toledo Food Processing Plant",
    category: "Food Processing",
    latitude: 41.6111,
    longitude: -83.5717,
    annualHeatDemandMWh: 4600,
  },
  // Columbus area
  {
    id: "fallback-consumer-11",
    name: "Columbus Hospital Complex",
    category: "Healthcare",
    latitude: 39.9652,
    longitude: -83.0008,
    annualHeatDemandMWh: 8500,
  },
  {
    id: "fallback-consumer-12",
    name: "Columbus District Heating",
    category: "District Heating",
    latitude: 39.9589,
    longitude: -82.9956,
    annualHeatDemandMWh: 12000,
  },
  {
    id: "fallback-consumer-13",
    name: "Columbus Apartment Complex",
    category: "Residential",
    latitude: 39.9689,
    longitude: -82.9889,
    annualHeatDemandMWh: 3200,
  },
];

/** Heat consumers for fallback (expanded to ~100 synthetic entries). */
export const FALLBACK_HEAT_CONSUMERS: HeatConsumer[] = Array.from(
  { length: 100 },
  (_v, i) => {
    const base = FALLBACK_HEAT_CONSUMERS_BASE[i % FALLBACK_HEAT_CONSUMERS_BASE.length];
    const copyIndex = Math.floor(i / FALLBACK_HEAT_CONSUMERS_BASE.length);
    return {
      ...base,
      id: copyIndex === 0 ? base.id : `${base.id}-copy-${copyIndex + 1}`,
      name: copyIndex === 0 ? base.name : `${base.name} (${copyIndex + 1})`,
    };
  }
);
