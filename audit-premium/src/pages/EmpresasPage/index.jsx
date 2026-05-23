import React, { useEffect, useState } from "react";
import "./styles.css";
import Sidebar from "../../components/Sidebar";
import { Building2, Plus, ChevronDown, Pencil, Trash2, Check, X } from "lucide-react";

export default function EmpresasPage() {
  const [userName, setUserName] = useState("Fulano da Silva");
  const [userRole, setUserRole] = useState("Auditor");
  const [empresas, setEmpresas] = useState([]);
  const [formAberto, setFormAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [porteAberto, setPorteAberto] = useState(false);
  const [form, setForm] = useState({ nome: "", cnpj: "", porte: "", setor: "", descricao: "" });

  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editPorteAberto, setEditPorteAberto] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(null);

  const porteOpcoes = ["Pequeno", "Médio", "Grande"];

  useEffect(() => {
    const savedUserData = localStorage.getItem("user");
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        setUserName(parsed.name || parsed.username || "Lead Auditor");
        setUserRole(parsed.cargo || "Auditor");
      } catch (e) {}
    }
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/controles/empresas/view", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEmpresas(data);
      }
    } catch (e) {}
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/controles/empresas/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        const firstError = Object.values(data)[0];
        setErro(Array.isArray(firstError) ? firstError[0] : data.detail || "Erro ao cadastrar empresa.");
        return;
      }
      setSucesso("Empresa cadastrada com sucesso!");
      setForm({ nome: "", cnpj: "", porte: "", setor: "", descricao: "" });
      setFormAberto(false);
      fetchEmpresas();
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicao = (empresa) => {
    setEditandoId(empresa.id_empresa);
    setEditForm({
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      porte: empresa.porte,
      setor: empresa.setor,
      descricao: empresa.descricao,
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditForm({});
    setEditPorteAberto(false);
  };

  const salvarEdicao = async (id_empresa) => {
    setLoadingEdit(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8000/controles/empresas/${id_empresa}/edit/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        setEditandoId(null);
        fetchEmpresas();
      }
    } catch (e) {}
    finally { setLoadingEdit(false); }
  };

  const excluirEmpresa = async (id_empresa) => {
    if (!window.confirm("Tem certeza que deseja excluir esta empresa?")) return;
    setLoadingDelete(id_empresa);
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`http://localhost:8000/controles/empresas/${id_empresa}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmpresas();
    } catch (e) {}
    finally { setLoadingDelete(null); }
  };

  const labelStyle = {
    fontFamily: "var(--font-sans)", fontSize: '11px', letterSpacing: '0.15em',
    textTransform: 'uppercase', color: '#6B0F2B', display: 'block', marginBottom: '4px',
  };

  const inputStyle = {
    width: '100%', backgroundColor: 'transparent', border: 'none',
    borderBottom: '1px solid rgba(107,15,43,0.35)', padding: '6px 0',
    fontSize: '13px', color: '#6B0F2B', fontFamily: "var(--font-sans)",
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div className="empresas-page app-shell-page" style={{ minHeight: '100vh', backgroundColor: '#F4EFE6', display: 'flex' }}>
      <Sidebar userName={userName} userSub={userRole} />

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '48px 80px 48px 120px', gap: '36px',
        overflowY: 'auto', maxWidth: '1600px', margin: '0 auto', width: '100%',
      }}>

        {/* Cabeçalho */}
        <div style={{ borderBottom: '1px solid rgba(107,15,43,0.1)', paddingBottom: '28px' }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: '20px', fontStyle: 'italic', color: 'rgba(107,15,43,0.55)', margin: 0 }}>
            Gestão de
          </p>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: '42px', fontWeight: 700, color: '#6B0F2B', margin: '4px 0 10px' }}>
            Empresas
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: '12px', color: 'rgba(107,15,43,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
            {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} cadastrada{empresas.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Formulário expansível */}
        <div style={{ backgroundColor: 'white', border: '1px solid rgba(107,15,43,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            onClick={() => { setFormAberto(!formAberto); setErro(""); setSucesso(""); }}
            style={{ width: '100%', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#6B0F2B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} color="#D4C5A9" />
              </div>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: '20px', color: '#6B0F2B' }}>
                Cadastrar nova empresa
              </span>
            </div>
            <ChevronDown size={20} color="#6B0F2B" style={{ transform: formAberto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
          </button>

          {formAberto && (
            <form className="smooth-open" onSubmit={handleSubmit} style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ height: '1px', backgroundColor: 'rgba(107,15,43,0.08)', marginBottom: '8px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>Nome da Empresa</label>
                  <input type="text" name="nome" required value={form.nome} onChange={handleChange} placeholder="Ex: Empresa LTDA" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>CNPJ</label>
                  <input type="text" name="cnpj" required value={form.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" style={inputStyle} />
                </div>

                {/* Porte dropdown */}
                <div>
                  <label style={labelStyle}>Porte</label>
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setPorteAberto(!porteAberto)}
                      style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'none', border: 'none', borderBottom: '1px solid rgba(107,15,43,0.35)', width: '100%', color: form.porte ? '#6B0F2B' : 'rgba(107,15,43,0.35)' }}>
                      {form.porte || "Selecione o porte"}
                      <ChevronDown size={16} color="#6B0F2B" style={{ transform: porteAberto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </button>
                    {porteAberto && (
                      <div className="smooth-open" style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 8px 32px rgba(107,15,43,0.15)', overflow: 'hidden', zIndex: 10, marginTop: '4px' }}>
                        {porteOpcoes.map(opcao => (
                          <button key={opcao} type="button"
                            onClick={() => { setForm(prev => ({ ...prev, porte: opcao })); setPorteAberto(false); }}
                            style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: form.porte === opcao ? 'rgba(107,15,43,0.08)' : 'none', border: 'none', cursor: 'pointer', fontFamily: "var(--font-sans)", fontSize: '13px', color: '#6B0F2B' }}
                            onMouseEnter={e => e.target.style.backgroundColor = 'rgba(107,15,43,0.05)'}
                            onMouseLeave={e => e.target.style.backgroundColor = form.porte === opcao ? 'rgba(107,15,43,0.08)' : 'transparent'}
                          >
                            {opcao}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Setor</label>
                  <input type="text" name="setor" required value={form.setor} onChange={handleChange} placeholder="Ex: Tecnologia, Saúde..." style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Descrição</label>
                  <input type="text" name="descricao" required value={form.descricao} onChange={handleChange} placeholder="Breve descrição da empresa" style={inputStyle} />
                </div>
              </div>

              {erro && <p style={{ color: '#7f1d1d', fontSize: '12px', textAlign: 'center', margin: 0 }}>{erro}</p>}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setFormAberto(false); setErro(""); }}
                  style={{ padding: '10px 28px', borderRadius: '6px', backgroundColor: 'transparent', color: '#6B0F2B', border: '1px solid rgba(107,15,43,0.3)', fontFamily: "var(--font-sans)", fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  style={{ padding: '10px 28px', borderRadius: '6px', backgroundColor: '#6B0F2B', color: '#D4C5A9', border: 'none', fontFamily: "var(--font-sans)", fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.3s ease' }}
                  onMouseEnter={e => !loading && (e.target.style.backgroundColor = '#5a0c24')}
                  onMouseLeave={e => (e.target.style.backgroundColor = '#6B0F2B')}>
                  {loading ? "Salvando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          )}
        </div>

        {sucesso && <p style={{ color: '#14532d', fontSize: '13px', textAlign: 'center', margin: '-20px 0' }}>{sucesso}</p>}

        {/* Lista de empresas */}
        {empresas.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', backgroundColor: 'rgba(255,255,255,0.4)', border: '1px solid rgba(107,15,43,0.08)', borderRadius: '8px', gap: '16px' }}>
            <Building2 size={48} color="rgba(107,15,43,0.2)" strokeWidth={1} />
            <p style={{ fontFamily: "var(--font-sans)", fontSize: '20px', color: 'rgba(107,15,43,0.4)', margin: 0 }}>
              Nenhuma empresa cadastrada ainda
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {empresas.map((empresa) => (
              <div key={empresa.id_empresa} style={{
                backgroundColor: 'white', border: '1px solid rgba(107,15,43,0.08)',
                borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px',
              }}>
                {editandoId === empresa.id_empresa ? (
                  /* Modo edição */
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#6B0F2B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={18} color="#D4C5A9" />
                      </div>
                      <input value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))}
                        style={{ ...inputStyle, fontSize: '18px', fontFamily: "var(--font-sans)" }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>CNPJ</label>
                        <input value={editForm.cnpj} onChange={e => setEditForm(p => ({ ...p, cnpj: e.target.value }))} style={inputStyle} />
                      </div>

                      {/* Porte dropdown edição */}
                      <div>
                        <label style={labelStyle}>Porte</label>
                        <div style={{ position: 'relative' }}>
                          <button type="button" onClick={() => setEditPorteAberto(!editPorteAberto)}
                            style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'none', border: 'none', borderBottom: '1px solid rgba(107,15,43,0.35)', width: '100%' }}>
                            {editForm.porte}
                            <ChevronDown size={16} color="#6B0F2B" style={{ transform: editPorteAberto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                          </button>
                          {editPorteAberto && (
                            <div className="smooth-open" style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 8px 32px rgba(107,15,43,0.15)', overflow: 'hidden', zIndex: 10, marginTop: '4px' }}>
                              {porteOpcoes.map(opcao => (
                                <button key={opcao} type="button"
                                  onClick={() => { setEditForm(p => ({ ...p, porte: opcao })); setEditPorteAberto(false); }}
                                  style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: editForm.porte === opcao ? 'rgba(107,15,43,0.08)' : 'none', border: 'none', cursor: 'pointer', fontFamily: "var(--font-sans)", fontSize: '13px', color: '#6B0F2B' }}>
                                  {opcao}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Setor</label>
                        <input value={editForm.setor} onChange={e => setEditForm(p => ({ ...p, setor: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Descrição</label>
                        <input value={editForm.descricao} onChange={e => setEditForm(p => ({ ...p, descricao: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button onClick={cancelarEdicao}
                        style={{ padding: '8px 20px', borderRadius: '6px', backgroundColor: 'transparent', color: '#6B0F2B', border: '1px solid rgba(107,15,43,0.3)', fontFamily: "var(--font-sans)", fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <X size={14} /> Cancelar
                      </button>
                      <button onClick={() => salvarEdicao(empresa.id_empresa)} disabled={loadingEdit}
                        style={{ padding: '8px 20px', borderRadius: '6px', backgroundColor: '#6B0F2B', color: '#D4C5A9', border: 'none', fontFamily: "var(--font-sans)", fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} /> {loadingEdit ? "Salvando..." : "Salvar"}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Modo visualização */
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#6B0F2B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={18} color="#D4C5A9" />
                        </div>
                        <p style={{ fontFamily: "var(--font-sans)", fontSize: '22px', color: '#6B0F2B', margin: 0 }}>
                          {empresa.nome}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => iniciarEdicao(empresa)} title="Editar"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(107,15,43,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(107,15,43,0.12)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(107,15,43,0.06)'}>
                          <Pencil size={14} color="#6B0F2B" />
                        </button>
                        <button onClick={() => excluirEmpresa(empresa.id_empresa)} disabled={loadingDelete === empresa.id_empresa} title="Excluir"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(107,15,43,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(200,0,0,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(107,15,43,0.06)'}>
                          <Trash2 size={14} color="#9B1C1C" />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: 'CNPJ', value: empresa.cnpj },
                        { label: 'Porte', value: empresa.porte },
                        { label: 'Setor', value: empresa.setor },
                        { label: 'Descrição', value: empresa.descricao },
                      ].map(({ label, value }) => (
                        <div key={label} style={label === 'Descrição' ? { gridColumn: '1 / -1' } : {}}>
                          <p style={{ fontFamily: "var(--font-sans)", fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(107,15,43,0.45)', margin: '0 0 2px' }}>
                            {label}
                          </p>
                          <p style={{ fontFamily: "var(--font-sans)", fontSize: '13px', color: '#6B0F2B', margin: 0 }}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
