import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Movimiento = {
  id: number | string;            // 👈 ahora usamos el id
  tipo: "cuota" | "extra" | "pago";
  descripcion: string;
  monto: number | string;         // puede venir como string (1.500,00)
  fecha: string;
  link_pago?: string | null;
};

type DetalleMensual = {
  mes: string;
  saldo: number | string;         // puede venir como string
  movimientos: Movimiento[];
};

// 🔒 Normalizador robusto para el UI (soporta 1.500,00 / 1,500.00 / 1500, etc.)
const toNumberUI = (v: unknown) => {
  if (typeof v === "number") return v;
  let s = String(v ?? "").trim();
  if (!s) return 0;
  // Dejar sólo dígitos y separadores . , -
  s = s.replace(/[^\d.,-]/g, "");

  // manejar signo
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

  // el último separador visto es decimal, el otro es miles
  const decSep = lastDot > lastComma ? lastDot : lastComma;

  const intPartRaw = s.slice(0, decSep);
  const decPartRaw = s.slice(decSep + 1);

  const intPart = intPartRaw.replace(/[.,]/g, "");
  const decPart = decPartRaw.replace(/[^\d]/g, "");

  const normalized = intPart + "." + decPart;
  const n = Number(normalized);
  return Number.isFinite(n) ? sign * n : 0;
};

// Normaliza todo el detalle (montos de movimientos y saldo) y recalcula saldo por mes
function normalizeDetalle(detalleRaw: DetalleMensual[]): DetalleMensual[] {
  return (detalleRaw || []).map((d) => {
    const movs = (d.movimientos || []).map((m) => ({
      ...m,
      monto: toNumberUI(m.monto),
    }));
    const saldoCalc = movs.reduce((acc, m) => acc + toNumberUI(m.monto), 0);
    return {
      ...d,
      movimientos: movs,
      // priorizo saldo recalculado para que siempre coincida con los movimientos
      saldo: saldoCalc,
    };
  });
}

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

        const detalleRaw: DetalleMensual[] = Array.isArray(data.detalle) ? data.detalle : [];
        // 🔧 Normalizo y recalculo saldo acá
        const detalleNorm = normalizeDetalle(detalleRaw);
        setDetalle(detalleNorm);
      } catch (error) {
        console.error("Error al obtener el detalle de cuenta corriente:", error);
        setDetalle([]);
      } finally {
        setLoading(false);
      }
    };
    if (dni) fetchDetalle();
  }, [dni, API_URL]);

  const handleGenerarLink = async (mov: Movimiento) => {
    // Solo para deudas
    if (mov.tipo === "pago") return;

    // Validar tipo
    const tipo =
      mov.tipo === "cuota" ? "cuota" :
      mov.tipo === "extra" ? "extra" : null;

    if (!tipo) {
      console.warn("❌ Tipo inválido para generar link:", mov.tipo, mov);
      alert("No se puede generar link para este tipo de movimiento.");
      return;
    }

    // Forzar item_id numérico (por si viene como string tipo 'cuota-123')
    const item_id = typeof mov.id === "number"
      ? mov.id
      : parseInt(String(mov.id).replace(/\D/g, ""), 10);

    if (!item_id || Number.isNaN(item_id)) {
      console.warn("❌ item_id inválido:", mov.id, mov);
      alert("No se pudo identificar el ítem para generar el link.");
      return;
    }

    try {
      console.log("➡️ POST generar-link payload:", { tipo, item_id });
      const res = await fetch(`${API_URL}/autogestion/socios/cuenta-corriente/generar-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, item_id }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      console.log("⬅️ generar-link response:", res.status, data);

      if (!res.ok) {
        alert(
          data?.error
            || (typeof data?.raw === "string" ? data.raw : "No se pudo generar el link (400).")
        );
        return;
      }

      if (data.link_pago) {
        setDetalle(prev =>
          prev.map(mesDetalle => ({
            ...mesDetalle,
            movimientos: mesDetalle.movimientos.map(m =>
              ((typeof m.id === "number" ? m.id : parseInt(String(m.id).replace(/\D/g, ""), 10)) === item_id)
              && m.tipo === tipo
                ? { ...m, link_pago: data.link_pago }
                : m
            ),
          }))
        );
      } else {
        alert("No vino link de pago en la respuesta.");
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
            <div key={mes} className="bg-white shadow-md rounded-xl border border-gray-200 mb-6">
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
                    toNumberUI(saldo) > 0 ? "text-green-600" : toNumberUI(saldo) < 0 ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  Saldo{" "}
                  {toNumberUI(saldo).toLocaleString("es-AR", {
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
                  movimientos.map((m) => {
                    const val = toNumberUI(m.monto);
                    return (
                      <div
                        key={`${m.tipo}-${m.id}-${m.fecha}`}
                        className="grid grid-cols-[1fr,140px,120px] gap-3 py-2 border-b last:border-b-0"
                      >
                        <div className="text-sm text-gray-800">{m.descripcion}</div>

                        <div
                          className={`text-sm font-semibold text-right ${
                            val > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {val > 0 ? "+" : "-"}
                          {Math.abs(val).toLocaleString("es-AR", {
                            style: "currency",
                            currency: "ARS",
                            minimumFractionDigits: 2,
                          })}
                        </div>

                        <div className="text-right">
                          {m.tipo === "pago" ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : m.link_pago ? (
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
                    );
                  })
                )}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
