import { useEffect, useState } from "react";

interface Cuota {
  id: number;
  socio_id: number;
  nombre: string;
  apellido: string;
  dni: string;
  periodo: string;
  importe: number;
  estado: string;
  monto_pago: number | null;
  fecha_pago: string | null;
}

export default function VerCuotasGrupo() {
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socioData = localStorage.getItem("socioData");
    if (!socioData) return;

    const socio = JSON.parse(socioData);
     console.log("DNI socio:", socio.dni); // 👈 Agregado
    fetch(`http://localhost:3000/api/cuotas/grupo-familiar?dni=${socio.dni}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Cuotas recibidas:", data); // 👈 Agregado
        setCuotas(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-4">Cargando cuotas...</p>;

  return (
    <div className="main-content px-2">
      <div className="form-modern">
        <h2 className="form-section-title">💰 Cuotas del Grupo Familiar</h2>

        {cuotas.length === 0 ? (
          <p>No hay cuotas registradas.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {cuotas.map((c) => (
              <div key={c.id} className="border rounded-xl p-3 shadow-sm bg-white">
                <div className="text-sm font-semibold">
                  {c.apellido} {c.nombre} – {c.periodo}
                </div>
                <div className="text-xs mt-1 text-gray-600">DNI: {c.dni}</div>
                <div className="flex justify-between text-sm mt-2">
                  <span>Estado: <strong>{c.estado}</strong></span>
                  <span>Importe: <strong>${c.importe.toFixed(2)}</strong></span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Pagado: {c.monto_pago ? `$${c.monto_pago.toFixed(2)}` : "-"}</span>
                  <span>Fecha: {c.fecha_pago ? new Date(c.fecha_pago).toLocaleDateString() : "-"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

