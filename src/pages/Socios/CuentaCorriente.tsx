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
  total_adeudado?: number | string; // compat viejo
  total_bruto?: number | string;    // suma (cuotas.importe + extras.monto)
  total_pagado?: number | string;   // suma (cuotas.monto_pago + extras.pago)
  total_saldo?: number | string;    // total_bruto - total_pagado
}

// Normalizador robusto para números: soporta "1.500,00", "1,500.00", "1500", etc.
const toNumberUI = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v ?? "").trim();
  if (!s) return 0;
  s = s.replace(/[^\d.,-]/g, ""); // deja solo dígitos, . , y -
  let sign = 1;
  if (s.includes("-")) {
    sign = -1;
    s = s.replace(/-/g, "");
  }
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot === -1 && lastComma === -1) {
    const n = Number(s);
    return Number.isFinite(n) ? sign * n : 0;
  }
  const decIdx = lastDot > lastComma ? lastDot : lastComma;
  const intPart = s.slice(0, decIdx).replace(/[.,]/g, "");
  const decPart = s.slice(decIdx + 1).replace(/[^\d]/g, "");
  const normalized = `${intPart}.${decPart}`;
  const n = Number(normalized);
  return Number.isFinite(n) ? sign * n : 0;
};

const fmt = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2 });

export default function CuentaCorriente() {
  const [socio, setSocio] = useState<Socio | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [bruto, setBruto] = useState<number | null>(null);
  const [pagado, setPagado] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const socioData = localStorage.getItem("socioData");
    if (!socioData) {
      setLoading(false);
      setErrorMsg("No se encontró información del socio en este dispositivo.");
      return;
    }

    const dni = JSON.parse(socioData).dni;
    const API_URL = import.meta.env.VITE_API_URL;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/autogestion/socios/cuenta-corriente/${dni}`);
        const data: ResumenCC = await res.json();

        if (!res.ok) throw new Error((data as any)?.error || "Error de servidor");

        setSocio(data.socio);

        // Usamos total_saldo si viene; si no, caemos a total_adeudado (compat viejo)
        const totalSaldo = toNumberUI(
          data.total_saldo ?? data.total_adeudado ?? 0
        );
        setTotal(totalSaldo);

        // Guardamos desglose si viene del backend (normalizados)
        setBruto(
          data.total_bruto !== undefined && data.total_bruto !== null
            ? toNumberUI(data.total_bruto)
            : null
        );
        setPagado(
          data.total_pagado !== undefined && data.total_pagado !== null
            ? toNumberUI(data.total_pagado)
            : null
        );
      } catch (err: any) {
        console.error("Error al cargar cuenta corriente", err);
        setErrorMsg(err?.message || "No se pudo cargar la cuenta corriente.");
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
        {errorMsg ? (
          <div className="text-sm text-red-600">{errorMsg}</div>
        ) : (
          <>
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
                  <span>A PAGAR:</span>
                  <span>${fmt.format(bruto)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PAGO:</span>
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
          </>
        )}
      </div>
    </div>
  );
}
