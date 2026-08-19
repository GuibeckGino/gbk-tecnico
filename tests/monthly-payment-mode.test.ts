import { describe, expect, it } from 'vitest';
import { analisarMesAMes } from '../lib/analytics';
import { calcularValorConfiguradoDoMes } from '../lib/monthly-payment-mode';
import type { Installation } from '../types/installation';

describe('Modo de pagamento por mês/ano', () => {
  it('usa R$ 70 no mês configurado como fixo e R$ 65 no mês em meta abaixo do limite', () => {
    const instalacao: Installation = {
      id: 'os-1',
      cliente: '1',
      endereco: 'Centro',
      tipoServico: 'Instalação',
      data: '18/08/2026',
      observacoes: '',
      createdAt: '2026-08-18T10:00:00.000Z',
    };

    expect(calcularValorConfiguradoDoMes(instalacao, 2, 7, 2026, {
      '2026-08': 'fixo70',
    })).toBe(70);
    expect(calcularValorConfiguradoDoMes({ ...instalacao, data: '18/07/2026' }, 2, 6, 2026, {
      '2026-07': 'meta',
    })).toBe(65);
  });

  it('mantém Tipo 3 em R$ 60 a partir de agosto de 2026 e usa valor padrão antes disso', () => {
    const base: Installation = {
      id: 'os-2',
      cliente: '2',
      endereco: 'Centro',
      tipoServico: 'Tipo 3',
      data: '18/08/2026',
      observacoes: '',
      createdAt: '2026-08-18T10:00:00.000Z',
    };

    // A partir de agosto de 2026: R$ 60
    expect(calcularValorConfiguradoDoMes(base, 120, 7, 2026, { '2026-08': 'fixo70' })).toBe(60);
    
    // Antes de agosto de 2026 (ex: 18/07/2026): segue o modo de pagamento (fixo70 = 70, meta < 104 = 65)
    const baseAntiga = { ...base, data: '18/07/2026', createdAt: '2026-07-18T10:00:00.000Z' };
    expect(calcularValorConfiguradoDoMes(baseAntiga, 50, 6, 2026, { '2026-07': 'fixo70' })).toBe(70);
    expect(calcularValorConfiguradoDoMes(baseAntiga, 50, 6, 2026, { '2026-07': 'meta' })).toBe(65);

    // Empresarial sempre R$ 100
    expect(calcularValorConfiguradoDoMes({ ...base, tipoServico: 'Empresarial' }, 120, 7, 2026, { '2026-08': 'meta' })).toBe(100);
  });

  it('calcula mês a mês com o modo correspondente a cada chave histórica', () => {
    const criar = (id: string, data: string): Installation => ({
      id,
      cliente: id,
      endereco: 'Centro',
      tipoServico: 'Instalação',
      data,
      observacoes: '',
      createdAt: `2026-${data.slice(3, 5)}-${data.slice(0, 2)}T10:00:00.000Z`,
    });

    const resultado = analisarMesAMes(
      [criar('ago-1', '18/08/2026'), criar('ago-2', '19/08/2026'), criar('jul-1', '18/07/2026'), criar('jul-2', '19/07/2026')],
      { '2026-08': 'fixo70', '2026-07': 'meta' },
    );

    expect(resultado.find((mes) => mes.mes === 8)?.valorTotal).toBe(140);
    expect(resultado.find((mes) => mes.mes === 7)?.valorTotal).toBe(130);
  });
});
