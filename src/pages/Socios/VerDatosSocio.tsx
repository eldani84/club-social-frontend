import { useEffect, useState } from "react";

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
  foto_url?: string;
}

export default function VerDatosSocio() {
  const [socio, setSocio] = useState<Socio | null>(null);
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const socioData = localStorage.getItem("socioData");
    if (socioData) {
      try {
        const socioParsed = JSON.parse(socioData);
        // Convertir nulls a cadenas vacías
        const socioConValores: Socio = {
          ...socioParsed,
          email: socioParsed.email ?? "",
          instagram: socioParsed.instagram ?? "",
          telefono: socioParsed.telefono ?? "",
          direccion: socioParsed.direccion ?? "",
          localidad: socioParsed.localidad ?? "",
          provincia: socioParsed.provincia ?? "",
          ocupacion: socioParsed.ocupacion ?? "",
          observaciones: socioParsed.observaciones ?? "",
          foto_url: socioParsed.foto_url ?? ""
        };

        setSocio(socioConValores);
      } catch (error) {
        console.error("Error al parsear socioData desde localStorage:", error);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!socio) return;
    const { name, value } = e.target;
    setSocio({ ...socio, [name]: value });
  };

  const handleGuardar = async () => {
    setMensaje("");
    try {
      const res = await fetch(`${API}/api/socios/${socio?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(socio),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar");

      localStorage.setItem("socioData", JSON.stringify(socio));
      setMensaje("✅ Cambios guardados correctamente.");
      setEditando(false);
    } catch (err: any) {
      setMensaje(`❌ ${err.message}`);
    }
  };

  if (!socio) return <p>Cargando datos del socio...</p>;

  return (
    <div className="p-4 max-w-3xl mx-auto bg-white rounded shadow text-sm">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Mis datos personales
      </h2>

      {mensaje && <p className="text-center text-sm mb-4">{mensaje}</p>}

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
          <strong>Email:</strong><br />
          {editando ? (
            <input type="email" name="email" value={socio.email} onChange={handleChange} className="input" />
          ) : (
            socio.email
          )}
        </label>
        <label>
          <strong>Instagram:</strong><br />
          {editando ? (
            <input type="text" name="instagram" value={socio.instagram} onChange={handleChange} className="input" />
          ) : (
            socio.instagram
          )}
        </label>
        <label>
          <strong>Teléfono:</strong><br />
          {editando ? (
            <input type="text" name="telefono" value={socio.telefono} onChange={handleChange} className="input" />
          ) : (
            socio.telefono
          )}
        </label>
        <label className="sm:col-span-2">
          <strong>Domicilio:</strong><br />
          {editando ? (
            <>
              <input type="text" name="direccion" value={socio.direccion} onChange={handleChange} placeholder="Dirección" className="input mb-1" />
              <input type="text" name="localidad" value={socio.localidad} onChange={handleChange} placeholder="Localidad" className="input mb-1" />
              <input type="text" name="provincia" value={socio.provincia} onChange={handleChange} placeholder="Provincia" className="input" />
            </>
          ) : (
            `${socio.direccion}, ${socio.localidad}, ${socio.provincia}`
          )}
        </label>
        <label>
          <strong>Ocupación:</strong><br />
          {editando ? (
            <input type="text" name="ocupacion" value={socio.ocupacion} onChange={handleChange} className="input" />
          ) : (
            socio.ocupacion
          )}
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

      <div className="text-center mt-6">
        {!editando ? (
          <button onClick={() => setEditando(true)} className="bg-red-600 text-white py-2 px-4 rounded text-sm">
            ✏️ Modificar datos
          </button>
        ) : (
          <button onClick={handleGuardar} className="bg-green-600 text-white py-2 px-4 rounded text-sm">
            💾 Guardar cambios
          </button>
        )}
      </div>
    </div>
  );
}
