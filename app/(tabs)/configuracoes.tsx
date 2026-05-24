import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
  Platform,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as Print from "expo-print";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useMonth } from "@/context/MonthContext";
import { useGBKTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/use-colors";
import { useWorkSchedule, type DayOfWeek } from "@/context/WorkScheduleContext";

import * as Haptics from "expo-haptics";
import { useState as useStateReact, useEffect } from "react";
import { useMonthlyConfig } from "@/hooks/use-monthly-config";
import { prepararDadosRelatorio, calcularTopClientes, formatarValor, calcularCrescimento } from "@/lib/pdf-generator";
import { compartilharRelatorio, gerarResumoRelatorio } from "@/lib/share-report";
import { useFocusEffect } from "@react-navigation/native";

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

function hapticError() {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

function hapticSuccess() {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export default function ConfiguracoesScreen() {
  const { instalacoes, stats, limparDados, exportarJSON, importarJSON, paymentMode, setPaymentMode, monthlyGoal, setMonthlyGoal } =
    useInstallations();
  const { mes, ano, mesAnoFormatado } = useMonth();
  const { modoEscuro, toggleModoEscuro } = useGBKTheme();
  const colors = useColors();
  useMonthlyConfig(); // Carregar configurações do mês selecionado
  const [exportando, setExportando] = useStateReact(false);
  const [importando, setImportando] = useStateReact(false);
  const [showPaymentModes, setShowPaymentModes] = useStateReact(false);

  // Modal de confirmação para limpar dados
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useStateReact(false);
  const [limpando, setLimpando] = useStateReact(false);
  const [gerandoPDF, setGerandoPDF] = useStateReact(false);
  const [editandoMeta, setEditandoMeta] = useStateReact(false);
  const [novaMetaInput, setNovaMetaInput] = useStateReact(monthlyGoal.toString());
  const [editandoAgenda, setEditandoAgenda] = useStateReact(false);
  const workSchedule = useWorkSchedule();
  const [diasSelecionados, setDiasSelecionados] = useStateReact<DayOfWeek[]>(workSchedule.workDays);
  const dayNames = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  async function compartilharMes() {
    const instalacoesDoMes = instalacoes.filter((inst) => {
      const [d, m, a] = inst.data.split("/");
      return parseInt(m) === mes && parseInt(a) === ano;
    });

    if (instalacoesDoMes.length === 0) {
      Alert.alert("Sem dados", `Não há instalações em ${mesAnoFormatado}.`);
      return;
    }

    const totalInstalacoes = instalacoesDoMes.length;
    const valorIndividual = totalInstalacoes >= 104 ? 70 : 65;
    const totalValor = totalInstalacoes * valorIndividual;
    const valorFormatado = totalValor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const contagem = {
      Instalacao: instalacoesDoMes.filter((i) => i.tipoServico === "Instalação").length,
      Tipo3: instalacoesDoMes.filter((i) => i.tipoServico === "Tipo 3").length,
      Mudanca: instalacoesDoMes.filter((i) => i.tipoServico === "Mudança").length,
    };

    const mensagem = `📊 *Relatório GBK Técnico - ${mesAnoFormatado}*\n\n` +
      `📦 Total de Instalações: ${totalInstalacoes}\n` +
      `💰 Valor Total: ${valorFormatado}\n\n` +
      `📋 Por Tipo:\n` +
      `  • Instalação: ${contagem.Instalacao}\n` +
      `  • Tipo 3: ${contagem.Tipo3}\n` +
      `  • Mudança: ${contagem.Mudanca}\n\n` +
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`;

    if (Platform.OS === "web") {
      Alert.alert(
        "Compartilhar",
        "Compartilhamento disponível apenas no dispositivo móvel."
      );
      return;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(mensagem, {
        dialogTitle: "Compartilhar Relatório",
      });
    }
  }




  async function exportarCSV() {
    if (instalacoes.length === 0) {
      Alert.alert("Sem dados", "Não há instalações para exportar.");
      return;
    }
    setExportando(true);
    try {
      console.log("[CSV] Iniciando exportação");
      
      const cabecalho = "Cliente,Endereço,Tipo,Data,Observações,Valor";
      const linhas = instalacoes.map((inst) => {
        let valor = 0;
        if (inst.tipoServico === "Empresarial") {
          valor = 100;
        } else {
          valor = instalacoes.length >= 104 ? 70 : 65;
        }
        
        const campos = [
          `"${inst.cliente.replace(/"/g, '""')}"`,
          `"${inst.endereco.replace(/"/g, '""')}"`,
          `"${inst.tipoServico}"`,
          `"${inst.data}"`,
          `"${inst.observacoes.replace(/"/g, '""')}"`,
          `"R$ ${valor.toFixed(2)}"`
        ];
        return campos.join(",");
      });
      const csv = [cabecalho, ...linhas].join("\n");
      console.log("[CSV] CSV gerado, tamanho:", csv.length);

      if (Platform.OS === "web") {
        Alert.alert(
          "Exportação",
          "Exportação CSV disponível apenas no dispositivo móvel."
        );
        setExportando(false);
        return;
      }

      const fileName = `gbk-tecnico-${new Date().toISOString().split("T")[0]}.csv`;
      const uri = `${FileSystem.documentDirectory}${fileName}`;
      console.log("[CSV] Caminho do arquivo:", uri);
      
      await FileSystem.writeAsStringAsync(uri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      console.log("[CSV] Arquivo criado com sucesso");

      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log("[CSV] Info do arquivo:", fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error("Arquivo CSV não foi criado no sistema de arquivos");
      }

      if (await Sharing.isAvailableAsync()) {
        console.log("[CSV] Iniciando compartilhamento");
        try {
          await Sharing.shareAsync(uri, {
            mimeType: "text/csv",
            dialogTitle: "Exportar CSV",
          });
          hapticSuccess();
          Alert.alert("Sucesso", "CSV exportado e pronto para compartilhar!");
        } catch (shareError) {
          console.error("[CSV] Erro ao compartilhar:", shareError);
          hapticSuccess();
          Alert.alert("Sucesso", `CSV salvo em:\n${uri}\n\nCompartilhamento não disponível neste momento.`);
        }
      } else {
        hapticSuccess();
        Alert.alert("Sucesso", `CSV salvo em:\n${uri}`);
      }
    } catch (error) {
      console.error("[CSV] Erro ao exportar:", error);
      hapticError();
      Alert.alert(
        "Erro ao Exportar CSV",
        `Não foi possível exportar o CSV.\n\nDetalhes: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setExportando(false);
    }
  }

  async function exportarBackup() {
    if (instalacoes.length === 0) {
      Alert.alert("Sem dados", "Não há instalações para exportar.");
      return;
    }
    setExportando(true);
    try {
      console.log("[JSON] Iniciando exportação de backup");
      
      // Gerar JSON dos dados
      const json = exportarJSON();
      console.log("[JSON] JSON gerado, tamanho:", json.length);

      if (Platform.OS === "web") {
        Alert.alert(
          "Exportação",
          "Exportação de backup disponível apenas no dispositivo móvel."
        );
        setExportando(false);
        return;
      }

      // Criar caminho do arquivo
      const timestamp = new Date().toISOString().split("T")[0];
      const fileName = `gbk-tecnico-backup-${timestamp}.json`;
      const uri = `${FileSystem.documentDirectory}${fileName}`;
      console.log("[JSON] Caminho do arquivo:", uri);

      // Escrever arquivo no dispositivo
      await FileSystem.writeAsStringAsync(uri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      console.log("[JSON] Arquivo criado com sucesso");

      // Verificar se arquivo foi criado
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log("[JSON] Info do arquivo:", fileInfo);

      if (!fileInfo.exists) {
        throw new Error("Arquivo JSON não foi criado no sistema de arquivos");
      }

      // Compartilhar arquivo
      if (await Sharing.isAvailableAsync()) {
        console.log("[JSON] Iniciando compartilhamento");
        try {
          await Sharing.shareAsync(uri, {
            mimeType: "application/json",
            dialogTitle: "Exportar Backup GBK Técnico",
          });
          hapticSuccess();
          Alert.alert("Sucesso", "Backup exportado e pronto para compartilhar!");
        } catch (shareError) {
          console.error("[JSON] Erro ao compartilhar:", shareError);
          hapticSuccess();
          Alert.alert("Sucesso", `Backup salvo em:\n${uri}\n\nCompartilhamento não disponível neste momento.`);
        }
      } else {
        hapticSuccess();
        Alert.alert("Sucesso", `Backup salvo em:\n${uri}`);
      }
    } catch (error) {
      console.error("[JSON] Erro ao exportar:", error);
      hapticError();
      Alert.alert(
        "Erro ao Exportar Backup",
        `Não foi possível exportar o backup.\n\nDetalhes: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setExportando(false);
    }
  }

  async function restaurarBackup() {
    if (Platform.OS === "web") {
      Alert.alert(
        "Restauração",
        "Restauração de backup disponível apenas no dispositivo móvel."
      );
      return;
    }
    setImportando(true);
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (resultado.canceled || !resultado.assets?.[0]) {
        console.log("[Restaurar] Seleção cancelada");
        setImportando(false);
        return;
      }

      const uri = resultado.assets[0].uri;
      console.log("[Restaurar] Arquivo selecionado:", uri);
      
      const conteudo = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      console.log("[Restaurar] Arquivo lido, tamanho:", conteudo.length);

      Alert.alert(
        "Restaurar Backup",
        "Isso substituirá todos os dados atuais. Deseja continuar?",
        [
          { text: "Cancelar", style: "cancel", onPress: () => setImportando(false) },
          {
            text: "Restaurar",
            style: "destructive",
            onPress: async () => {
              try {
                console.log("[Restaurar] Iniciando restauração");
                const sucesso = await importarJSON(conteudo);
                if (sucesso) {
                  console.log("[Restaurar] Restauração bem-sucedida");
                  hapticSuccess();
                  Alert.alert("Sucesso", "Backup restaurado com sucesso!");
                } else {
                  console.error("[Restaurar] Falha na restauração");
                  hapticError();
                  Alert.alert("Erro", "Arquivo de backup inválido.");
                }
              } catch (err) {
                console.error("[Restaurar] Erro durante restauração:", err);
                hapticError();
                Alert.alert("Erro", `Falha ao restaurar: ${err instanceof Error ? err.message : String(err)}`);
              } finally {
                setImportando(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("[Restaurar] Erro ao ler arquivo:", error);
      hapticError();
      Alert.alert("Erro", `Não foi possível ler o arquivo de backup.\n\nDetalhes: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setImportando(false);
    }
  }

  async function exportarRelatorioPDF() {
    if (instalacoes.length === 0) {
      Alert.alert("Sem dados", "Não há instalações para gerar relatório.");
      return;
    }
    setGerandoPDF(true);
    try {
      console.log("[PDF] Iniciando geração de relatório");
      
      if (Platform.OS === "web") {
        Alert.alert(
          "Relatório PDF",
          "Geração de PDF disponível apenas no dispositivo móvel."
        );
        setGerandoPDF(false);
        return;
      }

      // Preparar dados do relatório
      const dados = prepararDadosRelatorio(instalacoes, mes, ano, paymentMode);
      const topClientes = calcularTopClientes(dados.instalacoes, paymentMode);
      const crescimento = calcularCrescimento(dados.stats.valorTotal, dados.mesAnterior?.valorTotal || 0);

      // Gerar HTML para o PDF
      const htmlContent = gerarHTMLRelatorioPDF(dados, topClientes, crescimento);
      console.log("[PDF] HTML gerado, tamanho:", htmlContent.length);

      // Tentar gerar PDF
      let pdfGerado = false;
      let uri: string | null = null;

      try {
        // Tentar gerar arquivo PDF
        const resultado = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        uri = resultado.uri;
        pdfGerado = true;
        console.log("[PDF] PDF gerado em:", uri);
      } catch (pdfError) {
        console.warn("[PDF] Erro ao gerar arquivo PDF, tentando impressão nativa:", pdfError);
        // Fallback: usar impressão nativa do celular
        try {
          await Print.printAsync({
            html: htmlContent,
          });
          pdfGerado = true;
          console.log("[PDF] Impressão nativa iniciada");
        } catch (printError) {
          console.error("[PDF] Erro na impressão nativa:", printError);
        }
      }

      if (!pdfGerado) {
        throw new Error("Não foi possível gerar PDF ou iniciar impressão");
      }

      // Compartilhar PDF se arquivo foi gerado
      if (uri && (await Sharing.isAvailableAsync())) {
        console.log("[PDF] Iniciando compartilhamento");
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartilhar Relatório",
        });
        hapticSuccess();
        Alert.alert("Sucesso", "Relatório PDF gerado e pronto para compartilhar!");
      } else if (uri) {
        hapticSuccess();
        Alert.alert("Sucesso", `PDF salvo em:\n${uri}`);
      } else {
        hapticSuccess();
        Alert.alert("Sucesso", "Relatório enviado para impressão!");
      }
    } catch (error) {
      console.error("[PDF] Erro ao gerar relatório:", error);
      hapticError();
      Alert.alert(
        "Erro ao Gerar Relatório",
        `Não foi possível gerar o relatório.\n\nDetalhes: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setGerandoPDF(false);
    }
  }

  function gerarConteudoPDF(dados: any, topClientes: any[], crescimento: number) {
    return {
      titulo: "Relatório de Faturamento GBK Técnico",
      periodo: dados.mesAnoFormatado,
      dataGeracao: new Date().toLocaleDateString("pt-BR"),
      resumoExecutivo: {
        totalInstalacoes: dados.stats.total,
        valorTotal: formatarValor(dados.stats.valorTotal),
        metaAtingida: dados.stats.total >= 104,
        metaProgresso: `${dados.stats.total}/104`,
        modoPagemento: dados.paymentMode === "meta" ? "Meta Progressiva" : dados.paymentMode === "fixo65" ? "Fixo R$ 65" : "Fixo R$ 70",
      },
      analisePortipo: {
        instalacao: {
          quantidade: dados.stats.porTipo.instalacao,
          valor: formatarValor(dados.stats.porTipo.instalacao * (dados.stats.total >= 104 ? 70 : 65)),
        },
        tipo3: {
          quantidade: dados.stats.porTipo.tipo3,
          valor: formatarValor(dados.stats.porTipo.tipo3 * (dados.stats.total >= 104 ? 70 : 65)),
        },
        mudanca: {
          quantidade: dados.stats.porTipo.mudanca,
          valor: formatarValor(dados.stats.porTipo.mudanca * (dados.stats.total >= 104 ? 70 : 65)),
        },
        empresarial: {
          quantidade: dados.stats.porTipo.empresarial,
          valor: formatarValor(dados.stats.porTipo.empresarial * 100),
        },
      },
      comparativoMeses: {
        mesAtual: dados.stats.total,
        mesAnterior: dados.mesAnterior?.total || 0,
        crescimento: `${crescimento > 0 ? "+" : ""}${crescimento.toFixed(1)}%`,
      },
      topClientes: topClientes.map((c) => ({
        cliente: c.cliente,
        quantidade: c.quantidade,
        valor: formatarValor(c.valorTotal),
      })),
      instalacoes: dados.instalacoes.map((inst: any) => ({
        cliente: inst.cliente,
        endereco: inst.endereco,
        tipo: inst.tipoServico,
        data: inst.data,
        valor: inst.tipoServico === "Empresarial" ? "R$ 100" : inst.tipoServico === "Empresarial" ? "R$ 100" : formatarValor(dados.stats.total >= 104 ? 70 : 65),
        observacoes: inst.observacoes,
      })),
    };
  }

  function gerarHTMLRelatorioPDF(dados: any, topClientes: any[], crescimento: number): string {
    const tabelaInstalacoes = dados.instalacoes
      .map(
        (inst: any) => `
        <tr>
          <td>${inst.cliente}</td>
          <td>${inst.tipoServico}</td>
          <td>${inst.data}</td>
          <td>${inst.tipoServico === "Empresarial" ? "R$ 100" : "R$ " + (dados.stats.total >= 104 ? "70" : "65")}</td>
        </tr>
      `
      )
      .join("");

    const tabelaTopClientes = topClientes
      .map(
        (c: any) => `
        <tr>
          <td>${c.cliente}</td>
          <td>${c.quantidade}</td>
          <td>${c.valor}</td>
        </tr>
      `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #0a7ea4; text-align: center; }
            h2 { color: #0a7ea4; margin-top: 30px; border-bottom: 2px solid #0a7ea4; padding-bottom: 10px; }
            .resumo { background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .resumo-item { margin: 10px 0; }
            .resumo-label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background-color: #0a7ea4; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .meta-status { font-weight: bold; color: ${dados.stats.total >= 104 ? "green" : "red"}; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Relatório de Faturamento GBK Técnico</h1>
          <p style="text-align: center; color: #666;">${dados.mesAnoFormatado}</p>
          
          <h2>Resumo Executivo</h2>
          <div class="resumo">
            <div class="resumo-item">
              <span class="resumo-label">Total de Instalações:</span> ${dados.stats.total}
            </div>
            <div class="resumo-item">
              <span class="resumo-label">Valor Total:</span> ${formatarValor(dados.stats.valorTotal)}
            </div>
            <div class="resumo-item">
              <span class="resumo-label">Meta (104 instalações):</span> 
              <span class="meta-status">${dados.stats.total >= 104 ? "✓ ATINGIDA" : "✗ N\u00c3O ATINGIDA"} (${dados.stats.total}/104)</span>
            </div>
            <div class="resumo-item">
              <span class="resumo-label">Modo de Pagamento:</span> ${dados.paymentMode === "meta" ? "Meta Progressiva" : dados.paymentMode === "fixo65" ? "Fixo R$ 65" : "Fixo R$ 70"}
            </div>
          </div>
          
          <h2>Análise por Tipo de Serviço</h2>
          <table>
            <tr>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Valor Total</th>
            </tr>
            <tr>
              <td>Instalação</td>
              <td>${dados.stats.porTipo.instalacao}</td>
              <td>${formatarValor(dados.stats.porTipo.instalacao * (dados.stats.total >= 104 ? 70 : 65))}</td>
            </tr>
            <tr>
              <td>Tipo 3</td>
              <td>${dados.stats.porTipo.tipo3}</td>
              <td>${formatarValor(dados.stats.porTipo.tipo3 * (dados.stats.total >= 104 ? 70 : 65))}</td>
            </tr>
            <tr>
              <td>Mudança</td>
              <td>${dados.stats.porTipo.mudanca}</td>
              <td>${formatarValor(dados.stats.porTipo.mudanca * (dados.stats.total >= 104 ? 70 : 65))}</td>
            </tr>
            <tr>
              <td>Empresarial</td>
              <td>${dados.stats.porTipo.empresarial}</td>
              <td>${formatarValor(dados.stats.porTipo.empresarial * 100)}</td>
            </tr>
          </table>
          
          <h2>Comparativo com Mês Anterior</h2>
          <div class="resumo">
            <div class="resumo-item">
              <span class="resumo-label">Mês Anterior:</span> ${dados.mesAnterior?.total || 0} instalações
            </div>
            <div class="resumo-item">
              <span class="resumo-label">Crescimento:</span> <span style="color: ${crescimento > 0 ? "green" : "red"};">${crescimento > 0 ? "+" : ""}${crescimento.toFixed(1)}%</span>
            </div>
          </div>
          
          <h2>Top 5 Clientes</h2>
          <table>
            <tr>
              <th>Cliente</th>
              <th>Quantidade</th>
              <th>Valor Total</th>
            </tr>
            ${tabelaTopClientes}
          </table>
          
          <h2>Detalhamento de Instalações</h2>
          <table>
            <tr>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Data</th>
              <th>Valor</th>
            </tr>
            ${tabelaInstalacoes}
          </table>
          
          <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
          </div>
        </body>
      </html>
    `;
  }

  function abrirConfirmacaoLimpeza() {
    hapticError();
    setConfirmandoLimpeza(true);
  }



  function fecharConfirmacaoLimpeza() {
    setConfirmandoLimpeza(false);
  }

  async function executarLimpeza() {
    setLimpando(true);
    try {
      await limparDados();
      hapticSuccess();
      fecharConfirmacaoLimpeza();
    } finally {
      setLimpando(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.titulo, { color: colors.foreground }]}>
          Configurações
        </Text>

        {/* Seção Aparência */}
        <Secao titulo="Aparência">
          <ItemConfig
            icone="🌙"
            label="Modo Escuro"
            direita={
              <Switch
                value={modoEscuro}
                onValueChange={() => {
                  haptic();
                  toggleModoEscuro();
                }}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor="#fff"
              />
            }
          />
        </Secao>

        {/* Seção Modo de Pagamento */}
        <Secao titulo="Modo de Pagamento">
          <ItemConfig
            icone="💳"
            label="Modo Atual"
            sublabel={paymentMode === "meta" ? "Meta Progressiva" : paymentMode === "fixo65" ? "Fixo R$ 65" : "Fixo R$ 70"}
            onPress={() => setShowPaymentModes(true)}
          />
          <Divisor />
          <ItemConfig
            icone="🎯"
            label="Meta Mensal"
            sublabel={`${monthlyGoal} instalações`}
            onPress={() => setEditandoMeta(true)}
          />
        </Secao>

        {/* Seção Agenda de Trabalho */}
        <Secao titulo="Agenda de Trabalho">
          <ItemConfig
            icone="📅"
            label="Dias de Trabalho"
            sublabel={`${workSchedule.workDayNames.join(", ")}`}
            onPress={() => setEditandoAgenda(true)}
          />
        </Secao>

        {/* Seção Dados */}
        <Secao titulo="Dados">
          <ItemConfig
            icone="📄"
            label="Exportar CSV"
            sublabel={`${instalacoes.length} instalações`}
            onPress={exportarCSV}
            desabilitado={exportando}
          />
          <Divisor />
          <ItemConfig
            icone="💾"
            label="Exportar Backup (JSON)"
            sublabel="Salvar todos os dados"
            onPress={exportarBackup}
            desabilitado={exportando}
          />
          <Divisor />
          <ItemConfig
            icone="📂"
            label="Restaurar Backup"
            sublabel="Importar arquivo JSON"
            onPress={restaurarBackup}
            desabilitado={importando}
          />
          <Divisor />
          <ItemConfig
            icone="📊"
            label="Exportar Relatório PDF"
            sublabel={`Mês: ${mesAnoFormatado}`}
            onPress={exportarRelatorioPDF}
            desabilitado={gerandoPDF}
          />
        </Secao>

        {/* Seção Compartilhamento */}
        <Secao titulo="Compartilhamento">
          <ItemConfig
            icone="📤"
            label="Compartilhar Relatório"
            sublabel={`Mês: ${mesAnoFormatado}`}
            onPress={compartilharMes}
          />
        </Secao>

        {/* Seção Perigo */}
        <Secao titulo="Zona de Perigo">
          <ItemConfig
            icone="🗑️"
            label="Limpar Todos os Dados"
            sublabel="Apaga todas as instalações"
            onPress={abrirConfirmacaoLimpeza}
            cor="error"
          />
        </Secao>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.infoTexto, { color: colors.muted }]}>
            GBK Técnico v1.1.0
          </Text>
          <Text style={[styles.infoTexto, { color: colors.muted }]}>
            100% offline · AsyncStorage
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Seleção de Modo de Pagamento */}
      <Modal
        visible={showPaymentModes}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPaymentModes(false)}
      >
        <View style={styles.confirmOverlay}>
          <View
            style={[
              styles.confirmContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.confirmTitulo, { color: colors.foreground }]}
            >
              Modo de Pagamento
            </Text>
            <Text
              style={[styles.confirmMensagem, { color: colors.muted }]}
            >
              Selecione como o valor será calculado:
            </Text>

            <View style={styles.paymentModesContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.paymentModeButton,
                  {
                    backgroundColor: paymentMode === "meta" ? colors.primary : colors.surface,
                    borderColor: paymentMode === "meta" ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={async () => {
                  haptic();
                  await setPaymentMode("meta", mes, ano);
                  setShowPaymentModes(false);
                }}
              >
                <Text
                  style={[
                    styles.paymentModeLabel,
                    { color: paymentMode === "meta" ? "#fff" : colors.foreground },
                  ]}
                >
                  Meta Progressiva
                </Text>
                <Text
                  style={[
                    styles.paymentModeDesc,
                    { color: paymentMode === "meta" ? "rgba(255,255,255,0.8)" : colors.muted },
                  ]}
                >
                  &lt; 104: R$ 65 | ≥ 104: R$ 70
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.paymentModeButton,
                  {
                    backgroundColor: paymentMode === "fixo65" ? colors.primary : colors.surface,
                    borderColor: paymentMode === "fixo65" ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={async () => {
                  haptic();
                  await setPaymentMode("fixo65", mes, ano);
                  setShowPaymentModes(false);
                }}
              >
                <Text
                  style={[
                    styles.paymentModeLabel,
                    { color: paymentMode === "fixo65" ? "#fff" : colors.foreground },
                  ]}
                >
                  Fixo R$ 65
                </Text>
                <Text
                  style={[
                    styles.paymentModeDesc,
                    { color: paymentMode === "fixo65" ? "rgba(255,255,255,0.8)" : colors.muted },
                  ]}
                >
                  Todas as instalações
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.paymentModeButton,
                  {
                    backgroundColor: paymentMode === "fixo70" ? colors.primary : colors.surface,
                    borderColor: paymentMode === "fixo70" ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={async () => {
                  haptic();
                  await setPaymentMode("fixo70", mes, ano);
                  setShowPaymentModes(false);
                }}
              >
                <Text
                  style={[
                    styles.paymentModeLabel,
                    { color: paymentMode === "fixo70" ? "#fff" : colors.foreground },
                  ]}
                >
                  Fixo R$ 70
                </Text>
                <Text
                  style={[
                    styles.paymentModeDesc,
                    { color: paymentMode === "fixo70" ? "rgba(255,255,255,0.8)" : colors.muted },
                  ]}
                >
                  Todas as instalações
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.botaoCancelar,
                {
                  backgroundColor: colors.muted,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => setShowPaymentModes(false)}
            >
              <Text style={styles.botaoCancelarTexto}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação de Limpeza */}
      <Modal
        visible={confirmandoLimpeza}
        animationType="fade"
        transparent
        onRequestClose={fecharConfirmacaoLimpeza}
      >
        <View style={styles.confirmOverlay}>
          <View
            style={[
              styles.confirmContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.confirmTitulo, { color: colors.foreground }]}
            >
              Limpar Todos os Dados
            </Text>
            <Text
              style={[styles.confirmMensagem, { color: colors.muted }]}
            >
              Isso apagará permanentemente todas as {instalacoes.length} instalações cadastradas.
            </Text>
            <Text
              style={[styles.confirmAviso, { color: colors.error }]}
            >
              Esta ação não pode ser desfeita.
            </Text>

            <View style={styles.confirmBotoes}>
              <Pressable
                style={({ pressed }) => [
                  styles.botaoCancelar,
                  {
                    backgroundColor: colors.muted,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={fecharConfirmacaoLimpeza}
                disabled={limpando}
              >
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.botaoLimpar,
                  {
                    backgroundColor: limpando ? colors.muted : colors.error,
                    opacity: pressed ? 0.85 : 1,
                    transform: pressed ? [{ scale: 0.97 }] : [],
                  },
                ]}
                onPress={executarLimpeza}
                disabled={limpando}
              >
                {limpando ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.botaoLimparTexto}>Limpar Tudo</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Edição de Meta */}
      <Modal
        visible={editandoMeta}
        animationType="fade"
        transparent
        onRequestClose={() => setEditandoMeta(false)}
      >
        <View style={styles.confirmOverlay}>
          <View
            style={[
              styles.confirmContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.confirmTitulo, { color: colors.foreground }]}>
              Editar Meta Mensal
            </Text>
            <Text style={[styles.confirmMensagem, { color: colors.muted }]}>
              Digite a nova meta de instalações para o mês:
            </Text>

            <View style={styles.metaInputContainer}>
              <TextInput
                style={[
                  styles.metaInput,
                  { color: colors.foreground, borderColor: colors.border },
                ]}
                placeholder="Digite a meta"
                placeholderTextColor={colors.muted}
                value={novaMetaInput}
                onChangeText={setNovaMetaInput}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.confirmBotoes}>
              <Pressable
                style={({ pressed }) => [
                  styles.botaoCancelar,
                  {
                    backgroundColor: colors.muted,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => {
                  setEditandoMeta(false);
                  setNovaMetaInput(monthlyGoal.toString());
                }}
              >
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.botaoConfirmar,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={async () => {
                  const novaMeta = parseInt(novaMetaInput);
                  if (isNaN(novaMeta) || novaMeta < 1) {
                    Alert.alert("Erro", "Digite um número válido maior que 0");
                    return;
                  }
                  hapticSuccess();
                  await setMonthlyGoal(novaMeta, mes, ano);
                  setEditandoMeta(false);
                  Alert.alert("Sucesso", `Meta atualizada para ${novaMeta} instalações`);
                }}
              >
                <Text style={styles.botaoConfirmarTexto}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Agenda de Trabalho */}
      <Modal
        visible={editandoAgenda}
        animationType="fade"
        transparent
        onRequestClose={() => setEditandoAgenda(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitulo, { color: colors.foreground }]}>
              Dias de Trabalho
            </Text>
            <Text style={[styles.modalSubtitulo, { color: colors.muted }]}>
              Selecione os dias em que você trabalha
            </Text>

            <View style={styles.diasGrid}>
              {dayNames.map((dia, idx) => {
                const dayOfWeek = idx as DayOfWeek;
                const isSelected = diasSelecionados.includes(dayOfWeek);
                const isWeekend = idx === 5 || idx === 6;

                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      haptic();
                      if (isSelected) {
                        setDiasSelecionados(
                          diasSelecionados.filter((d) => d !== dayOfWeek)
                        );
                      } else {
                        setDiasSelecionados([...diasSelecionados, dayOfWeek]);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.diaButton,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isWeekend
                          ? colors.surface
                          : colors.surface,
                        borderColor: isWeekend ? colors.error : colors.border,
                        borderWidth: isWeekend ? 2 : 1,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.diaButtonText,
                        {
                          color: isSelected ? "#fff" : colors.foreground,
                          fontWeight: isSelected ? "600" : "500",
                        },
                      ]}
                    >
                      {dia.substring(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.confirmBotoes}>
              <Pressable
                style={({ pressed }) => [
                  styles.botaoCancelar,
                  {
                    backgroundColor: colors.muted,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => {
                  setEditandoAgenda(false);
                  setDiasSelecionados(workSchedule.workDays);
                }}
              >
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.botaoConfirmar,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={async () => {
                  if (diasSelecionados.length === 0) {
                    Alert.alert("Erro", "Selecione pelo menos um dia de trabalho");
                    return;
                  }
                  hapticSuccess();
                  await workSchedule.setWorkDays(diasSelecionados);
                  setEditandoAgenda(false);
                  Alert.alert("Sucesso", "Agenda de trabalho atualizada!");
                }}
              >
                <Text style={styles.botaoConfirmarTexto}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.secao}>
      <Text style={[styles.secaoTitulo, { color: colors.muted }]}>
        {titulo.toUpperCase()}
      </Text>
      <View
        style={[
          styles.secaoCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Divisor() {
  const colors = useColors();
  return (
    <View
      style={[styles.divisor, { backgroundColor: colors.border }]}
    />
  );
}

function ItemConfig({
  icone,
  label,
  sublabel,
  direita,
  onPress,
  desabilitado,
  cor,
}: {
  icone: string;
  label: string;
  sublabel?: string;
  direita?: React.ReactNode;
  onPress?: () => void;
  desabilitado?: boolean;
  cor?: "error";
}) {
  const colors = useColors();
  const corLabel = cor === "error" ? colors.error : colors.foreground;

  const conteudo = (
    <View style={styles.itemConfig}>
      <Text style={styles.itemIcone}>{icone}</Text>
      <View style={styles.itemTextos}>
        <Text
          style={[
            styles.itemLabel,
            { color: desabilitado ? colors.muted : corLabel },
          ]}
        >
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.itemSublabel, { color: colors.muted }]}>
            {sublabel}
          </Text>
        )}
      </View>
      {direita && <View style={styles.itemDireita}>{direita}</View>}
      {onPress && !direita && (
        <Text style={[styles.itemSeta, { color: colors.muted }]}>›</Text>
      )}
    </View>
  );

  if (!onPress) return conteudo;

  return (
    <Pressable
      style={({ pressed }) => [pressed && { opacity: 0.6 }]}
      onPress={() => {
        if (!desabilitado) {
          haptic();
          onPress();
        }
      }}
      disabled={desabilitado}
    >
      {conteudo}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  secao: {
    marginBottom: 20,
  },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  secaoCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  divisor: {
    height: 1,
    marginLeft: 52,
  },
  itemConfig: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemIcone: {
    fontSize: 20,
    width: 36,
  },
  itemTextos: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  itemSublabel: {
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
  },
  itemDireita: {
    marginLeft: 8,
  },
  itemSeta: {
    fontSize: 22,
    fontWeight: "300",
    marginLeft: 8,
  },
  infoContainer: {
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  infoTexto: {
    fontSize: 12,
  },
  // Modal de Confirmação
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  confirmContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmTitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmMensagem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  confirmAviso: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  confirmBotoes: {
    flexDirection: "row",
    gap: 12,
  },
  botaoCancelar: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoCancelarTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  botaoLimpar: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  botaoLimparTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  paymentModesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  paymentModeButton: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
  },
  paymentModeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentModeDesc: {
    fontSize: 12,
    fontWeight: "400",
  },
  metaInputContainer: {
    marginBottom: 20,
  },
  metaInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  botaoConfirmar: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoConfirmarTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitulo: {
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center",
  },
  diasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
    justifyContent: "center",
  },
  diaButton: {
    width: "30%",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  diaButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
