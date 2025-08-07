import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Movimiento = {
  tipo: string;
  descripcion: string;
  monto: number;
  fecha: string;
};

type DetalleMensual = {
  mes: string;
  saldo: number;
  movimientos: Movimiento[];
};

export default function CuentaCorrienteDetalle() {
  const { dni } = useParams();
  const [detalle, setDetalle] = useState<DetalleMensual[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const res = await fetch(`${API_URL}/autogestion/socios/cuenta-corriente/detalle/${dni}`);
        if (!res.ok) throw new Error("No se pudo obtener el detalle de cuenta corriente");
        const data = await res.json();
        console.log("Detalle recibido:", data);
        setDetalle(Array.isArray(data.detalle) ? data.detalle : []);
      } catch (error) {
        console.error("Error al obtener el detalle de cuenta corriente:", error);
      } finally {
        setLoading(false);
      }
    };

    if (dni) fetchDetalle();
  }, [dni]);

  if (loading) return <div className="text-center mt-8">Cargando detalle...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-6 text-center text-gray-800">Cuenta Corriente Detallada</h2>

      {detalle.length === 0 ? (
        <p className="text-center text-gray-500">No hay movimientos disponibles.</p>
      ) : (
        detalle.map(({ mes, saldo, movimientos }) => (
          <div
            key={mes}
            className="bg-gray-50 rounded-xl shadow-md border border-gray-300 mb-8 p-4"
          >
            {/* Encabezado del mes */}
            <div className="flex justify-between items-center border-b pb-2 mb-3">
              <h3 className="text-base font-semibold text-gray-700">
                {new Date(`${mes}-01`).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "long",
                })}
              </h3>
              <span
                className={`text-base font-bold ${
                  saldo > 0 ? "text-green-600" : saldo < 0 ? "text-red-600" : "text-gray-700"
                }`}
              >
                Saldo:{" "}
                {saldo.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Movimientos */}
            {movimientos.map((mov, index) => (
              <div
                key={index}
                className="grid grid-cols-2 py-2 border-b border-gray-200 last:border-none"
              >
                <span className="text-sm text-gray-800">{mov.descripcion}</span>
                <span
                  className={`text-sm font-semibold text-right ${
                    mov.monto > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {mov.monto > 0 ? "+" : ""}
                  {mov.monto.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
