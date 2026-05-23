import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { useRelatorioPDF } from "./useRelatorioPDF";
import ModalRelatorioPDF from "./ModalRelatorioPDF";
import "./relatorio-modal.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  ArrowLeft, BarChart3, CheckCircle2, ClipboardList,
  FileText, Loader2, Layers3, MinusCircle, PieChart, ShieldCheck, TimerReset, XCircle,
} from "lucide-react";


const BASE = "http://localhost:8000/controles";
const NORMA_SLUG = { "ISO 27002": "27002", "ISO 27701": "27701" };

function auditLabel(auditoria, fallback = "Auditoria") {
  if (auditoria?.nome) return auditoria.nome;
  if (auditoria?.id_auditoria) return `${fallback} #${auditoria.id_auditoria}`;
  return fallback;
}

const statusConfig = {
  CONFORME: { label: "Conformes", color: "#14532d", Icon: CheckCircle2 },
  NAO_CONFORME: { label: "Não Conformes", color: "#7f1d1d", Icon: XCircle },
  NAO_APLICA: { label: "Não Aplica", color: "#78350f", Icon: MinusCircle },
  PENDENTE: { label: "Pendentes", color: "#6B0F2B", Icon: TimerReset },
};

function MetricCard({ icon: Icon, label, value, helper, color }) {
  return (
    <article className="audit-dashboard-metric">
      <div style={{ color }} className="audit-dashboard-metric__icon">
        <Icon size={20} strokeWidth={1.7} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
    </article>
  );
}

function DistributionBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="audit-dashboard-bar" title={`${label}: ${value} de ${total || 0} (${pct}%)`}>
      <div className="audit-dashboard-bar__label">
        <span>{label}</span>
        <strong>{value} · {pct}%</strong>
      </div>
      <div className="audit-dashboard-bar__track">
        <div style={{ width: `${pct}%`, backgroundColor: color }} title={`${label}: ${pct}%`} />
      </div>
    </div>
  );
}

function maturityTone(value) {
  if (value >= 80) return "#14532d";
  if (value >= 50) return "#78350f";
  return "#7f1d1d";
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

function getCategoriaControle(item) {
  if (item.controle?.categoria) return [item.controle.categoria];
  const indice = String(item.controle?.indice || "").trim();
  const match = indice.match(/^([A-Z]\.\d+)/i);
  return [match ? match[1].toUpperCase() : "Sem categoria"];
}

function splitSvgLabel(label, maxChars = 14, maxLines = 3) {
  const words = String(label || "-").trim().split(/\s+/).filter(Boolean);
  const lines = [];

  words.forEach(word => {
    const current = lines[lines.length - 1] || "";
    const candidate = current ? `${current} ${word}` : word;
    if (!current || candidate.length <= maxChars) {
      lines[lines.length - 1] = candidate;
    } else if (lines.length < maxLines) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${word}`;
    }
  });

  return lines.length ? lines : ["-"];
}

function labelSlotWidth(labels, min = 124, max = 190) {
  const biggest = labels.reduce((size, label) => Math.max(size, String(label || "").length), 0);
  return Math.max(min, Math.min(max, biggest * 7));
}

function SvgAxisLabel({ x, y, label, maxChars = 14, maxLines = 3, className = "audit-dashboard-combo__label" }) {
  const lines = splitSvgLabel(label, maxChars, maxLines);

  return (
    <text x={x} y={y} textAnchor="middle" className={className}>
      <title>{label}</title>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : 12}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function DonutChart({ segments, label, subLabel, className }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="audit-dashboard-donut__track" cx="50" cy="50" r={radius} />
        {segments.map(segment => {
          const ratio = segment.value / total;
          const dash = ratio * circumference;
          const dashOffset = -offset;
          offset += dash;

          return (
            <circle
              key={segment.key}
              className="audit-dashboard-donut__segment"
              cx="50"
              cy="50"
              r={radius}
              stroke={segment.color}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={dashOffset}
            >
              <title>{segment.title}</title>
            </circle>
          );
        })}
      </svg>
      <span>{label}</span>
      <em>{subLabel}</em>
    </div>
  );
}

function buildMaturidadePorGrupo(controles, getGrupos) {
  const gruposMap = new Map();

  controles.forEach(item => {
    getGrupos(item).forEach(grupo => {
      const atual = gruposMap.get(grupo) || {
        label: grupo,
        total: 0,
        conformes: 0,
        naoAplica: 0,
      };
      atual.total += 1;
      if (item.resposta?.situacao === "CONFORME") atual.conformes += 1;
      if (item.resposta?.situacao === "NAO_APLICA") atual.naoAplica += 1;
      gruposMap.set(grupo, atual);
    });
  });

  return Array.from(gruposMap.values())
    .map(item => {
      const avaliados = item.total - item.naoAplica;
      return {
        ...item,
        avaliados,
        maturidade: avaliados ? Math.round((item.conformes / avaliados) * 100) : 0,
      };
    })
    .sort((a, b) => b.maturidade - a.maturidade || b.total - a.total);
}

function calcularMetricas(controles) {
  const total = controles.length;
  const conformes = controles.filter(c => c.resposta?.situacao === "CONFORME").length;
  const naoConformes = controles.filter(c => c.resposta?.situacao === "NAO_CONFORME").length;
  const naoAplica = controles.filter(c => c.resposta?.situacao === "NAO_APLICA").length;
  const respondidos = controles.filter(c => c.resposta?.situacao).length;
  const pendentes = total - respondidos;
  const controlesAvaliados = total - naoAplica;
  const progresso = total ? Math.round((respondidos / total) * 100) : 0;
  const maturidade = controlesAvaliados ? Math.round((conformes / controlesAvaliados) * 100) : 0;

  return {
    total,
    conformes,
    naoConformes,
    naoAplica,
    controlesAvaliados,
    respondidos,
    pendentes,
    progresso,
    maturidade,
    porTipo: buildMaturidadePorGrupo(controles, getTiposControle),
    porAtributo: buildMaturidadePorGrupo(controles, getAtributosControle),
    porCategoria: buildMaturidadePorGrupo(controles, getCategoriaControle),
    porPropriedade: buildMaturidadePorGrupo(controles, item => getControleTags(item, "propriedades_si", "Sem propriedade definida")),
    porConceito: buildMaturidadePorGrupo(controles, item => getControleTags(item, "conceitos_si", "Sem conceito definido")),
    porCapacidade: buildMaturidadePorGrupo(controles, item => getControleTags(item, "capacidades_operacionais", "Sem capacidade definida")),
    porDominio: buildMaturidadePorGrupo(controles, item => getControleTags(item, "dominios_seguranca", "Sem domínio definido")),
    porTema: buildMaturidadePorGrupo(controles, item => getControleTags(item, "temas_controle", "Sem tema definido")),
  };
}

function RadarChart({ items }) {
  const chartItems = items.slice(0, 8);
  const center = 118;
  const radius = 72;
  const rings = [0.33, 0.66, 1];

  if (chartItems.length < 3) {
    return (
      <div className="audit-dashboard-radar-fallback">
        {chartItems.map(item => (
          <div key={item.label} title={`${item.label}: ${item.maturidade}%`}>
            <span>{item.label}</span>
            <strong>{item.maturidade}%</strong>
          </div>
        ))}
      </div>
    );
  }

  const pointFor = (index, value = 100) => {
    const angle = (Math.PI * 2 * index) / chartItems.length - Math.PI / 2;
    const distance = radius * (value / 100);
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
      labelX: center + Math.cos(angle) * (radius + 28),
      labelY: center + Math.sin(angle) * (radius + 28),
    };
  };

  const polygon = chartItems
    .map((item, index) => {
      const point = pointFor(index, item.maturidade);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className="audit-dashboard-radar">
      <svg viewBox="0 0 236 236" role="img" aria-label="Radar de conformidade">
        {rings.map(ring => (
          <polygon
            key={ring}
            points={chartItems.map((_, index) => {
              const point = pointFor(index, ring * 100);
              return `${point.x},${point.y}`;
            }).join(" ")}
            className="audit-dashboard-radar__ring"
          />
        ))}
        {chartItems.map((_, index) => {
          const point = pointFor(index);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              className="audit-dashboard-radar__axis"
            />
          );
        })}
        <polygon points={polygon} className="audit-dashboard-radar__shape">
          <title>Maturidade por dimensão: {chartItems.map(item => `${item.label} ${item.maturidade}%`).join(", ")}</title>
        </polygon>
        {chartItems.map((item, index) => {
          const point = pointFor(index, item.maturidade);
          const label = pointFor(index);
          return (
            <g key={item.label}>
              <circle cx={point.x} cy={point.y} r="3.8" className="audit-dashboard-radar__dot">
                <title>{item.label}: {item.maturidade}%</title>
              </circle>
              <SvgAxisLabel
                x={label.labelX}
                y={label.labelY}
                label={item.label}
                maxChars={12}
                maxLines={3}
                className="audit-dashboard-radar__label"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ComparativeRadarChart({ items }) {
  const chartItems = items.slice(0, 8);
  const center = 118;
  const radius = 72;
  const rings = [0.33, 0.66, 1];

  if (chartItems.length < 3) {
    return (
      <div className="audit-dashboard-radar-fallback">
        {chartItems.map(item => (
          <div key={item.label} title={`${item.label}: atual ${item.atual}% / histórico ${item.historico}%`}>
            <span>{item.label}</span>
            <strong>{item.atual}% · {item.historico}%</strong>
          </div>
        ))}
      </div>
    );
  }

  const pointFor = (index, value = 100) => {
    const angle = (Math.PI * 2 * index) / chartItems.length - Math.PI / 2;
    const distance = radius * (value / 100);
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
      labelX: center + Math.cos(angle) * (radius + 28),
      labelY: center + Math.sin(angle) * (radius + 28),
    };
  };

  const polygonFor = key => chartItems
    .map((item, index) => {
      const point = pointFor(index, item[key]);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div className="audit-dashboard-radar audit-dashboard-radar--comparative">
      <svg viewBox="0 0 236 236" role="img" aria-label="Radar comparativo de maturidade">
        {rings.map(ring => (
          <polygon
            key={ring}
            points={chartItems.map((_, index) => {
              const point = pointFor(index, ring * 100);
              return `${point.x},${point.y}`;
            }).join(" ")}
            className="audit-dashboard-radar__ring"
          />
        ))}
        {chartItems.map((_, index) => {
          const point = pointFor(index);
          return (
            <line key={index} x1={center} y1={center} x2={point.x} y2={point.y} className="audit-dashboard-radar__axis" />
          );
        })}
        <polygon points={polygonFor("historico")} className="audit-dashboard-radar__shape audit-dashboard-radar__shape--history">
          <title>Histórico médio: {chartItems.map(item => `${item.label} ${item.historico}%`).join(", ")}</title>
        </polygon>
        <polygon points={polygonFor("atual")} className="audit-dashboard-radar__shape">
          <title>Atual: {chartItems.map(item => `${item.label} ${item.atual}%`).join(", ")}</title>
        </polygon>
        {chartItems.map((item, index) => {
          const point = pointFor(index, item.atual);
          const label = pointFor(index);
          return (
            <g key={item.label}>
              <circle cx={point.x} cy={point.y} r="3.8" className="audit-dashboard-radar__dot">
                <title>{item.label}: atual {item.atual}% / histórico {item.historico}%</title>
              </circle>
              <SvgAxisLabel
                x={label.labelX}
                y={label.labelY}
                label={item.label}
                maxChars={12}
                maxLines={3}
                className="audit-dashboard-radar__label"
              />
            </g>
          );
        })}
      </svg>
      <div className="audit-dashboard-radar__legend">
        <span><i /> Atual</span>
        <span><i /> Histórico médio</span>
      </div>
    </div>
  );
}

function VerticalBarsChart({ items }) {
  const chartItems = items.slice(0, 10);

  return (
    <div className="audit-dashboard-vertical-chart">
      {chartItems.map(item => (
        <div key={item.label} className="audit-dashboard-vertical-chart__item">
          <div
            className="audit-dashboard-vertical-chart__bar"
            title={`${item.label}: ${item.maturidade}% (${item.conformes} conforme / ${item.avaliados} avaliados)`}
          >
            <span
              style={{
                height: `${Math.max(item.maturidade, 4)}%`,
                backgroundColor: maturityTone(item.maturidade),
              }}
            />
          </div>
          <strong>{item.maturidade}%</strong>
          <em>{item.label}</em>
        </div>
      ))}
    </div>
  );
}

function GroupPieChart({ items }) {
  const chartItems = items.slice(0, 6);
  const total = chartItems.reduce((sum, item) => sum + item.total, 0) || 1;
  const colors = ["#6b0f2b", "#14532d", "#8a081e", "#78350f", "#123f36", "#c76f88"];

  if (chartItems.length === 0) {
    return <div className="audit-dashboard-empty">Sem dados para pizza.</div>;
  }

  const segments = chartItems.map((item, index) => {
    const pct = Math.round((item.total / total) * 100);
    return {
      key: item.label,
      value: item.total,
      color: colors[index % colors.length],
      title: `${item.label}: ${item.total} controles (${pct}%)`,
    };
  });

  return (
    <div className="audit-dashboard-group-pie">
      <DonutChart
        className="audit-dashboard-group-pie__chart"
        segments={segments}
        label={chartItems.length}
        subLabel="grupos"
      />
      <div className="audit-dashboard-group-pie__legend">
        {chartItems.map((item, index) => (
          <div key={item.label} title={`${item.label}: ${item.total} controles`}>
            <i style={{ backgroundColor: colors[index % colors.length] }} />
            <span>{item.label}</span>
            <strong>{item.total}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComboComplianceChart({ items }) {
  const chartItems = items.slice(0, 8);
  const slotMinWidth = labelSlotWidth(chartItems.map(item => item.label), 132, 210);
  const width = Math.max(420, chartItems.length * slotMinWidth);
  const height = 226;
  const padding = { top: 24, right: 30, bottom: 18, left: 42 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxTotal = Math.max(1, ...chartItems.map(item => item.avaliados || item.total || 0));
  const slotWidth = innerWidth / Math.max(chartItems.length, 1);
  const barWidth = Math.min(24, Math.max(12, slotWidth * 0.24));
  const barGap = Math.min(5, Math.max(3, slotWidth * 0.05));
  const groupWidth = (barWidth * 2) + barGap;

  const xFor = index => padding.left + (slotWidth * index) + (slotWidth / 2);
  const yForCount = value => padding.top + innerHeight - (value / maxTotal) * innerHeight;
  const yForPercent = value => padding.top + innerHeight - (value / 100) * innerHeight;

  const linePoints = chartItems
    .map((item, index) => `${xFor(index)},${yForPercent(item.maturidade)}`)
    .join(" ");

  if (chartItems.length === 0) {
    return <div className="audit-dashboard-empty">Sem dados para gráfico.</div>;
  }

  return (
    <div className="audit-dashboard-combo">
      <div className="audit-dashboard-combo__headline">
        <strong>{Math.round(chartItems.reduce((sum, item) => sum + item.maturidade, 0) / chartItems.length)}%</strong>
        <span>média dos grupos</span>
      </div>
      <div className="audit-dashboard-combo__scroll">
        <div className="audit-dashboard-combo__canvas" style={{ width }}>
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Controles avaliados e maturidade">
            {[0, 25, 50, 75, 100].map(tick => {
              const y = yForPercent(tick);
              return (
                <g key={tick}>
                  <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="audit-dashboard-combo__grid" />
                  <text x={padding.left - 10} y={y + 4} textAnchor="end" className="audit-dashboard-combo__axis">
                    {tick}%
                  </text>
                </g>
              );
            })}

            {chartItems.map((item, index) => {
              const x = xFor(index);
              const avaliadosHeight = padding.top + innerHeight - yForCount(item.avaliados);
              const conformesHeight = padding.top + innerHeight - yForCount(item.conformes);

              return (
                <g key={item.label}>
                  <rect
                    x={x - groupWidth / 2}
                    y={yForCount(item.avaliados)}
                    width={barWidth}
                    height={avaliadosHeight}
                    className="audit-dashboard-combo__bar audit-dashboard-combo__bar--total"
                  >
                    <title>{item.label}: {item.avaliados} avaliados</title>
                  </rect>
                  <rect
                    x={x - groupWidth / 2 + barWidth + barGap}
                    y={yForCount(item.conformes)}
                    width={barWidth}
                    height={conformesHeight}
                    className="audit-dashboard-combo__bar audit-dashboard-combo__bar--ok"
                  >
                    <title>{item.label}: {item.conformes} conformes</title>
                  </rect>
                </g>
              );
            })}

            <polyline points={linePoints} className="audit-dashboard-combo__line">
              <title>Maturidade: {chartItems.map(item => `${item.label} ${item.maturidade}%`).join(", ")}</title>
            </polyline>
            {chartItems.map((item, index) => (
              <circle
                key={`${item.label}-dot`}
                cx={xFor(index)}
                cy={yForPercent(item.maturidade)}
                r="4"
                className="audit-dashboard-combo__dot"
              >
                <title>{item.label}: {item.maturidade}% de maturidade</title>
              </circle>
            ))}
          </svg>
          <div
            className="audit-dashboard-chart-labels audit-dashboard-chart-labels--combo"
            style={{ gridTemplateColumns: `repeat(${chartItems.length}, minmax(0, 1fr))`, paddingLeft: padding.left, paddingRight: padding.right }}
          >
            {chartItems.map(item => (
              <span key={`label-${item.label}`} title={item.label}>{item.label}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="audit-dashboard-combo__legend">
        <span><i className="audit-dashboard-combo__legend-total" /> Avaliados</span>
        <span><i className="audit-dashboard-combo__legend-ok" /> Conformes</span>
        <span><i className="audit-dashboard-combo__legend-line" /> Maturidade</span>
      </div>
    </div>
  );
}

function DimensionInsightsSection({ title, items }) {
  const rankedItems = items.slice(0, 8);

  return (
    <section className="audit-dashboard-panel">
      <div className="audit-dashboard-panel__title">
        <BarChart3 size={18} />
        <h2>{title}</h2>
      </div>

      {rankedItems.length === 0 ? (
        <div className="audit-dashboard-empty">Nenhum agrupamento encontrado.</div>
      ) : (
        <div className="audit-dashboard-insights">
          <div className="audit-dashboard-insights__visuals">
            <div>
              <h3>Distribuição</h3>
              <GroupPieChart items={rankedItems} />
            </div>
            <div>
              <h3>Radar de maturidade</h3>
              <RadarChart items={rankedItems} />
            </div>
          </div>

          <div className="audit-dashboard-insights__cards">
            {rankedItems.map(item => (
              <article key={item.label} className="audit-dashboard-insight-card">
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.conformes} conforme / {item.avaliados} avaliados</span>
                </div>
                <em style={{ color: maturityTone(item.maturidade) }}>{item.maturidade}%</em>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function MaturityGroupSection({ title, emptyMessage, items, variant = "bars", actions = null }) {
  const featuredItems = items.slice(0, 8);

  return (
    <section className="audit-dashboard-panel">
      <div className={actions ? "audit-dashboard-panel__title audit-dashboard-panel__title--split" : "audit-dashboard-panel__title"}>
        <div>
          <Layers3 size={18} />
          <h2>{title}</h2>
        </div>
        {actions}
      </div>
      {items.length === 0 ? (
        <div className="audit-dashboard-empty">{emptyMessage}</div>
      ) : (
        <div className={`audit-dashboard-group audit-dashboard-group--${variant}`}>
          {variant === "combo" && <ComboComplianceChart items={featuredItems} />}
          {variant === "radar" && <RadarChart items={featuredItems} />}
          {variant === "vertical" && <VerticalBarsChart items={featuredItems} />}
          <div className="audit-dashboard-type-list">
            {featuredItems.map(item => (
              <div key={item.label} className="audit-dashboard-type-row">
                <div>
                  <strong>{item.label}</strong>
                  <span>
                    {item.conformes} conforme / {item.avaliados} avaliados
                  </span>
                </div>
                <div className="audit-dashboard-type-row__chart">
                  <div className="audit-dashboard-bar__track" title={`${item.label}: ${item.maturidade}%`}>
                    <div style={{ width: `${item.maturidade}%`, backgroundColor: maturityTone(item.maturidade) }} />
                  </div>
                  <em style={{ color: maturityTone(item.maturidade) }}>{item.maturidade}%</em>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function PizzaChart({ metricas }) {
  const total = metricas.total || 1;
  const entries = [
    ["CONFORME", metricas.conformes],
    ["NAO_CONFORME", metricas.naoConformes],
    ["NAO_APLICA", metricas.naoAplica],
    ["PENDENTE", metricas.pendentes],
  ];
  const segments = entries.map(([key, value]) => ({
    key,
    value,
    color: statusConfig[key].color,
    title: `${statusConfig[key].label}: ${value} de ${metricas.total || 0} (${metricas.total ? Math.round((value / metricas.total) * 100) : 0}%)`,
  }));

  return (
    <div className="audit-dashboard-pizza-wrap">
      <DonutChart
        className="audit-dashboard-pizza"
        segments={segments}
        label={`${metricas.maturidade}%`}
        subLabel="maturidade"
      />
      <div className="audit-dashboard-legend">
        {entries.map(([key, value]) => (
          <div key={key} title={`${statusConfig[key].label}: ${value} de ${metricas.total || 0}`}>
            <i style={{ backgroundColor: statusConfig[key].color }} />
            <span>{statusConfig[key].label}</span>
            <strong>
              {value}
              <small>{metricas.total ? Math.round((value / metricas.total) * 100) : 0}%</small>
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonDashboard({ data, loading, erro, range, setRange, isNorma27701 }) {
  const chartItems = data;
  const [grupoComparativo, setGrupoComparativo] = useState(isNorma27701 ? "categoria" : "tipos_controle");
  const comparisonSlotWidth = labelSlotWidth(chartItems.map(item => auditLabel(item.auditoria)), 136, 220);
  const width = Math.max(340, chartItems.length * comparisonSlotWidth);
  const height = 138;
  const padding = { top: 12, right: 22, bottom: 22, left: 34 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const slotWidth = innerWidth / Math.max(chartItems.length, 1);
  const xFor = index => padding.left + (slotWidth * index) + (slotWidth / 2);
  const yFor = value => padding.top + innerHeight - (value / 100) * innerHeight;
  const maxConformes = Math.max(1, ...chartItems.map(item => item.metricas.conformes));
  const yForConformes = value => padding.top + innerHeight - (value / maxConformes) * innerHeight;
  const maturidadePoints = chartItems.map((item, index) => `${xFor(index)},${yFor(item.metricas.maturidade)}`).join(" ");
  const progressoPoints = chartItems.map((item, index) => `${xFor(index)},${yFor(item.metricas.progresso)}`).join(" ");
  const conformesPoints = chartItems.map((item, index) => `${xFor(index)},${yForConformes(item.metricas.conformes)}`).join(" ");
  const auditoriaAtual = chartItems.find(item => item.atual) || chartItems[0];
  const comparisonItemKey = (item, index) => {
    const auditoriaId = item.auditoria?.id_auditoria ?? item.auditoria?.id ?? "sem-id";
    const data = item.auditoria?.data_auditoria ?? "sem-data";
    return `${item.atual ? "atual" : "historico"}-${auditoriaId}-${data}-${index}`;
  };
  const comparisonShortLabel = item => {
    const label = auditLabel(item.auditoria, "Auditoria");
    return label;
  };
  const gruposDisponiveis = isNorma27701
    ? [
        { key: "categoria", label: "Categoria", field: "porCategoria", empty: "Nenhuma categoria encontrada para comparar." },
        { key: "atributos_anexo", label: "atributo_anexo", field: "porAtributo", empty: "Nenhum atributo_anexo encontrado para comparar." },
        { key: "tipos_controle", label: "tipo_controle", field: "porTipo", empty: "Nenhum tipo_controle encontrado para comparar." },
      ]
    : [
        { key: "tipos_controle", label: "tipo_controle", field: "porTipo", empty: "Nenhum tipo_controle encontrado para comparar." },
        { key: "propriedade", label: "Propriedade", field: "porPropriedade", empty: "Nenhuma propriedade encontrada para comparar." },
        { key: "conceito", label: "Conceito", field: "porConceito", empty: "Nenhum conceito encontrado para comparar." },
        { key: "capacidade", label: "Capacidade operacional", field: "porCapacidade", empty: "Nenhuma capacidade operacional encontrada para comparar." },
        { key: "tema", label: "Tema", field: "porTema", empty: "Nenhum tema encontrado para comparar." },
        { key: "dominio", label: "Domínio", field: "porDominio", empty: "Nenhum domínio encontrado para comparar." },
      ];
  const grupoAtual = gruposDisponiveis.find(grupo => grupo.key === grupoComparativo) || gruposDisponiveis[0];
  const itensGrupoAtual = (auditoriaAtual?.metricas[grupoAtual.field] || []).slice(0, 8);
  const categorias = itensGrupoAtual.map(item => item.label);
  const itensComparativos = categorias.map(categoria => {
    const atual = auditoriaAtual?.metricas[grupoAtual.field]?.find(item => item.label === categoria)?.maturidade || 0;
    const historicos = chartItems
      .filter(item => !item.atual)
      .map(item => item.metricas[grupoAtual.field].find(valor => valor.label === categoria)?.maturidade || 0);
    const historico = historicos.length
      ? Math.round(historicos.reduce((sum, value) => sum + value, 0) / historicos.length)
      : 0;

    return {
      label: categoria,
      atual,
      historico,
      delta: atual - historico,
      total: Math.max(atual, 1),
      maturidade: atual,
      conformes: atual,
      avaliados: 100,
    };
  });

  return (
    <section className="audit-dashboard-panel audit-dashboard-comparison audit-dashboard-comparison--compact">
      <div className="audit-dashboard-panel__title audit-dashboard-panel__title--split">
        <div>
          <BarChart3 size={18} />
          <h2>Comparativo de auditorias</h2>
        </div>
        <div className="audit-dashboard-tabs" role="tablist" aria-label="Quantidade de auditorias comparadas">
          {[
            ["3", "Últimas 3"],
            ["5", "Últimas 5"],
            ["all", "Todas"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={range === value ? "audit-dashboard-tabs__item audit-dashboard-tabs__item--active" : "audit-dashboard-tabs__item"}
              onClick={() => setRange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {erro && <div className="audit-dashboard-alert">{erro}</div>}
      {loading ? (
        <div className="audit-dashboard-empty">Carregando comparativo...</div>
      ) : chartItems.length === 0 ? (
        <div className="audit-dashboard-empty">
          Nenhuma auditoria anterior encontrada para a mesma empresa e norma.
        </div>
      ) : (
        <>
          <div className="audit-dashboard-comparison__charts">
            <div className="audit-dashboard-comparison__chart-card">
              <h3>Progresso de maturidade</h3>
              <div className="audit-dashboard-comparison__chart">
                <div className="audit-dashboard-comparison__canvas" style={{ width }}>
                  <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Comparativo de maturidade e progresso">
                    {[0, 25, 50, 75, 100].map(tick => {
                      const y = yFor(tick);
                      return (
                        <g key={tick}>
                          <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="audit-dashboard-combo__grid" />
                          <text x={padding.left - 10} y={y + 4} textAnchor="end" className="audit-dashboard-combo__axis">{tick}%</text>
                        </g>
                      );
                    })}
                    <polyline points={progressoPoints} className="audit-dashboard-comparison__line audit-dashboard-comparison__line--progress">
                      <title>Progresso: {chartItems.map(item => `${auditLabel(item.auditoria)} ${item.metricas.progresso}%`).join(", ")}</title>
                    </polyline>
                    <polyline points={maturidadePoints} className="audit-dashboard-comparison__line">
                      <title>Maturidade: {chartItems.map(item => `${auditLabel(item.auditoria)} ${item.metricas.maturidade}%`).join(", ")}</title>
                    </polyline>
                    {chartItems.map((item, index) => (
                      <g key={`maturidade-${comparisonItemKey(item, index)}`}>
                        <circle
                          cx={xFor(index)}
                          cy={yFor(item.metricas.maturidade)}
                          r="4"
                          className="audit-dashboard-combo__dot"
                        >
                          <title>{auditLabel(item.auditoria)}: maturidade {item.metricas.maturidade}% / progresso {item.metricas.progresso}%</title>
                        </circle>
                      </g>
                    ))}
                  </svg>
                  <div
                    className="audit-dashboard-chart-labels audit-dashboard-chart-labels--comparison"
                    style={{ gridTemplateColumns: `repeat(${chartItems.length}, minmax(0, 1fr))`, paddingLeft: padding.left, paddingRight: padding.right }}
                  >
                    {chartItems.map((item, index) => (
                      <span key={`maturity-label-${comparisonItemKey(item, index)}`} title={auditLabel(item.auditoria)}>
                        {auditLabel(item.auditoria)}
                        <small>{item.auditoria.data_auditoria || "-"}</small>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="audit-dashboard-comparison__chart-card">
              <h3>Quantidade de conformes</h3>
              <div className="audit-dashboard-comparison__chart">
                <div className="audit-dashboard-comparison__canvas" style={{ width }}>
                  <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Comparativo de conformes">
                    {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                      const value = Math.round(maxConformes * tick);
                      const y = yForConformes(value);
                      return (
                        <g key={tick}>
                          <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="audit-dashboard-combo__grid" />
                          <text x={padding.left - 10} y={y + 4} textAnchor="end" className="audit-dashboard-combo__axis">{value}</text>
                        </g>
                      );
                    })}
                    {chartItems.map((item, index) => {
                      const x = xFor(index);
                      const barHeight = padding.top + innerHeight - yForConformes(item.metricas.conformes);
                      return (
                        <g key={`conformes-${comparisonItemKey(item, index)}`}>
                          <rect
                            x={x - Math.min(10, slotWidth * 0.25)}
                            y={yForConformes(item.metricas.conformes)}
                            width={Math.min(20, slotWidth * 0.5)}
                            height={barHeight}
                            className={item.atual ? "audit-dashboard-comparison__bar audit-dashboard-comparison__bar--current" : "audit-dashboard-comparison__bar"}
                          >
                            <title>{auditLabel(item.auditoria)}: {item.metricas.conformes} conformes</title>
                          </rect>
                        </g>
                      );
                    })}
                    <polyline points={conformesPoints} className="audit-dashboard-comparison__line audit-dashboard-comparison__line--conformes">
                      <title>Conformes: {chartItems.map(item => `${auditLabel(item.auditoria)} ${item.metricas.conformes}`).join(", ")}</title>
                    </polyline>
                  </svg>
                  <div
                    className="audit-dashboard-chart-labels audit-dashboard-chart-labels--comparison"
                    style={{ gridTemplateColumns: `repeat(${chartItems.length}, minmax(0, 1fr))`, paddingLeft: padding.left, paddingRight: padding.right }}
                  >
                    {chartItems.map((item, index) => (
                      <span key={`conformes-label-${comparisonItemKey(item, index)}`} title={auditLabel(item.auditoria)}>
                        {auditLabel(item.auditoria)}
                        <small>{item.metricas.conformes}</small>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="audit-dashboard-comparison__legend">
            <span><i className="audit-dashboard-comparison__legend-current" /> Auditoria atual</span>
            <span><i className="audit-dashboard-comparison__legend-history" /> Histórico</span>
            <span><i className="audit-dashboard-comparison__legend-line" /> Maturidade</span>
            <span><i className="audit-dashboard-comparison__legend-progress" /> Progresso</span>
            <span><i className="audit-dashboard-comparison__legend-conformes" /> Conformes</span>
          </div>

          <div className="audit-dashboard-comparison__cards">
            {chartItems.map((item, index) => (
              <article
                key={`card-${comparisonItemKey(item, index)}`}
                className={item.atual ? "audit-dashboard-comparison-card audit-dashboard-comparison-card--current" : "audit-dashboard-comparison-card"}
                title={`${auditLabel(item.auditoria)}: ${item.metricas.maturidade}% maturidade, ${item.metricas.progresso}% progresso`}
              >
                <p>{item.atual ? "Auditoria atual" : "Histórico"} · {auditLabel(item.auditoria)}</p>
                <strong>{item.metricas.maturidade}%</strong>
                <span>{item.metricas.conformes} conforme / {item.metricas.controlesAvaliados} avaliados</span>
                <em>{item.metricas.progresso}% progresso</em>
              </article>
            ))}
          </div>

          <div className="audit-dashboard-comparison-category">
            <div className="audit-dashboard-comparison-category__title">
              <Layers3 size={16} />
              <h3>Dashboard comparativo por {grupoAtual.label}</h3>
            </div>
            <div className="audit-dashboard-tabs audit-dashboard-tabs--compact" role="tablist" aria-label="Agrupamento do comparativo">
              {gruposDisponiveis.map(grupo => (
                <button
                  key={grupo.key}
                  type="button"
                  className={grupoAtual.key === grupo.key ? "audit-dashboard-tabs__item audit-dashboard-tabs__item--active" : "audit-dashboard-tabs__item"}
                  onClick={() => setGrupoComparativo(grupo.key)}
                >
                  {grupo.label}
                </button>
              ))}
            </div>
            {categorias.length === 0 ? (
              <div className="audit-dashboard-empty">{grupoAtual.empty}</div>
            ) : (
              <>
                <div className="audit-dashboard-comparison-insights">
                  <div>
                    <h4>Pizza comparativa atual</h4>
                    <GroupPieChart items={itensComparativos} />
                  </div>
                  <div>
                    <h4>Radar atual x histórico</h4>
                    <ComparativeRadarChart items={itensComparativos} />
                  </div>
                  <div className="audit-dashboard-comparison-rank">
                    <h4>Maturidade atual x histórico</h4>
                    {itensComparativos.map(item => (
                      <article key={item.label} title={`${item.label}: atual ${item.atual}% / histórico ${item.historico}% / variação ${item.delta >= 0 ? "+" : ""}${item.delta}%`}>
                        <span>{item.label}</span>
                        <strong style={{ color: maturityTone(item.atual) }}>
                          {item.atual}%
                          <small>{item.delta >= 0 ? "+" : ""}{item.delta}%</small>
                        </strong>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="audit-dashboard-comparison-category__grid">
                  {categorias.map(categoria => (
                    <article key={categoria} className="audit-dashboard-category-mini">
                      <strong>{categoria}</strong>
                      <div className="audit-dashboard-category-mini__bars">
                        {chartItems.map(item => {
                          const categoriaMetricas = item.metricas[grupoAtual.field].find(valor => valor.label === categoria);
                          const maturidade = categoriaMetricas?.maturidade || 0;
                          return (
                            <div key={`${categoria}-${comparisonItemKey(item, 0)}`}>
                              <span
                                title={`${auditLabel(item.auditoria)}: ${maturidade}%`}
                                className={item.atual ? "audit-dashboard-category-mini__bar audit-dashboard-category-mini__bar--current" : "audit-dashboard-category-mini__bar"}
                                style={{ height: `${Math.max(maturidade, 4)}%` }}
                              />
                              <em>{comparisonShortLabel(item)}</em>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default function DashboardAuditoriaPage() {
  const { id_auditoria } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Fulano da Silva");
  const [userRole, setUserRole] = useState("Auditor");
  const [auditoria, setAuditoria] = useState({ id_auditoria, ...(state || {}) });
  const [controles, setControles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [abaAgrupamento, setAbaAgrupamento] = useState("tipos_controle");
  const [abaDashboard, setAbaDashboard] = useState("atual");
  const [comparativoRange, setComparativoRange] = useState("3");
  const [comparativoData, setComparativoData] = useState([]);
  const [comparativoLoading, setComparativoLoading] = useState(false);
  const [comparativoErro, setComparativoErro] = useState("");
  const [modalRelatorio, setModalRelatorio] = useState(false);

  const { gerando, gerarRelatorio } = useRelatorioPDF();

  const token = () => localStorage.getItem("access_token");

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserName(parsed.name || parsed.username || "Lead Auditor");
        setUserRole(parsed.cargo || parsed.sub || "Auditor");
      } catch {}
    }
    carregarDashboard();
  }, []);

  const carregarRespostasAuditoria = async (idAuditoria, norma) => {
    const normaSlug = NORMA_SLUG[norma] || "27002";
    const respostasResp = await fetch(`${BASE}/auditoria/${idAuditoria}/${normaSlug}/respostas/`, {
      headers: { Authorization: `Bearer ${token()}` },
    });

    if (!respostasResp.ok) throw new Error();
    return respostasResp.json();
  };

  const carregarDashboard = async () => {
    setLoading(true);
    setErro("");
    try {
      let contexto = state || {};
      if (!contexto.norma) {
        const listaResp = await fetch(`${BASE}/auditorias/view`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (listaResp.ok) {
          const lista = await listaResp.json();
          contexto = lista.find(a => String(a.id_auditoria) === String(id_auditoria)) || {};
          setAuditoria(contexto);
        }
      }

      setControles(await carregarRespostasAuditoria(id_auditoria, contexto.norma));
    } catch {
      setErro("Não foi possível carregar o dashboard desta auditoria.");
    } finally {
      setLoading(false);
    }
  };

  async function handleGerarRelatorio(auditoriasSelecionadas, tipoRelatorio) {
    await gerarRelatorio({
      auditoria,
      contorlesJaCarregados: controles,
      auditoriasSelecionadas,
      tipoRelatorio,
    });
    setModalRelatorio(false);
  }

  const metricas = useMemo(() => {
    return calcularMetricas(controles);
  }, [controles]);

  const isNorma27701 = String(auditoria.norma || "").includes("27701");
  const abasAgrupamento = isNorma27701
    ? [
        {
          key: "categoria",
          label: "Categoria",
          items: metricas.porCategoria,
          emptyMessage: "Nenhuma categoria encontrada.",
        },
        {
          key: "tipos_controle",
          label: "Tipos de controle",
          items: metricas.porTipo,
          emptyMessage: "Nenhum tipo de controle encontrado.",
        },
        {
          key: "atributos_anexo",
          label: "atributos_anexo",
          items: metricas.porAtributo,
          emptyMessage: "Nenhum atributo_anexo encontrado.",
        },
      ]
    : [
        {
          key: "tipos_controle",
          label: "Tipos",
          items: metricas.porTipo,
          emptyMessage: "Nenhum tipo de controle encontrado.",
        },
        {
          key: "propriedades_si",
          label: "Propriedades SI",
          items: metricas.porPropriedade,
          emptyMessage: "Nenhuma propriedade de SI encontrada.",
        },
        {
          key: "conceitos_si",
          label: "Conceitos SI",
          items: metricas.porConceito,
          emptyMessage: "Nenhum conceito de SI encontrado.",
        },
        {
          key: "capacidades_operacionais",
          label: "Capacidades",
          items: metricas.porCapacidade,
          emptyMessage: "Nenhuma capacidade operacional encontrada.",
        },
        {
          key: "dominios_seguranca",
          label: "Domínios",
          items: metricas.porDominio,
          emptyMessage: "Nenhum domínio de segurança encontrado.",
        },
        {
          key: "temas_controle",
          label: "Temas",
          items: metricas.porTema,
          emptyMessage: "Nenhum tema de controle encontrado.",
        },
      ];
  const agrupamentoAtual = abasAgrupamento.find(aba => aba.key === abaAgrupamento) || abasAgrupamento[0];

  useEffect(() => {
    if (abaDashboard !== "comparativo") return;

    const carregarComparativo = async () => {
      setComparativoLoading(true);
      setComparativoErro("");
      try {
        const listaResp = await fetch(`${BASE}/auditorias/view`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
        if (!listaResp.ok) throw new Error();

        const lista = await listaResp.json();
        const auditoriaDaLista = lista.find(item => String(item.id_auditoria) === String(id_auditoria));
        const auditoriaBase = {
          ...(auditoriaDaLista || {}),
          ...auditoria,
          id_auditoria: auditoria.id_auditoria ?? auditoriaDaLista?.id_auditoria ?? id_auditoria,
          nome: auditoria.nome ?? auditoriaDaLista?.nome,
          empresa: auditoria.empresa ?? auditoriaDaLista?.empresa,
          norma: auditoria.norma ?? auditoriaDaLista?.norma,
          data_auditoria: auditoria.data_auditoria ?? auditoriaDaLista?.data_auditoria,
        };

        if (!auditoriaBase.empresa || !auditoriaBase.norma) {
          throw new Error();
        }

        const mesmaEmpresaNorma = lista
          .filter(item => (
            String(item.empresa || "").trim().toLowerCase() === String(auditoriaBase.empresa || "").trim().toLowerCase()
            && String(item.norma || "").trim().toLowerCase() === String(auditoriaBase.norma || "").trim().toLowerCase()
            && String(item.id_auditoria) !== String(id_auditoria)
          ))
          .sort((a, b) => {
            const dataDiff = new Date(b.data_auditoria || 0) - new Date(a.data_auditoria || 0);
            return dataDiff || Number(b.id_auditoria) - Number(a.id_auditoria);
          });

        const selecionadas = comparativoRange === "all"
          ? mesmaEmpresaNorma
          : mesmaEmpresaNorma.slice(0, Number(comparativoRange));

        const historico = await Promise.all(selecionadas.map(async item => {
          const respostas = await carregarRespostasAuditoria(item.id_auditoria, item.norma);
          return {
            auditoria: item,
            metricas: calcularMetricas(respostas),
            atual: false,
          };
        }));

        setComparativoData([
          {
            auditoria: auditoriaBase,
            metricas,
            atual: true,
          },
          ...historico,
        ]);
      } catch {
        setComparativoErro("Não foi possível carregar o comparativo desta empresa e norma.");
      } finally {
        setComparativoLoading(false);
      }
    };

    carregarComparativo();
  }, [abaDashboard, comparativoRange, auditoria, id_auditoria, controles, metricas]);

  return (
    <div className="audit-dashboard-page">
      <Sidebar userName={userName} userSub={userRole} />

      <main className="audit-dashboard-page__main">
        <header className="audit-dashboard-header">
          <button type="button" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Voltar
          </button>
          <p>Dashboard da Auditoria</p>
          <h1>{auditoria.nome || auditoria.empresa || `Auditoria #${id_auditoria}`}</h1>
          <div className="audit-dashboard-header__meta">
            {auditoria.empresa && <span>{auditoria.empresa}</span>}
            <span>{auditoria.norma || "Norma não informada"}</span>
            <span>#{id_auditoria}</span>
            {auditoria.data_auditoria && <span>{auditoria.data_auditoria}</span>}
          </div>
          <div className="audit-dashboard-header__actions">
            <button
              type="button"
              className="audit-dashboard-btn-relatorio"
              onClick={() => setModalRelatorio(true)}
              disabled={gerando || loading}
            >
              {gerando
                ? <><Loader2 size={15} className="relatorio-modal__spin" /> Gerando...</>
                : <><FileText size={15} /> Gerar relatório PDF</>
              }
            </button>
          </div>
        </header>

        {erro && <div className="audit-dashboard-alert">{erro}</div>}

        <div className="audit-dashboard-view-tabs" role="tablist" aria-label="Visões do dashboard">
          <button
            type="button"
            className={abaDashboard === "atual" ? "audit-dashboard-view-tabs__item audit-dashboard-view-tabs__item--active" : "audit-dashboard-view-tabs__item"}
            onClick={() => setAbaDashboard("atual")}
          >
            Auditoria atual
          </button>
          <button
            type="button"
            className={abaDashboard === "comparativo" ? "audit-dashboard-view-tabs__item audit-dashboard-view-tabs__item--active" : "audit-dashboard-view-tabs__item"}
            onClick={() => setAbaDashboard("comparativo")}
          >
            Comparativo
          </button>
        </div>

        {abaDashboard === "atual" ? (
          <>
            <section className="audit-dashboard-summary">
              <div>
                <BarChart3 size={24} strokeWidth={1.6} />
                <p>Dashboard de conformidade</p>
                <strong>{loading ? "..." : `${metricas.maturidade}%`}</strong>
                <span>
                  Maturidade = {metricas.conformes} conforme / {metricas.controlesAvaliados} controles avaliados
                </span>
              </div>
              <div className="audit-dashboard-ring" style={{ "--pct": `${metricas.progresso}%` }}>
                <span>{metricas.progresso}%</span>
                <em>progresso</em>
              </div>
            </section>

            <section className="audit-dashboard-metrics">
              <MetricCard icon={ClipboardList} label="Total" value={loading ? "..." : metricas.total} helper="Controles avaliáveis" color="#6B0F2B" />
              <MetricCard icon={ShieldCheck} label="Avaliados" value={loading ? "..." : metricas.controlesAvaliados} helper="Total menos não se aplica" color="#6B0F2B" />
              <MetricCard icon={CheckCircle2} label="Conformes" value={loading ? "..." : metricas.conformes} helper="Atendem ao controle" color="#14532d" />
              <MetricCard icon={XCircle} label="Não Conformes" value={loading ? "..." : metricas.naoConformes} helper="Demandam ação" color="#7f1d1d" />
              <MetricCard icon={MinusCircle} label="Não Aplica" value={loading ? "..." : metricas.naoAplica} helper="Fora do escopo" color="#78350f" />
              <MetricCard icon={TimerReset} label="Pendentes" value={loading ? "..." : metricas.pendentes} helper="Sem resposta" color="#6B0F2B" />
            </section>

            <section className="audit-dashboard-grid">
              <article className="audit-dashboard-panel">
                <div className="audit-dashboard-panel__title">
                  <PieChart size={18} />
                  <h2>Gráfico de respostas</h2>
                </div>
                <PizzaChart metricas={metricas} />
              </article>

              <article className="audit-dashboard-panel">
                <div className="audit-dashboard-panel__title">
                  <ShieldCheck size={18} />
                  <h2>Distribuição das respostas</h2>
                </div>
                {Object.entries({
                  CONFORME: metricas.conformes,
                  NAO_CONFORME: metricas.naoConformes,
                  NAO_APLICA: metricas.naoAplica,
                  PENDENTE: metricas.pendentes,
                }).map(([key, value]) => (
                  <DistributionBar
                    key={key}
                    label={statusConfig[key].label}
                    value={value}
                    total={metricas.total}
                    color={statusConfig[key].color}
                  />
                ))}
              </article>
            </section>

        <MaturityGroupSection
          title="Maturidade por dimensão da norma"
          emptyMessage={agrupamentoAtual.emptyMessage}
          items={agrupamentoAtual.items}
          variant="combo"
              actions={(
                <div className="audit-dashboard-tabs" role="tablist" aria-label="Agrupamento do gráfico">
                  {abasAgrupamento.map(aba => (
                    <button
                      key={aba.key}
                      type="button"
                      role="tab"
                      aria-selected={agrupamentoAtual.key === aba.key}
                      className={agrupamentoAtual.key === aba.key ? "audit-dashboard-tabs__item audit-dashboard-tabs__item--active" : "audit-dashboard-tabs__item"}
                      onClick={() => setAbaAgrupamento(aba.key)}
                    >
                      {aba.label}
                    </button>
                  ))}
                </div>
              )}
            />

            <DimensionInsightsSection
              title={`Dashboard por ${agrupamentoAtual.label}`}
              items={agrupamentoAtual.items}
            />

          </>
        ) : (
          <ComparisonDashboard
            data={comparativoData}
            loading={comparativoLoading}
            erro={comparativoErro}
            range={comparativoRange}
            setRange={setComparativoRange}
            isNorma27701={isNorma27701}
          />
        )}

        {modalRelatorio && (
          <ModalRelatorioPDF
            auditoria={auditoria}
            gerando={gerando}
            onGerar={handleGerarRelatorio}
            onFechar={() => setModalRelatorio(false)}
          />
        )}
      </main>
    </div>
  );
}
