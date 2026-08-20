import type { Installation } from "../types/installation";

export type CloudInstallationRecord = {
  id: string;
  cliente: string;
  endereco: string;
  tipoServico: Installation["tipoServico"];
  data: string;
  observacoes: string | null;
  isFavorito: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function cloudRecordToInstallation(record: CloudInstallationRecord): Installation {
  return {
    id: record.id,
    cliente: record.cliente,
    endereco: record.endereco,
    tipoServico: record.tipoServico,
    data: record.data,
    observacoes: record.observacoes ?? "",
    isFavorito: Boolean(record.isFavorito),
    createdAt: new Date(record.updatedAt ?? record.createdAt).toISOString(),
  };
}

export function mergeCloudAndLocal(
  cloud: Installation[],
  local: Installation[],
): { merged: Installation[]; localOnly: Installation[] } {
  const cloudIds = new Set(cloud.map((installation) => installation.id));
  const localOnly = local.filter((installation) => !cloudIds.has(installation.id));
  return { merged: [...cloud, ...localOnly], localOnly };
}

export function removedCloudIds(previousCloudIds: Set<string>, local: Installation[]): string[] {
  const localIds = new Set(local.map((installation) => installation.id));
  return [...previousCloudIds].filter((id) => !localIds.has(id));
}
