import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Movimiento {
  id: string;
  tipo: string;
  descripcion: string;
  monto: number;
  fecha: string;
  link_pago?: string | null;
}

interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  grupo_familiar_id?: number | null;
  es_titular: boolean;
}

export default function CuentaCorriente() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [total, setTotal] = useState(0);
  const [socio, setSocio] = useState<Socio | null>(null);

  const dni = localStorage.getItem("socioDni");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const obtenerCuentaCorriente = async () => {
      try {
        const res = await fetch(`${API_URL}/autogestion/socios/cuenta-corriente/${dni}`);
        const data = await res.json();
        setMovimientos(data.movimientos || []);
        setTotal(data.total_adeudado || 0);
        setSocio(data.socio || null);
      } catch (error) {
        console.error("Error al obtener la cuenta corriente:", error);
      }
    };

    if (dni) {
      obtenerCuentaCorriente();
    }
  }, [API_URL, dni]);

  return (
    <div className="max-w-3xl mx-auto mt-6 px-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Cuenta Corriente</h2>

      {socio && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <p className="text-sm text-gray-600 mb-1">
            <strong>Socio:</strong> {socio.nombre} {socio.apellido}
          </p>
          {socio.es_titular && (
            <p className="text-sm text-gray-600">
              <strong>Grupo familiar:</strong> Sí
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {movimientos.map((mov) => (
          <div
            key={mov.id}
            className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center"
          >
            <div>
              <p className="text-sm text-gray-700">{mov.descripcion}</p>
              <p className="text-xs text-gray-500">{new Date(mov.fecha).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-medium ${
                  mov.monto >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {mov.monto >= 0 ? "+" : "-"}${Math.abs(mov.monto).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </p>
              {mov.link_pago && (
                <a
                  href={mov.link_pago}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline mt-1 inline-block"
                >
                  Pagar
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-lg font-semibold text-gray-800">
          Total a pagar:{" "}
          <span className="text-red-600">
            ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
        </p>

        <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4">
          {/* Botón de pago total (para futura implementación) */}
          <button
            className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded shadow"
            disabled
          >
            Pago total
          </button>

          {/* ✅ Botón para ver el detalle mensual */}
          <Link
            to="/socio/cuenta-corriente/detalle"
            className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-4 rounded shadow text-center"
          >
            Ver detalle mensual
          </Link>
        </div>
      </div>
    </div>
  );
}
