import { useEffect, useState, useMemo } from "react";
import { FaFileExcel } from "react-icons/fa";

interface Cuota {
  id: number;
  socio_id: number;
  nombre: string;
  apellido: string;
  mes: string;
  importe: number | string;
  estado: string;
  fecha_pago: string | null;
  monto_pago: number | null;
  codigo_barra: string;
  forma_pago_nombre?: string;
  fecha_generacion?: string | null;
}

interface FormaDePago {
  id: number;
  forma_de_pago: string;
}

type ApiResp = {
  rows: Cuota[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  totals?: {
    totalCuotas: number;
    totalPagas: number;
    totalImporte: number;
    totalMontoPagado: number;
    totalFaltaCobro: number;
  };
};

const estados = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "pagada", label: "Pagada" },
  { value: "exento_vitalicio", label: "Exento vitalicio" },
  { value: "exento_g_familiar", label: "Exento grupo familiar" },
  { value: "exento_otros", label: "Exento otros" }
];

function hoyISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function restarDiasISO(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function InformeCuotasFiltros() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [formasPago, setFormasPago] = useState<FormaDePago[]>([]);

  // filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaPago, setFiltroFechaPago] = useState("");
  const [filtroFormaPago, setFiltroFormaPago] = useState<string>("");

  // rango (default 90 días)
  const [desde, setDesde] = useState<string>("");
  const [hasta, setHasta] = useState<string>("");

  // paginación
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  // orden (opcional)
  const [orderBy] = useState<"fecha_generacion" | "apellido" | "estado" | "mes">("fecha_generacion");
  const [orderDir] = useState<"asc" | "desc">("desc");

  // totales (del backend)
  const [totales, setTotales] = useState<ApiResp["totals"]>();

  // default 90 días
  useEffect(() => {
    setHasta(hoyISO());
    setDesde(restarDiasISO(90));
  }, []);

  useEffect(() => {
    obtenerFormasPago();
  }, []);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    p.set("orderBy", orderBy);
    p.set("orderDir", orderDir);

    if (busqueda) p.set("busqueda", busqueda);
    if (filtroMes) p.set("mes", filtroMes);
    if (filtroEstado) p.set("estado", filtroEstado);
    if (filtroFechaPago) p.set("fecha_pago", filtroFechaPago);
    if (filtroFormaPago) p.set("forma_pago", filtroFormaPago);
    if (desde) p.set("desde", desde);
    if (hasta) p.set("hasta", hasta);
    return p.toString();
  }, [page, pageSize, orderBy, orderDir, busqueda, filtroMes, filtroEstado, filtroFechaPago, filtroFormaPago, desde, hasta]);

  useEffect(() => {
    if (!desde || !hasta) return;
    cargarPagina(); // carga (o recarga) cada vez que cambia el qs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  const resetYBuscar = () => {
    setPage(1);
  };

  const obtenerFormasPago = async () => {
    try {
      const res = await fetch(`${API_URL}/informe-cuotas/formas-de-pago`);
      const data = await res.json();
      setFormasPago(data);
    } catch (e) {
      console.error("Error obteniendo formas de pago", e);
    }
  };

  async function cargarPagina() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/informe-cuotas/buscar?${qs}`);
      const json: ApiResp | Cuota[] = await res.json();

      // compat: si backend viejo devolvía array
      if (Array.isArray(json)) {
        setCuotas(json);
        setTotal(json.length);
        setHasMore(false);
        setTotales(undefined);
        return;
      }

      if (json.page === 1) setCuotas(json.rows);
      else setCuotas(prev => [...prev, ...json.rows]);

      setTotal(json.total);
      setHasMore(json.hasMore);
      setTotales(json.totals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleExportarExcel = () => {
    const p = new URLSearchParams();
    if (busqueda) p.set("busqueda", busqueda);
    if (filtroMes) p.set("mes", filtroMes);
    if (filtroEstado) p.set("estado", filtroEstado);
    if (filtroFechaPago) p.set("fecha_pago", filtroFechaPago);
    if (filtroFormaPago) p.set("forma_pago", filtroFormaPago);
    if (desde) p.set("desde", desde);
    if (hasta) p.set("hasta", hasta);

    // exporta TODO el rango filtrado (sin paginar)
    window.open(`${API_URL}/informe-cuotas/exportar-excel?${p.toString()}`, "_blank");
  };

  // fallback si el backend no envía totals
  const totalCuotas = totales?.totalCuotas ?? cuotas.length;
  const totalPagas = totales?.totalPagas ?? cuotas.filter(c => c.estado === "pagada").length;
  const totalImporte = totales?.totalImporte ?? cuotas.reduce((acc, c) => acc + Number(c.importe || 0), 0);
  const totalMontoPagado = totales?.totalMontoPagado ?? cuotas.reduce((acc, c) => acc + Number(c.monto_pago || 0), 0);
  const totalFaltaCobro = totales?.totalFaltaCobro ?? (totalImporte - totalMontoPagado);

  return (
    <div className="max-w-[100vw] mx-auto p-2 md:p-6">
      <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between gap-4">

          <div className="flex flex-col gap-2 text-[0.75rem] md:w-2/3">
            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col text-xs">
                Apellido Nombre:
                <input
                  type="text"
                  value={busqueda}
                  placeholder="Buscar"
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="border px-2 py-0 text-xs"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col text-xs">
                Mes:
                <input
                  type="month"
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  className="border px-2 py-0 text-xs"
                />
              </label>

              <label className="flex flex-col text-xs">
                Estado:
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="border px-2 py-[3px] text-xs w-[160px]"
                >
                  {estados.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col text-xs">
                Fecha de Pago (exacta):
                <input
                  type="date"
                  value={filtroFechaPago}
                  onChange={(e) => setFiltroFechaPago(e.target.value)}
                  className="border px-2 py-[3px] text-xs w-[160px]"
                />
              </label>

              <label className="flex flex-col text-xs">
                Forma de Pago:
                <select
                  value={filtroFormaPago}
                  onChange={(e) => setFiltroFormaPago(e.target.value)}
                  className="border px-2 py-[3px] text-xs w-[180px]"
                >
                  <option value="">Todas las formas</option>
                  {formasPago.map(fp => (
                    <option key={fp.id} value={String(fp.id)}>{fp.forma_de_pago}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Rango generación */}
            <div className="flex flex-wrap gap-4">
              <label className="flex flex-col text-xs">
                Desde (generación):
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="border px-2 py-[3px] text-xs w-[160px]"
                />
              </label>

              <label className="flex flex-col text-xs">
                Hasta (generación):
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="border px-2 py-[3px] text-xs w-[160px]"
                />
              </label>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={resetYBuscar}
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-1 rounded text-[0.75rem]"
              >
                Buscar
              </button>

              <button
                onClick={handleExportarExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-[0.75rem]"
              >
                <FaFileExcel className="text-sm" />
                Exportar Excel
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md shadow-sm border text-sm grid gap-1 md:w-1/3">
            <div><strong>Total cuotas (filtro):</strong> {totalCuotas}</div>
            <div><strong>Total cuotas pagas:</strong> {totalPagas}</div>
            <div><strong>Total importe generado:</strong> ${Number(totalImporte).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
            <div><strong>Total importe pagado:</strong> ${Number(totalMontoPagado).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
            <div><strong>Falta de cobro:</strong> ${Number(totalFaltaCobro).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {cuotas.length > 0 && (
          <div className="overflow-x-auto rounded-xl shadow ring-1 ring-black/5 bg-white">
            <table className="modern-table w-full min-w-[820px]">
              <thead className="bg-red-100 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-1 border">Apellido</th>
                  <th className="px-2 py-1 border">Nombre</th>
                  <th className="px-2 py-1 border">Mes</th>
                  <th className="px-2 py-1 border">Importe</th>
                  <th className="px-2 py-1 border">Estado</th>
                  <th className="px-2 py-1 border">Fecha Pago</th>
                  <th className="px-2 py-1 border">Monto Pago</th>
                  <th className="px-2 py-1 border">Forma de Pago</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {cuotas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">{c.apellido}</td>
                    <td className="border px-2 py-1">{c.nombre}</td>
                    <td className="border px-2 py-1">{c.mes}</td>
                    <td className="border px-2 py-1">
                      ${Number(c.importe).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border px-2 py-1">{c.estado}</td>
                    <td className="border px-2 py-1">{c.fecha_pago || "-"}</td>
                    <td className="border px-2 py-1">
                      ${Number(c.monto_pago || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border px-2 py-1">{c.forma_pago_nombre || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center gap-6 mt-3 text-sm">
          <div>Mostrando {cuotas.length} de {total}</div>
          {hasMore ? (
            <button disabled={loading} onClick={() => setPage(p => p + 1)} className="bg-gray-800 text-white px-3 py-1 rounded">
              {loading ? "Cargando..." : "Cargar más"}
            </button>
          ) : (
            <span className="opacity-70">No hay más resultados</span>
          )}
        </div>
      </div>
    </div>
  );
}
