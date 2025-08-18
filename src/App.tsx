// C:\Users\Daniel\Documents\VCC CURSO\club-social-frontend\src\App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider } from "./context/auth";
import RutaPrivada from "./components/RutaPrivada";
import RutaPrivadaSocio from "./components/RutaPrivadaSocio";

import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Home from "./pages/Home";
import Login from "./pages/Login";

import IngresarSocio from "./pages/Socios/IngresarSocio";
import GestionarSocios from "./pages/Socios/GestionarSocios";
import CrearGrupoFamiliar from "./pages/GrupoFamiliar/CrearGrupoFamiliar";
import GestionarGrupoFamiliar from "./pages/GrupoFamiliar/GestionarGrupoFamiliar";
import GenerarMensual from "./pages/Cuotas/GenerarMensual";
import GenerarIndividual from "./pages/Cuotas/GenerarIndividual";
import PagosRapidos from "./pages/Cuotas/pagoCB";
import ControlCuotas from "./pages/Cuotas/ControlCuotas";
import ImprimirCuotas from "./pages/Cuotas/ImprimirCuotas";
import GenerarLinksMasivosMP from "./pages/Cuotas/mercadopago";
import InformeMorosidadConsolidada from "./pages/Informes/InformeMorosidadConsolidada";
import InformeCuotasFiltros from "./pages/Informes/InformeCuotasFiltros";
import CrearUsuario from "./pages/Usuarios/CrearUsuario";
import EditarImporteCategoria from "./pages/Categorias/EditarImporteCategoria";

// SOCIO
import LoginSocio from "./pages/Socios/LoginSocio";
import PerfilSocioDashboard from "./pages/Socios/PerfilSocioDashboard";
import CambiarClaveSocio from "./pages/Socios/CambiarClaveSocio";
import VerGrupoFamiliar from "./pages/Socios/VerGrupoFamiliar";
import GenerarLinkPago from "./pages/Socios/GenerarLinkPago";
import VerSaldosExtra from "./pages/Socios/VerSaldosExtra";
import VerDatosSocio from "./pages/Socios/VerDatosSocio";
import CuentaCorriente from "./pages/Socios/CuentaCorriente";
import CuentaCorrienteDetalle from "./pages/Socios/CuentaCorrienteDetalle";

// DISCIPLINAS
import InscripcionesSocio from "./pages/Disciplinas/InscripcionesSocio";
import InscribirSocioDisciplina from "./pages/Disciplinas/InscribirSocioDisciplina";
import ABMDisciplinas from "./pages/Disciplinas/ABMDisciplinas";
import GenerarCuotasDisciplina from "./pages/Disciplinas/GenerarCuotasDisciplina"; // ⬅️ NUEVO
import ImprimirCuotasDisciplina from "./pages/Disciplinas/ImprimirCuotasDisciplina";

import "./styles/ModernUI.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [socioToken, setSocioToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setSocioToken(localStorage.getItem("socioToken"));
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : socioToken ? (
            <Navigate to="/socio/perfil" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Logins */}
      <Route path="/login" element={<Login />} />
      <Route path="/socio/login" element={<LoginSocio />} />

      {/* Admin (privado) */}
      <Route
        path="/*"
        element={
          <RutaPrivada>
            <LayoutPrivado />
          </RutaPrivada>
        }
      />

      {/* Socio (modo app protegido) */}
      <Route
        path="/socio/*"
        element={
          <RutaPrivadaSocio>
            <LayoutSocio />
          </RutaPrivadaSocio>
        }
      />
    </Routes>
  );
}

function LayoutPrivado() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <Routes>
          <Route path="dashboard" element={<Home />} />
          <Route path="socios/ingresar" element={<IngresarSocio />} />
          <Route path="socios/gestionar" element={<GestionarSocios />} />
          <Route path="grupofamiliar/crear" element={<CrearGrupoFamiliar />} />
          <Route path="grupofamiliar/gestionar" element={<GestionarGrupoFamiliar />} />
          <Route path="cuotas/generar-mensual" element={<GenerarMensual />} />
          <Route path="cuotas/generar-individual" element={<GenerarIndividual />} />
          <Route path="cuotas" element={<ControlCuotas />} />
          <Route path="cuotas/imprimir" element={<ImprimirCuotas />} />
          <Route path="cuotas/mercadopago" element={<GenerarLinksMasivosMP />} />
          <Route path="pagos-rapidos" element={<PagosRapidos />} />
          <Route path="informes/morosidad" element={<InformeMorosidadConsolidada />} />
          <Route path="informes/cuotas" element={<InformeCuotasFiltros />} />
          <Route path="informes/mora-por-socio" element={<ControlCuotas />} />
          <Route path="usuarios/crear" element={<CrearUsuario />} />
          <Route path="categorias/editar-importe" element={<EditarImporteCategoria />} />

          {/* DISCIPLINAS */}
          <Route path="disciplinas/inscribir" element={<InscribirSocioDisciplina />} />
          <Route path="disciplinas/inscripciones" element={<InscripcionesSocio />} />
          <Route path="disciplinas/gestionar" element={<ABMDisciplinas />} />
          <Route path="disciplinas/cuotas/generar" element={<GenerarCuotasDisciplina />} /> {/* ⬅️ NUEVO */}
          <Route path="disciplinas/cuotas/imprimir" element={<ImprimirCuotasDisciplina />} />
        </Routes>
      </div>
    </div>
  );
}

function LayoutSocio() {
  return (
    <Routes>
      <Route path="perfil" element={<PerfilSocioDashboard />} />
      <Route path="perfil/datos" element={<VerDatosSocio />} />
      <Route path="perfil/cambiar-clave" element={<CambiarClaveSocio />} />
      <Route path="perfil/grupo" element={<VerGrupoFamiliar />} />
      <Route path="perfil/cuotas" element={<CuentaCorriente />} />
      <Route path="perfil/link-pago" element={<GenerarLinkPago />} />
      <Route path="perfil/saldos" element={<VerSaldosExtra />} />
      <Route path="cuenta-corriente/detalle/:dni" element={<CuentaCorrienteDetalle />} />
    </Routes>
  );
}
