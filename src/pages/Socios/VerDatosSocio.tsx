import { useEffect, useState } from "react";
import { useAuth } from "../../context/auth";

const API = import.meta.env.VITE_API_URL;

interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  instagram: string;
  telefono: string;
  fecha_nacimiento: string;
  direccion: string;
  localidad: string;
  provincia: string;
  ocupacion: string;
  nro_carnet: string;
  categoria: string;
  forma_de_pago: string;
  fecha_alta: string;
  observaciones: string;
}

export default function VerDatosSocio() {
  const { usuario } = useAuth();
  const [socio, setSocio] = useState<Socio | null>(null);

  useEffect(() => {
    if (usuario?.id) {
      fetch(`${API}/api/socios/${usuario.id}`)
        .then((res) => res.json())
        .then((data) => setSocio(data))
        .catch((err) =>
          console.error("Error al obtener datos del socio:", err)
        );
    }
  }, [usuario]);

  if (!socio) return <p>Cargando datos del socio...</p>;

  return (
    <div className="p-4 max-w-3xl mx-auto bg-white rounded shadow text-sm">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Mis datos personales
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px]">
        <label>
          <strong>Apellido y Nombre:</strong> {socio.apellido} {socio.nombre}
        </label>
        <label>
          <strong>DNI:</strong> {socio.dni}
        </label>
        <label>
          <strong>Fecha Nacimiento:</strong>{" "}
          {new Date(socio.fecha_nacimiento).toLocaleDateString()}
        </label>
        <label>
          <strong>Email:</strong> {socio.email}
        </label>
        <label>
          <strong>Instagram:</strong> {socio.instagram}
        </label>
        <label>
          <strong>Teléfono:</strong> {socio.telefono}
        </label>
        <label className="sm:col-span-2">
          <strong>Domicilio:</strong> {socio.direccion}, {socio.localidad},{" "}
          {socio.provincia}
        </label>
        <label>
          <strong>Ocupación:</strong> {socio.ocupacion}
        </label>
        <label>
          <strong>N° Carnet:</strong> {socio.nro_carnet}
        </label>
        <label>
          <strong>Categoría:</strong> {socio.categoria}
        </label>
        <label>
          <strong>Forma de pago:</strong> {socio.forma_de_pago}
        </label>
        <label>
          <strong>Fecha de alta:</strong>{" "}
          {new Date(socio.fecha_alta).toLocaleDateString()}
        </label>
        <label className="sm:col-span-2">
          <strong>Observaciones:</strong> {socio.observaciones || "-"}
        </label>
      </div>
    </div>
  );
}
