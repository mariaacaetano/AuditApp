import { useNavigate } from "react-router-dom";
import "./styles.css";
import logo from "../../assets/logo.png";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page min-h-screen flex flex-col items-center justify-center bg-[#6B0F2B]">
      <div className="landing-page__brand" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '80px' }}>
        <img
          src={logo}
          alt="Audit Premium Logo"
          className="landing-page__logo w-auto"
          style={{ height: "250px", display: "block" }}
        />
        <span
          className="landing-page__brand-text text-[#D4C5A9]"
          style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 700, fontSize: '100px' }}
        >
          audit premium
        </span>
      </div>

      <div className="landing-page__actions" style={{ display: 'flex', gap: '40px' }}>
        <button
          onClick={() => navigate("/login")}
          style={{
            fontFamily: "var(--font-sans)",
            backgroundColor: '#D4C5A9',
            color: '#6B0F2B',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 40px',
            fontSize: '14px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => {
            e.target.style.backgroundColor = '#b8a98e';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = '#D4C5A9';
            e.target.style.transform = 'scale(1)';
          }}
        >
          Entrar
        </button>

        <button
          onClick={() => navigate("/cadastro")}
          style={{
            fontFamily: "var(--font-sans)",
            backgroundColor: 'transparent',
            color: '#D4C5A9',
            border: '1.5px solid #D4C5A9',
            borderRadius: '6px',
            padding: '12px 40px',
            fontSize: '14px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => {
            e.target.style.backgroundColor = '#D4C5A9';
            e.target.style.color = '#6B0F2B';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#D4C5A9';
            e.target.style.transform = 'scale(1)';
          }}
        >
          Cadastre-se
        </button>
      </div>
    </div>
  );
}
