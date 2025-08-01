import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function PerfilSocio() {
  const socioData = localStorage.getItem("socioData");
  const socio = socioData ? JSON.parse(socioData) : null;

  // Ocultar menú lateral si existe
  useEffect(() => {
    const sidebar = document.querySelector(".sidebar");
    const topbar = document.querySelector(".topbar");
    if (sidebar) (sidebar as HTMLElement).style.display = "none";
    if (topbar) (topbar as HTMLElement).style.display = "none";

    return () => {
      if (sidebar) (sidebar as HTMLElement).style.display = "";
      if (topbar) (topbar as HTMLElement).style.display = "";
    };
  }, []);

  return (
    <div className="perfil-socio-app">
      <h2 className="titulo">👋 Bienvenido/a {socio?.nombre}</h2>

      <div className="info-basica">
        <p><strong>DNI:</strong> {socio?.dni}</p>
        <p><strong>Apellido:</strong> {socio?.apellido}</p>
      </div>

      <div className="grid-opciones">
        <Link to="/socio/perfil/datos" className="btn-opcion">📄 Mis Datos</Link>
        <Link to="/socio/perfil/grupo" className="btn-opcion">👨‍👩‍👧‍👦 Grupo Familiar</Link>
        <Link to="/socio/perfil/cuotas" className="btn-opcion">💰 Cuotas y Pagos</Link>
        <Link to="/socio/perfil/link-pago" className="btn-opcion">💳 Link de Pago</Link>
        <Link to="/socio/perfil/saldos" className="btn-opcion">🧾 Saldos Extras</Link>
        <Link to="/socio/perfil/cambiar-clave" className="btn-opcion">🔒 Cambiar Clave</Link>
      </div>
    </div>
  );
}
