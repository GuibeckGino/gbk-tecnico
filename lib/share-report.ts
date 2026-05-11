import { Installation } from '@/types/installation';
import { calcularStats } from '@/types/installation';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

interface ReportData {
  mes: number;
  ano: number;
  instalacoes: Installation[];
  paymentMode: string;
  monthlyGoal: number;
}

/**
 * Gera um resumo de texto do relatório
 */
export function gerarResumoRelatorio(data: ReportData): string {
  const stats = calcularStats(data.instalacoes, data.paymentMode as any);
  const nomesMes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const mesNome = nomesMes[data.mes];
  const dataGeracao = new Date().toLocaleDateString('pt-BR');

  let resumo = `RELATÓRIO DE INSTALAÇÕES\n`;
  resumo += `${mesNome} de ${data.ano}\n`;
  resumo += `Gerado em: ${dataGeracao}\n\n`;

  resumo += `RESUMO EXECUTIVO\n`;
  resumo += `================\n`;
  resumo += `Total de Instalações: ${stats.total}\n`;
  resumo += `Valor Total: R$ ${stats.valorTotal.toLocaleString('pt-BR')}\n`;
  resumo += `Meta Mensal: ${data.monthlyGoal} instalações\n`;
  resumo += `Percentual da Meta: ${((stats.total / data.monthlyGoal) * 100).toFixed(1)}%\n\n`;

  resumo += `DISTRIBUIÇÃO POR TIPO\n`;
  resumo += `====================\n`;
  resumo += `Instalação: ${stats.porTipo.instalacao}\n`;
  resumo += `Tipo 3: ${stats.porTipo.tipo3}\n`;
  resumo += `Mudança: ${stats.porTipo.mudanca}\n`;
  resumo += `Empresarial: ${stats.porTipo.empresarial}\n\n`;

  resumo += `DETALHES DAS INSTALAÇÕES\n`;
  resumo += `========================\n`;
  data.instalacoes.forEach((inst, idx) => {
    resumo += `${idx + 1}. ${inst.cliente}\n`;
    resumo += `   Data: ${inst.data}\n`;
    resumo += `   Tipo: ${inst.tipoServico}\n`;
    resumo += `   Endereço: ${inst.endereco}\n`;
    if (inst.observacoes) {
      resumo += `   Observações: ${inst.observacoes}\n`;
    }
    resumo += `\n`;
  });

  return resumo;
}

/**
 * Compartilha relatório via email ou mensagem
 */
export async function compartilharRelatorio(data: ReportData): Promise<boolean> {
  try {
    const resumo = gerarResumoRelatorio(data);
    const nomesMes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const filename = `Relatorio_${nomesMes[data.mes]}_${data.ano}.txt`;
    const filepath = `${FileSystem.documentDirectory}${filename}`;

    // Escrever arquivo
    await FileSystem.writeAsStringAsync(filepath, resumo);

    // Compartilhar
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filepath, {
        mimeType: 'text/plain',
        dialogTitle: `Compartilhar Relatório - ${nomesMes[data.mes]} ${data.ano}`,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao compartilhar relatório:', error);
    return false;
  }
}

/**
 * Copia relatório para clipboard
 */
export async function copiarRelatorioParaClipboard(data: ReportData): Promise<boolean> {
  try {
    const resumo = gerarResumoRelatorio(data);
    // Implementar cópia para clipboard quando disponível
    return true;
  } catch (error) {
    console.error('Erro ao copiar relatório:', error);
    return false;
  }
}

/**
 * Gera link compartilhável (simulado - em produção seria um servidor)
 */
export function gerarLinkCompartilhavel(data: ReportData): string {
  // Simular geração de link
  const hash = btoa(JSON.stringify(data)).substring(0, 12);
  return `gbk-tecnico://relatorio/${hash}`;
}
