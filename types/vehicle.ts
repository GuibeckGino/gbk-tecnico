import type { Installation } from "./installation";

export type VehicleStatus = "ativo" | "manutencao" | "inativo";

export type MaintenanceCategory =
  | "óleo"
  | "filtros"
  | "pneus"
  | "freios"
  | "suspensão"
  | "motor"
  | "ar-condicionado"
  | "elétrica"
  | "alinhamento/balanceamento"
  | "documentação"
  | "seguro"
  | "lavagem"
  | "outros";

export interface VehicleProfile {
  marca?: string;
  modelo?: string;
  versao?: string;
  ano?: string;
  placa?: string;
  combustivel?: string;
  capacidadeTanque?: number;
  kmInicial?: number;
  kmAtual?: number;
  consumoEsperado?: number;
  precoMedioCombustivel?: number;
  status: VehicleStatus;
}

export interface FuelRecord {
  id: string;
  data: string;
  quilometragem: number;
  litros: number;
  precoPorLitro: number;
  valorTotal: number;
  combustivel?: string;
  posto?: string;
  observacoes?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  data: string;
  quilometragem?: number;
  categoria: MaintenanceCategory;
  descricao: string;
  valor: number;
  oficina?: string;
  observacoes?: string;
  createdAt: string;
}

export interface ScheduledMaintenance {
  id: string;
  titulo: string;
  categoria: MaintenanceCategory;
  proximaKm?: number;
  proximaData?: string;
  observacoes?: string;
  createdAt: string;
}

export interface OperationalCostSettings {
  incluirCombustivel: boolean;
  incluirManutencao: boolean;
  incluirSeguro: boolean;
  incluirFinanciamento: boolean;
  incluirOutros: boolean;
  seguroMensal: number;
  financiamentoMensal: number;
  outrosMensais: number;
}

export interface OsTripCost {
  distanceKm: number;
  kmInicial?: number;
  kmFinal?: number;
  costPerKmAtRegistration: number;
  estimatedCost: number;
  updatedAt: string;
}

export interface VehicleData {
  version: 1;
  profile: VehicleProfile;
  fuelRecords: FuelRecord[];
  maintenanceRecords: MaintenanceRecord[];
  scheduledMaintenances: ScheduledMaintenance[];
  operationalCosts: OperationalCostSettings;
  osTrips: Record<string, OsTripCost>;
}

export const DEFAULT_OPERATIONAL_COSTS: OperationalCostSettings = {
  incluirCombustivel: true,
  incluirManutencao: true,
  incluirSeguro: false,
  incluirFinanciamento: false,
  incluirOutros: false,
  seguroMensal: 0,
  financiamentoMensal: 0,
  outrosMensais: 0,
};

export function createEmptyVehicleData(): VehicleData {
  return {
    version: 1,
    profile: { status: "ativo" },
    fuelRecords: [],
    maintenanceRecords: [],
    scheduledMaintenances: [],
    operationalCosts: { ...DEFAULT_OPERATIONAL_COSTS },
    osTrips: {},
  };
}

export function normalizeVehicleData(input: unknown): VehicleData {
  const empty = createEmptyVehicleData();
  if (!input || typeof input !== "object") return empty;
  const data = input as Partial<VehicleData>;
  return {
    version: 1,
    profile: { ...empty.profile, ...(data.profile ?? {}) },
    fuelRecords: Array.isArray(data.fuelRecords) ? data.fuelRecords : [],
    maintenanceRecords: Array.isArray(data.maintenanceRecords) ? data.maintenanceRecords : [],
    scheduledMaintenances: Array.isArray(data.scheduledMaintenances) ? data.scheduledMaintenances : [],
    operationalCosts: { ...empty.operationalCosts, ...(data.operationalCosts ?? {}) },
    osTrips: data.osTrips && typeof data.osTrips === "object" ? data.osTrips : {},
  };
}

function parseDate(date: string): number {
  const [dia, mes, ano] = date.split("/").map(Number);
  if (!dia || !mes || !ano) return 0;
  return new Date(ano, mes - 1, dia).getTime();
}

export function isDateInMonth(date: string, mes: number, ano: number): boolean {
  const [, month, year] = date.split("/").map(Number);
  return month === mes + 1 && year === ano;
}

export interface FuelMetric extends FuelRecord {
  distanciaPercorrida: number;
  consumoKmPorLitro?: number;
  custoPorKm?: number;
}

export function calculateFuelMetrics(records: FuelRecord[]): FuelMetric[] {
  const ordered = [...records].sort((a, b) => parseDate(a.data) - parseDate(b.data) || a.quilometragem - b.quilometragem);
  return ordered.map((record, index) => {
    const previous = ordered[index - 1];
    const distanciaPercorrida = previous ? Math.max(0, record.quilometragem - previous.quilometragem) : 0;
    const consumoKmPorLitro = distanciaPercorrida > 0 && record.litros > 0 ? distanciaPercorrida / record.litros : undefined;
    const custoPorKm = distanciaPercorrida > 0 ? record.valorTotal / distanciaPercorrida : undefined;
    return { ...record, distanciaPercorrida, consumoKmPorLitro, custoPorKm };
  });
}

export interface VehicleMonthlySummary {
  fuelCost: number;
  maintenanceCost: number;
  insuranceCost: number;
  financingCost: number;
  otherCost: number;
  totalCost: number;
  kmDriven: number;
  consumptionKmPerLiter?: number;
  fuelCostPerKm?: number;
  maintenanceCostPerKm?: number;
  operationalCostPerKm?: number;
  averageFuelPrice?: number;
  osCount: number;
  vehicleCostPerOs?: number;
  distanceForOs: number;
  estimatedOsDisplacementCost: number;
}

export function calculateVehicleMonthlySummary(
  data: VehicleData,
  installations: Installation[],
  mes: number,
  ano: number,
): VehicleMonthlySummary {
  const fuelMetrics = calculateFuelMetrics(data.fuelRecords).filter((record) => isDateInMonth(record.data, mes, ano));
  const fuelCost = fuelMetrics.reduce((sum, record) => sum + record.valorTotal, 0);
  const kmDriven = fuelMetrics.reduce((sum, record) => sum + record.distanciaPercorrida, 0);
  const totalLiters = fuelMetrics.reduce((sum, record) => sum + record.litros, 0);
  const maintenanceCost = data.maintenanceRecords
    .filter((record) => isDateInMonth(record.data, mes, ano))
    .reduce((sum, record) => sum + record.valor, 0);
  const costs = data.operationalCosts;
  const insuranceCost = costs.incluirSeguro ? costs.seguroMensal : 0;
  const financingCost = costs.incluirFinanciamento ? costs.financiamentoMensal : 0;
  const otherCost = costs.incluirOutros ? costs.outrosMensais : 0;
  const includedFuel = costs.incluirCombustivel ? fuelCost : 0;
  const includedMaintenance = costs.incluirManutencao ? maintenanceCost : 0;
  const totalCost = includedFuel + includedMaintenance + insuranceCost + financingCost + otherCost;
  const monthInstallations = installations.filter((installation) => isDateInMonth(installation.data, mes, ano));
  const distanceForOs = monthInstallations.reduce((sum, installation) => sum + (data.osTrips[installation.id]?.distanceKm ?? 0), 0);
  const estimatedOsDisplacementCost = monthInstallations.reduce(
    (sum, installation) => sum + (data.osTrips[installation.id]?.estimatedCost ?? 0),
    0,
  );
  return {
    fuelCost,
    maintenanceCost,
    insuranceCost,
    financingCost,
    otherCost,
    totalCost,
    kmDriven,
    consumptionKmPerLiter: totalLiters > 0 && kmDriven > 0 ? kmDriven / totalLiters : undefined,
    fuelCostPerKm: kmDriven > 0 ? fuelCost / kmDriven : undefined,
    maintenanceCostPerKm: kmDriven > 0 ? maintenanceCost / kmDriven : undefined,
    operationalCostPerKm: kmDriven > 0 ? totalCost / kmDriven : undefined,
    averageFuelPrice: totalLiters > 0 ? fuelCost / totalLiters : undefined,
    osCount: monthInstallations.length,
    vehicleCostPerOs: monthInstallations.length > 0 ? totalCost / monthInstallations.length : undefined,
    distanceForOs,
    estimatedOsDisplacementCost,
  };
}

export function calculateVehiclePeriodSummary(
  data: VehicleData,
  installations: Installation[],
  startDate: string,
  endDate: string,
): VehicleMonthlySummary {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const inRange = (date: string) => {
    const time = parseDate(date);
    return time > 0 && time >= start && time <= end;
  };
  const fuelMetrics = calculateFuelMetrics(data.fuelRecords).filter((record) => inRange(record.data));
  const fuelCost = fuelMetrics.reduce((sum, record) => sum + record.valorTotal, 0);
  const kmDriven = fuelMetrics.reduce((sum, record) => sum + record.distanciaPercorrida, 0);
  const totalLiters = fuelMetrics.reduce((sum, record) => sum + record.litros, 0);
  const maintenanceCost = data.maintenanceRecords.filter((record) => inRange(record.data)).reduce((sum, record) => sum + record.valor, 0);
  const startMonth = new Date(new Date(start).getFullYear(), new Date(start).getMonth(), 1);
  const endMonth = new Date(new Date(end).getFullYear(), new Date(end).getMonth(), 1);
  let months = 0;
  const cursor = new Date(startMonth);
  while (cursor <= endMonth) {
    months += 1;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const costs = data.operationalCosts;
  const insuranceCost = costs.incluirSeguro ? costs.seguroMensal * Math.max(1, months) : 0;
  const financingCost = costs.incluirFinanciamento ? costs.financiamentoMensal * Math.max(1, months) : 0;
  const otherCost = costs.incluirOutros ? costs.outrosMensais * Math.max(1, months) : 0;
  const totalCost = (costs.incluirCombustivel ? fuelCost : 0) + (costs.incluirManutencao ? maintenanceCost : 0) + insuranceCost + financingCost + otherCost;
  const periodInstallations = installations.filter((installation) => inRange(installation.data));
  const distanceForOs = periodInstallations.reduce((sum, installation) => sum + (data.osTrips[installation.id]?.distanceKm ?? 0), 0);
  const estimatedOsDisplacementCost = periodInstallations.reduce((sum, installation) => sum + (data.osTrips[installation.id]?.estimatedCost ?? 0), 0);
  return {
    fuelCost,
    maintenanceCost,
    insuranceCost,
    financingCost,
    otherCost,
    totalCost,
    kmDriven,
    consumptionKmPerLiter: totalLiters > 0 && kmDriven > 0 ? kmDriven / totalLiters : undefined,
    fuelCostPerKm: kmDriven > 0 ? fuelCost / kmDriven : undefined,
    maintenanceCostPerKm: kmDriven > 0 ? maintenanceCost / kmDriven : undefined,
    operationalCostPerKm: kmDriven > 0 ? totalCost / kmDriven : undefined,
    averageFuelPrice: totalLiters > 0 ? fuelCost / totalLiters : undefined,
    osCount: periodInstallations.length,
    vehicleCostPerOs: periodInstallations.length > 0 ? totalCost / periodInstallations.length : undefined,
    distanceForOs,
    estimatedOsDisplacementCost,
  };
}

export type ScheduledMaintenanceStatus = "em_dia" | "proxima" | "vencida" | "sem_referencia";

export function getScheduledMaintenanceStatus(
  maintenance: ScheduledMaintenance,
  currentKm?: number,
  today = new Date(),
): ScheduledMaintenanceStatus {
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (maintenance.proximaKm !== undefined && currentKm !== undefined) {
    if (currentKm >= maintenance.proximaKm) return "vencida";
    if (maintenance.proximaKm - currentKm <= 500) return "proxima";
  }
  if (maintenance.proximaData) {
    const due = parseDate(maintenance.proximaData);
    if (due && due < todayTime) return "vencida";
    if (due && due - todayTime <= 30 * 24 * 60 * 60 * 1000) return "proxima";
    if (due) return "em_dia";
  }
  if (maintenance.proximaKm !== undefined) return "em_dia";
  return "sem_referencia";
}
