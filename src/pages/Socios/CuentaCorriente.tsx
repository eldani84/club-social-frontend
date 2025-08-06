import { useEffect, useState } from "react";

type Movimiento = {
  id: string;
  tipo: "cuota" | "extra";
  descripcion: string;
  monto: number;
  fecha: string;
  link_pago: string | null;
};

export default function CuentaCorriente() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socioNombre, setSocioNombre] = useState("");

  useEffect(() => {
    const dni = localStorage.getItem("socioDni");

    if (!dni) {
      console.error("DNI no encontrado en localStorage");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL;

    fetch(`${API_URL}/autogestion/socios/cuenta-corriente/${dni}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
          return;
        }
        setMovimientos(data.movimientos);
        setTotal(data.total_adeudado);
        setSocioNombre(`${data.socio.apellido}, ${data.socio.nombre}`);
      })
      .catch((err) => console.error("Error al obtener cuenta corriente:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 text-sm">
      <h2 className="text-lg font-semibold mb-2">Cuenta Corriente</h2>
      <p className="mb-4 text-xs text-gray-700">Socio: {socioNombre}</p>

      {loading ? (
        <p>Cargando...</p>
      ) : movimientos.length === 0 ? (
        <p>No hay movimientos pendientes.</p>
      ) : (
        <ul className="divide-y border rounded shadow-sm bg-white">
          {movimientos.map((mov) => (
            <li key={mov.id} className="p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{mov.descripcion}</p>
                <p className="text-xs text-gray-500">{mov.fecha}</p>
              </div>
              <div className="text-right">
                <p className="text-red-600 font-semibold">
                  ${mov.monto.toFixed(2)}
                </p>
                {mov.link_pago && (
                  <a
                    href={mov.link_pago}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-xs underline"
                  >
                    Pagar
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 border-t pt-4 font-bold text-right text-base">
        Total adeudado: ${total.toFixed(2)}
      </div>
    </div>
  );
}
