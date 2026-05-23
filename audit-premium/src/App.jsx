import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  AuditoriasPage,
  CadastroPage,
  DashboardAuditoriaPage,
  EmpresasPage,
  HomePage,
  LandingPage,
  LoginPage,
  NormasPage,
  PerfilPage,
  RespostaAuditoriaPage,
  SobreNosPage,
  UsuariosPage,
} from "./pages";

// Guard simples: redireciona para /login se não houver token
function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

function privatePage(Page) {
  return (
    <PrivateRoute>
      <Page />
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/home" element={privatePage(HomePage)} />
        <Route path="/empresas" element={privatePage(EmpresasPage)} />
        <Route path="/sobre" element={privatePage(SobreNosPage)} />
        <Route path="/auditorias" element={privatePage(AuditoriasPage)} />
        <Route path="/normas" element={privatePage(NormasPage)} />
        <Route path="/perfil" element={privatePage(PerfilPage)} />
        <Route path="/usuarios" element={privatePage(UsuariosPage)} />
        <Route path="/auditorias/:id_auditoria/dashboard" element={privatePage(DashboardAuditoriaPage)} />
        <Route path="/auditorias/:id_auditoria/responder" element={privatePage(RespostaAuditoriaPage)} />
      </Routes>
    </BrowserRouter>
  );
}
