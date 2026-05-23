import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";
import Sidebar from "../../components/Sidebar";
import {
  BarChart3, Building2, CheckCircle2, ClipboardList, FileText,
  Library, Shield, TimerReset,
} from "lucide-react";

const BASE = "http://localhost:8000/controles";

const isConcluida = (status) =>
  String(status || "").toUpperCase() === "CONCLUIDA";

function MetricCard({ icon: Icon, label, value, helper, variant = "light" }) {
  return (
    <article className={`home-metric home-metric--${variant}`}>
      <div className="home-metric__icon">
        <Icon size={20} strokeWidth={1.6} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
    </article>
  );
}

function StatusBar({ concluida, inconcluida }) {
  const total = concluida + inconcluida;
  const concluidaPct = total ? Math.round((concluida / total) * 100) : 0;

  return (
    <section className="home-panel">
      <div className="home-panel__header">
        <div>
          <p>Visão geral</p>
          <h2>Status das auditorias</h2>
        </div>
        <span>{concluidaPct}% concluídas</span>
      </div>
      <div className="home-progress">
        <div style={{ width: `${concluidaPct}%` }} />
      </div>
      <div className="home-status-grid">
        <div>
          <CheckCircle2 size={16} />
          <span>Concluídas</span>
          <strong>{concluida}</strong>
        </div>
        <div>
          <TimerReset size={16} />
          <span>Em andamento</span>
          <strong>{inconcluida}</strong>
        </div>
      </div>
    </section>
  );
}

function RecentAudits({ auditorias }) {
  return (
    <section className="home-panel">
      <div className="home-panel__header">
        <div>
          <p>Atividade recente</p>
          <h2>Últimas auditorias</h2>
        </div>
      </div>

      {auditorias.length === 0 ? (
        <div className="home-empty">
          <ClipboardList size={28} strokeWidth={1.4} />
          <span>Nenhuma auditoria encontrada.</span>
        </div>
      ) : (
        <div className="home-audit-list">
          {auditorias.map(auditoria => (
            <article key={auditoria.id_auditoria} className="home-audit-row">
              <div>
                <strong>{auditoria.nome || auditoria.empresa}</strong>
                <span>{auditoria.empresa} · {auditoria.norma}</span>
              </div>
              <div>
                <span>{auditoria.data_auditoria}</span>
                <em className={isConcluida(auditoria.status) ? "is-done" : ""}>
                  {isConcluida(auditoria.status) ? "Concluída" : "Inconcluída"}
                </em>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const [userName, setUserName] = useState("Fulano da Silva");
  const [userRole, setUserRole] = useState("Auditor");
  const [auditorias, setAuditorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [normas, setNormas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const token = () => localStorage.getItem("access_token");

  useEffect(() => {
    const savedUserData = localStorage.getItem("user");
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        setUserName(parsed.name || parsed.username || "Lead Auditor");
        setUserRole(parsed.cargo || parsed.sub || "Auditor");
      } catch {}
    }
    fetchDashboard();
  }, []);

  const fetchJson = async (url) => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!response.ok) throw new Error("Erro ao carregar dados.");
    return response.json();
  };

  const fetchDashboard = async () => {
    setErro("");
    setLoading(true);
    try {
      const [auditoriasData, empresasData, normasData] = await Promise.all([
        fetchJson(`${BASE}/auditorias/view`),
        fetchJson(`${BASE}/empresas/view`),
        fetchJson(`${BASE}/normas/`),
      ]);
      setAuditorias(auditoriasData);
      setEmpresas(empresasData);
      setNormas(normasData);
    } catch {
      setErro("Não foi possível carregar os dados do painel.");
    } finally {
      setLoading(false);
    }
  };

  const dashboard = useMemo(() => {
    const concluidas = auditorias.filter(a => isConcluida(a.status)).length;
    const inconcluidas = auditorias.length - concluidas;
    const empresasAuditadas = new Set(auditorias.map(a => a.empresa)).size;
    const recentes = [...auditorias]
      .sort((a, b) => new Date(b.data_auditoria) - new Date(a.data_auditoria))
      .slice(0, 5);

    return {
      concluidas,
      inconcluidas,
      empresasAuditadas,
      recentes,
    };
  }, [auditorias]);

  return (
    <div className="home-page">
      <Sidebar userName={userName} userSub={userRole} />

      <main className="home-page__main">
        <header className="home-page__header">
          <p>Seja bem-vindo,</p>
          <h1>{userName}</h1>
          <span>{userRole} · Portal de Governança e Cibersegurança</span>
        </header>

        {erro && <div className="home-alert">{erro}</div>}

        <section className="home-metrics-grid" aria-label="Indicadores do painel">
          <MetricCard
            icon={ClipboardList}
            label="Auditorias"
            value={loading ? "..." : auditorias.length}
            helper="Total disponível para o usuário"
            variant="primary"
          />
          <MetricCard
            icon={TimerReset}
            label="Em andamento"
            value={loading ? "..." : dashboard.inconcluidas}
            helper="Auditorias ainda inconcluídas"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Concluídas"
            value={loading ? "..." : dashboard.concluidas}
            helper="Auditorias finalizadas"
          />
          <MetricCard
            icon={Building2}
            label="Empresas"
            value={loading ? "..." : empresas.length}
            helper={`${dashboard.empresasAuditadas} com auditoria vinculada`}
          />
          <MetricCard
            icon={Library}
            label="Normas"
            value={loading ? "..." : normas.length}
            helper={normas.map(n => n.nome).join(" · ") || "Sem normas carregadas"}
          />
          <MetricCard
            icon={Shield}
            label="Escopo"
            value="ISO"
            helper="Segurança da informação e privacidade"
          />
        </section>

        <div className="home-content-grid">
          <StatusBar concluida={dashboard.concluidas} inconcluida={dashboard.inconcluidas} />
          <RecentAudits auditorias={dashboard.recentes} />
        </div>

        <section className="home-panel home-panel--wide">
          <div className="home-panel__header">
            <div>
              <p>Base integrada</p>
              <h2>Resumo do ambiente</h2>
            </div>
            <BarChart3 size={22} strokeWidth={1.6} />
          </div>
          <div className="home-summary-grid">
            <div>
              <FileText size={16} />
              <span>Normas cadastradas</span>
              <strong>{normas.length}</strong>
            </div>
            <div>
              <Building2 size={16} />
              <span>Empresas cadastradas</span>
              <strong>{empresas.length}</strong>
            </div>
            <div>
              <ClipboardList size={16} />
              <span>Auditorias vinculadas</span>
              <strong>{auditorias.length}</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
