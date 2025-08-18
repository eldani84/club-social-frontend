import { useEffect, useRef, useState } from "react";

type Disciplina = {
  id: number;
  nombre: string;
  estado: "activa" | "inactiva";
};

type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
};

type GenResp = {
  ok: boolean;
  periodo: string;
  generados: number;
  omitidos: number;
  mensaje?: string;
};

type Msg = { tipo: "ok" | "error" | "info"; texto: string } | null;

function currentYYYYMM() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function GenerarCuotasDisciplina() {
  const API_URL = import.meta.env.VITE_API_URL;

  // Período y filtros
  const [periodo, setPeriodo] = useState(currentYYYYMM());
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinaId, setDisciplinaId] = useState<number | "">("");
  const [socioSel, setSocioSel] = useState<Socio | null>(null);

  // Autocomplete socio
  const [token, setToken] = useState("");
  const [sugerencias, setSugerencias] = useState<Socio[]>([]);
  const [cargandoSug, setCargandoSug] = useState(false);
  const [mostrarSug, setMostrarSug] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Estado de request
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState<Msg>(null);
  const [resultado, setResultado] = useState<GenResp | null>(null);

  // Cargar disciplinas
  useEffect(() => {
    fetch(`${API_URL}/disciplinas`)
      .then((r) => r.json())
      .then((rows: Disciplina[]) => {
        const orden = [...rows].sort((a, b) => {
          if (a.estado !== b.estado) return a.estado === "activa" ? -1 : 1;
          return a.nombre.localeCompare(b.nombre);
        });
        setDisciplinas(orden);
      })
      .catch(() => setDisciplinas([]));
  }, [API_URL]);

  // Autocomplete socio por token (apellido/nombre/dni)
  useEffect(() => {
    if (!token || token.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    setCargandoSug(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(
          `${API_URL}/socios/buscar?busqueda=${encodeURIComponent(token)}`
        );
        const data = await r.json();
        setSugerencias(Array.isArray(data) ? data : []);
        setMostrarSug(true);
      } catch {
        setSugerencias([]);
      } finally {
        setCargandoSug(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [token, API_URL]);

  const seleccionarSocio = (s: Socio) => {
    setSocioSel(s);
    setToken(`${s.apellido} ${s.nombre} — ${s.dni}`);
    setMostrarSug(false);
  };

  const limpiarSocio = () => {
    setSocioSel(null);
    setToken("");
    setSugerencias([]);
  };

  const onGenerar = async () => {
    setMensaje(null);
    setResultado(null);

    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      setMensaje({ tipo: "error", texto: "Período inválido. Usá formato YYYY-MM" });
      return;
    }

    setGenerando(true);
    try {
      const body: any = { periodo };
      if (disciplinaId) body.disciplina_id = Number(disciplinaId);
      if (socioSel?.id) body.socio_id = Number(socioSel.id);

      const r = await fetch(`${API_URL}/disciplinas/cuotas/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: GenResp = await r.json().catch(() => ({} as any));
      if (!r.ok) throw new Error((data as any)?.error || "No se pudo generar");

      setResultado(data);
      setMensaje({
        tipo: "ok",
        texto:
          data.mensaje ??
          `Generadas: ${data.generados} · Omitidas: ${data.omitidos} (período ${data.periodo})`,
      });
    } catch (e: any) {
      setMensaje({ tipo: "error", texto: e?.message || "Error al generar" });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Generar cuotas por disciplina</h1>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Período */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Período <span className="text-gray-400">(YYYY-MM)</span>
            </label>
            <input
              type="month"
              className="border rounded-lg px-3 py-2 text-sm w-full"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            />
          </div>

          {/* Disciplina */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Disciplina <span className="text-gray-400">(opcional)</span>
            </label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-full"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Todas las disciplinas</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} {d.estado !== "activa" ? "(inactiva)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Socio opcional */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs text-gray-500 mb-1">
              Socio (opcional) — buscar por apellido / nombre / DNI
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                className="border rounded-lg px-3 py-2 text-sm w-full"
                placeholder="Ej: PEREZ JUAN o 30111222"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setSocioSel(null);
                }}
                onFocus={() => token.trim().length >= 2 && setMostrarSug(true)}
              />
              <button
                type="button"
                onClick={limpiarSocio}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
              >
                Limpiar
              </button>
            </div>

            {/* Sugerencias */}
            {mostrarSug && token.trim().length >= 2 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded-xl shadow max-h-64 overflow-auto">
                {cargandoSug ? (
                  <div className="p-3 text-sm text-gray-500">Buscando...</div>
                ) : sugerencias.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Sin resultados</div>
                ) : (
                  <ul>
                    {sugerencias.map((s) => (
                      <li
                        key={s.id}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm flex justify-between"
                        onClick={() => seleccionarSocio(s)}
                      >
                        <span>
                          {s.apellido}, {s.nombre} — {s.dni}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {socioSel && (
              <div className="mt-2 text-sm">
                Seleccionado:{" "}
                <span className="font-medium">
                  {socioSel.apellido}, {socioSel.nombre} ({socioSel.dni})
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={onGenerar}
            disabled={generando || !periodo}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
          >
            {generando ? "Generando..." : "Generar cuotas"}
          </button>
          {mensaje && (
            <span
              className={`ml-3 text-sm ${
                mensaje.tipo === "ok"
                  ? "text-green-700"
                  : mensaje.tipo === "info"
                  ? "text-gray-700"
                  : "text-red-700"
              }`}
            >
              {mensaje.texto}
            </span>
          )}
        </div>

        {resultado && (
          <div className="mt-3 text-xs text-gray-600">
            <div>Período: <b>{resultado.periodo}</b></div>
            <div>Generadas: <b>{resultado.generados}</b></div>
            <div>Omitidas: <b>{resultado.omitidos}</b></div>
          </div>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Nota: si la disciplina está inactiva o el socio está de baja, esas inscripciones se omiten.
        </p>
      </div>
    </div>
  );
}
