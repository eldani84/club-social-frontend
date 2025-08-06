// src/pages/Socios/CuentaCorrienteDetalle.tsx
import { useEffect, useState } from "react";

type Movimiento = {
  id: string;
  tipo: "cuota" | "pago" | "extra";
  descripcion: string;
  monto: number;
  fecha: string;
  nombre?: string; // solo para cuotas o extras
};

type MesAgrupado = {
  mes: string;
  saldo: number;
  movimientos: Movimiento[];
};

export default function CuentaCorrienteDetalle() {
  const [datos, setDatos] = useState<MesAgrupado[]>([]);
  const [loading, setLoading] = useState(true);
  const dni = localStorage.getItem("socioDni");

  useEffect(() => {
    if (!dni) return;

    const API_URL = import.meta.env.VITE_API_URL;
    fetch(`${API_URL}/autogestion/socios/cuenta-corriente/detalle/${dni}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || !Array.isArray(data)) return;
        setDatos(data);
      })
      .catch((err) => console.error("Error al obtener detalle:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatoMoneda = (valor: number) =>
    (valor < 0 ? "-" : "") + "$" + Math.abs(valor).toLocaleString("es-AR", { minimumFractionDigits: 2 });

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Detalle Mensual</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : datos.length === 0 ? (
        <p>No hay movimientos registrados.</p>
      ) : (
        datos.map((mes) => (
          <div key={mes.mes} className="bg-white rounded-lg shadow-md p-4 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-base font-semibold text-gray-700 capitalize">
                Mes {mes.mes}
              </h3>
              <p className="text-sm font-bold text-gray-800">
                Saldo: {formatoMoneda(mes.saldo)}
              </p>
            </div>

            <ul className="divide-y">
              {mes.movimientos.map((mov, idx) => (
                <li key={mov.id + idx} className="py-2 flex justify-between text-sm">
                  <div className="text-gray-700">
                    {mov.tipo === "pago" ? (
                      <span className="font-medium">PAGO {mov.fecha}</span>
                    ) : (
                      <span className="capitalize">
                        {mov.descripcion} {mov.nombre ? `- ${mov.nombre}` : ""}
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-semibold ${
                      mov.monto >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatoMoneda(mov.monto)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
