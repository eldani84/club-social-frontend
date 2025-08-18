// C:\Users\Daniel\Documents\VCC CURSO\club-social-frontend\src\pages\Cuotas\ControlCuotas.tsx
import { useEffect, useMemo, useState } from "react";
import { FaSearch, FaFileExcel, FaChevronDown, FaChevronRight } from "react-icons/fa";

type MoraRow = {
  socio_id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string | null;
  telefono: string | null;
  forma_pago_nombre: string | null;  // informativo
  categoria_nombre: string | null;
  cuotas_impagas: number;            // "cantidad" según estado seleccionado
  desde_mes: string | null;          // YYYY-MM
  total_adeudado: number;            // suma(importe - monto_pago) según estado seleccionado
  ultimo_pago_fecha: string | null;  // YYYY-MM-DD o null
};

type MoraDetalle = {
  id: number;
  mes: string; // YYYY-MM
  importe: number;
  estado: string;
  fecha_generacion: string | null;
  fecha_pago: string | null;
  monto_pago: number | null;
  codigo_barra: string | null;
};

type ApiResp = {
  rows: MoraRow[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  totals?: {
    total_socios: number;
    total_cuotas_impagas: number; // "cantidad" según estado seleccionado
    total_deuda: number;          // suma(importe - monto_pago) según estado seleccionado
  };
};

const currency = (n: number) =>
  Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 });

const hoyYYYYMM = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
};

const ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagada", label: "Pagada" },
  { value: "exento_vitalicio", label: "Exento vitalicio" },
  { value: "exento_g_familiar", label: "Exento grupo familiar" },
  { value: "exento_otros", label: "Exento otros" },
  { value: "todos", label: "Todos los estados" },
] as const;

type EstadoValue = typeof ESTADOS[number]["value"];

export default function ControlCuotas() {
  const API = import.meta.env.VITE_API_URL;

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  // Para no dejar afuera nada al probar, arrancamos desde 2000-01
  const [desdeMes, setDesdeMes] = useState("2000-01");
  // Por defecto "todos" para ver datos aunque no haya pendientes
  const [estado, setEstado] = useState<EstadoValue>("todos");

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  // Datos
  const [rows, setRows] = useState<MoraRow[]>([]);
  const [totales, setTotales] = useState<ApiResp["totals"]>();
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Detalles por socio (cache)
  const [openIds, setOpenIds] = useState<Record<number, boolean>>({});
  const [detalles, setDetalles] = useState<
    Record<number, { loading: boolean; data: MoraDetalle[] | null }>
  >({});

  // Query string para búsqueda — NO mandamos estado cuando es "todos"
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (busqueda.trim().length >= 2) p.set("busqueda", busqueda.trim());
    if (desdeMes) p.set("desdeMes", desdeMes);
    if (estado && estado !== "todos") p.set("estado", estado);
    return p.toString();
  }, [page, pageSize, busqueda, desdeMes, estado]);

  // Carga de página
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  async function cargar() {
    // Si no hay término de búsqueda, dejamos vacío (no cargamos toda la base)
    if (busqueda.trim().length < 2) {
      setRows([]);
      setTotal(0);
      setHasMore(false);
      setTotales(undefined);
      setErrorMsg("");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const r = await fetch(`${API}/informes/morosidad-por-socio/buscar?${qs}`);
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} ${r.statusText}${t ? ` – ${t}` : ""}`);
      }
      const json: ApiResp = await r.json();
      if (json.page === 1) setRows(json.rows);
      else setRows(prev => [...prev, ...json.rows]);
      setTotal(json.total);
      setHasMore(json.hasMore);
      setTotales(json.totals);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "Error cargando datos");
      setRows([]);
      setTotal(0);
      setHasMore(false);
      setTotales(undefined);
    } finally {
      setLoading(false);
    }
  }

  // Reset paginación cuando cambie filtro principal
  const resetYBuscar = () => setPage(1);

  // Toggle detalle y, si no está en cache, traerlo (sin pasar estado cuando es "todos")
  const toggleDetalle = async (socioId: number) => {
    const isOpen = !!openIds[socioId];
    setOpenIds(prev => ({ ...prev, [socioId]: !isOpen }));
    if (isOpen) return;
    if (detalles[socioId]?.data) return; // ya cacheado

    setDetalles(prev => ({ ...prev, [socioId]: { loading: true, data: null } }));
    try {
      const params = new URLSearchParams();
      if (estado && estado !== "todos") params.set("estado", estado);

      const r = await fetch(
        `${API}/informes/morosidad-por-socio/${socioId}/detalle${params.toString() ? `?${params.toString()}` : ""}`
      );
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} ${r.statusText}${t ? ` – ${t}` : ""}`);
      }
      const d: MoraDetalle[] = await r.json();
      setDetalles(prev => ({ ...prev, [socioId]: { loading: false, data: d } }));
    } catch (e) {
      console.error(e);
      setDetalles(prev => ({ ...prev, [socioId]: { loading: false, data: [] } }));
    }
  };

  // Exportar Excel del resultado filtrado (no paginado) — NO mandar estado si es "todos"
  const exportarExcel = () => {
    const p = new URLSearchParams();
    if (busqueda.trim().length >= 2) p.set("busqueda", busqueda.trim());
    if (desdeMes) p.set("desdeMes", desdeMes);
    if (estado && estado !== "todos") p.set("estado", estado);
    window.open(`${API}/informes/morosidad-por-socio/exportar-excel?${p.toString()}`, "_blank");
  };

  const estadoLabel = ESTADOS.find(e => e.value === estado)?.label || "Estado";
  const colCuotasTitulo = estado === "pendiente" ? "Cuotas impagas" : "Cuotas (según estado)";

  return (
    <div className="max-w-[100vw] mx-auto p-2 md:p-6">
      <div className="w-full rounded-xl bg-white/90 shadow-lg p-4 md:p-6 border border-gray-100 mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-red-700 mb-2 tracking-tight">
          Consulta de mora por socio
        </h2>

        {/* Filtros */}
        <form
          onSubmit={(e) => { e.preventDefault(); resetYBuscar(); }}
          className="w-full flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-4 flex-wrap"
        >
          <div className="flex flex-col w-full md:w-72">
            <label className="text-xs font-semibold mb-1">Socio (nombre/apellido/DNI)</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder='Ej: "Eberhardt d" o "12345678"'
              className="input-modern"
            />
            <small className="text-[11px] text-gray-500 mt-1">
              Busca por tokens (ej: <em>“Eberhardt d”</em> coincide con <em>“Eberhardt Daniel”</em>).
            </small>
          </div>

          <div className="flex flex-col w-full md:w-40">
            <label className="text-xs font-semibold mb-1">Desde mes (período)</label>
            <input
              type="month"
              value={desdeMes}
              onChange={(e) => setDesdeMes(e.target.value || hoyYYYYMM())}
              className="input-modern"
            />
          </div>

          <div className="flex flex-col w-full md:w-56">
            <label className="text-xs font-semibold mb-1">Estado de cuota</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoValue)}
              className="input-modern"
            >
              {ESTADOS.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn-main mt-5 md:mt-0 flex items-center gap-2 px-4 py-2"
            disabled={loading}
            title="Buscar"
          >
            <FaSearch /> {loading ? "Buscando..." : "Buscar"}
          </button>

          <button
            type="button"
            onClick={exportarExcel}
            className="btn-green mt-5 md:mt-0 flex items-center gap-2 px-4 py-2"
            title="Exportar Excel del resultado"
            disabled={busqueda.trim().length < 2}
          >
            <FaFileExcel /> Excel
          </button>
        </form>

        {/* Mensajes de ayuda / error */}
        {errorMsg && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mb-3">
            {errorMsg}
          </div>
        )}
        {busqueda.trim().length < 2 && (
          <div className="text-sm text-gray-600 bg-gray-50 border rounded-md p-3 mb-3">
            Ingresá al menos <strong>2 caracteres</strong> para buscar. Ejemplos: <em>"Eberhardt d"</em>, <em>"García a"</em>, <em>"12345678"</em>.
          </div>
        )}

        {/* Tabla resumen por socio */}
        <div className="overflow-x-auto rounded-xl shadow ring-1 ring-black/5 bg-white">
          <table className="modern-table w-full min-w-[960px]">
            <thead className="bg-red-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2 text-left">Socio</th>
                <th className="px-3 py-2 text-left">DNI</th>
                <th className="px-3 py-2 text-left">Forma de pago</th>
                <th className="px-3 py-2 text-left">Categoría</th>
                <th className="px-3 py-2 text-right">{colCuotasTitulo}</th>
                <th className="px-3 py-2 text-left">Desde</th>
                <th className="px-3 py-2 text-right">{estado === "pendiente" ? "Deuda total" : "Total"}</th>
                <th className="px-3 py-2 text-left">Últ. pago</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const abierto = !!openIds[r.socio_id];
                const det = detalles[r.socio_id];
                return (
                  <>
                    <tr key={r.socio_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-center">
                        <button
                          className="text-red-700"
                          onClick={() => toggleDetalle(r.socio_id)}
                          title={abierto ? "Ocultar detalle" : "Ver detalle"}
                        >
                          {abierto ? <FaChevronDown /> : <FaChevronRight />}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold">{r.apellido} {r.nombre}</div>
                        <div className="text-xs text-gray-600">{r.email || "-"}</div>
                        <div className="text-xs text-gray-600">{r.telefono || "-"}</div>
                      </td>
                      <td className="px-3 py-2">{r.dni}</td>
                      <td className="px-3 py-2">{r.forma_pago_nombre || "-"}</td>
                      <td className="px-3 py-2">{r.categoria_nombre || "-"}</td>
                      <td className="px-3 py-2 text-right">{r.cuotas_impagas}</td>
                      <td className="px-3 py-2">{r.desde_mes || "-"}</td>
                      <td className="px-3 py-2 text-right">${currency(r.total_adeudado)}</td>
                      <td className="px-3 py-2">{r.ultimo_pago_fecha || "-"}</td>
                    </tr>

                    {abierto && (
                      <tr key={`det-${r.socio_id}`} className="bg-gray-50/60">
                        <td></td>
                        <td colSpan={8} className="px-3 py-2">
                          <div className="text-sm font-semibold mb-2">
                            Detalle de cuotas (estado: {estadoLabel})
                          </div>
                          {!det || det.loading ? (
                            <div className="text-sm text-gray-600">Cargando detalle…</div>
                          ) : (det.data && det.data.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-2 py-1 border">Mes</th>
                                    <th className="px-2 py-1 border text-right">Importe</th>
                                    <th className="px-2 py-1 border">Estado</th>
                                    <th className="px-2 py-1 border">F. Generación</th>
                                    <th className="px-2 py-1 border">F. Pago</th>
                                    <th className="px-2 py-1 border text-right">Monto Pago</th>
                                    <th className="px-2 py-1 border">Código de Barra</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {det.data.map((c) => (
                                    <tr key={c.id}>
                                      <td className="px-2 py-1 border">{c.mes}</td>
                                      <td className="px-2 py-1 border text-right">${currency(c.importe)}</td>
                                      <td className="px-2 py-1 border">{c.estado}</td>
                                      <td className="px-2 py-1 border">{c.fecha_generacion || "-"}</td>
                                      <td className="px-2 py-1 border">{c.fecha_pago || "-"}</td>
                                      <td className="px-2 py-1 border text-right">
                                        {c.monto_pago ? `$${currency(c.monto_pago)}` : "-"}
                                      </td>
                                      <td className="px-2 py-1 border font-mono text-xs break-all">{c.codigo_barra || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">Sin cuotas para el estado seleccionado.</div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500 text-lg">
                    {loading
                      ? "Buscando…"
                      : (busqueda.trim().length < 2
                        ? "Ingresá al menos 2 caracteres para iniciar la búsqueda."
                        : (errorMsg || "No se encontraron socios para los filtros."))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de paginación / totales */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-3 text-sm">
          <div className="bg-gray-50 p-3 rounded-md shadow-sm border grid gap-1">
            <div><strong>Total socios (filtro):</strong> {totales?.total_socios ?? (rows.length ? "~" : 0)}</div>
            <div><strong>Total cuotas (según estado):</strong> {totales?.total_cuotas_impagas ?? "~"}</div>
            <div><strong>{estado === "pendiente" ? "Deuda total (filtro)" : "Total (filtro)"}:</strong> ${currency(totales?.total_deuda ?? 0)}</div>
          </div>

          <div className="flex items-center gap-6">
            <div>Mostrando {rows.length} de {total}</div>
            {hasMore ? (
              <button
                disabled={loading}
                onClick={() => setPage(p => p + 1)}
                className="bg-gray-800 text-white px-3 py-1 rounded"
              >
                {loading ? "Cargando..." : "Cargar más"}
              </button>
            ) : (
              <span className="opacity-70">No hay más resultados</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
