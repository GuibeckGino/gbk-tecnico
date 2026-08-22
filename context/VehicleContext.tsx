import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { gerarId } from "@/types/installation";
import {
  createEmptyVehicleData,
  normalizeVehicleData,
  type FuelRecord,
  type MaintenanceRecord,
  type OperationalCostSettings,
  type OsTripCost,
  type ScheduledMaintenance,
  type VehicleData,
  type VehicleProfile,
} from "@/types/vehicle";

export const VEHICLE_STORAGE_KEY = "@gbk_vehicle_data_v1";

interface VehicleContextValue {
  vehicleData: VehicleData;
  isVehicleLoading: boolean;
  updateProfile: (patch: Partial<VehicleProfile>) => void;
  updateOperationalCosts: (patch: Partial<OperationalCostSettings>) => void;
  addFuelRecord: (record: Omit<FuelRecord, "id" | "createdAt" | "valorTotal">) => void;
  updateFuelRecord: (record: FuelRecord) => void;
  removeFuelRecord: (id: string) => void;
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, "id" | "createdAt">) => void;
  updateMaintenanceRecord: (record: MaintenanceRecord) => void;
  removeMaintenanceRecord: (id: string) => void;
  addScheduledMaintenance: (record: Omit<ScheduledMaintenance, "id" | "createdAt">) => void;
  updateScheduledMaintenance: (record: ScheduledMaintenance) => void;
  removeScheduledMaintenance: (id: string) => void;
  setOsTrip: (installationId: string, trip: Omit<OsTripCost, "updatedAt">) => void;
  removeOsTrip: (installationId: string) => void;
  exportVehicleData: () => VehicleData;
  importVehicleData: (input: unknown) => boolean;
}

const VehicleContext = createContext<VehicleContextValue | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const [vehicleData, setVehicleData] = useState<VehicleData>(createEmptyVehicleData());
  const [isVehicleLoading, setIsVehicleLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(VEHICLE_STORAGE_KEY)
      .then((stored) => setVehicleData(normalizeVehicleData(stored ? JSON.parse(stored) : undefined)))
      .catch(() => setVehicleData(createEmptyVehicleData()))
      .finally(() => setIsVehicleLoading(false));
  }, []);

  useEffect(() => {
    if (!isVehicleLoading) {
      AsyncStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicleData)).catch(() => undefined);
    }
  }, [isVehicleLoading, vehicleData]);

  const updateProfile = useCallback((patch: Partial<VehicleProfile>) => {
    setVehicleData((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
  }, []);

  const updateOperationalCosts = useCallback((patch: Partial<OperationalCostSettings>) => {
    setVehicleData((current) => ({ ...current, operationalCosts: { ...current.operationalCosts, ...patch } }));
  }, []);

  const addFuelRecord = useCallback((record: Omit<FuelRecord, "id" | "createdAt" | "valorTotal">) => {
    const fuelRecord: FuelRecord = {
      ...record,
      id: gerarId(),
      valorTotal: Number((record.litros * record.precoPorLitro).toFixed(2)),
      createdAt: new Date().toISOString(),
    };
    setVehicleData((current) => ({
      ...current,
      profile: { ...current.profile, kmAtual: Math.max(current.profile.kmAtual ?? 0, record.quilometragem) },
      fuelRecords: [...current.fuelRecords, fuelRecord],
    }));
  }, []);

  const updateFuelRecord = useCallback((record: FuelRecord) => {
    const normalized = { ...record, valorTotal: Number((record.litros * record.precoPorLitro).toFixed(2)) };
    setVehicleData((current) => ({
      ...current,
      fuelRecords: current.fuelRecords.map((item) => item.id === normalized.id ? normalized : item),
    }));
  }, []);

  const removeFuelRecord = useCallback((id: string) => {
    setVehicleData((current) => ({ ...current, fuelRecords: current.fuelRecords.filter((item) => item.id !== id) }));
  }, []);

  const addMaintenanceRecord = useCallback((record: Omit<MaintenanceRecord, "id" | "createdAt">) => {
    const maintenance: MaintenanceRecord = { ...record, id: gerarId(), createdAt: new Date().toISOString() };
    setVehicleData((current) => ({ ...current, maintenanceRecords: [...current.maintenanceRecords, maintenance] }));
  }, []);

  const updateMaintenanceRecord = useCallback((record: MaintenanceRecord) => {
    setVehicleData((current) => ({
      ...current,
      maintenanceRecords: current.maintenanceRecords.map((item) => item.id === record.id ? record : item),
    }));
  }, []);

  const removeMaintenanceRecord = useCallback((id: string) => {
    setVehicleData((current) => ({ ...current, maintenanceRecords: current.maintenanceRecords.filter((item) => item.id !== id) }));
  }, []);

  const addScheduledMaintenance = useCallback((record: Omit<ScheduledMaintenance, "id" | "createdAt">) => {
    const scheduled: ScheduledMaintenance = { ...record, id: gerarId(), createdAt: new Date().toISOString() };
    setVehicleData((current) => ({ ...current, scheduledMaintenances: [...current.scheduledMaintenances, scheduled] }));
  }, []);

  const updateScheduledMaintenance = useCallback((record: ScheduledMaintenance) => {
    setVehicleData((current) => ({
      ...current,
      scheduledMaintenances: current.scheduledMaintenances.map((item) => item.id === record.id ? record : item),
    }));
  }, []);

  const removeScheduledMaintenance = useCallback((id: string) => {
    setVehicleData((current) => ({ ...current, scheduledMaintenances: current.scheduledMaintenances.filter((item) => item.id !== id) }));
  }, []);

  const setOsTrip = useCallback((installationId: string, trip: Omit<OsTripCost, "updatedAt">) => {
    setVehicleData((current) => ({
      ...current,
      osTrips: { ...current.osTrips, [installationId]: { ...trip, updatedAt: new Date().toISOString() } },
    }));
  }, []);

  const removeOsTrip = useCallback((installationId: string) => {
    setVehicleData((current) => {
      const nextTrips = { ...current.osTrips };
      delete nextTrips[installationId];
      return { ...current, osTrips: nextTrips };
    });
  }, []);

  const exportVehicleData = useCallback(() => vehicleData, [vehicleData]);
  const importVehicleData = useCallback((input: unknown) => {
    try {
      setVehicleData(normalizeVehicleData(input));
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<VehicleContextValue>(() => ({
    vehicleData,
    isVehicleLoading,
    updateProfile,
    updateOperationalCosts,
    addFuelRecord,
    updateFuelRecord,
    removeFuelRecord,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    removeMaintenanceRecord,
    addScheduledMaintenance,
    updateScheduledMaintenance,
    removeScheduledMaintenance,
    setOsTrip,
    removeOsTrip,
    exportVehicleData,
    importVehicleData,
  }), [addFuelRecord, addMaintenanceRecord, addScheduledMaintenance, exportVehicleData, importVehicleData, isVehicleLoading, removeFuelRecord, removeMaintenanceRecord, removeOsTrip, removeScheduledMaintenance, setOsTrip, updateFuelRecord, updateMaintenanceRecord, updateOperationalCosts, updateProfile, updateScheduledMaintenance, vehicleData]);

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useVehicle(): VehicleContextValue {
  const context = useContext(VehicleContext);
  if (!context) throw new Error("useVehicle deve ser usado dentro de VehicleProvider");
  return context;
}
