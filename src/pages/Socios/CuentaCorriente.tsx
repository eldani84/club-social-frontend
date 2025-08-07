import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  grupo_familiar_id: number | null;
  es_titular: boolean;
}



export default function CuentaCorriente() {
  const [socio, setSocio] = useState<Socio | null>(null);
  const [totalAdeudado, setTotalAdeudado] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const socioData = localStorage.getItem("socioData");
    if (!socioData) return;

    const dni = JSON.parse(socioData).dni;
    const API_URL = import.meta.env.VITE_API_URL;

    fetch(`${API_URL}/autogestion/socios/cuenta-corriente/${dni}`)
      .then((res) => res.json())
      .then((data) => {
        setSocio(data.socio);
        setTotalAdeudado(data.total_adeudado);
      })
      .catch((err) => {
        console.error("Error al cargar cuenta corriente", err);
      });
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Cuenta Corriente</h2>

      <div className="bg-white shadow-sm rounded-lg p-4 space-y-4">
        {socio && (
          <>
            <p className="text-sm text-gray-700">
              <strong>Socio:</strong> {socio.nombre} {socio.apellido}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Grupo familiar:</strong> {socio.grupo_familiar_id ? "Sí" : "No"}
            </p>
          </>
        )}

        <div className="flex justify-between items-center border-t pt-4">
          <span className="text-lg font-semibold">Total a pagar:</span>
          <span className="text-lg font-bold text-red-600">
            ${totalAdeudado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <button
            onClick={() => alert("🔧 Pago total próximamente")}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm"
          >
            Pago total
          </button>
            <button
            onClick={() => navigate(`/socio/cuenta-corriente/detalle/${JSON.parse(localStorage.getItem("socioData") || "{}").dni}`)}
            className="flex-1 border border-red-600 text-red-600 hover:bg-red-100 py-2 px-4 rounded text-sm"
            >
            Ver detalle
            </button>
        </div>
      </div>
    </div>
  );
}
