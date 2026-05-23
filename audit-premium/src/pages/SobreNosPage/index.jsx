import React, { useEffect, useState } from "react";
import "./styles.css";
import Sidebar from "../../components/Sidebar";
import { Shield, Database, Layout, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SobreNosPage() {
  const [userName, setUserName] = useState("Fulano da Silva");
  const [userRole, setUserRole] = useState("Administrador");
  const navigate = useNavigate();

  useEffect(() => {
    const savedUserData = localStorage.getItem("user");
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        setUserName(parsed.name || parsed.username || "Lead Auditor");
        setUserRole(parsed.sub || "Auditor");
      } catch (e) {}
    }
  }, []);

  const fundamentos = [
    {
      icon: <Layout size={22} strokeWidth={1.5} />,
      titulo: "Contexto Acadêmico",
      texto:
        "O sistema foi projetado como atividade acadêmica da disciplina de Segurança de Informação, articulando conceitos de governança, conformidade, privacidade e gestão de riscos.",
    },
    {
      icon: <Database size={22} strokeWidth={1.5} />,
      titulo: "Modelagem e Rastreabilidade",
      texto:
        "A plataforma organiza normas, controles, respostas, evidências e logs de modificação para manter histórico auditável e coerência entre os registros do processo avaliativo.",
    },
    {
      icon: <Award size={22} strokeWidth={1.5} />,
      titulo: "Aplicação das Normas",
      texto:
        "O projeto utiliza controles relacionados às normas ISO/IEC 27002 e ISO/IEC 27701 como base para apoiar avaliações de maturidade e conformidade em segurança da informação.",
    },
  ];

  return (
    <div className="sobre-nos-page app-shell-page" style={{ minHeight: "100vh", backgroundColor: "#F4EFE6", display: "flex" }}>
      <Sidebar userName={userName} userSub={userRole} />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "48px 80px 48px 120px",
          gap: "36px",
          overflowY: "auto",
          maxWidth: "1600px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Botão voltar */}
        <button
          onClick={() => navigate("/home")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(107,15,43,0.55)",
            padding: 0,
            alignSelf: "flex-start",
          }}
        >
          ← Voltar ao Painel
        </button>

        {/* Cabeçalho — mesmo padrão do boas-vindas do Home */}
        <div
          style={{
            borderBottom: "1px solid rgba(107,15,43,0.1)",
            paddingBottom: "28px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "20px",
              fontStyle: "italic",
              color: "rgba(107,15,43,0.55)",
              margin: 0,
            }}
          >
            Projeto acadêmico
          </p>
          <h1
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "48px",
              fontWeight: 700,
              color: "#6B0F2B",
              margin: "4px 0 10px",
            }}
          >
            Sobre o Projeto
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              color: "rgba(107,15,43,0.45)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Segurança de Informação · IFC Campus Araquari
          </p>
        </div>

        {/* Manifesto — card escuro + texto, mesmo padrão dos cards de métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

          {/* Texto manifesto */}
          <div
            style={{
              backgroundColor: "rgba(212,197,169,0.25)",
              border: "1px solid rgba(107,15,43,0.12)",
              borderRadius: "8px",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(107,15,43,0.6)",
                margin: 0,
              }}
            >
              Apresentação
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                lineHeight: 1.8,
                color: "rgba(107,15,43,0.8)",
                margin: 0,
              }}
            >
              O <strong style={{ color: "#6B0F2B" }}>Audit Premium</strong> foi
              desenvolvido como um projeto acadêmico voltado ao estudo aplicado de
              auditorias de segurança da informação, conformidade normativa e gestão
              de evidências em ambientes organizacionais.
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                lineHeight: 1.8,
                color: "rgba(107,15,43,0.8)",
                margin: 0,
              }}
            >
              A proposta foi elaborada pelos alunos{" "}
              <strong style={{ color: "#6B0F2B" }}>Maria Fernanda Caetano</strong> e{" "}
              <strong style={{ color: "#6B0F2B" }}>Pedro Henrique Moreira Montes</strong>,
              no 7º semestre regular do curso de Bacharelado em Sistemas de Informação
              do IFC Campus Araquari.
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                lineHeight: 1.8,
                color: "rgba(107,15,43,0.8)",
                margin: 0,
              }}
            >
              O trabalho foi desenvolvido para a disciplina de{" "}
              <strong style={{ color: "#6B0F2B" }}>Segurança de Informação</strong>,
              ministrada pelo professor{" "}
              <strong style={{ color: "#6B0F2B" }}>Mehran Misaghi</strong>. Seu objetivo
              é demonstrar, em uma aplicação funcional, como requisitos de segurança,
              privacidade e governança podem ser traduzidos em fluxos de auditoria,
              indicadores e registros rastreáveis.
            </p>
          </div>

          {/* Card escuro — mesmo estilo do card "Auditorias Ativas" */}
          <div
            style={{
              backgroundColor: "#6B0F2B",
              borderRadius: "8px",
              padding: "36px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.05 }}>
              <Shield size={140} color="#D4C5A9" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "13px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(212,197,169,0.7)",
                  margin: 0,
                }}
              >
                Enfoque Metodológico
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#D4C5A9",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Auditoria, Evidência e Maturidade
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "13px",
                  color: "rgba(212,197,169,0.7)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                A aplicação integra interface web, API e banco de dados para apoiar o
                registro de respostas, a análise de conformidade, a visualização de
                dashboards e a preservação de logs, aproximando teoria e prática em
                Segurança de Informação.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "28px" }}>
              {["React", "Django REST", "ISO/IEC 27002", "ISO/IEC 27701"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "6px 16px",
                    backgroundColor: "rgba(86,9,32,0.6)",
                    border: "1px solid rgba(212,197,169,0.2)",
                    borderRadius: "6px",
                    fontSize: "11px",
                    color: "#D4C5A9",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Fundamentos — mesmo padrão da seção "Progresso" do Home */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(107,15,43,0.08)",
            borderRadius: "8px",
            padding: "40px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "28px",
              fontWeight: 700,
              color: "#6B0F2B",
              margin: "0 0 10px",
            }}
          >
            Fundamentos Acadêmicos
          </h3>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              color: "rgba(107,15,43,0.6)",
              margin: "0 0 28px",
            }}
          >
            Eixos que orientam a construção da plataforma e sua relação com a disciplina.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {fundamentos.map((f) => (
              <div
                key={f.titulo}
                style={{
                  backgroundColor: "white",
                  border: "1px solid rgba(107,15,43,0.08)",
                  borderRadius: "8px",
                  padding: "36px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(107,15,43,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6B0F2B",
                    marginBottom: "20px",
                  }}
                >
                  {f.icon}
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "20px",
                    fontWeight: 500,
                    color: "#6B0F2B",
                    margin: "0 0 10px",
                  }}
                >
                  {f.titulo}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "12px",
                    color: "rgba(107,15,43,0.55)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {f.texto}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé interno */}
        <div
          style={{
            backgroundColor: "rgba(107,15,43,0.04)",
            border: "1px solid rgba(107,15,43,0.08)",
            borderRadius: "8px",
            padding: "28px 40px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(107,15,43,0.5)",
              margin: "0 0 6px",
            }}
          >
            Audit Premium · Projeto Acadêmico
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              color: "rgba(107,15,43,0.35)",
              margin: 0,
            }}
          >
            Maria Fernanda Caetano e Pedro Henrique Moreira Montes · Bacharelado em Sistemas de Informação · IFC Campus Araquari · 2026
          </p>
        </div>
      </main>
    </div>
  );
}
