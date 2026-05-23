import React, { useEffect, useState, useCallback } from "react";
import "./styles.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  ClipboardList, Plus, ChevronDown, Pencil,
  Trash2, PlayCircle, X, Lock, CheckCircle2, BarChart3,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const isConcluida = (status) =>
  status === "CONCLUIDA" || status === "concluida";

const BASE = "http://localhost:8000/controles";

// ─── sub-components ──────────────────────────────────────────────────────────

const labelStyle = {
  fontFamily: "var(--font-sans)", fontSize: "10px", letterSpacing: "0.15em",
  textTransform: "uppercase", color: "#6B0F2B", display: "block", marginBottom: "4px",
  opacity: 0.6,
};

const inputStyle = {
  width: "100%", backgroundColor: "transparent", border: "none",
  borderBottom: "1px solid rgba(107,15,43,0.35)", padding: "6px 0",
  fontSize: "13px", color: "#6B0F2B", fontFamily: "var(--font-sans)",
  outline: "none", boxSizing: "border-box",
};

function StatusBadge({ status }) {
  const ok = isConcluida(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 14px", borderRadius: 6, fontSize: 11,
      fontFamily: "var(--font-sans)", letterSpacing: "0.1em",
      textTransform: "uppercase", fontWeight: 600,
      backgroundColor: ok ? "rgba(20,83,45,0.1)" : "rgba(107,15,43,0.08)",
      color: ok ? "#14532d" : "#6B0F2B",
    }}>
      {ok ? <CheckCircle2 size={11} strokeWidth={2} /> : null}
      {ok ? "Concluída" : "Inconcluída"}
    </span>
  );
}

function DropdownSelect({ aberto, setAberto, valor, setValor, opcoes, placeholder, labelKey, valueKey }) {
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setAberto(!aberto)}
        style={{
          ...inputStyle, display: "flex", alignItems: "center",
          justifyContent: "space-between", cursor: "pointer",
          background: "none", border: "none",
          borderBottom: "1px solid rgba(107,15,43,0.35)", width: "100%",
          color: valor ? "#6B0F2B" : "rgba(107,15,43,0.35)",
        }}>
        {valor ? opcoes.find(o => o[valueKey] == valor)?.[labelKey] : placeholder}
        <ChevronDown size={16} color="#6B0F2B"
          style={{ transform: aberto ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {aberto && (
        <div className="smooth-open" style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          backgroundColor: "white", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(107,15,43,0.15)",
          overflow: "hidden", zIndex: 10, marginTop: 4,
          maxHeight: 200, overflowY: "auto",
        }}>
          {opcoes.map(opcao => (
            <button key={opcao[valueKey]} type="button"
              onClick={() => { setValor(opcao[valueKey]); setAberto(false); }}
              style={{
                width: "100%", padding: "12px 16px", textAlign: "left",
                background: valor == opcao[valueKey] ? "rgba(107,15,43,0.08)" : "none",
                border: "none", cursor: "pointer",
                fontFamily: "var(--font-sans)", fontSize: 13, color: "#6B0F2B",
              }}
              onMouseEnter={e => e.target.style.backgroundColor = "rgba(107,15,43,0.05)"}
              onMouseLeave={e => e.target.style.backgroundColor = valor == opcao[valueKey] ? "rgba(107,15,43,0.08)" : "transparent"}>
              {opcao[labelKey]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function AuditoriasPage() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Fulano da Silva");
  const [userRole, setUserRole] = useState("Auditor");
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [auditorias, setAuditorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [normas, setNormas] = useState([]);

  // criar
  const [formAberto, setFormAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [form, setForm] = useState({ nome: "", id_empresa: "", id_norma: "", data_auditoria: "", descricao: "" });
  const [empresaAberto, setEmpresaAberto] = useState(false);
  const [normaAberto, setNormaAberto] = useState(false);

  // editar
  const [modalAberto, setModalAberto] = useState(false);
  const [auditoriaEditando, setAuditoriaEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ nome: "", id_empresa: "", id_norma: "", data_auditoria: "", descricao: "" });
  const [empresaEditAberto, setEmpresaEditAberto] = useState(false);
  const [normaEditAberto, setNormaEditAberto] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [erroEdit, setErroEdit] = useState("");

  // deletar
  const [deletandoId, setDeletandoId] = useState(null);

  const token = () => localStorage.getItem("access_token");

  const fetchAuditorias = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/auditorias/view`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (r.ok) setAuditorias(await r.json());
    } catch {}
  }, []);

  const fetchEmpresas = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/empresas/view`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (r.ok) setEmpresas(await r.json());
    } catch {}
  }, []);

  const fetchNormas = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/normas/`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (r.ok) setNormas(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setUserName(p.name || p.username || "Lead Auditor");
        setUserRole(p.cargo || "Auditor");
        setIsSuperuser(Boolean(p.is_superuser || p.isSuperuser));
      } catch {}
    }
    fetchAuditorias();
    fetchEmpresas();
    fetchNormas();
  }, []);

  // refetch quando a aba volta ao foco (ex: após finalizar auditoria)
  useEffect(() => {
    const onFocus = () => fetchAuditorias();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAuditorias]);

  // ── criar ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(""); setSucesso(""); setLoading(true);
    try {
      const r = await fetch(`${BASE}/auditorias/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) { setErro(data.detail || "Erro ao criar auditoria."); return; }
      setSucesso("Auditoria criada com sucesso!");
      setForm({ nome: "", id_empresa: "", id_norma: "", data_auditoria: "", descricao: "" });
      setFormAberto(false);
      fetchAuditorias();
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // ── editar ────────────────────────────────────────────────────────────────

  const abrirModal = (auditoria) => {
    const podeEditarConcluida = isSuperuser || auditoria.pode_editar_concluida;
    if (isConcluida(auditoria.status) && !podeEditarConcluida) return; // guard extra
    setAuditoriaEditando(auditoria);
    const empresa = empresas.find(e => e.nome === auditoria.empresa);
    const norma   = normas.find(n => n.nome === auditoria.norma);
    setFormEdit({
      nome:           auditoria.nome || "",
      id_empresa:     empresa?.id_empresa || "",
      id_norma:       norma?.id_norma     || "",
      data_auditoria: auditoria.data_auditoria,
      descricao:      auditoria.descricao,
    });
    setErroEdit("");
    setModalAberto(true);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setErroEdit(""); setLoadingEdit(true);
    try {
      const r = await fetch(`${BASE}/auditorias/${auditoriaEditando.id_auditoria}/edit/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(formEdit),
      });
      const data = await r.json();
      if (!r.ok) { setErroEdit(data.detail || "Erro ao editar."); return; }
      setModalAberto(false);
      fetchAuditorias();
    } catch {
      setErroEdit("Erro ao conectar com o servidor.");
    } finally {
      setLoadingEdit(false);
    }
  };

  // ── deletar ───────────────────────────────────────────────────────────────

  const handleDeletar = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta auditoria?")) return;
    setDeletandoId(id);
    try {
      await fetch(`${BASE}/auditorias/${id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      fetchAuditorias();
    } catch {}
    finally { setDeletandoId(null); }
  };

  // ── responder ─────────────────────────────────────────────────────────────

  const handleResponder = (auditoria) => {
    navigate(`/auditorias/${auditoria.id_auditoria}/responder`, {
      state: { nome: auditoria.nome, norma: auditoria.norma, empresa: auditoria.empresa, status: auditoria.status },
    });
  };

  const handleDashboard = (auditoria) => {
    navigate(`/auditorias/${auditoria.id_auditoria}/dashboard`, {
      state: {
        id_auditoria: auditoria.id_auditoria,
        norma: auditoria.norma,
        nome: auditoria.nome,
        empresa: auditoria.empresa,
        status: auditoria.status,
        data_auditoria: auditoria.data_auditoria,
        auditor: auditoria.auditor,
        descricao: auditoria.descricao,
      },
    });
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="auditorias-page app-shell-page" style={{ minHeight: "100vh", backgroundColor: "#F4EFE6", display: "flex" }}>
      <Sidebar userName={userName} userSub={userRole} />

      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        padding: "48px 80px 48px 120px", gap: 36,
        overflowY: "auto", maxWidth: 1600, margin: "0 auto", width: "100%",
      }}>

        {/* ── Cabeçalho ── */}
        <div style={{ borderBottom: "1px solid rgba(107,15,43,0.1)", paddingBottom: 28 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 20,
            fontStyle: "italic", color: "rgba(107,15,43,0.55)", margin: 0 }}>
            Gestão de
          </p>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 42,
            fontWeight: 700, color: "#6B0F2B", margin: "4px 0 10px" }}>
            Auditorias
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(107,15,43,0.45)",
            letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            {auditorias.length} auditoria{auditorias.length !== 1 ? "s" : ""} encontrada{auditorias.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Formulário criar ── */}
        <div style={{ backgroundColor: "white", border: "1px solid rgba(107,15,43,0.08)",
          borderRadius: "8px", overflow: "hidden" }}>
          <button
            onClick={() => { setFormAberto(!formAberto); setErro(""); setSucesso(""); }}
            style={{ width: "100%", padding: "24px 32px", display: "flex", alignItems: "center",
              justifyContent: "space-between", background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#6B0F2B",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={18} color="#D4C5A9" />
              </div>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 20, color: "#6B0F2B" }}>
                Criar nova auditoria
              </span>
            </div>
            <ChevronDown size={20} color="#6B0F2B"
              style={{ transform: formAberto ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }} />
          </button>

          {formAberto && (
            <form className="smooth-open" onSubmit={handleSubmit}
              style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ height: 1, backgroundColor: "rgba(107,15,43,0.08)", marginBottom: 8 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Nome da Auditoria</label>
                  <input type="text" required value={form.nome}
                    onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                    placeholder="Ex: Auditoria LGPD - Filial Norte" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Empresa</label>
                  <DropdownSelect aberto={empresaAberto} setAberto={setEmpresaAberto}
                    valor={form.id_empresa} setValor={v => setForm(p => ({ ...p, id_empresa: v }))}
                    opcoes={empresas} placeholder="Selecione a empresa" labelKey="nome" valueKey="id_empresa" />
                </div>
                <div>
                  <label style={labelStyle}>Norma</label>
                  <DropdownSelect aberto={normaAberto} setAberto={setNormaAberto}
                    valor={form.id_norma} setValor={v => setForm(p => ({ ...p, id_norma: v }))}
                    opcoes={normas} placeholder="Selecione a norma" labelKey="nome" valueKey="id_norma" />
                </div>
                <div>
                  <label style={labelStyle}>Data da Auditoria</label>
                  <input type="date" required value={form.data_auditoria}
                    onChange={e => setForm(p => ({ ...p, data_auditoria: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Descrição</label>
                  <input type="text" required value={form.descricao}
                    onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                    placeholder="Breve descrição da auditoria" style={inputStyle} />
                </div>
              </div>
              {erro && <p style={{ color: "#7f1d1d", fontSize: 12, textAlign: "center", margin: 0 }}>{erro}</p>}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => { setFormAberto(false); setErro(""); }}
                  style={{ padding: "10px 28px", borderRadius: 6, backgroundColor: "transparent",
                    color: "#6B0F2B", border: "1px solid rgba(107,15,43,0.3)",
                    fontFamily: "var(--font-sans)", fontSize: 12, letterSpacing: "2px",
                    textTransform: "uppercase", cursor: "pointer" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  style={{ padding: "10px 28px", borderRadius: 6, backgroundColor: "#6B0F2B",
                    color: "#D4C5A9", border: "none", fontFamily: "var(--font-sans)",
                    fontSize: 12, letterSpacing: "2px", textTransform: "uppercase",
                    fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
                  {loading ? "Criando..." : "Criar Auditoria"}
                </button>
              </div>
            </form>
          )}
        </div>

        {sucesso && (
          <p style={{ color: "#14532d", fontSize: 13, textAlign: "center", margin: "-20px 0" }}>
            {sucesso}
          </p>
        )}

        {/* ── Lista ── */}
        {auditorias.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: 60,
            backgroundColor: "rgba(255,255,255,0.4)",
            border: "1px solid rgba(107,15,43,0.08)", borderRadius: "8px", gap: 16 }}>
            <ClipboardList size={48} color="rgba(107,15,43,0.2)" strokeWidth={1} />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 20,
              color: "rgba(107,15,43,0.4)", margin: 0 }}>
              Nenhuma auditoria encontrada
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
            {auditorias.map(auditoria => {
              const concluida  = isConcluida(auditoria.status);
              const podeEditarConcluida = isSuperuser || auditoria.pode_editar_concluida;
              const edicaoBloqueada = concluida && !podeEditarConcluida;
              const deletando  = deletandoId === auditoria.id_auditoria;

              return (
                <div key={auditoria.id_auditoria} style={{
                  backgroundColor: "white",
                  border: concluida
                    ? "1px solid rgba(20,83,45,0.15)"
                    : "1px solid rgba(107,15,43,0.08)",
                  borderRadius: "8px", padding: 32,
                  display: "flex", flexDirection: "column", gap: 16,
                  opacity: deletando ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}>

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        backgroundColor: concluida ? "rgba(20,83,45,0.12)" : "#6B0F2B",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {concluida
                          ? <CheckCircle2 size={18} color="#14532d" strokeWidth={1.5} />
                          : <ClipboardList size={18} color="#D4C5A9" />
                        }
                      </div>
                      <div>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 20,
                          color: "#6B0F2B", margin: 0 }}>
                          {auditoria.nome || auditoria.empresa}
                        </p>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11,
                          color: "rgba(107,15,43,0.45)", margin: 0 }}>
                          {auditoria.empresa} · #{auditoria.id_auditoria}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={auditoria.status} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                      { label: "Auditoria", value: auditoria.nome || `Auditoria #${auditoria.id_auditoria}` },
                      { label: "Norma",     value: auditoria.norma },
                      { label: "Data",      value: auditoria.data_auditoria },
                      { label: "Auditor",   value: auditoria.auditor },
                      { label: "Descrição", value: auditoria.descricao },
                    ].map(({ label, value }) => (
                      <div key={label} style={label === "Descrição" ? { gridColumn: "1 / -1" } : {}}>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.12em",
                          textTransform: "uppercase", color: "rgba(107,15,43,0.45)", margin: "0 0 2px" }}>
                          {label}
                        </p>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#6B0F2B", margin: 0 }}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Botões */}
                  <div style={{ display: "flex", gap: 8, paddingTop: 8,
                    borderTop: "1px solid rgba(107,15,43,0.06)" }}>

                    <button
                      onClick={() => handleResponder(auditoria)}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 6, padding: 10, borderRadius: 6,
                        backgroundColor: concluida ? "rgba(20,83,45,0.08)" : "#6B0F2B",
                        color: concluida ? "#14532d" : "#D4C5A9",
                        border: concluida ? "1px solid rgba(20,83,45,0.2)" : "none",
                        fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "2px",
                        textTransform: "uppercase", fontWeight: 600, cursor: "pointer",
                      }}
                      onMouseEnter={e => { if (!concluida) e.currentTarget.style.backgroundColor = "#5a0c24"; }}
                      onMouseLeave={e => { if (!concluida) e.currentTarget.style.backgroundColor = "#6B0F2B"; }}>
                      {concluida
                        ? <><CheckCircle2 size={14} /> Ver Respostas</>
                        : <><PlayCircle size={14} /> Responder</>
                      }
                    </button>

                    <button
                      onClick={() => handleDashboard(auditoria)}
                      title="Visualizar dashboard"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 6, padding: "10px 16px", borderRadius: 6,
                        backgroundColor: "transparent", color: "#6B0F2B",
                        border: "1px solid rgba(107,15,43,0.25)",
                        fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "2px",
                        textTransform: "uppercase", cursor: "pointer",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(107,15,43,0.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <BarChart3 size={13} />
                      Dashboard
                    </button>

                    {/* Editar — concluída só para superuser */}
                    <button
                      onClick={() => !edicaoBloqueada && abrirModal(auditoria)}
                      disabled={edicaoBloqueada}
                      title={edicaoBloqueada ? "Auditoria concluída só pode ser editada por superuser" : "Editar auditoria"}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 6, padding: "10px 20px", borderRadius: 6,
                        backgroundColor: "transparent",
                        color: edicaoBloqueada ? "rgba(107,15,43,0.25)" : "#6B0F2B",
                        border: edicaoBloqueada ? "1px solid rgba(107,15,43,0.1)" : "1px solid rgba(107,15,43,0.25)",
                        fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "2px",
                        textTransform: "uppercase", cursor: edicaoBloqueada ? "not-allowed" : "pointer",
                      }}
                      onMouseEnter={e => { if (!edicaoBloqueada) e.currentTarget.style.backgroundColor = "rgba(107,15,43,0.04)"; }}
                      onMouseLeave={e => { if (!edicaoBloqueada) e.currentTarget.style.backgroundColor = "transparent"; }}>
                      {edicaoBloqueada ? <Lock size={13} /> : <Pencil size={13} />}
                      Editar
                    </button>

                    {/* Deletar — bloqueado se concluída */}
                    <button
                      onClick={() => !concluida && handleDeletar(auditoria.id_auditoria)}
                      disabled={concluida || deletando}
                      title={concluida ? "Auditoria concluída não pode ser excluída" : "Excluir auditoria"}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "10px 14px", borderRadius: 6,
                        backgroundColor: "transparent",
                        color: concluida ? "rgba(107,15,43,0.2)" : "rgba(107,15,43,0.4)",
                        border: concluida ? "1px solid rgba(107,15,43,0.08)" : "1px solid rgba(107,15,43,0.15)",
                        cursor: concluida ? "not-allowed" : "pointer",
                      }}
                      onMouseEnter={e => {
                        if (!concluida) {
                          e.currentTarget.style.backgroundColor = "rgba(127,29,29,0.06)";
                          e.currentTarget.style.color = "#7f1d1d";
                          e.currentTarget.style.borderColor = "rgba(127,29,29,0.3)";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!concluida) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "rgba(107,15,43,0.4)";
                          e.currentTarget.style.borderColor = "rgba(107,15,43,0.15)";
                        }
                      }}>
                      {concluida ? <Lock size={13} /> : <Trash2 size={13} />}
                    </button>
                  </div>

                  {concluida && (
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.12em",
                      textTransform: "uppercase", color: podeEditarConcluida ? "rgba(107,15,43,0.45)" : "rgba(20,83,45,0.5)",
                      margin: 0, textAlign: "center" }}>
                      {podeEditarConcluida
                        ? "Auditoria finalizada · edição liberada para superuser"
                        : "Auditoria finalizada · edição bloqueada"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Modal de edição ── */}
      {modalAberto && (
        <div
          className="smooth-overlay"
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(30,10,20,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setModalAberto(false); }}>
          <div className="smooth-pop" style={{ backgroundColor: "white", borderRadius: "8px", padding: 40,
            width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 24,
            boxShadow: "0 24px 64px rgba(107,15,43,0.18)" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 16,
                  fontStyle: "italic", color: "rgba(107,15,43,0.5)", margin: 0 }}>Editando</p>
                <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 28,
                  fontWeight: 700, color: "#6B0F2B", margin: 0 }}>
                  {auditoriaEditando?.empresa}
                </h2>
              </div>
              <button onClick={() => setModalAberto(false)}
                style={{ width: 36, height: 36, borderRadius: "50%",
                  border: "1px solid rgba(107,15,43,0.15)", backgroundColor: "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} color="#6B0F2B" />
              </button>
            </div>

            <div style={{ height: 1, backgroundColor: "rgba(107,15,43,0.08)" }} />

            <form onSubmit={handleEditar} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Nome da Auditoria</label>
                  <input type="text" required value={formEdit.nome}
                    onChange={e => setFormEdit(p => ({ ...p, nome: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Empresa</label>
                  <DropdownSelect aberto={empresaEditAberto} setAberto={setEmpresaEditAberto}
                    valor={formEdit.id_empresa} setValor={v => setFormEdit(p => ({ ...p, id_empresa: v }))}
                    opcoes={empresas} placeholder="Selecione a empresa" labelKey="nome" valueKey="id_empresa" />
                </div>
                <div>
                  <label style={labelStyle}>Norma</label>
                  <DropdownSelect aberto={normaEditAberto} setAberto={setNormaEditAberto}
                    valor={formEdit.id_norma} setValor={v => setFormEdit(p => ({ ...p, id_norma: v }))}
                    opcoes={normas} placeholder="Selecione a norma" labelKey="nome" valueKey="id_norma" />
                </div>
                <div>
                  <label style={labelStyle}>Data da Auditoria</label>
                  <input type="date" required value={formEdit.data_auditoria}
                    onChange={e => setFormEdit(p => ({ ...p, data_auditoria: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Descrição</label>
                  <input type="text" required value={formEdit.descricao}
                    onChange={e => setFormEdit(p => ({ ...p, descricao: e.target.value }))}
                    style={inputStyle} />
                </div>
              </div>

              {erroEdit && (
                <p style={{ color: "#7f1d1d", fontSize: 12, textAlign: "center", margin: 0 }}>{erroEdit}</p>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setModalAberto(false)}
                  style={{ padding: "10px 24px", borderRadius: 6, backgroundColor: "transparent",
                    color: "#6B0F2B", border: "1px solid rgba(107,15,43,0.3)",
                    fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "2px",
                    textTransform: "uppercase", cursor: "pointer" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loadingEdit}
                  style={{ padding: "10px 28px", borderRadius: 6, backgroundColor: "#6B0F2B",
                    color: "#D4C5A9", border: "none", fontFamily: "var(--font-sans)",
                    fontSize: 11, letterSpacing: "2px", textTransform: "uppercase",
                    fontWeight: 600, cursor: loadingEdit ? "not-allowed" : "pointer",
                    opacity: loadingEdit ? 0.6 : 1 }}>
                  {loadingEdit ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
