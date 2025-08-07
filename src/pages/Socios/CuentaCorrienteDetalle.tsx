
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
        setDetalle(data.detalle || []);
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
      <h2 className="text-xl font-bold mb-4 text-center">Detalle de Cuenta Corriente</h2>

      {detalle.length === 0 ? (
        <p className="text-center text-gray-500">No hay movimientos disponibles.</p>
      ) : (
        detalle.map(({ mes, saldo, movimientos }) => (
          <div key={mes} className="bg-white shadow-md rounded-md p-4 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-2 border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-700 capitalize">
                {new Date(`${mes}-01`).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "long",
                })}
              </h3>
              <span
                className={`text-sm font-bold ${
                  saldo > 0 ? "text-green-600" : saldo < 0 ? "text-red-600" : "text-gray-600"
                }`}
              >
                Saldo: {saldo.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
              </span>
            </div>

            {movimientos.map((mov, index) => (
              <div key={index} className="flex justify-between py-2 border-b last:border-b-0">
                <span className="text-sm text-gray-700">{mov.descripcion}</span>
                <span
                  className={`text-sm font-medium ${
                    mov.monto > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {mov.monto > 0 ? "+" : ""}
                  {mov.monto.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                </span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
