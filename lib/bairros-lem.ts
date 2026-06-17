/**
 * Lista de bairros de Luís Eduardo Magalhães - BA
 * Baseada em dados dos Correios e bases de CEP
 * Organizada por regiões da cidade
 */

// Bairros principais (cadastrados nos Correios)
const BAIRROS_PRINCIPAIS = [
  'Alto da Lagoa',
  'Área Rural de Luís Eduardo Magalhães',
  'Bahia Farm',
  'Boa Vista',
  'Centro',
  'Cidade do Automóvel',
  'Cidade Santa Cruz',
  'Florais Léa',
  'Jardim Alvorada',
  'Jardim das Acácias',
  'Jardim das Oliveiras',
  'Jardim Imperial',
  'Jardim Paraíso',
  'Jardim Primavera',
  'Mimoso do Oeste',
  'Ondumar Marabá',
  'Santa Cruz',
  'Setor C Sul Arnaldo H. Ferreira',
  'Tropical Ville',
  'Universitário',
  'Novo Paraná',
];

// Loteamentos e conjuntos habitacionais
const LOTEAMENTOS_E_RESIDENCIAIS = [
  'Aroldo da Cruz',
  'Chácaras Santa Cruz I',
  'Chácaras Santa Cruz II',
  'Chiodi',
  'Cidade Santa Cruz II',
  'Jardim das Acácias II',
  'Jardim das Acácias III',
  'Jardim Paraíso II',
  'Jardim Paraíso III',
  'JK',
  'Vereda Tropical',
];

// Regiões da cidade (para organização)
export const REGIOES_LEM = {
  'Centro': ['Centro', 'Setor C Sul Arnaldo H. Ferreira'],
  'Santa Cruz': ['Santa Cruz', 'Cidade Santa Cruz', 'Cidade Santa Cruz II', 'Chácaras Santa Cruz I', 'Chácaras Santa Cruz II'],
  'Jardim Paraíso': ['Jardim Paraíso', 'Jardim Paraíso II', 'Jardim Paraíso III'],
  'Boa Vista': ['Boa Vista', 'Tropical Ville'],
  'Universitário': ['Universitário', 'Cidade do Automóvel'],
  'Jardim das Acácias': ['Jardim das Acácias', 'Jardim das Acácias II', 'Jardim das Acácias III'],
  'Outros': [
    'Alto da Lagoa',
    'Área Rural de Luís Eduardo Magalhães',
    'Bahia Farm',
    'Aroldo da Cruz',
    'Chiodi',
    'Florais Léa',
    'Jardim Alvorada',
    'Jardim das Oliveiras',
    'Jardim Imperial',
    'Jardim Primavera',
    'JK',
    'Mimoso do Oeste',
    'Novo Paraná',
    'Ondumar Marabá',
    'Vereda Tropical',
  ],
};

/**
 * Lista completa de bairros, loteamentos e residenciais
 * Ordenada alfabeticamente para facilitar busca
 */
export const BAIRROS_LEM = [
  ...BAIRROS_PRINCIPAIS,
  ...LOTEAMENTOS_E_RESIDENCIAIS,
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

/**
 * Função para obter a região de um bairro
 * @param bairro - Nome do bairro
 * @returns Nome da região ou 'Outros' se não encontrado
 */
export function obterRegiaoBairro(bairro: string): string {
  for (const [regiao, bairros] of Object.entries(REGIOES_LEM)) {
    if (bairros.includes(bairro)) {
      return regiao;
    }
  }
  return 'Outros';
}

/**
 * Função para obter todos os bairros de uma região
 * @param regiao - Nome da região
 * @returns Array de bairros da região
 */
export function obterBairrosPorRegiao(regiao: string): string[] {
  return REGIOES_LEM[regiao as keyof typeof REGIOES_LEM] || [];
}
