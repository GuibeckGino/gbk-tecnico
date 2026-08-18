import { describe, expect, it } from 'vitest';
import { applyQuickEdit } from '../lib/quick-edit';
import type { Installation } from '../types/installation';

describe('Edição rápida da OS', () => {
  it('atualiza os campos editáveis e preserva ID, data de criação e favorito', () => {
    const original: Installation = {
      id: 'os-1',
      cliente: '123456',
      endereco: 'Centro',
      tipoServico: 'Instalação',
      data: '18/08/2026',
      observacoes: 'Original',
      createdAt: '2026-08-18T10:00:00.000Z',
      isFavorito: true,
    };

    const updated = applyQuickEdit(original, {
      cliente: '  654321 ',
      endereco: '  Santa Cruz ',
      tipoServico: 'Tipo 3',
      data: '19/08/2026',
      observacoes: '  Ajustada  ',
    });

    expect(updated).toMatchObject({
      id: 'os-1',
      cliente: '654321',
      endereco: 'Santa Cruz',
      tipoServico: 'Tipo 3',
      data: '19/08/2026',
      observacoes: 'Ajustada',
      createdAt: '2026-08-18T10:00:00.000Z',
      isFavorito: true,
    });
  });
});
