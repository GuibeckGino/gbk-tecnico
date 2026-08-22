import type { Installation } from "../types/installation";
import { normalizeVehicleData, type VehicleData } from "../types/vehicle";

export const GBK_BACKUP_VERSION = 3;

export interface GBKBackup {
  version: number;
  exportedAt: string;
  installations: Installation[];
  vehicleData?: VehicleData;
}

export function createFullBackup(installations: Installation[], vehicleData: VehicleData): GBKBackup {
  return {
    version: GBK_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    installations,
    vehicleData,
  };
}

export function parseBackup(input: string): { installations: Installation[]; vehicleData?: VehicleData; version: number } | null {
  try {
    const parsed: unknown = JSON.parse(input);
    if (Array.isArray(parsed)) return { installations: parsed as Installation[], version: 1 };
    if (!parsed || typeof parsed !== "object") return null;
    const backup = parsed as Partial<GBKBackup>;
    if (!Array.isArray(backup.installations)) return null;
    return {
      installations: backup.installations,
      vehicleData: backup.vehicleData ? normalizeVehicleData(backup.vehicleData) : undefined,
      version: typeof backup.version === "number" ? backup.version : 2,
    };
  } catch {
    return null;
  }
}
