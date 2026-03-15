import type { HeatSource, HeatConsumer } from "../../shared/types";
import { DEFAULT_ASSUMPTIONS } from "../../shared/constants";

/**
 * Toledo Heat Transfer Map seed data.
 * Toledo center: 41.6639° N, 83.5552° W
 * recoverableHeatMWhPerYear = estimatedWasteHeatMWhPerYear × DEFAULT_ASSUMPTIONS.recoveryFactor
 */

export const HEAT_SOURCES: HeatSource[] = [
  { id: "src-001", name: "BP-Husky Toledo Refinery", industry: "refinery", latitude: 41.732, longitude: -83.469, estimatedWasteHeatMWhPerYear: 850000, recoverableHeatMWhPerYear: 425000, temperatureClass: "high", operatingHoursPerYear: 8400 },
  { id: "src-002", name: "Toledo Edison Bay Shore Power Plant", industry: "energy", latitude: 41.698, longitude: -83.452, estimatedWasteHeatMWhPerYear: 620000, recoverableHeatMWhPerYear: 310000, temperatureClass: "high", operatingHoursPerYear: 7800 },
  { id: "src-003", name: "Owens Corning Insulation Mfg", industry: "glass_manufacturing", latitude: 41.655, longitude: -83.537, estimatedWasteHeatMWhPerYear: 180000, recoverableHeatMWhPerYear: 90000, temperatureClass: "high", operatingHoursPerYear: 8000 },
  { id: "src-004", name: "Stellantis Jeep Assembly Toledo", industry: "auto_manufacturing", latitude: 41.718, longitude: -83.507, estimatedWasteHeatMWhPerYear: 95000, recoverableHeatMWhPerYear: 47500, temperatureClass: "medium", operatingHoursPerYear: 6000 },
  { id: "src-005", name: "First Solar Manufacturing", industry: "manufacturing", latitude: 41.565, longitude: -83.648, estimatedWasteHeatMWhPerYear: 22000, recoverableHeatMWhPerYear: 11000, temperatureClass: "low", operatingHoursPerYear: 7000 },
  { id: "src-006", name: "Pilkington North America Glass", industry: "glass_manufacturing", latitude: 41.69, longitude: -83.53, estimatedWasteHeatMWhPerYear: 145000, recoverableHeatMWhPerYear: 72500, temperatureClass: "high", operatingHoursPerYear: 8200 },
  { id: "src-007", name: "O-I Glass Toledo", industry: "glass_manufacturing", latitude: 41.662, longitude: -83.559, estimatedWasteHeatMWhPerYear: 130000, recoverableHeatMWhPerYear: 65000, temperatureClass: "high", operatingHoursPerYear: 8760 },
  { id: "src-008", name: "Dana Incorporated", industry: "auto_parts", latitude: 41.676, longitude: -83.498, estimatedWasteHeatMWhPerYear: 38000, recoverableHeatMWhPerYear: 19000, temperatureClass: "medium", operatingHoursPerYear: 6500 },
  { id: "src-009", name: "ProMedica Toledo Hospital", industry: "healthcare", latitude: 41.657, longitude: -83.548, estimatedWasteHeatMWhPerYear: 9500, recoverableHeatMWhPerYear: 4750, temperatureClass: "low", operatingHoursPerYear: 8760 },
  { id: "src-010", name: "HCR ManorCare Data Center", industry: "data_center", latitude: 41.664, longitude: -83.605, estimatedWasteHeatMWhPerYear: 6200, recoverableHeatMWhPerYear: 3100, temperatureClass: "low", operatingHoursPerYear: 8760 },
];

export const HEAT_CONSUMERS: HeatConsumer[] = [
  { id: "con-001", name: "Toledo Botanical Garden Greenhouses", category: "greenhouse", latitude: 41.669, longitude: -83.607, annualHeatDemandMWh: 3200 },
  { id: "con-002", name: "University of Toledo Campus Heating", category: "district_heating", latitude: 41.658, longitude: -83.614, annualHeatDemandMWh: 32000 },
  { id: "con-003", name: "Cherry Street Mission", category: "institutional", latitude: 41.668, longitude: -83.545, annualHeatDemandMWh: 1800 },
  { id: "con-004", name: "Toledo Museum of Art", category: "institutional", latitude: 41.662, longitude: -83.587, annualHeatDemandMWh: 4100 },
  { id: "con-005", name: "Toledo Farmers Market Greenhouse Hub", category: "greenhouse", latitude: 41.654, longitude: -83.54, annualHeatDemandMWh: 2600 },
  { id: "con-006", name: "Owens Community College", category: "district_heating", latitude: 41.564, longitude: -83.869, annualHeatDemandMWh: 14000 },
  { id: "con-007", name: "Toledo Zoo Aquarium", category: "aquaculture", latitude: 41.648, longitude: -83.573, annualHeatDemandMWh: 5800 },
  { id: "con-008", name: "North Toledo Industrial Park", category: "industrial", latitude: 41.724, longitude: -83.536, annualHeatDemandMWh: 28000 },
  { id: "con-009", name: "Maumee Valley Habitat Restoration Center", category: "greenhouse", latitude: 41.598, longitude: -83.652, annualHeatDemandMWh: 1400 },
  { id: "con-010", name: "Toledo Lucas County Port Authority", category: "industrial", latitude: 41.696, longitude: -83.516, annualHeatDemandMWh: 9200 },
];

/** Used when computing recoverable heat from waste heat (e.g. seed scripts). */
export const RECOVERY_FACTOR = DEFAULT_ASSUMPTIONS.recoveryFactor;
