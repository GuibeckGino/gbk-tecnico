import { PDFDocument, rgb } from "pdf-lib";
// @ts-ignore
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { Installation } from "@/types/installation";

interface RelatorioMensalParams {
  mes: number; // 0-11
  ano: number;
  instalacoes: Installation[];
  valorIndividual: number;
  valorTotal: number;
}

const nomesMeses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export async function gerarRelatorioPDF(
  params: RelatorioMensalParams
): Promise<void> {
  const { mes, ano, instalacoes, valorIndividual, valorTotal } = params;
  const mesNome = nomesMeses[mes];

  // Criar documento PDF
  const pdfDoc = await PDFDocument.create();
  const page = (pdfDoc as any).addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  let y = height - 40;
  const margin = 40;
  const lineHeight = 14;

  // Título
  page.drawText(`GBK Técnico - Relatório de ${mesNome}/${ano}`, {
    x: margin,
    y,
    size: 20,
    color: rgb(0.1, 0.3, 0.7),
  });
  y -= 30;

  // Data de geração
  page.drawText(
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    {
      x: margin,
      y,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    }
  );
  y -= 25;

  // Resumo
  page.drawText("RESUMO DO MÊS", {
    x: margin,
    y,
    size: 14,
    color: rgb(0.1, 0.3, 0.7),
  });
  y -= 18;

  page.drawText(`Total de Instalações: ${instalacoes.length}`, {
    x: margin,
    y,
    size: 11,
  });
  y -= lineHeight;

  page.drawText(`Valor por Instalação: R$ ${valorIndividual}`, {
    x: margin,
    y,
    size: 11,
  });
  y -= lineHeight;

  page.drawText(`Valor Total a Receber: R$ ${valorTotal.toLocaleString("pt-BR")}`, {
    x: margin,
    y,
    size: 12,
    color: rgb(0, 0.6, 0),
  });
  y -= 25;

  // Contagem por tipo
  const porTipo = {
    instalacao: instalacoes.filter((i) => i.tipoServico === "Instalação")
      .length,
    tipo3: instalacoes.filter((i) => i.tipoServico === "Tipo 3").length,
    mudanca: instalacoes.filter((i) => i.tipoServico === "Mudança").length,
  };

  page.drawText("POR TIPO DE SERVIÇO", {
    x: margin,
    y,
    size: 12,
    color: rgb(0.1, 0.3, 0.7),
  });
  y -= 16;

  page.drawText(`  • Instalação: ${porTipo.instalacao}`, {
    x: margin,
    y,
    size: 10,
  });
  y -= lineHeight;

  page.drawText(`  • Tipo 3: ${porTipo.tipo3}`, {
    x: margin,
    y,
    size: 10,
  });
  y -= lineHeight;

  page.drawText(`  • Mudança: ${porTipo.mudanca}`, {
    x: margin,
    y,
    size: 10,
  });
  y -= 25;

  // Lista de instalações
  page.drawText("LISTA DE INSTALAÇÕES", {
    x: margin,
    y,
    size: 12,
    color: rgb(0.1, 0.3, 0.7),
  });
  y -= 16;

  // Cabeçalho da tabela
  const colWidths = {
    num: 30,
    cliente: 150,
    endereco: 150,
    tipo: 80,
    data: 70,
  };

  const headerY = y;
  page.drawText("#", { x: margin, y: headerY, size: 9, color: rgb(1, 1, 1) });
  page.drawText("Cliente", {
    x: margin + colWidths.num,
    y: headerY,
    size: 9,
    color: rgb(1, 1, 1),
  });
  page.drawText("Endereço", {
    x: margin + colWidths.num + colWidths.cliente,
    y: headerY,
    size: 9,
    color: rgb(1, 1, 1),
  });
  page.drawText("Tipo", {
    x: margin + colWidths.num + colWidths.cliente + colWidths.endereco,
    y: headerY,
    size: 9,
    color: rgb(1, 1, 1),
  });
  page.drawText("Data", {
    x:
      margin +
      colWidths.num +
      colWidths.cliente +
      colWidths.endereco +
      colWidths.tipo,
    y: headerY,
    size: 9,
    color: rgb(1, 1, 1),
  });

  // Fundo do cabeçalho
  page.drawRectangle({
    x: margin - 5,
    y: headerY - 12,
    width: width - 2 * margin + 10,
    height: 16,
    color: rgb(0.1, 0.3, 0.7),
  });

  y -= 20;

  // Linhas da tabela
  instalacoes.forEach((inst, idx) => {
    if (y < margin + 20) {
      // Nova página se necessário
      y = height - margin;
      const newPage = (pdfDoc as any).addPage([595, 842]);
      page.drawText(`${mesNome}/${ano} (continuação)`, {
        x: margin,
        y,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 20;
    }

    const rowNum = (idx + 1).toString();
    const clienteTrunc = inst.cliente.substring(0, 20);
    const enderecoTrunc = inst.endereco.substring(0, 20);

    page.drawText(rowNum, { x: margin, y, size: 9 });
    page.drawText(clienteTrunc, {
      x: margin + colWidths.num,
      y,
      size: 9,
    });
    page.drawText(enderecoTrunc, {
      x: margin + colWidths.num + colWidths.cliente,
      y,
      size: 9,
    });
    page.drawText(inst.tipoServico, {
      x: margin + colWidths.num + colWidths.cliente + colWidths.endereco,
      y,
      size: 9,
    });
    page.drawText(inst.data, {
      x:
        margin +
        colWidths.num +
        colWidths.cliente +
        colWidths.endereco +
        colWidths.tipo,
      y,
      size: 9,
    });

    y -= lineHeight + 2;
  });

  // Salvar e compartilhar
  const pdfBytes = await (pdfDoc as any).save();
  const base64 = Buffer.from(pdfBytes as any).toString("base64");
  const uri = `${FileSystem.documentDirectory}gbk_relatorio_${mesNome}_${ano}.pdf`;

  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Relatório ${mesNome}/${ano}`,
    });
  }
}
