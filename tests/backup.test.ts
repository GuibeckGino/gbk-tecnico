import { describe, expect, it } from "vitest";
import { createFullBackup, parseBackup } from "../lib/backup";
import { createEmptyVehicleData } from "../types/vehicle";

describe("backup completo GBK", () => {
  it("inclui veículo sem alterar a lista de OS", () => {
    const installations = [{ id: "os-1", cliente: "Ana", endereco: "Centro", tipoServico: "Instalação" as const, data: "01/08/2026", observacoes: "", createdAt: "2026-08-01" }];
    const vehicle = createEmptyVehicleData();
    vehicle.profile.modelo = "Strada";
    const parsed = parseBackup(JSON.stringify(createFullBackup(installations, vehicle)));

    expect(parsed?.installations).toEqual(installations);
    expect(parsed?.vehicleData?.profile.modelo).toBe("Strada");
  });

  it("aceita backup legado que contém apenas um array de OS", () => {
    const parsed = parseBackup(JSON.stringify([]));
    expect(parsed).toEqual({ installations: [], version: 1 });
  });
});
