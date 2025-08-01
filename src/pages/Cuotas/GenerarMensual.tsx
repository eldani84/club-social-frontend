import React, { useState, useEffect } from "react";

type CambioCategoria = {
  socio: any;
  anterior: string;
  nueva: string;
  descripcion?: string;
};
type CuotaNormal = { socio: any; categoria: any };

type SimulacionResultado = {
  cambiosCategoria: CambioCategoria[];
  exentosVitalicio: any[];
  exentosGrupoFamiliar: any[];
  normales: CuotaNormal[];
  datosFaltantes: any[];
  yaTienenCuota: any[];
  total: number;
};

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function GenerarMensual() {
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [simulacion, setSimulacion] = useState<SimulacionResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<any>(null);

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (generando) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [generando]);

  const handleSimular = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSimulacion(null);
    setResultadoFinal(null);
    setConfirmar(false);

    try {
      const res = await fetch("http://localhost:3000/api/cuotas/simular-generacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, anio }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setSimulacion(data);
    } catch (err) {
      setError("Error al simular generación de cuotas.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerar = async () => {
    setGenerando(true);
    setError(null);
    setResultadoFinal(null);
    try {
      const res = await fetch("http://localhost:3000/api/cuotas/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, anio }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResultadoFinal(data);
    } catch (err) {
      setError("Error al generar cuotas.");
      console.error(err);
    } finally {
      setGenerando(false);
      setConfirmar(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 rounded-2xl shadow-lg bg-white/90 border border-gray-100">
      <h2 className="text-2xl font-bold text-red-700 mb-4 text-center tracking-tight">
        Generar Cuotas Mensuales
      </h2>
      <form onSubmit={handleSimular} className="flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <label className="font-semibold">Mes y Año:</label>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="input-modern">
            {meses.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            min={2020}
            max={2100}
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            className="input-modern"
            style={{ width: 90 }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl shadow"
        >
          {loading ? "Simulando..." : "Simular generación"}
        </button>
      </form>

      {/* Barra de carga o error */}
      {loading && (
        <div className="mt-4 text-center text-red-700 font-bold">Procesando, espere por favor...</div>
      )}
      {error && <div className="mt-4 text-center text-red-700 font-bold">{error}</div>}

      {/* Mostrar resumen de simulación */}
      {simulacion && (
        <div className="mt-6 bg-red-50 rounded-xl p-4 shadow">
          <div className="mb-2 font-bold text-red-800 text-lg">
            Resumen de la generación {meses[mes - 1]} {anio}
          </div>
          <ul className="mb-3 space-y-1 text-sm">
            <li>✔️ Cuotas normales a generar: <b>{simulacion.normales.length}</b></li>
            <li>🏷️ Cambios de categoría: <b>{simulacion.cambiosCategoria.length}</b></li>
            <li>🎖️ Exentos vitalicio: <b>{simulacion.exentosVitalicio.length}</b></li>
            <li>👨‍👩‍👧‍👦 Exentos grupo familiar: <b>{simulacion.exentosGrupoFamiliar.length}</b></li>
            <li>⚠️ Datos faltantes: <b>{simulacion.datosFaltantes.length}</b></li>
            <li>🟡 Ya tenían cuota: <b>{simulacion.yaTienenCuota.length}</b></li>
            <li className="mt-2 font-semibold">TOTAL socios procesados: {simulacion.total}</li>
          </ul>
          {/* ... (el resto igual como lo tienes) ... */}
          {/* Cambios de categoría */}
          {simulacion.cambiosCategoria.length > 0 && (
            <details className="mb-2">
              <summary className="font-semibold cursor-pointer text-blue-700">Ver cambios de categoría</summary>
              <ul className="list-disc ml-5 mt-1">
                {simulacion.cambiosCategoria.map((c, i) => (
                  <li key={i} className="text-blue-800">
                    {c.socio?.nombre} {c.socio?.apellido} (ID: {c.socio?.id}) – {c.anterior} → {c.nueva}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {/* Exentos vitalicio */}
          {simulacion.exentosVitalicio.length > 0 && (
            <details className="mb-2">
              <summary className="font-semibold cursor-pointer text-green-700">Ver exentos vitalicio</summary>
              <ul className="list-disc ml-5 mt-1">
                {simulacion.exentosVitalicio.map((s, i) => (
                  <li key={i} className="text-green-800">{s.nombre} {s.apellido} (ID: {s.id})</li>
                ))}
              </ul>
            </details>
          )}
          {/* Exentos grupo familiar */}
          {simulacion.exentosGrupoFamiliar.length > 0 && (
            <details className="mb-2">
              <summary className="font-semibold cursor-pointer text-purple-700">Ver exentos por grupo familiar</summary>
              <ul className="list-disc ml-5 mt-1">
                {simulacion.exentosGrupoFamiliar.map((s, i) => (
                  <li key={i} className="text-purple-800">{s.nombre} {s.apellido} (ID: {s.id})</li>
                ))}
              </ul>
            </details>
          )}
          {/* Socios con datos faltantes */}
          {simulacion.datosFaltantes.length > 0 && (
            <details className="mb-2">
              <summary className="font-semibold cursor-pointer text-yellow-700">Ver socios con datos faltantes</summary>
              <ul className="list-disc ml-5 mt-1">
                {simulacion.datosFaltantes.map((s, i) => (
                  <li key={i} className="text-yellow-800">
                    {s.nombre} {s.apellido} (ID: {s.id}) {s.motivo && <span style={{color:"#b58900"}}>— {s.motivo}</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {/* Socios que ya tenían cuota */}
          {simulacion.yaTienenCuota.length > 0 && (
            <details>
              <summary className="font-semibold cursor-pointer text-gray-600">Ver socios ya tenían cuota</summary>
              <ul className="list-disc ml-5 mt-1">
                {simulacion.yaTienenCuota.map((s, i) => (
                  <li key={i} className="text-gray-800">{s.nombre} {s.apellido} (ID: {s.id})</li>
                ))}
              </ul>
            </details>
          )}
          {/* Botón para confirmar y generar cuotas */}
          <button
            onClick={() => setConfirmar(true)}
            disabled={generando}
            className="mt-6 w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-xl shadow"
          >
            {generando ? "Generando cuotas..." : "Confirmar y Generar Cuotas"}
          </button>
        </div>
      )}
      {/* Overlay mientras se generan cuotas */}
      {generando && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center">
            <div className="mb-4 font-bold text-lg text-green-700">
              Generando cuotas…<br />
              <span className="text-sm text-gray-500">No cierre ni recargue esta ventana</span>
            </div>
            <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div className="bg-green-500 h-3 animate-pulse" style={{ width: "80%" }} />
            </div>
            <div className="spinner-border text-green-600" style={{ width: 32, height: 32, borderWidth: 4 }}></div>
          </div>
        </div>
      )}
      {/* Confirmación y resultado */}
      {confirmar && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full border border-green-200">
            <div className="font-bold mb-2 text-green-800 text-lg">¿Está seguro que desea generar las cuotas?</div>
            <div className="mb-4 text-gray-600">Esto grabará todas las cuotas mostradas en el resumen. Esta acción no puede deshacerse.</div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleGenerar}
                disabled={generando}
                className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg shadow"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmar(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Resultado final */}
      {resultadoFinal && (
        <div className="mt-6 bg-green-50 rounded-xl p-4 shadow border border-green-200">
          <div className="font-bold text-green-700 mb-2">
            ✔️ Proceso finalizado correctamente
          </div>
          <div>Total de cuotas generadas: <b>{resultadoFinal.cuotas_generadas || resultadoFinal.insertados || 0}</b></div>
          {resultadoFinal.socios_omitidos?.length > 0 && (
            <div className="mt-2">
              <b>Socios omitidos:</b>
              <ul>
                {resultadoFinal.socios_omitidos.map((msg: any, i: number) => <li key={i}>{msg}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
