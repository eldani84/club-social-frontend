import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "1rem", background: "#f5f5f5" }}>
      <h2>Club Social</h2>
      <ul style={{ display: "flex", gap: "1rem", listStyle: "none", paddingLeft: 0 }}>
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/socios">Socios</Link></li>
        <li></li><Link to="/socios/ingresar">Ingresar Socio</Link>
        <li></li><Link to="/socios/gestionar">Gestionar Socios</Link>
        <li><Link to="/grupofamiliar/crear">Crear Grupo Familiar</Link></li>
        <li><Link to="/grupofamiliar/gestionar">Gestionar Grupos Familiares</Link></li>
        <li><Link to="/cuotas/generar-mensual">Generar Cuotas Mensual</Link></li>
        <li><Link to="/cuotas/generar-individual">Generar Cuota Individual</Link></li>
        <li><Link to="/Registrar Pagos">Ingreso de Pagos</Link></li>
        <li><Link to="/cuotas/imprimir">Imprimir Cuotas</Link></li>
        <li><Link to="/informes/cuotas">Informe de Cuotas</Link></li>

      </ul>
    </nav>
  );
}
