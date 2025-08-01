import { useEffect, useState } from "react";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

interface ResultadoMorosidad {
  id: number;
  nombre: string;
  apellido: string;
  forma_pago_nombre: string;
  cuotas_impagas: number;
  desde_mes: string;
  total_adeudado: number;
}

interface TotalPorForma {
  forma_pago: string;
  total: string;
}

interface TotalesGenerales {
  total_socios: number;
  total_cuotas: number;
  total_deuda: string;
}

interface FormaDePago {
  id: number;
  forma_de_pago: string;
}

export default function InformeMorosidadConsolidada() {
  const [minCuotas, setMinCuotas] = useState(3);
  const [desdeMes, setDesdeMes] = useState("2024-01");
  const [formaPagoId, setFormaPagoId] = useState("todos");

  const [resultados, setResultados] = useState<ResultadoMorosidad[]>([]);
  const [formasPago, setFormasPago] = useState<FormaDePago[]>([]);
  const [totalesPorForma, setTotalesPorForma] = useState<TotalPorForma[]>([]);
  const [totalesGenerales, setTotalesGenerales] = useState<TotalesGenerales | null>(null);

  const buscarMorosos = async () => {
    try {
      const params = new URLSearchParams({
        minCuotas: String(minCuotas),
        desdeMes,
        formaPagoId,
      });

      const res = await fetch(`http://localhost:3000/api/informes/morosidad-consolidada?${params}`);
      const data = await res.json();

      setResultados(data.socios || []);
      setTotalesPorForma(data.totales_por_forma || []);
      setTotalesGenerales(data.totales_generales || null);
    } catch (err) {
      console.error("Error al obtener morosos:", err);
    }
  };

  const exportar = async (formato: "excel" | "pdf") => {
    const params = new URLSearchParams({
      minCuotas: String(minCuotas),
      desdeMes,
      formaPagoId,
    });

    const endpoint =
      formato === "excel"
        ? "http://localhost:3000/api/informes/exportar-excel"
        : "http://localhost:3000/api/informes/exportar-pdf";

    window.open(`${endpoint}?${params}`, "_blank");
  };

  const cargarFormasPago = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/formas-de-pago");
      const data = await res.json();
      setFormasPago(data);
    } catch (err) {
      console.error("Error al cargar formas de pago", err);
    }
  };

  useEffect(() => {
    buscarMorosos();
  }, [minCuotas, desdeMes, formaPagoId]);

  useEffect(() => {
    cargarFormasPago();
  }, []);

  return (
    <div className="max-w-[100vw] p-4">
      <h2 className="text-xl font-semibold text-red-700 mb-4">Informe de Morosidad Consolidada</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <label className="flex flex-col text-xs">
          Mínimo de cuotas:
          <input
            type="number"
            value={minCuotas}
            onChange={(e) => setMinCuotas(Number(e.target.value))}
            className="border p-1 w-20 text-xs"
          />
        </label>

        <label className="flex flex-col text-xs">
          Desde mes:
          <input
            type="month"
            value={desdeMes}
            onChange={(e) => setDesdeMes(e.target.value)}
            className="border p-1 w-40 text-xs"
          />
        </label>

        <label className="flex flex-col text-xs">
          Forma de pago:
          <select
            value={formaPagoId}
            onChange={(e) => setFormaPagoId(e.target.value)}
            className="border p-1 w-40 text-xs"
          >
            <option value="todos">Todas</option>
            {formasPago.map((fp) => (
              <option key={fp.id} value={fp.id}>
                {fp.forma_de_pago}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => exportar("excel")}
          className="flex items-center gap-1 text-xs text-green-700 border border-green-700 px-2 py-1 rounded hover:bg-green-100"
        >
          <FaFileExcel /> Excel
        </button>

        <button
          onClick={() => exportar("pdf")}
          className="flex items-center gap-1 text-xs text-red-700 border border-red-700 px-2 py-1 rounded hover:bg-red-100"
        >
          <FaFilePdf /> PDF
        </button>
      </div>

      {totalesGenerales && (
        <div className="text-xs mb-4">
          <p><strong>Total de socios:</strong> {totalesGenerales.total_socios}</p>
          <p><strong>Total de cuotas impagas:</strong> {totalesGenerales.total_cuotas}</p>
          <p><strong>Total de deuda acumulada:</strong> ${Number(totalesGenerales.total_deuda).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">#</th>
              <th className="border px-2 py-1">Nombre</th>
              <th className="border px-2 py-1">Apellido</th>
              <th className="border px-2 py-1">Forma de Pago</th>
              <th className="border px-2 py-1">Cuotas Impagas</th>
              <th className="border px-2 py-1">Desde</th>
              <th className="border px-2 py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r, i) => (
              <tr key={r.id}>
                <td className="border px-2 py-1 text-center">{i + 1}</td>
                <td className="border px-2 py-1">{r.nombre}</td>
                <td className="border px-2 py-1">{r.apellido}</td>
                <td className="border px-2 py-1">{r.forma_pago_nombre || "N/D"}</td>
                <td className="border px-2 py-1 text-center">{r.cuotas_impagas}</td>
                <td className="border px-2 py-1 text-center">{r.desde_mes}</td>
                <td className="border px-2 py-1 text-right">
                  ${Number(r.total_adeudado).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalesPorForma.length > 0 && (
        <div className="mt-4 text-xs">
          <h4 className="font-semibold mb-1">Totales por forma de pago:</h4>
          <ul className="list-disc pl-4">
            {totalesPorForma.map((t, i) => (
              <li key={i}>
                {t.forma_pago}: ${Number(t.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
