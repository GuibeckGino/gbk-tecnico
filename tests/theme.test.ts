import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Tema visual premium do GBK Técnico', () => {
  it('declara a paleta escura azul-marinho com destaques dourados', () => {
    const themeFile = readFileSync(resolve(process.cwd(), 'theme.config.js'), 'utf8');

    expect(themeFile).toContain("dark: '#050A14'");
    expect(themeFile).toContain("dark: '#0B1426'");
    expect(themeFile).toContain("dark: '#2F6BFF'");
    expect(themeFile).toContain("dark: '#C99524'");
  });
});

  it('expõe tokens premium reutilizáveis e aplica o padrão nas telas principais', () => {
    const premiumFile = readFileSync(resolve(process.cwd(), 'components/premium-ui.tsx'), 'utf8');
    expect(premiumFile).toContain("gold: '#F2B52B'");
    expect(premiumFile).toContain("surface: '#0B1426'");
    expect(premiumFile).toContain("blue: '#2F6BFF'");

    const screens = [
      'app/(tabs)/analise.tsx',
      'app/(tabs)/calendario.tsx',
      'app/(tabs)/configuracoes.tsx',
      'app/(tabs)/graficos.tsx',
      'app/(tabs)/historico.tsx',
      'app/(tabs)/novo-cadastro.tsx',
    ];

    for (const screen of screens) {
      const source = readFileSync(resolve(process.cwd(), screen), 'utf8');
      expect(source).toContain('premium-ui');
    }
  });
