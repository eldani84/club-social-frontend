import { useEffect, useState } from "react";

interface Movimiento {
  id: string;
  tipo: string;
  descripcion: string;
  monto: number;
  fecha: string;
  link_pago: string | null;
}

export default function CuentaCorriente() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const dni = localStorage.getItem("socioDni"); // Asegurate de guardar el DNI al loguear

  useEffect(() => {
    const fetchCuentaCorriente = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/autogestion/socios/cuenta-corriente/${dni}`
        );
        const data = await res.json();
        setMovimientos(data.movimientos);
        setTotal(data.total_adeudado);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar cuenta corriente", error);
        setLoading(false);
      }
    };

    if (dni) fetchCuentaCorriente();
  }, [dni]);

  if (loading) return <p className="p-4">Cargando cuenta corriente...</p>;

  return (
    <div className="p-4 max-w-md mx-auto text-sm">
      <h2 className="text-xl font-bold mb-4 text-center">Cuenta Corriente</h2>

      {movimientos.length === 0 && (
        <p className="text-center">No hay deudas pendientes 🎉</p>
      )}

      <ul className="space-y-2">
        {movimientos.map((mov) => (
          <li key={mov.id} className="border p-2 rounded shadow-sm">
            <div className="flex justify-between">
              <span className="font-semibold">{mov.descripcion}</span>
              <span>${mov.monto.toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-600">
              {mov.tipo.toUpperCase()} | {new Date(mov.fecha).toLocaleDateString()}
            </div>
            {mov.link_pago && (
              <a
                href={mov.link_pago}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-red-600 text-white py-1 mt-2 rounded text-xs hover:bg-red-700"
              >
                Pagar
              </a>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-6 p-3 text-center bg-gray-100 rounded shadow">
        <p className="text-sm">Total adeudado:</p>
        <p className="text-xl font-bold text-red-700">${total.toFixed(2)}</p>
      </div>
    </div>
  );
}
