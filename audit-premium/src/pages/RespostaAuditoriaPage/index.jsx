import React, { useEffect, useState } from "react";
import "./styles.css";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  ArrowLeft, X, CheckCircle2, XCircle, MinusCircle,
  FileText, AlertCircle, BarChart3, Paperclip,
  Save, Trash2, ChevronDown, Edit3, Lock,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  CONFORME:     { label: "Conforme",     color: "#14532d", bg: "rgba(20,83,45,0.09)",   Icon: CheckCircle2 },
  NAO_CONFORME: { label: "Não Conforme", color: "#7f1d1d", bg: "rgba(127,29,29,0.09)", Icon: XCircle      },
  NAO_APLICA:   { label: "Não Aplica",   color: "#78350f", bg: "rgba(120,53,15,0.09)", Icon: MinusCircle  },
};

const NORMA_SLUG = { "ISO 27002": "27002", "ISO 27701": "27701" };
const isConcluida = (status) =>
  String(status || "").toUpperCase() === "CONCLUIDA";

// CORREÇÃO: prefixo correto para todas as chamadas
const BASE            = "http://localhost:8000/controles";
const BASE_AUDITORIAS = "http://localhost:8000/controles/auditorias";

// ─── sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{
      backgroundColor: "white", border: "1px solid rgba(107,15,43,0.08)",
      borderRadius: "8px", padding: "24px 28px",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: bg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} strokeWidth={1.5} />
      </div>
      <div>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.15em",
          textTransform: "uppercase", color: "rgba(107,15,43,0.45)", margin: "0 0 2px" }}>{label}</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 28,
          fontWeight: 700, color: "#6B0F2B", margin: 0, lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

function ProgressBar({ value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ backgroundColor: "white", border: "1px solid rgba(107,15,43,0.08)",
      borderRadius: "8px", padding: "24px 28px", gridColumn: "1 / -1" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.15em",
          textTransform: "uppercase", color: "rgba(107,15,43,0.45)", margin: 0 }}>
          Progresso da Auditoria
        </p>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 22,
          fontWeight: 700, color: "#6B0F2B" }}>{pct}%</span>
      </div>
      <div style={{ height: 6, backgroundColor: "rgba(107,15,43,0.08)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 6,
          background: "linear-gradient(90deg, #6B0F2B, #a0284e)",
          transition: "width 0.8s ease" }} />
      </div>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "rgba(107,15,43,0.45)",
        margin: "8px 0 0", textAlign: "right" }}>
        {value} de {total} controles respondidos
      </p>
    </div>
  );
}

function StatusBadge({ situacao, size = "normal" }) {
  const s = STATUS_MAP[situacao] || {
    label: situacao, color: "#6B0F2B",
    bg: "rgba(107,15,43,0.08)", Icon: AlertCircle,
  };
  const { Icon } = s;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: size === "small" ? "3px 10px" : "5px 14px",
      borderRadius: 6, fontSize: size === "small" ? 10 : 11,
      fontFamily: "var(--font-sans)", letterSpacing: "0.08em",
      textTransform: "uppercase", fontWeight: 600,
      backgroundColor: s.bg, color: s.color,
    }}>
      <Icon size={size === "small" ? 11 : 13} strokeWidth={2} />
      {s.label}
    </span>
  );
}

// ─── ControleRow ──────────────────────────────────────────────────────────────

function ControleRow({ item, index, onClick, onStatusChange, normaSlug, idAuditoria, token, bloqueado }) {
  const [saving, setSaving] = useState(null);
  const situacaoAtual = item.resposta?.situacao;

  const handleStatusClick = async (e, statusKey) => {
    e.stopPropagation();
    if (bloqueado) return;
    if (statusKey === situacaoAtual) return;
    setSaving(statusKey);
    try {
      const resp = await fetch(
        `${BASE}/auditoria/${idAuditoria}/${normaSlug}/controle/${item.controle.id}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            situacao: statusKey,
            observacoes: item.resposta?.observacoes || "",
            justificativa: item.resposta?.justificativa || "",
            possui_andamento: item.resposta?.possui_andamento || false,
          }),
        }
      );
      if (resp.ok) {
        onStatusChange({ ...item, resposta: { ...item.resposta, situacao: statusKey } });
      }
    } catch {}
    finally { setSaving(null); }
  };

  return (
    <div
      className="resposta-controle-row"
      style={{
        backgroundColor: "white", border: "1px solid rgba(107,15,43,0.08)",
        borderRadius: "8px", overflow: "hidden", transition: "box-shadow 0.15s ease",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(107,15,43,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>

      <button
        className="resposta-controle-row__main"
        onClick={() => onClick(item)}
        style={{ width: "100%", textAlign: "left", background: "none", border: "none",
          cursor: "pointer", padding: "18px 24px",
          display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "rgba(107,15,43,0.3)",
          letterSpacing: "0.1em", minWidth: 28, flexShrink: 0 }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "rgba(107,15,43,0.45)", margin: "0 0 2px" }}>
            {item.controle.indice}
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 18,
            color: "#6B0F2B", margin: 0, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.controle.titulo}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {situacaoAtual
            ? <StatusBadge situacao={situacaoAtual} size="small" />
            : <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(107,15,43,0.3)" }}>Pendente</span>
          }
          {bloqueado
            ? <Lock size={14} color="rgba(107,15,43,0.3)" />
            : <Edit3 size={14} color="rgba(107,15,43,0.3)" />
          }
        </div>
      </button>

      <div className="resposta-quick-answer" style={{ display: "flex", alignItems: "center", gap: 6,
        padding: "10px 24px 14px 68px",
        borderTop: "1px solid rgba(107,15,43,0.05)",
        backgroundColor: "rgba(107,15,43,0.015)" }}>
        <span className="resposta-quick-answer__label" style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.18em",
          textTransform: "uppercase", color: "rgba(107,15,43,0.3)", marginRight: 4 }}>
          {bloqueado ? "Somente leitura:" : "Resposta rápida:"}
        </span>
        {Object.entries(STATUS_MAP).map(([key, { label, Icon, color, bg }]) => {
          const isSelected = situacaoAtual === key;
          const isLoading  = saving === key;
          return (
            <button className="resposta-quick-answer__button" key={key} onClick={e => handleStatusClick(e, key)} disabled={bloqueado || !!saving}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 12px", borderRadius: 6, cursor: bloqueado || saving ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.1em",
                textTransform: "uppercase", fontWeight: 600, transition: "all 0.15s ease",
                backgroundColor: isSelected ? bg : "transparent",
                color: isSelected ? color : "rgba(107,15,43,0.4)",
                border: isSelected ? `1.5px solid ${color}40` : "1.5px solid rgba(107,15,43,0.12)",
                opacity: bloqueado && !isSelected ? 0.45 : saving && !isLoading ? 0.5 : 1,
                transform: isSelected ? "scale(1.04)" : "scale(1)",
              }}
              onMouseEnter={e => { if (!isSelected && !saving && !bloqueado) { e.currentTarget.style.backgroundColor = bg; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = `${color}40`; } }}
              onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "rgba(107,15,43,0.4)"; e.currentTarget.style.borderColor = "rgba(107,15,43,0.12)"; } }}>
              {isLoading
                ? <span style={{ width: 10, height: 10, border: `1.5px solid ${color}`,
                    borderTopColor: "transparent", borderRadius: "50%",
                    display: "inline-block", animation: "spin 0.6s linear infinite" }} />
                : <Icon size={11} strokeWidth={2.5} />
              }
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TagList({ items, label }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.15em",
        textTransform: "uppercase", color: "rgba(107,15,43,0.4)", margin: "0 0 8px" }}>{label}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((t, i) => (
          <span key={i} style={{ padding: "3px 12px", borderRadius: 6, fontSize: 11,
            fontFamily: "var(--font-sans)", backgroundColor: "rgba(107,15,43,0.06)",
            color: "#6B0F2B", border: "1px solid rgba(107,15,43,0.12)" }}>
            {t.nome}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function DetalheModal({ item, onClose, normaSlug, idAuditoria, token, onRespostaAtualizada, bloqueado }) {
  const [modoEdicao, setModoEdicao] = useState(false);
  const [form, setForm] = useState({ situacao: "", observacoes: "", justificativa: "", possui_andamento: false });
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [evidencias, setEvidencias] = useState([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);

  const c = item.controle;
  const r = item.resposta;
  const temResposta = !!r?.situacao;

  useEffect(() => {
    setForm({
      situacao:        r?.situacao        || "",
      observacoes:     r?.observacoes     || "",
      justificativa:   r?.justificativa   || "",
      possui_andamento: r?.possui_andamento || false,
    });
    setModoEdicao(!bloqueado && !temResposta);
    setErro(""); setSucesso("");

    const fetchEvidencias = async () => {
      try {
        const resp = await fetch(
          `${BASE}/auditoria/${idAuditoria}/${normaSlug}/controle/${c.id}/evidencias/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (resp.ok) setEvidencias(await resp.json());
      } catch {}
    };
    fetchEvidencias();
  }, [item, bloqueado]);

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (bloqueado) { setErro("Auditoria concluída não permite alteração de respostas."); return; }
    if (!form.situacao) { setErro("Selecione uma situação."); return; }
    setErro(""); setSucesso(""); setLoading(true);
    try {
      const resp = await fetch(
        `${BASE}/auditoria/${idAuditoria}/${normaSlug}/controle/${c.id}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        }
      );
      const data = await resp.json();
      if (!resp.ok) { setErro(data.detail || "Erro ao salvar."); return; }
      setSucesso("Resposta salva com sucesso!");
      setModoEdicao(false);
      onRespostaAtualizada({ ...item, resposta: { ...form } });
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletar = async () => {
    if (bloqueado) { setErro("Auditoria concluída não permite excluir respostas."); return; }
    if (!window.confirm("Tem certeza que deseja excluir esta resposta?")) return;
    setErro(""); setLoadingDelete(true);
    try {
      const resp = await fetch(
        `${BASE}/auditoria/${idAuditoria}/${normaSlug}/controle/${c.id}/`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setErro(data.detail || "Erro ao excluir resposta.");
        return;
      }
      setSucesso("Resposta excluída.");
      setForm({ situacao: "", observacoes: "", justificativa: "", possui_andamento: false });
      setModoEdicao(true);
      onRespostaAtualizada({ ...item, resposta: { situacao: null, observacoes: null, justificativa: null, possui_andamento: null } });
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoadingDelete(false);
    }
  };

  const labelStyle = {
    fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.15em",
    textTransform: "uppercase", color: "rgba(107,15,43,0.45)", margin: "0 0 6px", display: "block",
  };
  const valueStyle = { fontFamily: "var(--font-sans)", fontSize: 13, color: "#3d0818", lineHeight: 1.6, margin: 0 };
  const inputStyle = {
    width: "100%", backgroundColor: "transparent", border: "none",
    borderBottom: "1px solid rgba(107,15,43,0.3)", padding: "6px 0",
    fontSize: 13, color: "#3d0818", fontFamily: "var(--font-sans)",
    outline: "none", boxSizing: "border-box", resize: "vertical",
  };

  return (
    <div
      className="smooth-overlay"
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(20,5,12,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, backdropFilter: "blur(6px)", padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="resposta-modal smooth-pop" style={{ backgroundColor: "#FDFAF6", borderRadius: "10px",
        width: "100%", maxWidth: 680, maxHeight: "92vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 32px 80px rgba(107,15,43,0.22)",
        border: "1px solid rgba(107,15,43,0.1)" }}>

        {/* Header */}
        <div className="resposta-modal__header" style={{ padding: "32px 36px 24px", borderBottom: "1px solid rgba(107,15,43,0.08)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "rgba(107,15,43,0.4)", margin: "0 0 4px" }}>
              {c.indice}
            </p>
            <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 24,
              fontWeight: 700, color: "#6B0F2B", margin: "0 0 12px", lineHeight: 1.2 }}>
              {c.titulo}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {form.situacao
                ? <StatusBadge situacao={form.situacao} />
                : <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "rgba(107,15,43,0.35)",
                    padding: "5px 14px", border: "1px dashed rgba(107,15,43,0.2)", borderRadius: 6 }}>
                    Pendente
                  </span>
              }
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%",
            border: "1px solid rgba(107,15,43,0.15)", backgroundColor: "transparent",
            cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="#6B0F2B" />
          </button>
        </div>

        {/* Body */}
        <div className="resposta-modal__body" style={{ overflowY: "auto", flex: 1, padding: "28px 36px 36px",
          display: "flex", flexDirection: "column", gap: 24 }}>

          {c.descricao && (
            <div>
              <span style={labelStyle}>Descrição do Controle</span>
              <p style={{ ...valueStyle, color: "rgba(61,8,24,0.75)" }}>{c.descricao}</p>
            </div>
          )}
          {c.categoria && (
            <div>
              <span style={labelStyle}>Categoria</span>
              <p style={valueStyle}>{c.categoria}</p>
            </div>
          )}

          {(c.tipos_controle?.length > 0 || c.propriedades_si?.length > 0 ||
            c.conceitos_si?.length > 0 || c.capacidades_operacionais?.length > 0 ||
            c.dominios_seguranca?.length > 0 || c.temas_controle?.length > 0) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14,
              padding: 20, backgroundColor: "rgba(107,15,43,0.03)",
              borderRadius: "8px", border: "1px solid rgba(107,15,43,0.07)" }}>
              <TagList items={c.tipos_controle} label="Tipos de Controle" />
              <TagList items={c.propriedades_si} label="Propriedades de SI" />
              <TagList items={c.conceitos_si} label="Conceitos de SI" />
              <TagList items={c.capacidades_operacionais} label="Capacidades Operacionais" />
              <TagList items={c.dominios_seguranca} label="Domínios de Segurança" />
              <TagList items={c.temas_controle} label="Temas de Controle" />
            </div>
          )}

          {(c.atributos_anexos?.length > 0 || c.tipos_controle_anexo?.length > 0) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14,
              padding: 20, backgroundColor: "rgba(107,15,43,0.03)",
              borderRadius: "8px", border: "1px solid rgba(107,15,43,0.07)" }}>
              {c.anexoB && <div><span style={labelStyle}>Anexo B</span><p style={valueStyle}>{c.anexoB}</p></div>}
              {c.orientacao_anexoB && <div><span style={labelStyle}>Orientação Anexo B</span><p style={{ ...valueStyle, color: "rgba(61,8,24,0.75)" }}>{c.orientacao_anexoB}</p></div>}
              <TagList items={c.atributos_anexos} label="Atributos Anexos" />
              <TagList items={c.tipos_controle_anexo} label="Tipos de Controle Anexo" />
            </div>
          )}

          <div style={{ height: 1, backgroundColor: "rgba(107,15,43,0.08)" }} />

          {/* Resposta */}
          <div>
            <div className="resposta-modal__answer-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 20,
                color: "#6B0F2B", fontStyle: "italic", margin: 0 }}>
                Resposta do controle
              </p>
              {!modoEdicao && temResposta && !bloqueado && (
                <div className="resposta-modal__answer-actions" style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setModoEdicao(true); setErro(""); setSucesso(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px",
                      borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-sans)",
                      fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600,
                      backgroundColor: "transparent", color: "#6B0F2B",
                      border: "1px solid rgba(107,15,43,0.25)" }}>
                    <Edit3 size={12} /> Editar
                  </button>
                  <button onClick={handleDeletar} disabled={loadingDelete}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
                      borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-sans)",
                      fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600,
                      backgroundColor: "transparent", color: "#7f1d1d",
                      border: "1px solid rgba(127,29,29,0.25)",
                      opacity: loadingDelete ? 0.6 : 1 }}>
                    <Trash2 size={12} /> {loadingDelete ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              )}
              {bloqueado && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 6,
                  border: "1px solid rgba(20,83,45,0.2)",
                  backgroundColor: "rgba(20,83,45,0.08)",
                  color: "#14532d", fontFamily: "var(--font-sans)", fontSize: 11,
                  letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                  <Lock size={12} /> Concluída
                </span>
              )}
            </div>

            {/* Modo leitura */}
            {!modoEdicao && temResposta && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {r.observacoes && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={labelStyle}>Observações</span>
                    <p style={valueStyle}>{r.observacoes}</p>
                  </div>
                )}
                {r.justificativa && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={labelStyle}>Justificativa</span>
                    <p style={valueStyle}>{r.justificativa}</p>
                  </div>
                )}
                {r.possui_andamento !== null && r.possui_andamento !== undefined && (
                  <div>
                    <span style={labelStyle}>Possui Andamento</span>
                    <p style={valueStyle}>{r.possui_andamento ? "Sim" : "Não"}</p>
                  </div>
                )}
              </div>
            )}

            {!modoEdicao && !temResposta && bloqueado && (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12,
                color: "rgba(107,15,43,0.55)", margin: 0 }}>
                Esta auditoria foi concluída sem resposta para este controle.
              </p>
            )}

            {/* Modo edição */}
            {modoEdicao && (
              <form onSubmit={handleSalvar} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <span style={labelStyle}>Situação *</span>
                  <div style={{ position: "relative" }}>
                    <button type="button" onClick={() => setDropdownAberto(!dropdownAberto)}
                      style={{ width: "100%", backgroundColor: "transparent", border: "none",
                        borderBottom: "1px solid rgba(107,15,43,0.3)", padding: "6px 0",
                        fontSize: 13, color: form.situacao ? "#3d0818" : "rgba(107,15,43,0.35)",
                        fontFamily: "var(--font-sans)", outline: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {form.situacao ? STATUS_MAP[form.situacao]?.label : "Selecione a situação"}
                      <ChevronDown size={16} color="#6B0F2B"
                        style={{ transform: dropdownAberto ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                    </button>
                    {dropdownAberto && (
                      <div className="smooth-open" style={{ position: "absolute", top: "100%", left: 0, right: 0,
                        backgroundColor: "white", borderRadius: 12,
                        boxShadow: "0 8px 32px rgba(107,15,43,0.15)",
                        overflow: "hidden", zIndex: 10, marginTop: 4 }}>
                        {Object.entries(STATUS_MAP).map(([key, { label, Icon, color, bg }]) => (
                          <button key={key} type="button"
                            onClick={() => { setForm(p => ({ ...p, situacao: key })); setDropdownAberto(false); }}
                            style={{ width: "100%", padding: "12px 16px", textAlign: "left",
                              background: form.situacao === key ? bg : "none",
                              border: "none", cursor: "pointer",
                              fontFamily: "var(--font-sans)", fontSize: 13, color,
                              display: "flex", alignItems: "center", gap: 8 }}
                            onMouseEnter={e => { if (form.situacao !== key) e.currentTarget.style.backgroundColor = "rgba(107,15,43,0.04)"; }}
                            onMouseLeave={e => { if (form.situacao !== key) e.currentTarget.style.backgroundColor = "transparent"; }}>
                            <Icon size={14} strokeWidth={2} /> {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Observações</label>
                  <textarea value={form.observacoes}
                    onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                    rows={3} placeholder="Descreva as observações..."
                    style={{ ...inputStyle, paddingTop: 8 }} />
                </div>

                <div>
                  <label style={labelStyle}>Justificativa</label>
                  <textarea value={form.justificativa}
                    onChange={e => setForm(p => ({ ...p, justificativa: e.target.value }))}
                    rows={3} placeholder="Justifique a situação escolhida..."
                    style={{ ...inputStyle, paddingTop: 8 }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button type="button"
                    onClick={() => setForm(p => ({ ...p, possui_andamento: !p.possui_andamento }))}
                    style={{ width: 40, height: 22, borderRadius: 6, border: "none", cursor: "pointer",
                      backgroundColor: form.possui_andamento ? "#6B0F2B" : "rgba(107,15,43,0.15)",
                      transition: "background-color 0.2s", position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "white",
                      position: "absolute", top: 3,
                      left: form.possui_andamento ? 21 : 3, transition: "left 0.2s",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                  </button>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 12,
                    color: "rgba(107,15,43,0.65)", letterSpacing: "0.05em" }}>
                    Possui andamento em curso
                  </span>
                </div>

                {erro && <p style={{ color: "#7f1d1d", fontSize: 12, textAlign: "center", margin: 0 }}>{erro}</p>}

                <div className="resposta-modal__form-actions" style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                  {temResposta && (
                    <button type="button"
                      onClick={() => { setModoEdicao(false); setErro(""); setSucesso("");
                        setForm({ situacao: r.situacao || "", observacoes: r.observacoes || "",
                          justificativa: r.justificativa || "", possui_andamento: r.possui_andamento || false }); }}
                      style={{ padding: "10px 24px", borderRadius: 6, backgroundColor: "transparent",
                        color: "#6B0F2B", border: "1px solid rgba(107,15,43,0.25)",
                        fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "2px",
                        textTransform: "uppercase", cursor: "pointer" }}>
                      Cancelar
                    </button>
                  )}
                  <button type="submit" disabled={loading}
                    style={{ display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 28px", borderRadius: 6, backgroundColor: "#6B0F2B",
                      color: "#D4C5A9", border: "none", fontFamily: "var(--font-sans)",
                      fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
                      fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1 }}>
                    <Save size={13} />
                    {loading ? "Salvando..." : "Salvar Resposta"}
                  </button>
                </div>
              </form>
            )}

            {sucesso && (
              <p style={{ color: "#14532d", fontSize: 12, textAlign: "center",
                margin: "8px 0 0", fontFamily: "var(--font-sans)" }}>
                {sucesso}
              </p>
            )}
          </div>

          {(evidencias.length > 0 || !bloqueado) && (
            <div>
              <div style={{ height: 1, backgroundColor: "rgba(107,15,43,0.08)", marginBottom: 16 }} />
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 18,
                color: "#6B0F2B", fontStyle: "italic", margin: "0 0 12px" }}>Evidências</p>

              {!bloqueado && modoEdicao === true && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={labelStyle}>Descrição</label>
                    <input
                      value={form.descricao || ""}
                      onChange={(e) => setForm(p => ({ ...p, descricao: e.target.value }))}
                      placeholder="Ex: print da tela / documento" 
                      style={{ ...inputStyle, paddingTop: 8 }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => setForm(p => ({ ...p, evidFile: e.target.files?.[0] || null }))}
                      style={{ flex: 1 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (!form.evidFile) {
                          setErro("Selecione um arquivo para anexar.");
                          return;
                        }
                        setErro("");
                        setSucesso("");
                        setLoading(true);
                        const fd = new FormData();
                        fd.append("arquivo", form.evidFile);
                        fd.append("descricao", form.descricao || "");

                        const resp = await fetch(
                          `${BASE}/auditoria/${idAuditoria}/${normaSlug}/controle/${c.id}/evidencias/`,
                          {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                            body: fd,
                          }
                        );
                        const data = await resp.json().catch(() => ({}));
                        if (!resp.ok) {
                          setErro(data.detail || "Erro ao anexar evidência.");
                          return;
                        }
                        setSucesso("Evidência anexada com sucesso!");
                        setForm(p => ({ ...p, evidFile: null }));
                        setEvidencias(Array.isArray(data) ? data : []);
                      } catch {
                        setErro("Erro ao conectar com o servidor.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={bloqueado || loading}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 6,
                      backgroundColor: "#6B0F2B",
                      color: "#D4C5A9",
                      border: "none",
                      cursor: bloqueado || loading ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-sans)",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      opacity: bloqueado || loading ? 0.65 : 1,
                    }}
                  >
                    {loading ? "Anexando..." : "Anexar evidência"}
                  </button>

                </div>
              )}

              {evidencias.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {evidencias.map((ev, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 16px", backgroundColor: "rgba(107,15,43,0.04)",
                      borderRadius: "6px", border: "1px solid rgba(107,15,43,0.08)" }}>
                      <Paperclip size={13} color="#6B0F2B" />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "#6B0F2B", margin: 0 }}>
                          {ev.descricao}
                        </p>
                        {ev.arquivo && (
                          <a href={`http://localhost:8000${ev.arquivo}`} target="_blank" rel="noreferrer"
                            style={{ fontFamily: "var(--font-sans)", fontSize: 11,
                              color: "rgba(107,15,43,0.5)", letterSpacing: "0.1em" }}>
                            Ver arquivo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {evidencias.length === 0 && bloqueado === false && (
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(107,15,43,0.55)", margin: 0 }}>
                  Nenhuma evidência anexada ainda.
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function RespostasAuditoriaPage() {
  const { id_auditoria } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Fulano da Silva");
  const [userRole, setUserRole] = useState("Auditor");
  const [controles, setControles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalItem, setModalItem] = useState(null);
  const [filtro, setFiltro] = useState("TODOS");

  const [finalizando, setFinalizando] = useState(false);
  const [auditoriaFinalizada, setAuditoriaFinalizada] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  const norma     = state?.norma    || "";
  const empresa   = state?.empresa  || "";
  const nomeAuditoria = state?.nome || `Auditoria #${id_auditoria}`;
  const statusInicial = state?.status || "";
  const normaSlug = NORMA_SLUG[norma] || "27002";

  const token = () => localStorage.getItem("access_token");

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setUserName(p.name || p.username || "Auditor");
        setUserRole(p.cargo || "Auditor");
        setIsSuperuser(Boolean(p.is_superuser || p.isSuperuser));
      } catch {}
    }
    setAuditoriaFinalizada(isConcluida(statusInicial));
    fetchAuditoriaStatus();
    fetchRespostas();
  }, []);

  const fetchAuditoriaStatus = async () => {
    try {
      const r = await fetch(`${BASE_AUDITORIAS}/${id_auditoria}/`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (r.ok) {
        const data = await r.json();
        setAuditoriaFinalizada(isConcluida(data.status));
        if (data.is_superuser !== undefined) setIsSuperuser(Boolean(data.is_superuser));
      }
    } catch {}
  };

  const fetchRespostas = async () => {
    setLoading(true); setErro("");
    try {
      const r = await fetch(
        `${BASE}/auditoria/${id_auditoria}/${normaSlug}/respostas/`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (r.ok) setControles(await r.json());
      else await fetchControlesIndividuais();
    } catch {
      await fetchControlesIndividuais();
    } finally {
      setLoading(false);
    }
  };

  const fetchControlesIndividuais = async () => {
    const lista = [];
    let id = 1;
    while (true) {
      try {
        const r = await fetch(
          `${BASE}/auditoria/${id_auditoria}/${normaSlug}/controle/${id}/`,
          { headers: { Authorization: `Bearer ${token()}` } }
        );
        if (!r.ok) break;
        lista.push(await r.json());
        id++;
      } catch { break; }
    }
    setControles(lista);
  };

  const handleRespostaAtualizada = (itemAtualizado) => {
    setControles(prev =>
      prev.map(c => c.controle.id === itemAtualizado.controle.id ? itemAtualizado : c)
    );
    setModalItem(itemAtualizado);
  };

  const handleStatusChange = (itemAtualizado) => {
    setControles(prev =>
      prev.map(c => c.controle.id === itemAtualizado.controle.id ? itemAtualizado : c)
    );
    if (modalItem?.controle?.id === itemAtualizado.controle.id) setModalItem(itemAtualizado);
  };

  // CORREÇÃO: usa BASE_AUDITORIAS correto + redirect após finalizar
  const handleFinalizarAuditoria = async () => {
    if (auditoriaFinalizada) return;
    if (!window.confirm("Deseja finalizar esta auditoria? O status será alterado para Concluída.")) return;
    setFinalizando(true);
    try {
      const resp = await fetch(`${BASE_AUDITORIAS}/${id_auditoria}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status: "CONCLUIDA" }),
      });
      if (resp.ok) {
        setAuditoriaFinalizada(true);
        setTimeout(() => navigate("/auditorias"), 2000);
      } else {
        const data = await resp.json().catch(() => ({}));
        alert(data.detail || "Erro ao finalizar a auditoria.");
      }
    } catch {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setFinalizando(false);
    }
  };

  // ── estatísticas ──────────────────────────────────────────────────────────
  const respondidos  = controles.filter(c => c.resposta?.situacao);
  const conformes    = controles.filter(c => c.resposta?.situacao === "CONFORME").length;
  const naoConformes = controles.filter(c => c.resposta?.situacao === "NAO_CONFORME").length;
  const naoAplica    = controles.filter(c => c.resposta?.situacao === "NAO_APLICA").length;
  const pendentes    = controles.length - respondidos.length;
  const respostasBloqueadas = auditoriaFinalizada && !isSuperuser;

  const FILTROS = [
    { key: "TODOS",        label: "Todos",        count: controles.length },
    { key: "CONFORME",     label: "Conformes",     count: conformes },
    { key: "NAO_CONFORME", label: "Não Conformes", count: naoConformes },
    { key: "NAO_APLICA",   label: "Não Aplica",    count: naoAplica },
    { key: "PENDENTE",     label: "Pendentes",     count: pendentes },
  ];

  const controlesFiltrados = controles.filter(c => {
    if (filtro === "TODOS")    return true;
    if (filtro === "PENDENTE") return !c.resposta?.situacao;
    return c.resposta?.situacao === filtro;
  });

  const labelStyle = {
    fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.15em",
    textTransform: "uppercase", color: "rgba(107,15,43,0.45)", margin: 0,
  };

  return (
    <div className="resposta-auditoria-page app-shell-page" style={{ minHeight: "100vh", backgroundColor: "#F4EFE6", display: "flex" }}>
      <Sidebar userName={userName} userSub={userRole} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column",
        padding: "48px 80px 64px 120px", gap: 36,
        overflowY: "auto", maxWidth: 1600, margin: "0 auto", width: "100%" }}>

        {/* Cabeçalho */}
        <div style={{ borderBottom: "1px solid rgba(107,15,43,0.1)", paddingBottom: 28 }}>
          <button onClick={() => navigate(-1)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none",
              border: "none", cursor: "pointer", padding: "0 0 16px",
              fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.15em",
              textTransform: "uppercase", color: "rgba(107,15,43,0.45)" }}>
            <ArrowLeft size={14} color="rgba(107,15,43,0.45)" /> Voltar
          </button>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 20,
            fontStyle: "italic", color: "rgba(107,15,43,0.55)", margin: 0 }}>
            Respostas da Auditoria
          </p>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 42,
            fontWeight: 700, color: "#6B0F2B", margin: "4px 0 10px" }}>
            {nomeAuditoria}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {empresa && (
              <>
                <p style={labelStyle}>{empresa}</p>
                <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "rgba(107,15,43,0.25)" }} />
              </>
            )}
            <p style={labelStyle}>{norma}</p>
            <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "rgba(107,15,43,0.25)" }} />
            <p style={labelStyle}>#{id_auditoria}</p>
            {respostasBloqueadas && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "rgba(107,15,43,0.25)" }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 6,
                  backgroundColor: "rgba(20,83,45,0.1)",
                  border: "1px solid rgba(20,83,45,0.2)",
                  color: "#14532d", fontFamily: "var(--font-sans)", fontSize: 11,
                  letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                  <Lock size={11} /> Somente leitura
                </span>
              </>
            )}
            {auditoriaFinalizada && isSuperuser && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "rgba(107,15,43,0.25)" }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 6,
                  backgroundColor: "rgba(107,15,43,0.08)",
                  border: "1px solid rgba(107,15,43,0.2)",
                  color: "#6B0F2B", fontFamily: "var(--font-sans)", fontSize: 11,
                  letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                  <Edit3 size={11} /> Edição liberada
                </span>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: 80, gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%",
              border: "2px solid rgba(107,15,43,0.15)", borderTopColor: "#6B0F2B",
              animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 18,
              color: "rgba(107,15,43,0.4)", margin: 0 }}>Carregando respostas…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : erro ? (
          <div style={{ padding: 40, textAlign: "center",
            fontFamily: "var(--font-sans)", fontSize: 13, color: "#7f1d1d" }}>{erro}</div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <SummaryCard icon={BarChart3}    label="Total de Controles" value={controles.length} color="#6B0F2B" bg="rgba(107,15,43,0.08)" />
              <SummaryCard icon={CheckCircle2} label="Conformes"          value={conformes}        color="#14532d" bg="rgba(20,83,45,0.08)"   />
              <SummaryCard icon={XCircle}      label="Não Conformes"      value={naoConformes}     color="#7f1d1d" bg="rgba(127,29,29,0.08)"  />
              <SummaryCard icon={MinusCircle}  label="Não Aplica"         value={naoAplica}        color="#78350f" bg="rgba(120,53,15,0.08)"  />
              <ProgressBar value={respondidos.length} total={controles.length} />
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FILTROS.map(f => (
                <button key={f.key} onClick={() => setFiltro(f.key)}
                  style={{ padding: "8px 20px", borderRadius: 6, cursor: "pointer",
                    fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.12em",
                    textTransform: "uppercase", fontWeight: 600, transition: "all 0.15s ease",
                    backgroundColor: filtro === f.key ? "#6B0F2B" : "white",
                    color: filtro === f.key ? "#D4C5A9" : "rgba(107,15,43,0.55)",
                    border: filtro === f.key ? "1px solid #6B0F2B" : "1px solid rgba(107,15,43,0.15)" }}>
                  {f.label}
                  <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 11 }}>({f.count})</span>
                </button>
              ))}
            </div>

            {/* Lista */}
            {controlesFiltrados.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: 60, backgroundColor: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(107,15,43,0.08)", borderRadius: "8px", gap: 12 }}>
                <FileText size={40} color="rgba(107,15,43,0.2)" strokeWidth={1} />
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 20,
                  color: "rgba(107,15,43,0.4)", margin: 0 }}>
                  Nenhum controle encontrado para este filtro
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {controlesFiltrados.map((item, i) => (
                  <ControleRow
                    key={item.controle?.id || i}
                    item={item} index={i}
                    onClick={setModalItem}
                    onStatusChange={handleStatusChange}
                    normaSlug={normaSlug}
                    idAuditoria={id_auditoria}
                    token={token()}
                    bloqueado={respostasBloqueadas}
                  />
                ))}
              </div>
            )}

            {/* Finalizar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              paddingTop: 24, paddingBottom: 8,
              borderTop: "1px solid rgba(107,15,43,0.1)", marginTop: 8 }}>
              {auditoriaFinalizada ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10,
                  padding: "14px 32px", borderRadius: 6,
                  backgroundColor: "rgba(20,83,45,0.1)", border: "1px solid rgba(20,83,45,0.25)" }}>
                  <CheckCircle2 size={16} color="#14532d" strokeWidth={2} />
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.18em",
                    textTransform: "uppercase", fontWeight: 600, color: "#14532d" }}>
                    Auditoria Concluída
                  </span>
                </div>
              ) : (
                <>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "rgba(107,15,43,0.35)", margin: 0 }}>
                    {respondidos.length} de {controles.length} controles respondidos
                  </p>
                  <button
                    onClick={handleFinalizarAuditoria}
                    disabled={finalizando}
                    style={{ display: "inline-flex", alignItems: "center", gap: 10,
                      padding: "14px 40px", borderRadius: 6,
                      cursor: finalizando ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.18em",
                      textTransform: "uppercase", fontWeight: 600,
                      backgroundColor: "#6B0F2B", color: "#D4C5A9", border: "none",
                      opacity: finalizando ? 0.65 : 1,
                      boxShadow: "0 4px 20px rgba(107,15,43,0.25)",
                      transition: "box-shadow 0.2s ease" }}
                    onMouseEnter={e => { if (!finalizando) e.currentTarget.style.boxShadow = "0 6px 28px rgba(107,15,43,0.4)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(107,15,43,0.25)"; }}>
                    {finalizando
                      ? <span style={{ width: 14, height: 14, border: "2px solid rgba(212,197,169,0.4)",
                          borderTopColor: "#D4C5A9", borderRadius: "50%", display: "inline-block",
                          animation: "spin 0.6s linear infinite" }} />
                      : <CheckCircle2 size={15} strokeWidth={2} />
                    }
                    {finalizando ? "Finalizando…" : "Finalizar Auditoria"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </main>

      {modalItem && (
        <DetalheModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          normaSlug={normaSlug}
          idAuditoria={id_auditoria}
          token={token()}
          onRespostaAtualizada={handleRespostaAtualizada}
          bloqueado={respostasBloqueadas}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
