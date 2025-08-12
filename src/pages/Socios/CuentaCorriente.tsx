import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  grupo_familiar_id: number | null;
  es_titular: boolean;
}

interface ResumenCC {
  socio: Socio;
  movimientos?: any[];
  total_adeudado?: number; // compat viejo
  total_bruto?: number;    // suma (cuotas.importe + extras.monto)
  total_pagado?: number;   // suma (cuotas.monto_pago + extras.pago)
  total_saldo?: number;    // total_bruto - total_pagado (lo que querés)
}

const fmt = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2 });

export default function CuentaCorriente() {
  const [socio, setSocio] = useState<Socio | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [bruto, setBruto] = useState<number | null>(null);
  const [pagado, setPagado] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const socioData = localStorage.getItem("socioData");
    if (!socioData) return;

    const dni = JSON.parse(socioData).dni;
    const API_URL = import.meta.env.VITE_API_URL;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/autogestion/socios/cuenta-corriente/${dni}`);
        const data: ResumenCC = await res.json();

        if (!res.ok) throw new Error((data as any)?.error || "Error de servidor");

        setSocio(data.socio);

        // Usamos total_saldo si viene; si no, caemos a total_adeudado (compat viejo)
        const totalSaldo = (data.total_saldo ?? data.total_adeudado ?? 0) as number;
        setTotal(Number(totalSaldo) || 0);

        // Guardamos desglose si viene del backend
        setBruto(
          typeof data.total_bruto === "number" ? data.total_bruto : null
        );
        setPagado(
          typeof data.total_pagado === "number" ? data.total_pagado : null
        );
      } catch (err) {
        console.error("Error al cargar cuenta corriente", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">Cuenta Corriente</h2>
        <div className="bg-white shadow-sm rounded-lg p-4">
          <p className="text-sm text-gray-600">Cargando…</p>
        </div>
      </div>
    );
  }

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

        {/* Desglose (opcional) si el backend lo envía */}
        {bruto !== null && pagado !== null && (
          <div className="text-sm text-gray-600 border-t pt-3">
            <div className="flex justify-between">
              <span>Bruto (cuotas + extras):</span>
              <span>${fmt.format(bruto)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pagado:</span>
              <span>− ${fmt.format(pagado)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center border-t pt-4">
          <span className="text-lg font-semibold">Total a pagar:</span>
          <span className="text-lg font-bold text-red-600">
            ${fmt.format(total)}
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
            onClick={() =>
              navigate(
                `/socio/cuenta-corriente/detalle/${
                  JSON.parse(localStorage.getItem("socioData") || "{}").dni || ""
                }`
              )
            }
            className="flex-1 border border-red-600 text-red-600 hover:bg-red-100 py-2 px-4 rounded text-sm"
          >
            Ver detalle
          </button>
        </div>
      </div>
    </div>
  );
}
