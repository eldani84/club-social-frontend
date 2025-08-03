import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./PerfilSocioDashboard.css"; // Estilo app móvil

export default function PerfilSocioDashboard() {
  const [socio, setSocio] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socioData = localStorage.getItem("socioData");
    if (socioData) {
      try {
        setSocio(JSON.parse(socioData));
      } catch (error) {
        console.error("Error al parsear socioData:", error);
        setSocio(null);
      }
    }
    setLoading(false);
  }, []);

  if (loading) return <p className="text-center p-4">Cargando...</p>;

  return (
    <div className="perfil-socio-app">
      {socio ? (
        <>
          <div className="bienvenida">
            <p className="bienvenida-nombre">
              👋 Bienvenido/a <strong>{socio.nombre} {socio.apellido}</strong>
            </p>
            <p className="bienvenida-dni">DNI: {socio.dni}</p>
          </div>

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
        </>
      ) : (
        <p className="text-red-500 text-center p-4">
          No se encontraron datos del socio. Inicie sesión nuevamente.
        </p>
      )}
    </div>
  );
}
