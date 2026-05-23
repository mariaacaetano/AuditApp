/**
 * useRelatorioPDF
 * Gera um PDF completo de uma auditoria usando jsPDF (sem html2canvas).
 * Instale: npm install jspdf
 */

import { useCallback, useState } from "react";

const BASE = "http://localhost:8000/controles";
const NORMA_SLUG = { "ISO 27002": "27002", "ISO 27701": "27701" };

const COR = {
  primaria: [107, 15, 43],      // #6B0F2B
  verde: [20, 83, 45],          // #14532d
  vermelho: [127, 29, 29],      // #7f1d1d
  amarelo: [120, 53, 15],       // #78350f
  cinzaClaro: [245, 245, 245],
  cinzaMedio: [200, 200, 200],
  cinzaEscuro: [100, 100, 100],
  branco: [255, 255, 255],
  preto: [30, 30, 30],
};

const SITUACAO_LABEL = {
  CONFORME: "Conforme",
  NAO_CONFORME: "Não Conforme",
  NAO_APLICA: "Não Aplica",
  PENDENTE: "Pendente",
};

const SITUACAO_COR = {
  CONFORME: COR.verde,
  NAO_CONFORME: COR.vermelho,
  NAO_APLICA: COR.amarelo,
  PENDENTE: COR.primaria,
};

function token() {
  return localStorage.getItem("access_token");
}

async function carregarRespostas(idAuditoria, norma) {
  const slug = NORMA_SLUG[norma] || "27002";
  const resp = await fetch(`${BASE}/auditoria/${idAuditoria}/${slug}/respostas/`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!resp.ok) throw new Error("Falha ao carregar respostas");
  return resp.json();
}

function calcularMetricas(controles) {
  const total = controles.length;
  const conformes = controles.filter(c => c.resposta?.situacao === "CONFORME").length;
  const naoConformes = controles.filter(c => c.resposta?.situacao === "NAO_CONFORME").length;
  const naoAplica = controles.filter(c => c.resposta?.situacao === "NAO_APLICA").length;
  const respondidos = controles.filter(c => c.resposta?.situacao).length;
  const pendentes = total - respondidos;
  const avaliados = total - naoAplica;
  const progresso = total ? Math.round((respondidos / total) * 100) : 0;
  const maturidade = avaliados ? Math.round((conformes / avaliados) * 100) : 0;
  return { total, conformes, naoConformes, naoAplica, pendentes, avaliados, progresso, maturidade };
}

function getTiposControle(item) {
  const controle = item.controle || {};
  const tipos = [
    ...(controle.tipos_controle || []),
    ...(controle.tipos_controle_anexo || []),
  ];

  if (tipos.length === 0) return ["Sem tipo definido"];
  return tipos.map(tipo => tipo.nome || tipo.descricao || "Sem tipo definido");
}

function getAtributosControle(item) {
  const atributos = item.controle?.atributos_anexos || [];
  if (atributos.length === 0) return ["Sem atributo definido"];
  return atributos.map(atributo => atributo.nome || atributo.descricao || "Sem atributo definido");
}

function getControleTags(item, fieldName, fallback) {
  const values = item.controle?.[fieldName] || [];
  if (values.length === 0) return [fallback];
  return values.map(value => value.nome || value.descricao || fallback);
}

function caracteristicasDaNorma(auditoria) {
  const norma = String(auditoria?.norma || "").toLowerCase();
  const is27701 = norma.includes("27701");

  if (is27701) {
    return [
      { titulo: "Tipos de controle", getValores: getTiposControle },
      { titulo: "Atributos do Anexo", getValores: getAtributosControle },
    ];
  }

  return [
    { titulo: "Domínios de segurança", getValores: item => getControleTags(item, "dominios_seguranca", "Sem domínio definido") },
    { titulo: "Conceitos de SI", getValores: item => getControleTags(item, "conceitos_si", "Sem conceito definido") },
    { titulo: "Temas de controle", getValores: item => getControleTags(item, "temas_controle", "Sem tema definido") },
    { titulo: "Capacidades operacionais", getValores: item => getControleTags(item, "capacidades_operacionais", "Sem capacidade definida") },
    { titulo: "Propriedades de SI", getValores: item => getControleTags(item, "propriedades_si", "Sem propriedade definida") },
    { titulo: "Tipos de controle", getValores: getTiposControle },
  ];
}

function agruparPorCaracteristica(controles, getValores) {
  const grupos = new Map();

  controles.forEach(item => {
    getValores(item).forEach(valor => {
      const key = String(valor || "Sem classificação").trim() || "Sem classificação";
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key).push(item);
    });
  });

  return Array.from(grupos.entries())
    .map(([tipo, itens]) => ({
      tipo,
      controles: itens,
      metricas: calcularMetricas(itens),
    }))
    .sort((a, b) => b.metricas.maturidade - a.metricas.maturidade || b.controles.length - a.controles.length);
}

// ---------------------------------------------------------------------------
// Utilitários de desenho PDF
// ---------------------------------------------------------------------------

function rgbFill(doc, cor) {
  doc.setFillColor(...cor);
}

function rgbText(doc, cor) {
  doc.setTextColor(...cor);
}

function rgbDraw(doc, cor) {
  doc.setDrawColor(...cor);
}

function addPage(doc) {
  doc.addPage();
  return 20; // margem inicial y
}

/**
 * Verifica se há espaço suficiente; se não, adiciona nova página.
 * Retorna o y atual (possivelmente na nova página).
 */
function garantirEspaco(doc, y, altura, pageH, margem = 20) {
  if (y + altura > pageH - margem) {
    return addPage(doc);
  }
  return y;
}

function titulo(doc, text, x, y, tamanho = 13) {
  doc.setFontSize(tamanho);
  doc.setFont("helvetica", "bold");
  rgbText(doc, COR.primaria);
  doc.text(text, x, y);
}

function subtitulo(doc, text, x, y, tamanho = 10) {
  doc.setFontSize(tamanho);
  doc.setFont("helvetica", "bold");
  rgbText(doc, COR.preto);
  doc.text(text, x, y);
}

function corpo(doc, text, x, y, tamanho = 9, cor = COR.preto) {
  doc.setFontSize(tamanho);
  doc.setFont("helvetica", "normal");
  rgbText(doc, cor);
  doc.text(text, x, y);
}

function linhaHorizontal(doc, x1, x2, y, cor = COR.cinzaMedio) {
  rgbDraw(doc, cor);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x2, y);
}

function barraProgresso(doc, x, y, largura, altura, valor, corBarra) {
  // fundo
  rgbFill(doc, COR.cinzaClaro);
  rgbDraw(doc, COR.cinzaMedio);
  doc.setLineWidth(0.2);
  doc.rect(x, y, largura, altura, "FD");
  // preenchimento
  if (valor > 0) {
    rgbFill(doc, corBarra);
    doc.setLineWidth(0);
    doc.rect(x, y, (largura * Math.min(valor, 100)) / 100, altura, "F");
  }
}

function desenharTotalizadoresDashboard(doc, metricas, pageW, y) {
  subtitulo(doc, "Totalizadores do dashboard", 20, y);
  y += 6;

  const totalizadores = [
    { label: "Total de controles", valor: metricas.total },
    { label: "Controles avaliados", valor: metricas.avaliados },
    { label: "Respondidos", valor: metricas.total - metricas.pendentes },
    { label: "Progresso", valor: `${metricas.progresso}%` },
    { label: "Maturidade", valor: `${metricas.maturidade}%` },
    { label: "Conformes", valor: metricas.conformes },
    { label: "Não conformes", valor: metricas.naoConformes },
    { label: "Não aplica", valor: metricas.naoAplica },
    { label: "Pendentes", valor: metricas.pendentes },
  ];
  const colunas = 3;
  const gap = 5;
  const cardW = (pageW - 40 - gap * (colunas - 1)) / colunas;
  const cardH = 16;

  totalizadores.forEach((item, index) => {
    const coluna = index % colunas;
    const linha = Math.floor(index / colunas);
    const x = 20 + coluna * (cardW + gap);
    const cardY = y + linha * (cardH + 4);

    rgbFill(doc, COR.cinzaClaro);
    rgbDraw(doc, COR.cinzaMedio);
    doc.roundedRect(x, cardY, cardW, cardH, 1.5, 1.5, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    rgbText(doc, COR.cinzaEscuro);
    doc.text(item.label, x + 4, cardY + 5);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    rgbText(doc, COR.primaria);
    doc.text(String(item.valor), x + 4, cardY + 12);
  });

  return y + 3 * (cardH + 4) + 2;
}

// ---------------------------------------------------------------------------
// Seções do PDF
// ---------------------------------------------------------------------------

function desenharCapa(doc, auditoria, metricas, pageW, pageH) {
  // Faixa de topo
  rgbFill(doc, COR.primaria);
  doc.rect(0, 0, pageW, 52, "F");

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  rgbText(doc, COR.branco);
  doc.text("Relatório de Auditoria", 20, 22);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const nomeAuditoria = auditoria.nome || `Auditoria #${auditoria.id_auditoria}`;
  doc.text(nomeAuditoria, 20, 34);
  doc.text(`${auditoria.empresa || ""} · ${auditoria.norma || ""} · ${auditoria.data_auditoria || ""}`, 20, 43);

  // Cards de métricas
  const cardY = 66;
  const cardH = 28;
  const cardW = (pageW - 40 - 15) / 4;
  const cards = [
    { label: "Maturidade", valor: `${metricas.maturidade}%`, cor: COR.primaria },
    { label: "Conformes", valor: metricas.conformes, cor: COR.verde },
    { label: "Não Conformes", valor: metricas.naoConformes, cor: COR.vermelho },
    { label: "Pendentes", valor: metricas.pendentes, cor: COR.amarelo },
  ];
  cards.forEach((card, i) => {
    const x = 20 + i * (cardW + 5);
    rgbFill(doc, card.cor);
    doc.roundedRect(x, cardY, cardW, cardH, 2, 2, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    rgbText(doc, COR.branco);
    doc.text(String(card.valor), x + cardW / 2, cardY + 14, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(card.label, x + cardW / 2, cardY + 22, { align: "center" });
  });

  // Barra de progresso geral
  let y = cardY + cardH + 14;
  subtitulo(doc, "Progresso da auditoria", 20, y);
  y += 5;
  barraProgresso(doc, 20, y, pageW - 40, 6, metricas.progresso, COR.primaria);
  corpo(doc, `${metricas.progresso}%  (${metricas.total - metricas.pendentes} de ${metricas.total} respondidos)`, 20, y + 10);

  y += 20;
  linhaHorizontal(doc, 20, pageW - 20, y);

  y += 10;
  y = desenharTotalizadoresDashboard(doc, metricas, pageW, y);
  linhaHorizontal(doc, 20, pageW - 20, y);

  // Resumo distribuição
  y += 10;
  subtitulo(doc, "Distribuição das respostas", 20, y);
  y += 7;
  const itens = [
    { label: "Conformes", valor: metricas.conformes, cor: COR.verde },
    { label: "Não Conformes", valor: metricas.naoConformes, cor: COR.vermelho },
    { label: "Não Aplica", valor: metricas.naoAplica, cor: COR.amarelo },
    { label: "Pendentes", valor: metricas.pendentes, cor: COR.primaria },
  ];
  const barW = pageW - 40;
  itens.forEach(item => {
    corpo(doc, item.label, 20, y + 3, 8, COR.cinzaEscuro);
    barraProgresso(doc, 65, y - 1, barW - 80, 5, metricas.total ? (item.valor / metricas.total) * 100 : 0, item.cor);
    corpo(doc, `${item.valor}`, pageW - 20, y + 3, 8, COR.preto);
    doc.setFont("helvetica", "normal");
    y += 8;
  });

  return y + 6;
}

function desenharSecaoControles(doc, controles, pageW, pageH) {
  let y = addPage(doc);

  titulo(doc, "Controles e Respostas", 20, y, 14);
  y += 10;
  linhaHorizontal(doc, 20, pageW - 20, y);
  y += 8;

  for (const item of controles) {
    const situacao = item.resposta?.situacao || "PENDENTE";
    const corSituacao = SITUACAO_COR[situacao] || COR.cinzaEscuro;
    const labelSituacao = SITUACAO_LABEL[situacao] || situacao;
    const indice = item.controle?.indice || item.controle?.indice_norma || "";
    const tituloControle = item.controle?.titulo || "";
    const observacoes = item.resposta?.observacoes || "";
    const justificativa = item.resposta?.justificativa || "";
    const evidencias = item.evidencias || [];

    // Estimar altura necessária
    const linhasObs = observacoes ? Math.ceil(observacoes.length / 90) : 0;
    const linhasJust = justificativa ? Math.ceil(justificativa.length / 90) : 0;
    const alturaEstimada = 14 + (linhasObs + linhasJust) * 5 + evidencias.length * 5 + 10;

    y = garantirEspaco(doc, y, alturaEstimada, pageH);

    // Cabeçalho do controle
    rgbFill(doc, COR.cinzaClaro);
    doc.rect(20, y - 4, pageW - 40, 10, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    rgbText(doc, COR.preto);
    doc.text(`${indice}  ${tituloControle}`.substring(0, 90), 23, y + 2);

    // Badge situação
    rgbFill(doc, corSituacao);
    doc.roundedRect(pageW - 55, y - 3, 34, 8, 1.5, 1.5, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    rgbText(doc, COR.branco);
    doc.text(labelSituacao, pageW - 38, y + 2, { align: "center" });

    y += 10;

    // Observações
    if (observacoes) {
      corpo(doc, "Observações:", 23, y, 8, COR.cinzaEscuro);
      y += 5;
      const linhas = doc.splitTextToSize(observacoes, pageW - 46);
      linhas.slice(0, 4).forEach(linha => {
        y = garantirEspaco(doc, y, 5, pageH);
        corpo(doc, linha, 23, y, 8);
        y += 5;
      });
    }

    // Justificativa
    if (justificativa) {
      corpo(doc, "Justificativa:", 23, y, 8, COR.cinzaEscuro);
      y += 5;
      const linhas = doc.splitTextToSize(justificativa, pageW - 46);
      linhas.slice(0, 4).forEach(linha => {
        y = garantirEspaco(doc, y, 5, pageH);
        corpo(doc, linha, 23, y, 8);
        y += 5;
      });
    }

    // Evidências
    if (evidencias.length > 0) {
      corpo(doc, `Evidências (${evidencias.length}):`, 23, y, 8, COR.cinzaEscuro);
      y += 5;
      evidencias.forEach(ev => {
        y = garantirEspaco(doc, y, 5, pageH);
        corpo(doc, `• ${ev.descricao || "Sem descrição"}`, 27, y, 7, COR.cinzaEscuro);
        y += 5;
      });
    }

    linhaHorizontal(doc, 20, pageW - 20, y, COR.cinzaClaro);
    y += 6;
  }

  return y;
}

function desenharBlocoGrupoCaracteristica(doc, grupo, y, pageW, pageH) {
  y = garantirEspaco(doc, y, 38, pageH);

  rgbFill(doc, COR.primaria);
  doc.roundedRect(20, y - 5, pageW - 40, 12, 1.5, 1.5, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  rgbText(doc, COR.branco);
  const tipoLinhas = doc.splitTextToSize(grupo.tipo, pageW - 48);
  doc.text(tipoLinhas[0], 24, y + 2);
  y += 14;

  const resumo = [
    `Maturidade ${grupo.metricas.maturidade}%`,
    `${grupo.metricas.conformes} conformes`,
    `${grupo.metricas.naoConformes} nao conformes`,
    `${grupo.metricas.naoAplica} nao aplica`,
    `${grupo.metricas.pendentes} pendentes`,
  ].join(" · ");
  corpo(doc, resumo, 24, y, 8, COR.cinzaEscuro);
  y += 6;
  barraProgresso(doc, 24, y, pageW - 48, 5, grupo.metricas.maturidade, COR.verde);
  y += 12;

  grupo.controles.forEach(item => {
    const situacao = item.resposta?.situacao || "PENDENTE";
    const corSituacao = SITUACAO_COR[situacao] || COR.cinzaEscuro;
    const labelSituacao = SITUACAO_LABEL[situacao] || situacao;
    const indice = item.controle?.indice || item.controle?.indice_norma || "";
    const tituloControle = item.controle?.titulo || "";
    const observacoes = item.resposta?.observacoes || "";
    const justificativa = item.resposta?.justificativa || "";
    const evidencias = item.evidencias || [];

    const linhasTitulo = doc.splitTextToSize(`${indice}  ${tituloControle}`, pageW - 88);
    const linhasObs = observacoes ? doc.splitTextToSize(observacoes, pageW - 52).slice(0, 3) : [];
    const linhasJust = justificativa ? doc.splitTextToSize(justificativa, pageW - 52).slice(0, 3) : [];
    const alturaEstimada = 16 + (linhasTitulo.length * 4) + (linhasObs.length * 5) + (linhasJust.length * 5) + Math.min(evidencias.length, 3) * 5;

    y = garantirEspaco(doc, y, alturaEstimada, pageH);

    rgbFill(doc, COR.cinzaClaro);
    doc.rect(24, y - 4, pageW - 48, 10 + Math.max(0, linhasTitulo.length - 1) * 4, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    rgbText(doc, COR.preto);
    linhasTitulo.forEach((linha, index) => {
      doc.text(linha, 27, y + 2 + index * 4);
    });

    rgbFill(doc, corSituacao);
    doc.roundedRect(pageW - 57, y - 3, 34, 8, 1.5, 1.5, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    rgbText(doc, COR.branco);
    doc.text(labelSituacao, pageW - 40, y + 2, { align: "center" });

    y += 10 + Math.max(0, linhasTitulo.length - 1) * 4;

    if (linhasObs.length > 0) {
      corpo(doc, "Observacoes:", 27, y, 8, COR.cinzaEscuro);
      y += 5;
      linhasObs.forEach(linha => {
        y = garantirEspaco(doc, y, 5, pageH);
        corpo(doc, linha, 27, y, 8);
        y += 5;
      });
    }

    if (linhasJust.length > 0) {
      corpo(doc, "Justificativa:", 27, y, 8, COR.cinzaEscuro);
      y += 5;
      linhasJust.forEach(linha => {
        y = garantirEspaco(doc, y, 5, pageH);
        corpo(doc, linha, 27, y, 8);
        y += 5;
      });
    }

    if (evidencias.length > 0) {
      corpo(doc, `Evidencias (${evidencias.length}):`, 27, y, 8, COR.cinzaEscuro);
      y += 5;
      evidencias.slice(0, 3).forEach(ev => {
        y = garantirEspaco(doc, y, 5, pageH);
        corpo(doc, `- ${ev.descricao || "Sem descricao"}`, 31, y, 7, COR.cinzaEscuro);
        y += 5;
      });
    }

    linhaHorizontal(doc, 24, pageW - 24, y, COR.cinzaClaro);
    y += 6;
  });

  return y + 4;
}

function desenharSecaoCaracteristicas(doc, auditoria, controles, pageW, pageH) {
  const caracteristicas = caracteristicasDaNorma(auditoria);
  let y = addPage(doc);

  titulo(doc, "Relatório por características da norma", 20, y, 14);
  y += 7;
  corpo(doc, "Os controles abaixo foram agrupados conforme as características aplicáveis a esta norma.", 20, y, 8, COR.cinzaEscuro);
  y += 8;
  linhaHorizontal(doc, 20, pageW - 20, y);
  y += 8;

  caracteristicas.forEach(caracteristica => {
    const grupos = agruparPorCaracteristica(controles, caracteristica.getValores);

    y = garantirEspaco(doc, y, 18, pageH);
    subtitulo(doc, caracteristica.titulo, 20, y, 11);
    y += 8;

    grupos.forEach(grupo => {
      y = desenharBlocoGrupoCaracteristica(doc, grupo, y, pageW, pageH);
    });
  });

  return y;
}

function desenharSecaoComparativo(doc, comparativo, pageW, pageH) {
  if (!comparativo || comparativo.length < 2) return;

  let y = addPage(doc);
  titulo(doc, "Comparativo com auditorias anteriores", 20, y, 14);
  y += 10;
  linhaHorizontal(doc, 20, pageW - 20, y);
  y += 8;

  const colW = (pageW - 40) / comparativo.length;

  // Cabeçalhos
  comparativo.forEach((item, i) => {
    const x = 20 + i * colW;
    const isAtual = item.atual;
    if (isAtual) {
      rgbFill(doc, COR.primaria);
      doc.rect(x, y - 4, colW - 2, 10, "F");
      rgbText(doc, COR.branco);
    } else {
      rgbFill(doc, COR.cinzaClaro);
      doc.rect(x, y - 4, colW - 2, 10, "F");
      rgbText(doc, COR.preto);
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const nomeAuditoria = isAtual
      ? "Atual"
      : (item.auditoria.nome || `#${item.auditoria.id_auditoria}`);
    doc.text(nomeAuditoria.length > 18 ? `${nomeAuditoria.slice(0, 18)}...` : nomeAuditoria, x + colW / 2, y + 2, { align: "center" });
  });
  y += 10;

  // Linhas de métricas
  const linhas = [
    { label: "Data", fn: item => item.auditoria.data_auditoria || "-" },
    { label: "Maturidade", fn: item => `${item.metricas.maturidade}%` },
    { label: "Progresso", fn: item => `${item.metricas.progresso}%` },
    { label: "Conformes", fn: item => String(item.metricas.conformes) },
    { label: "Não Conformes", fn: item => String(item.metricas.naoConformes) },
    { label: "Não Aplica", fn: item => String(item.metricas.naoAplica) },
    { label: "Pendentes", fn: item => String(item.metricas.pendentes) },
    { label: "Total controles", fn: item => String(item.metricas.total) },
  ];

  linhas.forEach((linha, li) => {
    y = garantirEspaco(doc, y, 8, pageH);
    if (li % 2 === 0) {
      rgbFill(doc, COR.cinzaClaro);
      doc.rect(20, y - 4, pageW - 40, 8, "F");
    }
    corpo(doc, linha.label, 23, y, 8, COR.cinzaEscuro);
    comparativo.forEach((item, i) => {
      const x = 20 + i * colW;
      corpo(doc, linha.fn(item), x + colW / 2, y, 8, COR.preto);
    });
    y += 8;
  });

  // Barras de maturidade
  y += 6;
  y = garantirEspaco(doc, y, 60, pageH);
  subtitulo(doc, "Maturidade por auditoria", 20, y);
  y += 8;
  const barMaxW = pageW - 40;
  comparativo.forEach(item => {
    const corBar = item.atual ? COR.primaria : COR.cinzaEscuro;
    corpo(doc, item.auditoria.nome || `#${item.auditoria.id_auditoria}`, 20, y + 3, 8, COR.cinzaEscuro);
    barraProgresso(doc, 48, y - 1, barMaxW - 30, 6, item.metricas.maturidade, corBar);
    corpo(doc, `${item.metricas.maturidade}%`, pageW - 18, y + 3, 8, COR.preto);
    y += 10;
  });
}

function adicionarRodape(doc, pageW) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    linhaHorizontal(doc, 20, pageW - 20, doc.internal.pageSize.getHeight() - 12);
    corpo(
      doc,
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} · Página ${i} de ${total}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 6,
      7,
      COR.cinzaEscuro,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    rgbText(doc, COR.cinzaEscuro);
    doc.text("Sistema de Gestão de Normas", 20, doc.internal.pageSize.getHeight() - 6);
  }
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------

export function useRelatorioPDF() {
  const [gerando, setGerando] = useState(false);

  const gerarPDF = useCallback(async ({
    auditoria,
    controles,
    comparativo = null,
    tipoRelatorio = "completo",
  }) => {
    setGerando(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      const metricas = calcularMetricas(controles);

      // Capa
      desenharCapa(doc, auditoria, metricas, pageW, pageH);

      if (tipoRelatorio === "caracteristicas") {
        desenharSecaoCaracteristicas(doc, auditoria, controles, pageW, pageH);
      } else {
        desenharSecaoControles(doc, controles, pageW, pageH);
      }

      // Comparativo (opcional)
      if (comparativo && comparativo.length > 1) {
        desenharSecaoComparativo(doc, comparativo, pageW, pageH);
      }

      // Rodapé em todas as páginas
      adicionarRodape(doc, pageW);

      const slugAuditoria = (auditoria.nome || `auditoria_${auditoria.id_auditoria}`)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const sufixoTipo = tipoRelatorio === "caracteristicas" ? "_por_caracteristicas" : "_completo";
      const nomeArquivo = `relatorio_${slugAuditoria || "auditoria"}${sufixoTipo}.pdf`
        .toLowerCase()
        .replace(/\s+/g, "_");

      doc.save(nomeArquivo);
    } finally {
      setGerando(false);
    }
  }, []);

  /**
   * Gera PDF buscando os dados necessários da API.
   * Aceita auditoria principal + lista de auditorias comparativas opcionais.
   */
  const gerarRelatorio = useCallback(async ({
    auditoria,
    contorlesJaCarregados,
    auditoriasSelecionadas = [],
    tipoRelatorio = "completo",
  }) => {
    setGerando(true);
    try {
      // Controles da auditoria principal
      const controles = contorlesJaCarregados?.length
        ? contorlesJaCarregados
        : await carregarRespostas(auditoria.id_auditoria, auditoria.norma);

      // Comparativo
      let comparativo = null;
      if (auditoriasSelecionadas.length > 0) {
        const metricas = calcularMetricas(controles);
        const historico = await Promise.all(
          auditoriasSelecionadas.map(async aud => {
            const respostas = await carregarRespostas(aud.id_auditoria, aud.norma);
            return { auditoria: aud, metricas: calcularMetricas(respostas), atual: false };
          })
        );
        comparativo = [{ auditoria, metricas, atual: true }, ...historico];
      }

      await gerarPDF({ auditoria, controles, comparativo, tipoRelatorio });
    } finally {
      setGerando(false);
    }
  }, [gerarPDF]);

  return { gerando, gerarRelatorio };
}
