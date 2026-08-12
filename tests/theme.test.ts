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
