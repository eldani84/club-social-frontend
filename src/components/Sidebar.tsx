import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaUserPlus,
  FaClipboardList,
  FaUserFriends,
  FaTools,
  FaMoneyCheckAlt,
  FaCalendarPlus,
  FaFileInvoiceDollar,
  FaCashRegister,
  FaTable,
  FaPrint,
  FaCreditCard,
  FaChartBar,
  FaHourglassHalf,
  FaFileAlt,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaUserCog
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { useAuth } from "../context/auth";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();
  const { usuario } = useAuth();

  const isCuotas =
    location.pathname.startsWith("/cuotas") ||
    location.pathname.startsWith("/pagos-rapidos");

  const [openSocios, setOpenSocios] = useState(false);
  const [openGrupos, setOpenGrupos] = useState(false);
  const [openCuotas, setOpenCuotas] = useState(isCuotas);
  const [openInformes, setOpenInformes] = useState(false);
  const [colapsado, setColapsado] = useState(false);

  useEffect(() => {
    setOpenCuotas(isCuotas);
  }, [location.pathname]);

  return (
    <nav className={`sidebar ${colapsado ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!colapsado && (
          <img src="/logo_caf.png" alt="Logo CAF" className="sidebar-logo" />
        )}
        <button
          className="collapse-btn"
          onClick={() => setColapsado(!colapsado)}
        >
          {colapsado ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      <ul>
        <li>
          <Link
            to="/"
            className={location.pathname === "/" ? "active" : ""}
            title="Inicio"
          >
            <FaHome /> {colapsado ? "" : "Inicio"}
          </Link>
        </li>

        {/* SOCIOS */}
        <li onClick={() => setOpenSocios(!openSocios)}>
          <span title="Socios">
            <FaUsers /> {colapsado ? "" : "Socios"}
            {!colapsado && (
              <FaChevronDown
                className={`chev ${openSocios ? "rot" : ""}`}
              />
            )}
          </span>
          {!colapsado && openSocios && (
            <ul className="submenu">
              <li>
                <Link
                  to="/socios/ingresar"
                  className={
                    location.pathname === "/socios/ingresar" ? "active" : ""
                  }
                >
                  <FaUserPlus /> Ingresar Socio
                </Link>
              </li>
              <li>
                <Link
                  to="/socios/gestionar"
                  className={
                    location.pathname === "/socios/gestionar" ? "active" : ""
                  }
                >
                  <FaClipboardList /> Gestionar Socios
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* GRUPOS FAMILIARES */}
        <li onClick={() => setOpenGrupos(!openGrupos)}>
          <span title="Grupo Familiar">
            <FaUsers /> {colapsado ? "" : "Grupo Familiar"}
            {!colapsado && (
              <FaChevronDown
                className={`chev ${openGrupos ? "rot" : ""}`}
              />
            )}
          </span>
          {!colapsado && openGrupos && (
            <ul className="submenu">
              <li>
                <Link
                  to="/grupofamiliar/crear"
                  className={
                    location.pathname === "/grupofamiliar/crear"
                      ? "active"
                      : ""
                  }
                >
                  <FaUserFriends /> Crear Grupo Familiar
                </Link>
              </li>
              <li>
                <Link
                  to="/grupofamiliar/gestionar"
                  className={
                    location.pathname === "/grupofamiliar/gestionar"
                      ? "active"
                      : ""
                  }
                >
                  <FaTools /> Gestionar Grupos
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* CUOTAS */}
        <li onClick={() => setOpenCuotas(!openCuotas)}>
          <span title="Cuotas">
            <FaMoneyCheckAlt /> {colapsado ? "" : "Cuotas"}
            {!colapsado && (
              <FaChevronDown className={`chev ${openCuotas ? "rot" : ""}`} />
            )}
          </span>
          {!colapsado && openCuotas && (
            <ul className="submenu">
              <li>
                <Link
                  to="/cuotas/generar-mensual"
                  className={
                    location.pathname === "/cuotas/generar-mensual"
                      ? "active"
                      : ""
                  }
                >
                  <FaCalendarPlus /> Generar Mensual
                </Link>
              </li>
              <li>
                <Link
                  to="/cuotas/generar-individual"
                  className={
                    location.pathname === "/cuotas/generar-individual"
                      ? "active"
                      : ""
                  }
                >
                  <FaFileInvoiceDollar /> Generar Individual
                </Link>
              </li>
              <li>
                <Link
                  to="/pagos-rapidos"
                  className={
                    location.pathname === "/pagos-rapidos" ? "active" : ""
                  }
                >
                  <FaCashRegister /> Registro Pagos
                </Link>
              </li>
              <li>
                <Link
                  to="/cuotas"
                  className={
                    location.pathname === "/cuotas" ? "active" : ""
                  }
                >
                  <FaTable /> Control de Cuotas
                </Link>
              </li>
              <li>
                <Link
                  to="/cuotas/imprimir"
                  className={
                    location.pathname === "/cuotas/imprimir" ? "active" : ""
                  }
                >
                  <FaPrint /> Imprimir Cuotas
                </Link>
              </li>
              <li>
                <Link
                  to="/cuotas/mercadopago"
                  className={
                    location.pathname === "/cuotas/mercadopago" ? "active" : ""
                  }
                >
                  <FaCreditCard /> Links Mercado Pago
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* INFORMES */}
        <li onClick={() => setOpenInformes(!openInformes)}>
          <span title="Informes">
            <FaChartBar /> {colapsado ? "" : "Informes"}
            {!colapsado && (
              <FaChevronDown
                className={`chev ${openInformes ? "rot" : ""}`}
              />
            )}
          </span>
          {!colapsado && openInformes && (
            <ul className="submenu">
              <li>
                <Link
                  to="/informes/morosidad"
                  className={
                    location.pathname === "/informes/morosidad"
                      ? "active"
                      : ""
                  }
                >
                  <FaHourglassHalf /> Morosidad Consolidada
                </Link>
              </li>
              <li>
                <Link
                  to="/informes/cuotas"
                  className={
                    location.pathname === "/informes/cuotas" ? "active" : ""
                  }
                >
                  <FaFileAlt /> Informe de Cuotas
                </Link>
              </li>
            </ul>
          )}
        </li>

        {/* SOLO PARA ADMIN */}
        {usuario?.rol === "admin" && (
          <li>
            <Link
              to="/usuarios/crear"
              className={
                location.pathname === "/usuarios/crear" ? "active" : ""
              }
              title="Crear Usuario"
            >
              <FaUserCog /> {colapsado ? "" : "Crear Usuario"}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
