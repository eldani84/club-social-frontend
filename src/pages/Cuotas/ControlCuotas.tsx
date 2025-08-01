import { useEffect, useState } from "react";
import { FaSearch, FaFileExcel } from "react-icons/fa";

interface Cuota {
  id: number;
  socio_id: number;
  nombre: string;
  apellido: string;
  mes: string;
  importe: number;
  estado: string;
  fecha_pago: string | null;
  monto_pago: number | null;
  codigo_barra: string;
}

interface FormaDePago {
  id: number;
  forma_de_pago: string;
}

const estados = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "pagada", label: "Pagada" },
  { value: "exento_vitalicio", label: "Exento vitalicio" },
  { value: "exento_g_familiar", label: "Exento grupo familiar" },
  { value: "exento_otros", label: "Exento otros" }
];

export default function ControlCuotas() {
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaPago, setFiltroFechaPago] = useState("");
  const [filtroFormaPago, setFiltroFormaPago] = useState<string>("");

  const [formasPago, setFormasPago] = useState<FormaDePago[]>([]);
  const [sortField, setSortField] = useState<keyof Cuota | "">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    buscarCuotas();
    obtenerFormasPago();
    // eslint-disable-next-line
  }, []);

  const obtenerFormasPago = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/formas-de-pago");
      const data = await res.json();
      setFormasPago(data);
    } catch (error) {
      console.error("Error obteniendo formas de pago", error);
    }
  };

  const buscarCuotas = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (busqueda) params.append("busqueda", busqueda);
    if (filtroMes) params.append("mes", filtroMes);
    if (filtroEstado) params.append("estado", filtroEstado);
    if (filtroFechaPago) params.append("fecha_pago", filtroFechaPago);
    if (filtroFormaPago) params.append("forma_pago", filtroFormaPago);

    const res = await fetch(
      `http://localhost:3000/api/cuotas/buscar?${params.toString()}`
    );
    const data = await res.json();
    setCuotas(data);
    setLoading(false);
  };

  const handleSort = (field: keyof Cuota) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const cuotasFiltradas = cuotas
    .filter(
      (c) =>
        (`${c.nombre} ${c.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
          c.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
          c.nombre.toLowerCase().includes(busqueda.toLowerCase())) &&
        (filtroEstado ? c.estado === filtroEstado : true) &&
        (filtroMes ? c.mes === filtroMes : true) &&
        (filtroFechaPago ? (c.fecha_pago ? c.fecha_pago.slice(0, 10) === filtroFechaPago : false) : true)
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      if (valA === valB) return 0;
      return sortOrder === "asc"
        ? valA > valB
          ? 1
          : -1
        : valA < valB
        ? 1
        : -1;
    });

  const handleExportarExcel = () => {
    const params = new URLSearchParams();
    if (busqueda) params.append("busqueda", busqueda);
    if (filtroMes) params.append("mes", filtroMes);
    if (filtroEstado) params.append("estado", filtroEstado);
    if (filtroFechaPago) params.append("fecha_pago", filtroFechaPago);
    if (filtroFormaPago) params.append("forma_pago", filtroFormaPago);

    const url = `http://localhost:3000/api/cuotas/exportar-excel?${params.toString()}`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-[100vw] mx-auto p-2 md:p-6">
      <div className="w-full rounded-xl bg-white/90 shadow-lg p-4 md:p-6 border border-gray-100 mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-red-700 mb-2 tracking-tight">
          Control de Cuotas
        </h2>
        {/* Filtros */}
        <form
          onSubmit={e => {
            e.preventDefault();
            buscarCuotas();
          }}
          className="w-full flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-4 flex-wrap"
        >
          <div className="flex flex-col w-full md:w-48">
            <label className="text-xs font-semibold mb-1">Nombre/Apellido</label>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar"
              className="input-modern"
            />
          </div>
          <div className="flex flex-col w-full md:w-36">
            <label className="text-xs font-semibold mb-1">Mes</label>
            <input
              type="month"
              value={filtroMes}
              onChange={e => setFiltroMes(e.target.value)}
              className="input-modern"
            />
          </div>
          <div className="flex flex-col w-full md:w-36">
            <label className="text-xs font-semibold mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="input-modern"
            >
              {estados.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col w-full md:w-40">
            <label className="text-xs font-semibold mb-1">Fecha de pago</label>
            <input
              type="date"
              value={filtroFechaPago}
              onChange={e => setFiltroFechaPago(e.target.value)}
              className="input-modern"
            />
          </div>
          <div className="flex flex-col w-full md:w-48">
            <label className="text-xs font-semibold mb-1">Forma de Pago</label>
            <select
              value={filtroFormaPago}
              onChange={e => setFiltroFormaPago(e.target.value)}
              className="input-modern"
            >
              <option value="">Todas</option>
              {formasPago.map(fp => (
                <option key={fp.id} value={fp.id}>{fp.forma_de_pago}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="btn-main mt-5 md:mt-0 flex items-center gap-2 px-4 py-2"
            disabled={loading}
          >
            <FaSearch /> Buscar
          </button>
          <button
            type="button"
            onClick={handleExportarExcel}
            className="btn-green mt-5 md:mt-0 flex items-center gap-2 px-4 py-2"
          >
            <FaFileExcel /> Excel
          </button>
        </form>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl shadow ring-1 ring-black/5 bg-white">
          <table className="modern-table w-full min-w-[820px]">
            <thead className="bg-red-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 font-semibold text-left text-red-700 cursor-pointer select-none"
                    onClick={() => handleSort("apellido")}>
                  Apellido{sortField === "apellido" ? (sortOrder === "asc" ? " 🔼" : " 🔽") : ""}
                </th>
                <th className="px-3 py-2 font-semibold text-left text-red-700 cursor-pointer select-none"
                    onClick={() => handleSort("nombre")}>
                  Nombre{sortField === "nombre" ? (sortOrder === "asc" ? " 🔼" : " 🔽") : ""}
                </th>
                <th className="px-3 py-2 font-semibold text-left text-red-700 cursor-pointer select-none"
                    onClick={() => handleSort("mes")}>
                  Mes{sortField === "mes" ? (sortOrder === "asc" ? " 🔼" : " 🔽") : ""}
                </th>
                <th className="px-3 py-2 font-semibold text-left text-red-700">Importe</th>
                <th className="px-3 py-2 font-semibold text-left text-red-700 cursor-pointer select-none"
                    onClick={() => handleSort("estado")}>
                  Estado{sortField === "estado" ? (sortOrder === "asc" ? " 🔼" : " 🔽") : ""}
                </th>
                <th className="px-3 py-2 font-semibold text-left text-red-700">Fecha Pago</th>
                <th className="px-3 py-2 font-semibold text-left text-red-700">Monto Pago</th>
                <th className="px-3 py-2 font-semibold text-left text-red-700">Código de Barra</th>
              </tr>
            </thead>
            <tbody>
              {cuotasFiltradas.map((c, idx) => (
                <tr key={c.id} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-2">{c.apellido}</td>
                  <td className="px-3 py-2">{c.nombre}</td>
                  <td className="px-3 py-2">{c.mes}</td>
                  <td className="px-3 py-2">${c.importe}</td>
                  <td className="px-3 py-2">
                    {estados.find(e => e.value === c.estado)?.label || c.estado}
                  </td>
                  <td className="px-3 py-2">{c.fecha_pago ? c.fecha_pago.slice(0, 10) : ""}</td>
                  <td className="px-3 py-2">{c.monto_pago ? `$${c.monto_pago}` : ""}</td>
                  <td className="px-3 py-2 font-mono">{c.codigo_barra}</td>
                </tr>
              ))}
              {cuotasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500 text-lg">
                    {loading ? "Cargando cuotas..." : "No se encontraron cuotas para los filtros seleccionados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
