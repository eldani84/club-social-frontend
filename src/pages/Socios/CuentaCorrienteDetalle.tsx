import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Movimiento = {
  tipo: string;
  descripcion: string;
  monto: number;
  fecha: string;
  link_pago?: string | null;
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
        setDetalle(Array.isArray(data.detalle) ? data.detalle : []);
      } catch (error) {
        console.error("Error al obtener el detalle de cuenta corriente:", error);
      } finally {
        setLoading(false);
      }
    };

    if (dni) fetchDetalle();
  }, [dni]);

  const handleGenerarLink = async (mov: Movimiento) => {
    if (!dni || !mov.descripcion || !mov.monto) return;

    try {
      const res = await fetch(`${API_URL}/autogestion/socios/cuenta-corriente/generar-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: mov.descripcion,
          monto: mov.monto,
          dni,
        }),
      });

      const data = await res.json();

      if (res.ok && data.link_pago) {
        // Reemplazar link en el estado
        setDetalle((prev) =>
          prev.map((mesDetalle) => ({
            ...mesDetalle,
            movimientos: mesDetalle.movimientos.map((m) =>
              m.descripcion === mov.descripcion && m.monto === mov.monto && m.fecha === mov.fecha
                ? { ...m, link_pago: data.link_pago }
                : m
            ),
          }))
        );
      } else {
        alert("No se pudo generar el link de pago.");
      }
    } catch (error) {
      console.error("Error al generar link:", error);
      alert("Error al generar link.");
    }
  };

  if (loading) return <div className="text-center mt-8">Cargando detalle...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold text-center mb-6">Cuenta Corriente — Detalle</h2>

      {detalle.length === 0 ? (
        <p className="text-center text-gray-500">No hay movimientos disponibles.</p>
      ) : (
        detalle
          .sort((a, b) => b.mes.localeCompare(a.mes))
          .slice(0, 3)
          .map(({ mes, saldo, movimientos }) => (
            <div
              key={mes}
              className="bg-white shadow-md rounded-xl border border-gray-200 mb-6"
            >
              {/* Encabezado del mes */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="text-base font-semibold text-gray-800">
                  {new Date(`${mes}-01`).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "long",
                  })}
                </div>
                <div
                  className={`text-base font-bold ${
                    saldo > 0
                      ? "text-green-600"
                      : saldo < 0
                      ? "text-red-600"
                      : "text-gray-700"
                  }`}
                >
                  Saldo:{" "}
                  {saldo.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>

              {/* Tabla: Detalle | Monto | Pagar */}
              <div className="px-4 py-2">
                <div className="grid grid-cols-[1fr,140px,120px] gap-3 py-2 text-xs font-semibold text-gray-500 border-b">
                  <div>Detalle</div>
                  <div className="text-right">Monto</div>
                  <div className="text-right">Pagar</div>
                </div>

                {movimientos.length === 0 ? (
                  <div className="py-4 text-sm text-gray-500">Sin movimientos este mes.</div>
                ) : (
                  movimientos.map((m, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr,140px,120px] gap-3 py-2 border-b last:border-b-0"
                    >
                      <div className="text-sm text-gray-800">{m.descripcion}</div>

                      <div
                        className={`text-sm font-semibold text-right ${
                          m.monto > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {m.monto > 0 ? "+" : "-"}
                        {Math.abs(m.monto).toLocaleString("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          minimumFractionDigits: 2,
                        })}
                      </div>

                      <div className="text-right">
                        {m.link_pago ? (
                          <a
                            href={m.link_pago}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                          >
                            Pagar
                          </a>
                        ) : (
                          <button
                            onClick={() => handleGenerarLink(m)}
                            className="inline-block text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded"
                          >
                            Generar link
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
