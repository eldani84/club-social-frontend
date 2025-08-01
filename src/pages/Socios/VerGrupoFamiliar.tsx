import { useEffect, useState } from "react";

interface SocioFamiliar {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  email: string;
  telefono: string;
}

export default function VerGrupoFamiliar() {
  const [familiares, setFamiliares] = useState<SocioFamiliar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socioData = localStorage.getItem("socioData");
    if (!socioData) return;

    const socio = JSON.parse(socioData);

    fetch(`http://localhost:3000/api/socios/grupo-familiar?dni=${socio.dni}`)
      .then((res) => res.json())
      .then((data) => {
        setFamiliares(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-4">Cargando grupo familiar...</p>;

  return (
    <div className="main-content">
      <div className="form-modern">
        <h2 className="form-section-title">Grupo Familiar</h2>
        {familiares.length === 0 ? (
          <p>No hay grupo familiar registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-2 border">Apellido y Nombre</th>
                  <th className="p-2 border">DNI</th>
                  <th className="p-2 border">Fecha Nac.</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {familiares.map((f) => (
                  <tr key={f.id}>
                    <td className="p-2 border">{f.apellido} {f.nombre}</td>
                    <td className="p-2 border">{f.dni}</td>
                    <td className="p-2 border">{new Date(f.fecha_nacimiento).toLocaleDateString()}</td>
                    <td className="p-2 border">{f.email}</td>
                    <td className="p-2 border">{f.telefono}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
