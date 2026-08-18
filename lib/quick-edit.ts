import type { Installation, ServiceType } from '@/types/installation';

export type QuickEditValues = Pick<Installation, 'cliente' | 'endereco' | 'tipoServico' | 'data' | 'observacoes'>;

export function applyQuickEdit(original: Installation, values: QuickEditValues): Installation {
  return {
    ...original,
    cliente: values.cliente.trim(),
    endereco: values.endereco.trim(),
    tipoServico: values.tipoServico as ServiceType,
    data: values.data.trim(),
    observacoes: values.observacoes.trim(),
  };
}
