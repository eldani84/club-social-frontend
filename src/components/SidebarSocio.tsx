// src/components/SidebarSocio.tsx
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaUsers,
  FaKey,
  FaMoneyBillWave,
  FaDollarSign,
  FaFileInvoice,
} from "react-icons/fa";

import "./Sidebar.css"; // Usa el mismo CSS si ya lo estás utilizando para mantener estilos consistentes

export default function SidebarSocio() {
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ? "active" : "";

  return (
    <nav className="sidebar">
      <ul>
        <li>
          <Link to="/socio/perfil" className={isActive("/socio/perfil")}>
            <FaHome /> <span>Inicio</span>
          </Link>
        </li>
        <li>
          <Link to="/socio/perfil/datos" className={isActive("/socio/perfil/datos")}>
            <FaUser /> <span>Mis Datos</span>
          </Link>
        </li>
        <li>
          <Link to="/socio/perfil/grupo" className={isActive("/socio/perfil/grupo")}>
            <FaUsers /> <span>Grupo Familiar</span>
          </Link>
        </li>
        <li>
          <Link to="/socio/perfil/cuotas" className={isActive("/socio/perfil/cuotas")}>
            <FaFileInvoice /> <span>Cuotas</span>
          </Link>
        </li>
        <li>
          <Link to="/socio/perfil/saldos" className={isActive("/socio/perfil/saldos")}>
            <FaDollarSign /> <span>Saldos Extra</span>
          </Link>
        </li>
        <li>
          <Link to="/socio/perfil/link-pago" className={isActive("/socio/perfil/link-pago")}>
            <FaMoneyBillWave /> <span>Pago</span>
          </Link>
        </li>
        <li>
          <Link to="/socio/perfil/cambiar-clave" className={isActive("/socio/perfil/cambiar-clave")}>
            <FaKey /> <span>Clave</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
