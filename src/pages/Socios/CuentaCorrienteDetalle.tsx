import { useEffect, useState } from "react";

interface Movimiento {
  tipo: string;
  descripcion: string;
  monto: number;
  mes: string;
}

interface DetalleMensual {
  mes: string;
  saldo: number;
  movimientos: Movimiento[];
}

export default function CuentaCorrienteDetalle() {
  const [detalle, setDetalle] = useState<DetalleMensual[]>([]);
  const [loading, setLoading] = useState(true);
  const dni = localStorage.getItem("socioDni");

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API_URL}/autogestion/socios/cuenta-corriente/detalle/${dni}`);
        const data = await res.json();
        setDetalle(data.detalle || []);
      } catch (error) {
        console.error("Error al obtener el detalle de cuenta corriente:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetalle();
  }, [dni]);

  if (loading) return <div className="p-4 text-center">Cargando...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Cuenta Corriente Detallada</h2>

      {detalle.length === 0 ? (
        <p className="text-center text-gray-500">No hay movimientos registrados.</p>
      ) : (
        detalle.map((mesDetalle) => (
          <div key={mesDetalle.mes} className="bg-white rounded shadow-sm mb-6">
            {/* Encabezado mes */}
            <div className="flex justify-between bg-gray-100 px-4 py-2 border-b">
              <span className="font-medium">{mesDetalle.mes}</span>
              <span className="font-semibold text-right">
                Saldo:{" "}
                <span className={mesDetalle.saldo < 0 ? "text-red-600" : "text-green-600"}>
                  {mesDetalle.saldo.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </span>
              </span>
            </div>

            {/* Lista de movimientos */}
            <ul className="divide-y">
              {mesDetalle.movimientos.map((mov, idx) => (
                <li key={idx} className="flex justify-between px-4 py-2 text-sm">
                  <span className="text-gray-800">{mov.descripcion}</span>
                  <span
                    className={`${
                      mov.monto < 0 ? "text-red-600" : "text-green-600"
                    } font-semibold`}
                  >
                    {(mov.monto >= 0 ? "+" : "-") +
                      Math.abs(mov.monto).toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

