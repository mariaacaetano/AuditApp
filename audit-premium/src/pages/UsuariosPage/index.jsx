import React, { useEffect, useState } from "react";
import "./styles.css";
import Sidebar from "../../components/Sidebar";
import {
  BadgeCheck, Calendar, CheckCircle2, Download, KeyRound, Mail, Plus, Save,
  RefreshCw, ShieldAlert, ShieldCheck, Upload, User, UserCog, X, XCircle,
} from "lucide-react";

const API = "http://localhost:8000/api";

const labelStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: 11,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "rgba(107,15,43,0.45)",
  margin: "0 0 6px",
};

const inputStyle = {
  width: "100%",
  backgroundColor: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(107,15,43,0.3)",
  padding: "7px 0",
  fontSize: 13,
  color: "#6B0F2B",
  fontFamily: "var(--font-sans)",
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "10px 18px",
  borderRadius: 6,
  border: "none",
  backgroundColor: "#6B0F2B",
  color: "#D4C5A9",
  fontFamily: "var(--font-sans)",
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontWeight: 700,
  cursor: "pointer",
};

function StatusPill({ active }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 6,
      backgroundColor: active ? "rgba(20,83,45,0.1)" : "rgba(127,29,29,0.08)",
      color: active ? "#14532d" : "#7f1d1d",
      fontFamily: "var(--font-sans)", fontSize: 11,
      letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700,
    }}>
      {active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 0", borderBottom: "1px solid rgba(107,15,43,0.08)",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(107,15,43,0.07)", flexShrink: 0,
      }}>
        <Icon size={15} color="#6B0F2B" strokeWidth={1.7} />
      </div>
      <div>
        <p style={labelStyle}>{label}</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#6B0F2B", margin: 0 }}>
          {value || "Não informado"}
        </p>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const [userName, setUserName] = useState("Fulano da Silva");
  const [userRole, setUserRole] = useState("Auditor");
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [codigos, setCodigos] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvandoUsuario, setSalvandoUsuario] = useState(null);
  const [salvandoCodigo, setSalvandoCodigo] = useState(null);
  const [usuarioModal, setUsuarioModal] = useState(null);
  const [usuarioModalForm, setUsuarioModalForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    cargo: "",
    is_active: true,
  });
  const [novoCodigo, setNovoCodigo] = useState({
    codigo: "",
    nome: "",
    email: "",
    cargo: "Auditor",
    ativo: true,
  });

  const token = () => localStorage.getItem("access_token");

  const gerarCodigoAleatorio = () => {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const tamanho = 15;
    const bytes = new Uint8Array(tamanho);
    window.crypto.getRandomValues(bytes);
    const codigo = Array.from(bytes, byte => caracteres[byte % caracteres.length]).join("");
    setNovoCodigo(prev => ({ ...prev, codigo }));
  };

  useEffect(() => {
    const savedUserData = localStorage.getItem("user");
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        setUserName(parsed.name || parsed.username || "Lead Auditor");
        setUserRole(parsed.cargo || "Auditor");
        setIsSuperuser(Boolean(parsed.is_superuser || parsed.isSuperuser));
      } catch {}
    }
    fetchTudo();
  }, []);

  const fetchTudo = async () => {
    await Promise.all([fetchUsuarios(), fetchCodigos()]);
  };

  const fetchUsuarios = async () => {
    try {
      const r = await fetch(`${API}/admin/usuarios/`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (r.ok) setUsuarios(await r.json());
    } catch {}
  };

  const fetchCodigos = async () => {
    try {
      const r = await fetch(`${API}/admin/codigos-acesso/`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (r.ok) setCodigos(await r.json());
    } catch {}
  };

  const atualizarUsuario = async (usuario, patch) => {
    setErro(""); setSucesso(""); setSalvandoUsuario(usuario.id);
    try {
      const r = await fetch(`${API}/admin/usuarios/${usuario.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(patch),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(data.detail || "Erro ao atualizar usuário."); return; }
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? data : u));
      setSucesso("Usuário atualizado.");
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setSalvandoUsuario(null);
    }
  };

  const abrirUsuarioModal = (usuario) => {
    setUsuarioModal(usuario);
    setUsuarioModalForm({
      first_name: usuario.first_name || "",
      last_name: usuario.last_name || "",
      email: usuario.email || "",
      cargo: usuario.cargo || "",
      is_active: Boolean(usuario.is_active),
    });
  };

  const fecharUsuarioModal = () => {
    setUsuarioModal(null);
    setUsuarioModalForm({
      first_name: "",
      last_name: "",
      email: "",
      cargo: "",
      is_active: true,
    });
  };

  const salvarUsuarioModal = async () => {
    if (!usuarioAtualModal) return;
    await atualizarUsuario(usuarioAtualModal, usuarioModalForm);
  };

  const criarCodigo = async (e) => {
    e.preventDefault();
    setErro(""); setSucesso(""); setSalvandoCodigo("novo");
    try {
      const r = await fetch(`${API}/admin/codigos-acesso/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(novoCodigo),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(data.detail || "Erro ao criar código."); return; }
      setCodigos(prev => [data, ...prev]);
      setNovoCodigo({ codigo: "", nome: "", email: "", cargo: "Auditor", ativo: true });
      setSucesso("Código criado.");
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setSalvandoCodigo(null);
    }
  };

  const atualizarCodigo = async (codigo, patch) => {
    setErro(""); setSucesso(""); setSalvandoCodigo(codigo.id_codigo);
    try {
      const r = await fetch(`${API}/admin/codigos-acesso/${codigo.id_codigo}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(patch),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(data.detail || "Erro ao atualizar código."); return; }
      setCodigos(prev => prev.map(c => c.id_codigo === codigo.id_codigo ? data : c));
      setSucesso("Código atualizado.");
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setSalvandoCodigo(null);
    }
  };

  const baixarCSV = async () => {
    const r = await fetch(`${API}/admin/codigos-acesso/csv/`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!r.ok) return;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "codigos_acesso_cadastro.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importarCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(""); setSucesso("");
    const formData = new FormData();
    formData.append("arquivo", file);
    try {
      const r = await fetch(`${API}/admin/codigos-acesso/csv/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(data.detail || "Erro ao importar CSV."); return; }
      setSucesso(`${data.criados || 0} criados, ${data.atualizados || 0} atualizados.`);
      fetchCodigos();
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      e.target.value = "";
    }
  };

  const formatarData = (valor) => {
    if (!valor) return "Não informado";
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(valor));
    } catch {
      return valor;
    }
  };

  const usuarioAtualModal = usuarioModal
    ? usuarios.find(u => u.id === usuarioModal.id) || usuarioModal
    : null;

  return (
    <div className="usuarios-page app-shell-page" style={{ minHeight: "100vh", backgroundColor: "#F4EFE6", display: "flex" }}>
      <Sidebar userName={userName} userSub={userRole} />

      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        padding: "48px 80px 64px 120px", gap: 32,
        overflowY: "auto", maxWidth: 1600, margin: "0 auto", width: "100%",
      }}>
        <div style={{ borderBottom: "1px solid rgba(107,15,43,0.1)", paddingBottom: 28 }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 20,
            fontStyle: "italic", color: "rgba(107,15,43,0.55)", margin: 0 }}>
            Administração
          </p>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 42,
            fontWeight: 700, color: "#6B0F2B", margin: "4px 0 10px" }}>
            Usuários
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(107,15,43,0.45)",
            letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            Contas, cargos, status e códigos de cadastro
          </p>
        </div>

        {!isSuperuser && (
          <div style={{ display: "flex", alignItems: "center", gap: 12,
            backgroundColor: "rgba(127,29,29,0.08)", border: "1px solid rgba(127,29,29,0.18)",
            borderRadius: "8px", padding: 20, color: "#7f1d1d" }}>
            <ShieldAlert size={20} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13 }}>
              Esta área é exclusiva para superuser.
            </span>
          </div>
        )}

        {(erro || sucesso) && (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13,
            color: erro ? "#7f1d1d" : "#14532d", margin: 0 }}>
            {erro || sucesso}
          </p>
        )}

        {isSuperuser && (
          <>
            <section style={{ backgroundColor: "white", border: "1px solid rgba(107,15,43,0.08)",
              borderRadius: "8px", padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <UserCog size={20} color="#6B0F2B" />
                <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 26,
                  fontWeight: 700, color: "#6B0F2B", margin: 0 }}>
                  Contas
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {usuarios.map(usuario => (
                  <div key={usuario.id} style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1fr auto",
                    gap: 16,
                    alignItems: "center",
                    padding: "14px 0",
                    borderTop: "1px solid rgba(107,15,43,0.07)",
                  }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 20,
                        color: "#6B0F2B", margin: 0 }}>
                        {usuario.name}
                      </p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11,
                        color: "rgba(107,15,43,0.45)", margin: 0 }}>
                        @{usuario.username} · {usuario.email || "sem e-mail"}
                      </p>
                    </div>
                    <div>
                      <p style={labelStyle}>Cargo</p>
                      <input value={usuario.cargo || ""}
                        onChange={e => setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, cargo: e.target.value } : u))}
                        style={inputStyle} />
                    </div>
                    <StatusPill active={usuario.is_active} />
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button type="button"
                        onClick={() => abrirUsuarioModal(usuario)}
                        style={{ ...buttonStyle, backgroundColor: "transparent", color: "#6B0F2B",
                          border: "1px solid rgba(107,15,43,0.25)" }}>
                        Ver
                      </button>
                      <button type="button"
                        onClick={() => atualizarUsuario(usuario, { is_active: !usuario.is_active })}
                        style={{ ...buttonStyle, backgroundColor: "transparent", color: "#6B0F2B",
                          border: "1px solid rgba(107,15,43,0.25)" }}>
                        {usuario.is_active ? "Inativar" : "Ativar"}
                      </button>
                      <button type="button"
                        disabled={salvandoUsuario === usuario.id}
                        onClick={() => atualizarUsuario(usuario, { cargo: usuario.cargo, is_active: usuario.is_active })}
                        style={{ ...buttonStyle, opacity: salvandoUsuario === usuario.id ? 0.6 : 1 }}>
                        <Save size={13} /> Salvar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ backgroundColor: "white", border: "1px solid rgba(107,15,43,0.08)",
              borderRadius: "8px", padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <KeyRound size={20} color="#6B0F2B" />
                  <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 26,
                    fontWeight: 700, color: "#6B0F2B", margin: 0 }}>
                    Códigos de Acesso
                  </h2>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={{ ...buttonStyle, backgroundColor: "transparent", color: "#6B0F2B",
                    border: "1px solid rgba(107,15,43,0.25)" }}>
                    <Upload size={13} /> Importar CSV
                    <input type="file" accept=".csv,text/csv" onChange={importarCSV} style={{ display: "none" }} />
                  </label>
                  <button type="button" onClick={baixarCSV} style={buttonStyle}>
                    <Download size={13} /> Exportar CSV
                  </button>
                </div>
              </div>

              <form onSubmit={criarCodigo} style={{
                display: "grid", gridTemplateColumns: "1fr 1.2fr 1.2fr 1fr auto",
                gap: 16, alignItems: "end", paddingBottom: 20,
              }}>
                <div>
                  <p style={labelStyle}>Código</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input required value={novoCodigo.codigo} maxLength={15}
                      onChange={e => setNovoCodigo(p => ({ ...p, codigo: e.target.value.toUpperCase().slice(0, 15) }))}
                      placeholder="ACESSO2026" style={inputStyle} />
                    <button type="button" onClick={gerarCodigoAleatorio}
                      title="Gerar código aleatório"
                      style={{ ...buttonStyle, padding: "8px 12px", flexShrink: 0 }}>
                      <RefreshCw size={13} /> Gerar
                    </button>
                  </div>
                </div>
                <div>
                  <p style={labelStyle}>Nome</p>
                  <input value={novoCodigo.nome} onChange={e => setNovoCodigo(p => ({ ...p, nome: e.target.value }))}
                    placeholder="Nome permitido" style={inputStyle} />
                </div>
                <div>
                  <p style={labelStyle}>E-mail</p>
                  <input type="email" value={novoCodigo.email} onChange={e => setNovoCodigo(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@empresa.com" style={inputStyle} />
                </div>
                <div>
                  <p style={labelStyle}>Cargo</p>
                  <input value={novoCodigo.cargo} onChange={e => setNovoCodigo(p => ({ ...p, cargo: e.target.value }))}
                    style={inputStyle} />
                </div>
                <button type="submit" disabled={salvandoCodigo === "novo"} style={buttonStyle}>
                  <Plus size={13} /> Criar
                </button>
              </form>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {codigos.map(codigo => (
                  <div key={codigo.id_codigo} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.2fr 1.2fr 1fr auto",
                    gap: 16,
                    alignItems: "center",
                    padding: "14px 0",
                    borderTop: "1px solid rgba(107,15,43,0.07)",
                  }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700,
                        color: "#6B0F2B", margin: 0 }}>
                        {codigo.codigo}
                      </p>
                      <p style={{ fontFamily: "var(--font-sans)", fontSize: 11,
                        color: "rgba(107,15,43,0.45)", margin: "3px 0 0" }}>
                        {codigo.usado_por_username ? `Usado por ${codigo.usado_por_username}` : "Disponível"}
                      </p>
                    </div>
                    <input value={codigo.nome || ""} onChange={e => setCodigos(prev => prev.map(c => c.id_codigo === codigo.id_codigo ? { ...c, nome: e.target.value } : c))}
                      style={inputStyle} />
                    <input value={codigo.email || ""} onChange={e => setCodigos(prev => prev.map(c => c.id_codigo === codigo.id_codigo ? { ...c, email: e.target.value } : c))}
                      style={inputStyle} />
                    <input value={codigo.cargo || ""} onChange={e => setCodigos(prev => prev.map(c => c.id_codigo === codigo.id_codigo ? { ...c, cargo: e.target.value } : c))}
                      style={inputStyle} />
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button type="button"
                        onClick={() => atualizarCodigo(codigo, { ativo: !codigo.ativo })}
                        style={{ ...buttonStyle, backgroundColor: "transparent", color: "#6B0F2B",
                          border: "1px solid rgba(107,15,43,0.25)" }}>
                        {codigo.ativo ? "Inativar" : "Ativar"}
                      </button>
                      <button type="button" disabled={salvandoCodigo === codigo.id_codigo}
                        onClick={() => atualizarCodigo(codigo, {
                          nome: codigo.nome,
                          email: codigo.email,
                          cargo: codigo.cargo,
                          ativo: codigo.ativo,
                        })}
                        style={{ ...buttonStyle, opacity: salvandoCodigo === codigo.id_codigo ? 0.6 : 1 }}>
                        <Save size={13} /> Salvar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {usuarioAtualModal && (
        <div
          className="smooth-overlay"
          onClick={e => { if (e.target === e.currentTarget) fecharUsuarioModal(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            backgroundColor: "rgba(20,5,12,0.48)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, backdropFilter: "blur(6px)",
          }}
        >
          <div className="smooth-pop" style={{
            width: "100%", maxWidth: 720, maxHeight: "90vh", overflow: "hidden",
            backgroundColor: "#FDFAF6", borderRadius: "10px",
            boxShadow: "0 32px 80px rgba(107,15,43,0.24)",
            border: "1px solid rgba(107,15,43,0.1)",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "30px 34px 24px",
              borderBottom: "1px solid rgba(107,15,43,0.08)",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18,
            }}>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  backgroundColor: "#6B0F2B",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#D4C5A9", flexShrink: 0,
                }}>
                  <User size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: 11,
                    letterSpacing: "0.16em", textTransform: "uppercase",
                    color: "rgba(107,15,43,0.45)", margin: "0 0 4px" }}>
                    Usuário #{usuarioAtualModal.id}
                  </p>
                  <h2 style={{ fontFamily: "var(--font-sans)",
                    fontSize: 30, fontWeight: 700, color: "#6B0F2B",
                    margin: "0 0 8px", lineHeight: 1.1 }}>
                    {`${usuarioModalForm.first_name} ${usuarioModalForm.last_name}`.trim() || usuarioAtualModal.name}
                  </h2>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <StatusPill active={usuarioModalForm.is_active} />
                    {usuarioAtualModal.is_superuser && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 12px", borderRadius: 6,
                        backgroundColor: "rgba(107,15,43,0.08)",
                        color: "#6B0F2B", fontFamily: "var(--font-sans)", fontSize: 11,
                        letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700,
                      }}>
                        <BadgeCheck size={11} /> Superuser
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={fecharUsuarioModal}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: "1px solid rgba(107,15,43,0.15)",
                  backgroundColor: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={15} color="#6B0F2B" />
              </button>
            </div>

            <div style={{ overflowY: "auto", padding: "26px 34px 34px" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "0 28px",
              }}>
                <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(107,15,43,0.08)" }}>
                  <p style={labelStyle}>Primeiro nome</p>
                  <input value={usuarioModalForm.first_name}
                    onChange={e => setUsuarioModalForm(p => ({ ...p, first_name: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(107,15,43,0.08)" }}>
                  <p style={labelStyle}>Sobrenome</p>
                  <input value={usuarioModalForm.last_name}
                    onChange={e => setUsuarioModalForm(p => ({ ...p, last_name: e.target.value }))}
                    style={inputStyle} />
                </div>
                <DetailItem icon={UserCog} label="Nome de usuário" value={`@${usuarioAtualModal.username}`} />
                <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(107,15,43,0.08)" }}>
                  <p style={labelStyle}>E-mail</p>
                  <input type="email" value={usuarioModalForm.email}
                    onChange={e => setUsuarioModalForm(p => ({ ...p, email: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(107,15,43,0.08)" }}>
                  <p style={labelStyle}>Cargo</p>
                  <input value={usuarioModalForm.cargo}
                    onChange={e => setUsuarioModalForm(p => ({ ...p, cargo: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(107,15,43,0.08)" }}>
                  <p style={labelStyle}>Status</p>
                  <button type="button"
                    onClick={() => setUsuarioModalForm(p => ({ ...p, is_active: !p.is_active }))}
                    style={{ ...buttonStyle, backgroundColor: "transparent", color: "#6B0F2B",
                      border: "1px solid rgba(107,15,43,0.25)" }}>
                    {usuarioModalForm.is_active ? "Ativo" : "Inativo"}
                  </button>
                </div>
                <DetailItem icon={Calendar} label="Criado em" value={formatarData(usuarioAtualModal.date_joined)} />
                <DetailItem icon={ShieldCheck} label="Tipo de conta" value={usuarioAtualModal.is_superuser ? "Superuser" : "Usuário comum"} />
              </div>

              <div style={{
                marginTop: 24, padding: 18, borderRadius: "8px",
                backgroundColor: "rgba(107,15,43,0.04)",
                border: "1px solid rgba(107,15,43,0.08)",
              }}>
                <p style={{ fontFamily: "var(--font-sans)",
                  fontSize: 20, color: "#6B0F2B", fontStyle: "italic",
                  margin: "0 0 12px" }}>
                  Permissões
                </p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 13,
                  lineHeight: 1.6, color: "rgba(61,8,24,0.72)", margin: 0 }}>
                  {usuarioAtualModal.is_superuser
                    ? "Este usuário pode acessar áreas administrativas, gerenciar usuários e códigos de acesso, além de editar auditorias concluídas conforme as regras atuais."
                    : "Este usuário segue as permissões padrão da conta e depende do status ativo para conseguir acessar o sistema."}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
                <button type="button"
                  onClick={fecharUsuarioModal}
                  style={{ ...buttonStyle, backgroundColor: "transparent", color: "#6B0F2B",
                    border: "1px solid rgba(107,15,43,0.25)" }}>
                  Cancelar
                </button>
                <button type="button"
                  disabled={salvandoUsuario === usuarioAtualModal.id}
                  onClick={salvarUsuarioModal}
                  style={{ ...buttonStyle, opacity: salvandoUsuario === usuarioAtualModal.id ? 0.6 : 1 }}>
                  <Save size={13} /> {salvandoUsuario === usuarioAtualModal.id ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
