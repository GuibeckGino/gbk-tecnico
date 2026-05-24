/**
 * Lista de bairros de Luís Eduardo Magalhães - BA
 * Ordenada alfabeticamente para facilitar busca
 */
export const BAIRROS_LEM = [
  'Bahia Farm',
  'Boa Vista',
  'Centro',
  'Cidade Universitária',
  'Conquista',
  'Florais Léa',
  'Jardim Imperial',
  'Jardim Paraíso',
  'Jardim Primavera',
  'Mimoso do Oeste I',
  'Mimoso do Oeste II',
  'Parque São José',
  'Santa Cruz',
  'Solar do Oeste',
].sort();

/**
 * Função para buscar bairros por filtro
 * @param query - Texto para filtrar bairros
 * @returns Array de bairros que correspondem ao filtro
 */
export function buscarBairros(query: string): string[] {
  if (!query.trim()) return BAIRROS_LEM;
  
  const queryLower = query.toLowerCase();
  return BAIRROS_LEM.filter(bairro => 
    bairro.toLowerCase().includes(queryLower)
  );
}

/**
 * Função para validar se um bairro existe na lista
 * @param bairro - Nome do bairro
 * @returns true se o bairro existe, false caso contrário
 */
export function validarBairro(bairro: string): boolean {
  return BAIRROS_LEM.includes(bairro);
}
