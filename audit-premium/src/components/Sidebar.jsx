import {
  BarChart2,
  Bookmark,
  Box,
  CheckCircle,
  Paperclip,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Sidebar.css";

const navItems = [
  { label: "Home", icon: BarChart2, to: "/home" },
  { label: "Auditorias", icon: CheckCircle, to: "/auditorias" },
  { label: "Normas", icon: Paperclip, to: "/normas" },
  { label: "Empresas", icon: Box, to: "/empresas" },
  { label: "Sobre nós", icon: Bookmark, to: "/sobre" },
];

export default function Sidebar({
  userName = "Fulano da Silva",
  userSub = "Auditor",
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const isSuperuser = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return Boolean(user.is_superuser || user.isSuperuser);
    } catch {
      return false;
    }
  })();
  const items = isSuperuser
    ? [
        ...navItems.slice(0, 4),
        { label: "Usuários", icon: Users, to: "/usuarios" },
        ...navItems.slice(4),
      ]
    : navItems;

  const handleProfile = () => {
    navigate("/perfil");
  };

  return (
    <aside
      className={expanded ? "app-sidebar app-sidebar--expanded" : "app-sidebar"}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="app-sidebar__brand">
        <img
          src={logo}
          alt="Logo"
          className="app-sidebar__logo"
        />
        {expanded && (
          <span className="app-sidebar__brand-text smooth-slide">
            audit premium
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="app-sidebar__nav">
        {items.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? "app-sidebar__link app-sidebar__link--active" : "app-sidebar__link"}
            title={label}
          >
            <Icon size={24} strokeWidth={1.5} className="app-sidebar__icon" />
            {expanded && (
              <span className="app-sidebar__label smooth-slide">
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Usuário */}
      <div className="app-sidebar__user">
        <button
          onClick={handleProfile}
          title="Abrir perfil"
          className="app-sidebar__profile"
        >
          <div className="app-sidebar__avatar">
            <User size={18} strokeWidth={1.5} color="#D4C5A9" />
          </div>
          {expanded && (
            <div className="app-sidebar__user-text smooth-slide">
              <p>
                {userName}
              </p>
              <p>
                {userSub}
              </p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
