import { useState } from "react";
import "./styles.css";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo_vermelho.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Credenciais inválidas.");
        return;
      }

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/home");
    } catch {
      setError("Erro ao conectar com o servidor.");
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
      className="login-page auth-page"
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
          Bem-vindo de volta
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
          Acesse sua conta para continuar
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div>
            <label style={labelStyle}>Usuário</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="seu usuário"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Senha</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              style={inputStyle}
            />
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
            {loading ? "Entrando..." : "Entrar"}
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
          Não tem uma conta?{" "}
          <Link
            to="/cadastro"
            style={{ color: '#6B0F2B', textDecoration: 'underline', textUnderlineOffset: '3px' }}
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
