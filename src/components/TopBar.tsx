import { useAuth } from "../context/auth";

export default function TopBar() {
  const { usuario, logout } = useAuth();

  return (
    <div className="topbar-container">
      <span className="usuario-nombre">
        Bienvenido, <strong>{usuario?.nombre}</strong>
      </span>
      <button className="btn-cerrar-sesion" onClick={logout}>
        Cerrar sesión
      </button>
    </div>
  );
}
