// Tipos para o módulo financeiro

export interface Expense {
  id: string;
  titulo: string;
  categoria: 'Combustível' | 'Alimentação' | 'Pedágio' | 'Ferramentas' | 'Peças' | 'Internet' | 'Telefone' | 'Manutenção' | 'Impostos' | 'Outros';
  valor: number;
  data: string; // ISO date
  descricao: string;
  formaPagamento: 'Dinheiro' | 'Débito' | 'Crédito' | 'PIX' | 'Outro';
  mes: number;
  ano: number;
}

export interface FuelSupply {
  id: string;
  posto: string;
  data: string; // ISO date
  litros: number;
  valorTotal: number;
  precoLitro: number;
  quilometragem: number;
  observacoes: string;
  mes: number;
  ano: number;
}

export interface FinancialSummary {
  receitaBruta: number;
  totalInstalacoes: number;
  gastosCombustivel: number;
  outrasDespesas: number;
  lucroLiquido: number;
  ticketMedio: number;
  receitaPorDia: number;
  receitaPorBairro: { [bairro: string]: number };
  receitaPorTipo: { [tipo: string]: number };
}

export interface MonthlyFinancial {
  mes: number;
  ano: number;
  receitaPrevista: number;
  receitaRecebida: number;
  receitaPendente: number;
  despesasTotal: number;
  combustivelTotal: number;
  lucroLiquido: number;
  margemLucro: number;
  lucroPorInstalacao: number;
  lucroPorBairro: { [bairro: string]: number };
  lucroPorTipo: { [tipo: string]: number };
}

export interface FinancialAlert {
  id: string;
  tipo: 'aviso' | 'sucesso' | 'erro';
  mensagem: string;
  data: string;
  lido: boolean;
}

export interface FinancialForecast {
  receitaPrevisaFim: number;
  lucroPrevisaoFim: number;
  despesaPrevisaoFim: number;
  instalacoesPrevisaoFim: number;
  percentualMeta: number;
}

export interface ReceiptStatus {
  id: string;
  instalacaoId: string;
  status: 'Recebido' | 'Pendente' | 'Cancelado';
  valorPrevisto: number;
  valorRecebido: number;
  data: string;
  mes: number;
  ano: number;
}
