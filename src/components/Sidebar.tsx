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
  FaUserCog,
  FaTags,
  FaSearch,
  FaFutbol,        // ⬅️ Módulo Disciplinas
  FaPlusCircle,    // ⬅️ Inscribir
  FaListUl,        // ⬅️ Inscripciones del socio
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

  const isInformes = location.pathname.startsWith("/informes");
  const isDisciplinas = location.pathname.startsWith("/disciplinas"); // ⬅️ NUEVO

  const [openSocios, setOpenSocios] = useState(false);
  const [openGrupos, setOpenGrupos] = useState(false);
  const [openCuotas, setOpenCuotas] = useState(isCuotas);
  const [openInformes, setOpenInformes] = useState(isInformes);
  const [openDisciplinas, setOpenDisciplinas] = useState(isDisciplinas); // ⬅️ NUEVO
  const [colapsado, setColapsado] = useState(false);

  useEffect(() => {
    setOpenCuotas(isCuotas);
  }, [location.pathname]);

  useEffect(() => {
    setOpenInformes(isInformes);
  }, [location.pathname]);

  useEffect(() => {
    setOpenDisciplinas(isDisciplinas);
  }, [location.pathname]); // ⬅️ NUEVO

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

      {/* ⬇️ CONTENEDOR SCROLLEABLE */}
      <div className="sidebar-scroll">
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
                <FaChevronDown className={`chev ${openSocios ? "rot" : ""}`} />
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
                <FaChevronDown className={`chev ${openGrupos ? "rot" : ""}`} />
              )}
            </span>
            {!colapsado && openGrupos && (
              <ul className="submenu">
                <li>
                  <Link
                    to="/grupofamiliar/crear"
                    className={
                      location.pathname === "/grupofamiliar/crear" ? "active" : ""
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
                    className={location.pathname === "/cuotas" ? "active" : ""}
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

                {/* CATEGORÍAS (Importes) */}
                <li>
                  <Link
                    to="/categorias/editar-importe"
                    className={
                      location.pathname === "/categorias/editar-importe"
                        ? "active"
                        : ""
                    }
                  >
                    <FaTags /> Categorías (Importes)
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* DISCIPLINAS — NUEVO MÓDULO */}
          <li onClick={() => setOpenDisciplinas(!openDisciplinas)}>
            <span title="Disciplinas">
              <FaFutbol /> {colapsado ? "" : "Disciplinas"}
              {!colapsado && (
                <FaChevronDown className={`chev ${openDisciplinas ? "rot" : ""}`} />
              )}
            </span>
            {!colapsado && openDisciplinas && (
              <ul className="submenu">
                <li>
                  <Link
                    to="/disciplinas/inscribir"
                    className={
                      location.pathname === "/disciplinas/inscribir" ? "active" : ""
                    }
                  >
                    <FaPlusCircle /> Inscribir socio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/disciplinas/inscripciones"
                    className={
                      location.pathname === "/disciplinas/inscripciones" ? "active" : ""
                    }
                  >
                    <FaListUl /> Inscripciones del socio
                  </Link>
                </li>
                {/* ⬇️ Nuevo: ABM de disciplinas */}
                <li>
                  <Link
                    to="/disciplinas/gestionar"
                    className={
                      location.pathname === "/disciplinas/gestionar" ? "active" : ""
                    }
                  >
                    <FaTools /> Gestionar disciplinas
                  </Link>
                </li>
                <li>
                    <Link
                      to="/disciplinas/cuotas/generar"
                      className={location.pathname === "/disciplinas/cuotas/generar" ? "active" : ""}
                    >
                      {/* Podés usar el ícono que prefieras */}
                      <FaCalendarPlus /> Generar cuotas
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/disciplinas/cuotas/imprimir"
                      className={location.pathname === "/disciplinas/cuotas/imprimir" ? "active" : ""}
                    >
                      <FaPrint /> Imprimir cupones
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
                <FaChevronDown className={`chev ${openInformes ? "rot" : ""}`} />
              )}
            </span>
            {!colapsado && openInformes && (
              <ul className="submenu">
                <li>
                  <Link
                    to="/informes/morosidad"
                    className={
                      location.pathname === "/informes/morosidad" ? "active" : ""
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
                {/* NUEVO: MORA POR SOCIO */}
                <li>
                  <Link
                    to="/informes/mora-por-socio"
                    className={
                      location.pathname === "/informes/mora-por-socio"
                        ? "active"
                        : ""
                    }
                  >
                    <FaSearch /> Mora por socio
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
      </div>
    </nav>
  );
}
