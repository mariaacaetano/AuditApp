import React, { useEffect, useState } from "react";
import "./styles.css";
import Sidebar from "../../components/Sidebar";
import {
  AlertCircle, BookOpen, CheckCircle2, Database, FileText, Layers3,
  Shield, Users,
} from "lucide-react";

const normas = [
  {
    icon: Shield,
    tag: "Segurança da Informação",
    title: "ISO/IEC 27002:2022",
    description:
      "Guia de referência para seleção, implementação e gestão de controles de segurança da informação em organizações de diferentes portes.",
    stats: ["93 controles", "4 temas", "Estrutura unificada"],
    tone: "primary",
  },
  {
    icon: BookOpen,
    tag: "Privacidade e LGPD",
    title: "ISO/IEC 27701:2019",
    description:
      "Extensão da ISO 27001 para gestão de privacidade, apoiando a estruturação de controles para dados pessoais e responsabilidades de tratamento.",
    stats: ["Dados pessoais", "Controlador", "Operador"],
    tone: "accent",
  },
];

const taxonomias = [
  {
    icon: Database,
    title: "Mapeamento ISO 27002",
    text: "Os controles são organizados por temas, propriedades de segurança, conceitos, domínios e capacidades operacionais.",
    chips: ["Organizacional", "Pessoas", "Físico", "Tecnológico"],
  },
  {
    icon: Users,
    title: "Mapeamento ISO 27701",
    text: "Os controles apoiam a distinção de papéis de privacidade e a avaliação de responsabilidades sobre dados pessoais.",
    chips: ["Controlador", "Operador", "PII", "LGPD"],
  },
  {
    icon: Layers3,
    title: "Base Relacional",
    text: "A estrutura do sistema conecta normas, controles, respostas e evidências para manter rastreabilidade nas auditorias.",
    chips: ["Normas", "Controles", "Respostas", "Evidências"],
  },
  {
    icon: CheckCircle2,
    title: "Uso em Auditoria",
    text: "Cada resposta exige situação, observação técnica e justificativa, formando um histórico consistente de avaliação.",
    chips: ["Conforme", "Não Conforme", "Não Aplica"],
  },
];

function NormaCard({ norma }) {
  const Icon = norma.icon;
  const primary = norma.tone === "primary";

  return (
    <article className="normas-card">
      <div className={primary ? "normas-card__icon normas-card__icon--primary" : "normas-card__icon"}>
        <Icon size={24} strokeWidth={1.6} />
      </div>
      <p className="normas-card__tag">{norma.tag}</p>
      <h2 className="normas-card__title">{norma.title}</h2>
      <p className="normas-card__description">{norma.description}</p>
      <div className="normas-card__stats">
        {norma.stats.map(stat => (
          <span key={stat}>{stat}</span>
        ))}
      </div>
    </article>
  );
}

function TaxonomyCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="normas-taxonomy">
      <div className="normas-taxonomy__header">
        <div className="normas-taxonomy__icon">
          <Icon size={18} strokeWidth={1.7} />
        </div>
        <h3>{item.title}</h3>
      </div>
      <p>{item.text}</p>
      <div className="normas-taxonomy__chips">
        {item.chips.map(chip => (
          <span key={chip}>{chip}</span>
        ))}
      </div>
    </article>
  );
}

export default function NormasPage() {
  const [userName, setUserName] = useState("Fulano da Silva");
  const [userRole, setUserRole] = useState("Auditor");

  useEffect(() => {
    const savedUserData = localStorage.getItem("user");
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData);
        setUserName(parsed.name || parsed.username || "Lead Auditor");
        setUserRole(parsed.cargo || parsed.sub || "Auditor");
      } catch {}
    }
  }, []);

  return (
    <div className="normas-page">
      <Sidebar userName={userName} userSub={userRole} />

      <main className="normas-page__main">
        <header className="normas-page__header">
          <p>Base técnica</p>
          <h1>Normas</h1>
          <span>Frameworks de auditoria de cibersegurança e privacidade</span>
        </header>

        <section className="normas-grid" aria-label="Normas disponíveis">
          {normas.map(norma => (
            <NormaCard key={norma.title} norma={norma} />
          ))}
        </section>

        <section className="normas-section">
          <div className="normas-section__title">
            <FileText size={20} strokeWidth={1.6} />
            <div>
              <p>Estrutura de dados</p>
              <h2>Taxonomia Técnica</h2>
            </div>
          </div>

          <div className="normas-taxonomy-grid">
            {taxonomias.map(item => (
              <TaxonomyCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="normas-note">
          <AlertCircle size={22} strokeWidth={1.6} />
          <div>
            <h2>Nota metodológica</h2>
            <p>
              Os controles usados na plataforma são estruturados para apoiar a auditoria com rastreabilidade:
              respostas, justificativas e evidências ficam conectadas ao escopo da norma e à auditoria realizada.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
