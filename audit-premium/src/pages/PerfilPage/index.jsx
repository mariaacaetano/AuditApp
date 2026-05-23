import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  ArrowLeft, BadgeCheck, LogOut, Mail, ShieldCheck, User,
} from "lucide-react";

const labelStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: 11,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "rgba(107,15,43,0.45)",
  margin: "0 0 6px",
};

const valueStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  color: "#6B0F2B",
  margin: 0,
};

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "18px 0", borderBottom: "1px solid rgba(107,15,43,0.08)",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        backgroundColor: "rgba(107,15,43,0.07)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={17} color="#6B0F2B" strokeWidth={1.6} />
      </div>
      <div>
        <p style={labelStyle}>{label}</p>
        <p style={valueStyle}>{value || "Não informado"}</p>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState({
    name: "Fulano da Silva",
    username: "usuario",
    email: "",
    cargo: "Auditor",
    is_superuser: false,
  });

  useEffect(() => {
    const savedUserData = localStorage.getItem("user");
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        setUsuario({
          name: parsed.name || parsed.username || "Fulano da Silva",
          username: parsed.username || "usuario",
          email: parsed.email || "",
          cargo: parsed.cargo || parsed.sub || "Auditor",
          is_superuser: Boolean(parsed.is_superuser || parsed.isSuperuser),
        });
      } catch {}
    }
  }, []);

  const iniciais = useMemo(() => {
    const partes = (usuario.name || usuario.username || "U").trim().split(/\s+/);
    return partes.slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "U";
  }, [usuario.name, usuario.username]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="perfil-page app-shell-page" style={{ minHeight: "100vh", backgroundColor: "#F4EFE6", display: "flex" }}>
      <Sidebar userName={usuario.name} userSub={usuario.cargo} />

      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "48px 80px 64px 120px",
        gap: 36,
        overflowY: "auto",
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
      }}>
        <div style={{ borderBottom: "1px solid rgba(107,15,43,0.1)", paddingBottom: 28 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "none", border: "none", cursor: "pointer",
              padding: "0 0 16px", fontFamily: "var(--font-sans)",
              fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
              color: "rgba(107,15,43,0.45)",
            }}
          >
            <ArrowLeft size={14} color="rgba(107,15,43,0.45)" /> Voltar
          </button>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 20,
            fontStyle: "italic", color: "rgba(107,15,43,0.55)", margin: 0,
          }}>
            Minha conta
          </p>
          <h1 style={{
            fontFamily: "var(--font-sans)", fontSize: 42,
            fontWeight: 700, color: "#6B0F2B", margin: "4px 0 10px",
          }}>
            Perfil
          </h1>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 12, color: "rgba(107,15,43,0.45)",
            letterSpacing: "0.15em", textTransform: "uppercase", margin: 0,
          }}>
            Dados da sessão atual
          </p>
        </div>

        <section style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 28,
          alignItems: "stretch",
        }}>
          <div style={{
            backgroundColor: "#6B0F2B",
            borderRadius: "8px",
            padding: 32,
            minHeight: 360,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 14px 42px rgba(107,15,43,0.18)",
          }}>
            <div>
              <div style={{
                width: 92, height: 92, borderRadius: "50%",
                border: "1px solid rgba(212,197,169,0.35)",
                backgroundColor: "rgba(212,197,169,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 22,
              }}>
                <span style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 36,
                  color: "#D4C5A9",
                }}>
                  {iniciais}
                </span>
              </div>
              <h2 style={{
                fontFamily: "var(--font-sans)",
                fontSize: 30,
                fontWeight: 700,
                color: "#D4C5A9",
                margin: "0 0 6px",
                lineHeight: 1.1,
              }}>
                {usuario.name}
              </h2>
              <p style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(212,197,169,0.58)",
                margin: 0,
              }}>
                @{usuario.username}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                alignSelf: "flex-start",
                padding: "7px 14px",
                borderRadius: 6,
                backgroundColor: usuario.is_superuser
                  ? "rgba(20,83,45,0.28)"
                  : "rgba(212,197,169,0.12)",
                color: usuario.is_superuser ? "#d5f5df" : "#D4C5A9",
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}>
                <BadgeCheck size={13} />
                {usuario.is_superuser ? "Superuser" : usuario.cargo}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "11px 18px",
                  borderRadius: 6,
                  border: "1px solid rgba(212,197,169,0.28)",
                  backgroundColor: "transparent",
                  color: "#D4C5A9",
                  fontFamily: "var(--font-sans)",
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          </div>

          <div style={{
            backgroundColor: "white",
            border: "1px solid rgba(107,15,43,0.08)",
            borderRadius: "8px",
            padding: "30px 36px",
            display: "flex",
            flexDirection: "column",
          }}>
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: 22,
              color: "#6B0F2B",
              fontStyle: "italic",
              margin: "0 0 8px",
            }}>
              Informações
            </p>
            <DetailRow icon={User} label="Nome" value={usuario.name} />
            <DetailRow icon={User} label="Usuário" value={usuario.username} />
            <DetailRow icon={Mail} label="E-mail" value={usuario.email} />
            <DetailRow icon={ShieldCheck} label="Cargo" value={usuario.cargo} />
            <div style={{ paddingTop: 18 }}>
              <p style={labelStyle}>Permissões</p>
              <p style={{
                ...valueStyle,
                color: usuario.is_superuser ? "#14532d" : "#6B0F2B",
              }}>
                {usuario.is_superuser
                  ? "Pode editar auditorias concluídas e respostas finalizadas."
                  : "Pode acessar e responder auditorias conforme as permissões da conta."}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
