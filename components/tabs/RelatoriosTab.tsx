import React, { useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useInstallations } from '@/context/InstallationsContext';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/use-colors';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  calcularReceitaBruta,
  calcularDespesasTotal,
  calcularCombustivelTotal,
  calcularLucroLiquido,
  calcularMargemLucro,
  calcularLucroPorBairro,
  calcularLucroPorTipo,
} from '@/lib/finance-utils';

export function RelatoriosTab() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano } = useMonth();
  const { state: financeState } = useFinance();
  const colors = useColors();

  // Cálculos
  const receitaBruta = useMemo(() => {
    return calcularReceitaBruta(instalacoes, mes, ano, paymentMode);
  }, [instalacoes, mes, ano, paymentMode]);

  const despesasTotal = useMemo(() => {
    return calcularDespesasTotal(financeState.expenses, mes, ano);
  }, [financeState.expenses, mes, ano]);

  const combustivelTotal = useMemo(() => {
    return calcularCombustivelTotal(financeState.fuelSupplies, mes, ano);
  }, [financeState.fuelSupplies, mes, ano]);

  const lucroLiquido = useMemo(() => {
    return calcularLucroLiquido(receitaBruta, despesasTotal, combustivelTotal);
  }, [receitaBruta, despesasTotal, combustivelTotal]);

  const margemLucro = useMemo(() => {
    return calcularMargemLucro(lucroLiquido, receitaBruta);
  }, [lucroLiquido, receitaBruta]);

  const lucroPorBairro = useMemo(() => {
    return calcularLucroPorBairro(
      instalacoes,
      financeState.expenses,
      financeState.fuelSupplies,
      mes,
      ano,
      paymentMode
    );
  }, [instalacoes, financeState.expenses, financeState.fuelSupplies, mes, ano, paymentMode]);

  const lucroPorTipo = useMemo(() => {
    return calcularLucroPorTipo(
      instalacoes,
      financeState.expenses,
      financeState.fuelSupplies,
      mes,
      ano,
      paymentMode
    );
  }, [instalacoes, financeState.expenses, financeState.fuelSupplies, mes, ano, paymentMode]);

  const gerarRelatorioFinanceiro = async () => {
    try {
      const mesNome = new Date(ano, mes - 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });

      const conteudo = `
RELATÓRIO FINANCEIRO - ${mesNome.toUpperCase()}
${'='.repeat(60)}

RESUMO EXECUTIVO
${'-'.repeat(60)}
Receita Bruta:        R$ ${receitaBruta.toFixed(2)}
Despesas:             R$ ${despesasTotal.toFixed(2)}
Combustível:          R$ ${combustivelTotal.toFixed(2)}
Lucro Líquido:        R$ ${lucroLiquido.toFixed(2)}
Margem de Lucro:      ${margemLucro.toFixed(2)}%

DETALHES DE RECEITA
${'-'.repeat(60)}
Total de Instalações: ${instalacoes.filter(i => {
  const data = new Date(i.createdAt);
  return data.getMonth() + 1 === mes && data.getFullYear() === ano;
}).length}

LUCRO POR BAIRRO
${'-'.repeat(60)}
${Object.entries(lucroPorBairro)
  .sort((a, b) => b[1] - a[1])
  .map(([bairro, lucro]) => `${bairro.padEnd(40)} R$ ${lucro.toFixed(2)}`)
  .join('\n')}

LUCRO POR TIPO DE SERVIÇO
${'-'.repeat(60)}
${Object.entries(lucroPorTipo)
  .sort((a, b) => b[1] - a[1])
  .map(([tipo, lucro]) => `${tipo.padEnd(40)} R$ ${lucro.toFixed(2)}`)
  .join('\n')}

DESPESAS DETALHADAS
${'-'.repeat(60)}
${financeState.expenses
  .filter(e => e.mes === mes && e.ano === ano)
  .map(e => `${e.titulo.padEnd(30)} ${e.categoria.padEnd(15)} R$ ${e.valor.toFixed(2)}`)
  .join('\n')}

COMBUSTÍVEL DETALHADO
${'-'.repeat(60)}
${financeState.fuelSupplies
  .filter(f => f.mes === mes && f.ano === ano)
  .map(f => `${f.posto.padEnd(30)} ${f.litros.toFixed(1)}L @ R$ ${f.precoLitro.toFixed(2)}/L = R$ ${f.valorTotal.toFixed(2)}`)
  .join('\n')}

GERADO EM: ${new Date().toLocaleString('pt-BR')}
`;

      const fileName = `relatorio_financeiro_${ano}_${String(mes).padStart(2, '0')}.txt`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, conteudo);

      // Compartilhar
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/plain',
          dialogTitle: 'Compartilhar Relatório Financeiro',
        });
      } else {
        Alert.alert('Sucesso', `Relatório salvo em: ${filePath}`);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      Alert.alert('Erro', 'Não foi possível gerar o relatório');
    }
  };

  const gerarRelatorioJSON = async () => {
    try {
      const mesNome = new Date(ano, mes - 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });

      const dados = {
        periodo: mesNome,
        ano,
        mes,
        geradoEm: new Date().toISOString(),
        resumo: {
          receitaBruta,
          despesasTotal,
          combustivelTotal,
          lucroLiquido,
          margemLucro,
        },
        lucroPorBairro,
        lucroPorTipo,
        despesas: financeState.expenses.filter(e => e.mes === mes && e.ano === ano),
        combustivel: financeState.fuelSupplies.filter(f => f.mes === mes && f.ano === ano),
      };

      const fileName = `relatorio_financeiro_${ano}_${String(mes).padStart(2, '0')}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(dados, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Compartilhar Relatório JSON',
        });
      } else {
        Alert.alert('Sucesso', `Relatório salvo em: ${filePath}`);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório JSON:', error);
      Alert.alert('Erro', 'Não foi possível gerar o relatório JSON');
    }
  };

  const gerarRelatorioCSV = async () => {
    try {
      const mesNome = new Date(ano, mes - 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });

      let csv = 'RELATÓRIO FINANCEIRO - ' + mesNome + '\n\n';

      // Resumo
      csv += 'RESUMO\n';
      csv += 'Receita Bruta,Despesas,Combustível,Lucro Líquido,Margem Lucro\n';
      csv += `${receitaBruta.toFixed(2)},${despesasTotal.toFixed(2)},${combustivelTotal.toFixed(2)},${lucroLiquido.toFixed(2)},${margemLucro.toFixed(2)}%\n\n`;

      // Despesas
      csv += 'DESPESAS\n';
      csv += 'Título,Categoria,Valor,Data,Forma Pagamento\n';
      financeState.expenses
        .filter(e => e.mes === mes && e.ano === ano)
        .forEach(e => {
          csv += `"${e.titulo}","${e.categoria}",${e.valor.toFixed(2)},${new Date(e.data).toLocaleDateString('pt-BR')},"${e.formaPagamento}"\n`;
        });

      csv += '\nCOMBUSTÍVEL\n';
      csv += 'Posto,Litros,Preço/L,Valor Total,Quilometragem,Data\n';
      financeState.fuelSupplies
        .filter(f => f.mes === mes && f.ano === ano)
        .forEach(f => {
          csv += `"${f.posto}",${f.litros.toFixed(2)},${f.precoLitro.toFixed(2)},${f.valorTotal.toFixed(2)},${f.quilometragem},${new Date(f.data).toLocaleDateString('pt-BR')}\n`;
        });

      const fileName = `relatorio_financeiro_${ano}_${String(mes).padStart(2, '0')}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Compartilhar Relatório CSV',
        });
      } else {
        Alert.alert('Sucesso', `Relatório salvo em: ${filePath}`);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório CSV:', error);
      Alert.alert('Erro', 'Não foi possível gerar o relatório CSV');
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-foreground font-semibold text-lg mb-4">Gerar Relatórios</Text>

      {/* Resumo */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-foreground font-semibold mb-3">Período</Text>
        <Text className="text-muted">
          {new Date(ano, mes - 1).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Botões de Exportação */}
      <View className="gap-3 mb-6">
        <TouchableOpacity
          onPress={gerarRelatorioFinanceiro}
          className="bg-primary rounded-lg p-4 active:opacity-80"
        >
          <Text className="text-white text-center font-semibold">📄 Relatório Financeiro (TXT)</Text>
          <Text className="text-white/80 text-xs text-center mt-1">Formato texto legível</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={gerarRelatorioJSON}
          className="bg-primary rounded-lg p-4 active:opacity-80"
        >
          <Text className="text-white text-center font-semibold">📊 Relatório Estruturado (JSON)</Text>
          <Text className="text-white/80 text-xs text-center mt-1">Para análise e integração</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={gerarRelatorioCSV}
          className="bg-primary rounded-lg p-4 active:opacity-80"
        >
          <Text className="text-white text-center font-semibold">📈 Relatório Tabular (CSV)</Text>
          <Text className="text-white/80 text-xs text-center mt-1">Para planilhas e análises</Text>
        </TouchableOpacity>
      </View>

      {/* Informações */}
      <View className="bg-surface rounded-lg p-4 border border-border">
        <Text className="text-foreground font-semibold mb-2">Informações Incluídas</Text>
        <Text className="text-muted text-sm mb-2">✓ Resumo financeiro (receita, despesas, lucro)</Text>
        <Text className="text-muted text-sm mb-2">✓ Lucro por bairro</Text>
        <Text className="text-muted text-sm mb-2">✓ Lucro por tipo de serviço</Text>
        <Text className="text-muted text-sm mb-2">✓ Detalhes de despesas</Text>
        <Text className="text-muted text-sm">✓ Detalhes de combustível</Text>
      </View>
    </ScrollView>
  );
}
