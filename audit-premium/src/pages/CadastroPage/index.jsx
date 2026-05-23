import React, { useState } from "react";
import "./styles.css";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/logo_vermelho.png";

export default function CadastroPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    username: "",
    accessCode: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const senhaNormalizada = form.password.trim().toLowerCase();
  const dadosUsuario = [form.nome, form.email, form.username]
    .map(value => value.trim().toLowerCase())
    .filter(value => value.length >= 3);
  const senhaStatus = [
    {
      label: "Use pelo menos 8 caracteres.",
      valid: form.password.length >= 8,
    },
    {
      label: "Evite senhas muito comuns, como senha123 ou 12345678.",
      valid: !["senha123", "12345678", "password", "admin123"].includes(senhaNormalizada),
    },
    {
      label: "Não use apenas números.",
      valid: form.password.length > 0 && !/^\d+$/.test(form.password),
    },
    {
      label: "Não use uma senha parecida com seu nome, e-mail ou usuário.",
      valid: form.password.length > 0 && !dadosUsuario.some(value => senhaNormalizada.includes(value) || value.includes(senhaNormalizada)),
    },
  ];

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatApiError = (data) => {
    if (data?.detail) return data.detail;
    if (typeof data === "string") return data;
    if (!data || typeof data !== "object") {
      return "Não foi possível criar a conta. Verifique os dados.";
    }

    const labels = {
      access_code: "Código de acesso",
      email: "Email",
      username: "Nome de usuário",
      password: "Senha",
      name: "Nome",
    };

    const messages = Object.entries(data).map(([field, value]) => {
      const message = Array.isArray(value) ? value.join(" ") : String(value);
      return `${labels[field] || field}: ${message}`;
    });

    return messages.join(" ");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.nome,
          email: form.email,
          username: form.username,
          access_code: form.accessCode,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(formatApiError(data));
        return;
      }

      navigate("/login");
    } catch (err) {
      setError("Erro ao conectar com o servidor. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    fontFamily: "var(--font-sans)",
    fontSize: '11px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#6B0F2B',
    display: 'block',
    marginBottom: '4px',
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(107,15,43,0.35)',
    padding: '6px 0',
    fontSize: '13px',
    color: '#6B0F2B',
    fontFamily: "var(--font-sans)",
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      className="cadastro-page auth-page"
      style={{
        minHeight: '100vh',
        backgroundColor: '#6B0F2B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="auth-card"
        style={{
          backgroundColor: '#D4C5A9',
          borderRadius: '8px',
          padding: '40px 44px',
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <img
          src={logo}
          alt="Logo"
          className="auth-card__logo"
          style={{ height: '80px', width: 'auto', marginBottom: '8px' }}
        />
        <span
          className="auth-card__brand"
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontWeight: 500,
            fontSize: '36px',
            color: '#6B0F2B',
            marginBottom: '20px',
          }}
        >
          audit premium
        </span>

        <h2
          className="auth-card__title"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: '22px',
            color: '#6B0F2B',
            marginBottom: '2px',
            alignSelf: 'flex-start',
          }}
        >
          Credenciamento
        </h2>
        <p
          className="auth-card__subtitle"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: '14px',
            color: 'rgba(107,15,43,0.55)',
            marginBottom: '20px',
            alignSelf: 'flex-start',
            letterSpacing: '0.03em',
          }}
        >
          Cadastre suas credenciais para continuar
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div>
            <label style={labelStyle}>Nome Completo</label>
            <input type="text" name="nome" required value={form.nome} onChange={handleChange} placeholder="Ex: Dr. Fulano da Silva" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Email Corporativo</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="exemplo@organizacao.com" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Nome de Usuário</label>
            <input type="text" name="username" required value={form.username} onChange={handleChange} placeholder="Seu nome de usuário" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Código de Acesso</label>
            <input type="text" name="accessCode" required value={form.accessCode} onChange={handleChange} placeholder="Código fornecido pela administração" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Senha</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange} placeholder="Mínimo 8 caracteres" style={inputStyle} />
            <div className="cadastro-page__password-help" aria-live="polite">
              <strong>A senha precisa seguir estes critérios:</strong>
              <ul>
                {senhaStatus.map(item => (
                  <li
                    key={item.label}
                    className={form.password ? (item.valid ? "is-valid" : "is-invalid") : ""}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Confirmar Senha</label>
            <input type="password" name="confirmPassword" required value={form.confirmPassword} onChange={handleChange} placeholder="Confirme sua senha" style={inputStyle} />
          </div>

          {error && (
            <p style={{ color: '#7f1d1d', fontSize: '12px', textAlign: 'center' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#6B0F2B',
              color: '#D4C5A9',
              border: 'none',
              fontFamily: "var(--font-sans)",
              fontSize: '13px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => !loading && (e.target.style.backgroundColor = '#5a0c24')}
            onMouseLeave={e => (e.target.style.backgroundColor = '#6B0F2B')}
          >
            {loading ? "Criando Registro..." : "Cadastrar Auditor"}
          </button>
        </form>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: '14px',
            color: 'rgba(107,15,43,0.6)',
            marginTop: '20px',
          }}
        >
          Já possui login?{" "}
          <Link to="/login" style={{ color: '#6B0F2B', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
