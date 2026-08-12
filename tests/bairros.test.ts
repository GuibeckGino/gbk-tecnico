import { describe, expect, it } from 'vitest';
import { BAIRROS_LEM, buscarBairros, obterBairrosPorRegiao } from '../lib/bairros-lem';

describe('Bairros de Luís Eduardo Magalhães', () => {
  it('mantém Santa Cruz e remove as variações Chácaras Santa Cruz', () => {
    expect(BAIRROS_LEM).toContain('Santa Cruz');
    expect(BAIRROS_LEM).not.toContain('Chácaras Santa Cruz I');
    expect(BAIRROS_LEM).not.toContain('Chácaras Santa Cruz II');
    expect(obterBairrosPorRegiao('Santa Cruz')).toEqual([
      'Santa Cruz',
      'Cidade Santa Cruz',
      'Cidade Santa Cruz II',
    ]);
  });

  it('continua encontrando Santa Cruz na busca', () => {
    expect(buscarBairros('Santa Cruz')).toContain('Santa Cruz');
  });
});
