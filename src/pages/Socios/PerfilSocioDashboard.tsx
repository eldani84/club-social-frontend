import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./PerfilSocioDashboard.css";

export default function PerfilSocioDashboard() {
  const [socio, setSocio] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("socioToken");
    if (!token) {
      window.location.href = "/socio/login";
    }
  }, []);

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
            <Link to="/socio/perfil/datos" className="boton-app">📄 Ver Mis Datos</Link>
            <Link to="/socio/perfil/cambiar-clave" className="boton-app">🔒 Cambiar Contraseña</Link>
            <Link to="/socio/perfil/grupo" className="boton-app">👨‍👩‍👧‍👦 Grupo Familiar</Link>
            <Link to="/socio/perfil/cuotas" className="boton-app">💰 Cuotas y Pagos</Link>
            <Link to="/socio/perfil/link-pago" className="boton-app">💳 Generar Link de Pago</Link>
            <Link to="/socio/perfil/saldos" className="boton-app">🧾 Saldos Extras</Link>
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
