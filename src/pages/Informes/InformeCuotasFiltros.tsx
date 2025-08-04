import { useEffect, useState } from "react";
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

export default function InformeCuotasFiltros() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaPago, setFiltroFechaPago] = useState("");
  const [filtroFormaPago, setFiltroFormaPago] = useState<string>("");
  const [formasPago, setFormasPago] = useState<FormaDePago[]>([]);

  useEffect(() => {
    buscarCuotas();
    obtenerFormasPago();
  }, [busqueda, filtroMes, filtroEstado, filtroFechaPago, filtroFormaPago]);

  const obtenerFormasPago = async () => {
    try {
      const res = await fetch(`${API_URL}/api/informe-cuotas/formas-de-pago`);
      const data = await res.json();
      setFormasPago(data);
    } catch (error) {
      console.error("Error obteniendo formas de pago", error);
    }
  };

  const buscarCuotas = async () => {
    const params = new URLSearchParams();
    if (busqueda) params.append("busqueda", busqueda);
    if (filtroMes) params.append("mes", filtroMes);
    if (filtroEstado) params.append("estado", filtroEstado);
    if (filtroFechaPago) params.append("fecha_pago", filtroFechaPago);
    if (filtroFormaPago) params.append("forma_pago", filtroFormaPago);

    const res = await fetch(`${API_URL}/api/informe-cuotas/buscar?${params.toString()}`);
    const data = await res.json();
    setCuotas(data);
  };

  const handleExportarExcel = () => {
    const params = new URLSearchParams();
    if (busqueda) params.append("busqueda", busqueda);
    if (filtroMes) params.append("mes", filtroMes);
    if (filtroEstado) params.append("estado", filtroEstado);
    if (filtroFechaPago) params.append("fecha_pago", filtroFechaPago);
    if (filtroFormaPago) params.append("forma_pago", filtroFormaPago);

    const url = `${API_URL}/api/informe-cuotas/exportar-excel?${params.toString()}`;
    window.open(url, "_blank");
  };

  const totalCuotas = cuotas.length;
  const cuotasPagas = cuotas.filter((c) => c.estado === "pagada");
  const totalPagas = cuotasPagas.length;

  const totalImporte = cuotas.reduce((acc, c) => acc + Number(c.importe || 0), 0);
  const totalMontoPagado = cuotas.reduce((acc, c) => acc + Number(c.monto_pago || 0), 0);
  const totalFaltaCobro = totalImporte - totalMontoPagado;

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
                Fecha de Pago:
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
                    <option key={fp.id} value={fp.id}>{fp.forma_de_pago}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={buscarCuotas}
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
            <div><strong>Total cuotas generadas:</strong> {totalCuotas}</div>
            <div><strong>Total cuotas pagas:</strong> {totalPagas}</div>
            <div><strong>Total importe generado:</strong> ${totalImporte.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
            <div><strong>Total importe pagado:</strong> ${totalMontoPagado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
            <div><strong>Falta de cobro:</strong> ${totalFaltaCobro.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
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
      </div>
    </div>
  );
}
