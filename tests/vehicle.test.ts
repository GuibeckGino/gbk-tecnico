import { describe, expect, it } from "vitest";

import type { Installation } from "../types/installation";
import {
  calculateFuelMetrics,
  calculateVehiclePeriodSummary,
  calculateVehicleMonthlySummary,
  createEmptyVehicleData,
  getScheduledMaintenanceStatus,
} from "../types/vehicle";

describe("módulo Meu Veículo", () => {
  it("calcula consumo e custo por quilômetro a partir de abastecimentos consecutivos", () => {
    const metrics = calculateFuelMetrics([
      { id: "a", data: "01/08/2026", quilometragem: 200000, litros: 40, precoPorLitro: 5, valorTotal: 200, createdAt: "2026-08-01" },
      { id: "b", data: "10/08/2026", quilometragem: 200360, litros: 40, precoPorLitro: 5, valorTotal: 200, createdAt: "2026-08-10" },
    ]);

    expect(metrics[0].distanciaPercorrida).toBe(0);
    expect(metrics[1].distanciaPercorrida).toBe(360);
    expect(metrics[1].consumoKmPorLitro).toBe(9);
    expect(metrics[1].custoPorKm).toBeCloseTo(200 / 360, 6);
  });

  it("mantém custo do veículo separado do valor oficial das OS", () => {
    const data = createEmptyVehicleData();
    data.fuelRecords = [
      { id: "a", data: "01/08/2026", quilometragem: 200000, litros: 40, precoPorLitro: 5, valorTotal: 200, createdAt: "2026-08-01" },
      { id: "b", data: "10/08/2026", quilometragem: 200360, litros: 40, precoPorLitro: 5, valorTotal: 200, createdAt: "2026-08-10" },
    ];
    data.maintenanceRecords = [
      { id: "m", data: "11/08/2026", categoria: "óleo", descricao: "Troca", valor: 100, createdAt: "2026-08-11" },
    ];
    data.operationalCosts = { ...data.operationalCosts, incluirSeguro: true, seguroMensal: 50 };
    data.osTrips = {
      os1: { distanceKm: 18, costPerKmAtRegistration: 0.72, estimatedCost: 12.96, updatedAt: "2026-08-11" },
    };
    const installations: Installation[] = [
      { id: "os1", cliente: "Cliente", endereco: "Centro", tipoServico: "Instalação", data: "11/08/2026", observacoes: "", createdAt: "2026-08-11" },
    ];

    const summary = calculateVehicleMonthlySummary(data, installations, 7, 2026);

    expect(summary.fuelCost).toBe(400);
    expect(summary.maintenanceCost).toBe(100);
    expect(summary.insuranceCost).toBe(50);
    expect(summary.totalCost).toBe(550);
    expect(summary.operationalCostPerKm).toBeCloseTo(550 / 360, 6);
    expect(summary.estimatedOsDisplacementCost).toBe(12.96);
    expect(installations[0].tipoServico).toBe("Instalação");
  });

  it("classifica manutenção por quilometragem e vencimento de data", () => {
    expect(getScheduledMaintenanceStatus(
      { id: "1", titulo: "Óleo", categoria: "óleo", proximaKm: 210000, createdAt: "2026-01-01" },
      210100,
      new Date(2026, 7, 1),
    )).toBe("vencida");
    expect(getScheduledMaintenanceStatus(
      { id: "2", titulo: "Seguro", categoria: "seguro", proximaData: "15/08/2026", createdAt: "2026-01-01" },
      200000,
      new Date(2026, 7, 1),
    )).toBe("proxima");
  });

  it("consolida custos por intervalo sem assumir custo em meses fora do período", () => {
    const data = createEmptyVehicleData();
    data.maintenanceRecords = [
      { id: "m1", data: "12/07/2026", categoria: "pneus", descricao: "Pneu", valor: 400, createdAt: "2026-07-12" },
      { id: "m2", data: "12/08/2026", categoria: "óleo", descricao: "Óleo", valor: 100, createdAt: "2026-08-12" },
    ];
    data.operationalCosts = { ...data.operationalCosts, incluirSeguro: true, seguroMensal: 50 };
    const summary = calculateVehiclePeriodSummary(data, [], "01/08/2026", "31/08/2026");

    expect(summary.maintenanceCost).toBe(100);
    expect(summary.insuranceCost).toBe(50);
    expect(summary.totalCost).toBe(150);
  });
});
