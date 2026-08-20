import { describe, expect, it } from "vitest";

import { mergeCloudAndLocal, removedCloudIds } from "../lib/cloud-sync";
import type { Installation } from "../types/installation";

const criarOS = (id: string): Installation => ({
  id,
  cliente: `Cliente ${id}`,
  endereco: "Centro",
  tipoServico: "Instalação",
  data: "01/08/2026",
  observacoes: "",
  createdAt: "2026-08-01T10:00:00.000Z",
});

describe("sincronização online", () => {
  it("preserva registros remotos e separa registros locais ainda não enviados", () => {
    const resultado = mergeCloudAndLocal([criarOS("nuvem-1")], [criarOS("nuvem-1"), criarOS("local-1")]);

    expect(resultado.merged.map((item) => item.id)).toEqual(["nuvem-1", "local-1"]);
    expect(resultado.localOnly.map((item) => item.id)).toEqual(["local-1"]);
  });

  it("identifica exclusões locais que precisam ser removidas da nuvem", () => {
    expect(removedCloudIds(new Set(["os-1", "os-2"]), [criarOS("os-2")])).toEqual(["os-1"]);
  });
});
