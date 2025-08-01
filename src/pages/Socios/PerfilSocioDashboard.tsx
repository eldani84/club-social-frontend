import { Link } from "react-router-dom";
import "./PerfilSocioDashboard.css"; // Archivo CSS que agregaremos para darle estilo móvil

export default function PerfilSocioDashboard() {
  const socioData = localStorage.getItem("socioData");
  const socio = socioData ? JSON.parse(socioData) : null;

  return (
    <div className="perfil-socio-app">
      {socio ? (
        <div className="bienvenida">
          <p className="bienvenida-nombre">
            👋 Bienvenido/a <strong>{socio.nombre} {socio.apellido}</strong>
          </p>
          <p className="bienvenida-dni">DNI: {socio.dni}</p>
        </div>
      ) : (
        <p className="text-red-500 text-center p-4">No se encontraron datos del socio.</p>
      )}

      <div className="botonera-app">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Link to="/socio/perfil/datos" className="modern-btn">📄 Ver Mis Datos</Link>
        <Link to="/socio/perfil/cambiar-clave" className="modern-btn">🔒 Cambiar Contraseña</Link>
        <Link to="/socio/perfil/grupo" className="modern-btn">👨‍👩‍👧‍👦 Grupo Familiar</Link>
        <Link to="/socio/perfil/cuotas" className="modern-btn">💰 Cuotas y Pagos</Link>
        <Link to="/socio/perfil/link-pago" className="modern-btn">💳 Generar Link de Pago</Link>
        <Link to="/socio/perfil/saldos" className="modern-btn">🧾 Saldos Extras</Link>
      </div>

      </div>
    </div>
  );
}
