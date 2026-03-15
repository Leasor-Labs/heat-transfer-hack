import type { HeatSource, HeatConsumer } from "../../shared/types";
import { TEMPERATURE_CLASSES } from "../../shared/constants";

export function isTemperatureClass(s: string): s is HeatSource["temperatureClass"] {
  return (TEMPERATURE_CLASSES as readonly string[]).includes(s);
}

export function itemToHeatSource(item: Record<string, unknown>): HeatSource {
  return {
    id: item.id as string,
    name: item.name as string,
    industry: item.industry as string,
    latitude: item.latitude as number,
    longitude: item.longitude as number,
    estimatedWasteHeatMWhPerYear: item.estimatedWasteHeatMWhPerYear as number,
    recoverableHeatMWhPerYear: item.recoverableHeatMWhPerYear as number,
    temperatureClass: item.temperatureClass as HeatSource["temperatureClass"],
    operatingHoursPerYear: item.operatingHoursPerYear as number,
  };
}

export function itemToHeatConsumer(item: Record<string, unknown>): HeatConsumer {
  return {
    id: item.id as string,
    name: item.name as string,
    category: item.category as string,
    latitude: item.latitude as number,
    longitude: item.longitude as number,
    annualHeatDemandMWh: item.annualHeatDemandMWh as number,
  };
}
