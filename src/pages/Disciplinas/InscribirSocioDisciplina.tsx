// src/pages/Disciplinas/InscribirSocioDisciplina.tsx
import { useEffect, useMemo, useRef, useState } from "react";

type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  grupo_familiar_id: number | null;
};

type Disciplina = {
  id: number;
  nombre: string;
  estado: "activa" | "inactiva";
  precio_actual: number;
};

type Msg = { tipo: "ok" | "error"; texto: string } | null;

export default function InscribirSocioDisciplina() {
  const API_URL = import.meta.env.VITE_API_URL;

  // ======== estado socio / búsqueda ========
  const [socioSel, setSocioSel] = useState<Socio | null>(null);

  // token (apellido/nombre/dni parcial) con autocompletar
  const [token, setToken] = useState("");
  const [sugerencias, setSugerencias] = useState<Socio[]>([]);
  const [cargandoSug, setCargandoSug] = useState(false);
  const [mostrarSug, setMostrarSug] = useState(false);

  // búsqueda directa por DNI (usa el mismo endpoint /buscar con el DNI completo)
  const [dni, setDni] = useState("");
  const [buscandoDni, setBuscandoDni] = useState(false);

  // ======== disciplinas / alta ========
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinaId, setDisciplinaId] = useState<number | "">("");
  const [descuentoTipo, setDescuentoTipo] = useState<"NINGUNO" | "PORCENTAJE" | "MONTO">("NINGUNO");
  const [descuentoValor, setDescuentoValor] = useState<string>("0");
  const [observaciones, setObservaciones] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<Msg>(null);

  // ======== cargar disciplinas ========
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

  // ======== búsqueda por token (debounce) ========
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!token || token.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    setCargandoSug(true);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        // Usa tu ruta: /api/socios/buscar?busqueda=...
        const res = await fetch(`${API_URL}/socios/buscar?busqueda=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error("No se pudo buscar");
        const data = await res.json();
        setSugerencias(Array.isArray(data) ? data : [data].filter(Boolean));
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
    setMostrarSug(false);
    setToken(`${s.apellido} ${s.nombre}`);
    setMensaje(null);
  };

  // ======== búsqueda exacta por DNI (reutiliza /buscar) ========
  const buscarPorDni = async () => {
    setMensaje(null);
    setBuscandoDni(true);
    setSocioSel(null);
    try {
      const res = await fetch(`${API_URL}/socios/buscar?busqueda=${encodeURIComponent(dni)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "No encontrado");
      }
      const data = await res.json();
      const arr: Socio[] = Array.isArray(data) ? data : [data].filter(Boolean);
      const s = arr.find((x) => String(x.dni) === String(dni)); // coincidencia exacta
      if (!s) throw new Error("No encontrado");
      setSocioSel(s);
      setToken(`${s.apellido} ${s.nombre}`);
    } catch (e: any) {
      setMensaje({ tipo: "error", texto: e?.message || "Error buscando por DNI" });
    } finally {
      setBuscandoDni(false);
    }
  };

  // ======== guardar alta ========
  const onGuardar = async () => {
    setMensaje(null);
    if (!socioSel?.id) return setMensaje({ tipo: "error", texto: "Seleccioná un socio válido" });
    if (!disciplinaId) return setMensaje({ tipo: "error", texto: "Seleccioná una disciplina" });

    setGuardando(true);
    try {
      const body = {
        disciplina_id: Number(disciplinaId),
        descuento_tipo: descuentoTipo,
        descuento_valor: Number(descuentoValor || "0"),
        observaciones: observaciones?.trim() || undefined,
      };

      const r = await fetch(`${API_URL}/socios/${socioSel.id}/disciplinas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "No se pudo inscribir");

      setMensaje({ tipo: "ok", texto: "¡Inscripción realizada con éxito!" });
      setDisciplinaId("");
      setDescuentoTipo("NINGUNO");
      setDescuentoValor("0");
      setObservaciones("");
    } catch (e: any) {
      setMensaje({ tipo: "error", texto: e?.message || "Error al guardar" });
    } finally {
      setGuardando(false);
    }
  };

  const precioBase = useMemo(() => {
    const d = disciplinas.find((x) => x.id === Number(disciplinaId));
    return d ? Number(d.precio_actual || 0) : 0;
  }, [disciplinas, disciplinaId]);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Inscribir socio en disciplina</h1>

      {/* BUSCAR SOCIO: Token (apellido/nombre/dni) */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4 relative">
        <label className="block text-xs text-gray-500 mb-1">Buscar por apellido / nombre / DNI</label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setSocioSel(null);
          }}
          onFocus={() => token.length >= 2 && setMostrarSug(true)}
          placeholder="Ej: EBERHARDT DANIEL o 31163294"
        />
        {mostrarSug && token.length >= 2 && (
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
                    <span className="text-gray-500">GF: {s.grupo_familiar_id ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {socioSel && (
          <div className="mt-2 text-sm">
            <span className="font-medium">
              {socioSel.apellido}, {socioSel.nombre}
            </span>{" "}
            <span className="text-gray-500">
              ({socioSel.dni}) · GF: {socioSel.grupo_familiar_id ?? "—"}
            </span>
          </div>
        )}
      </div>

      {/* BUSCAR SOCIO: DNI exacto (reutiliza /buscar) */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">DNI (búsqueda exacta)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="31163294"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={buscarPorDni}
              disabled={buscandoDni || !dni.trim()}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {buscandoDni ? "Buscando..." : "Buscar DNI"}
            </button>
          </div>
        </div>
      </div>

      {/* SELECCIÓN DISCIPLINA + DESCUENTO */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Disciplina</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Seleccioná disciplina...</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id} disabled={d.estado !== "activa"}>
                  {d.nombre} {d.estado !== "activa" ? "(inactiva)" : ""}
                </option>
              ))}
            </select>
            {disciplinaId && (
              <p className="text-xs text-gray-500 mt-1">Precio base: ${precioBase.toFixed(2)}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Descuento</label>
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={descuentoTipo}
                onChange={(e) => {
                  const v = e.target.value as "NINGUNO" | "PORCENTAJE" | "MONTO";
                  setDescuentoTipo(v);
                  if (v === "NINGUNO") setDescuentoValor("0");
                }}
              >
                <option value="NINGUNO">Ninguno</option>
                <option value="PORCENTAJE">% Porcentaje</option>
                <option value="MONTO">$ Monto</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                className="border rounded-lg px-3 py-2 text-sm"
                value={descuentoValor}
                onChange={(e) => setDescuentoValor(e.target.value)}
                disabled={descuentoTipo === "NINGUNO"}
                placeholder={descuentoTipo === "PORCENTAJE" ? "Ej: 10" : "Ej: 1500"}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Observaciones</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Opcional (ej. hermano en vóley)"
            />
          </div>
        </div>
      </div>

      {/* ACCIÓN */}
      <div className="flex items-center gap-2">
        <button
          onClick={onGuardar}
          disabled={guardando || !socioSel || !disciplinaId}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Inscribir"}
        </button>
        {mensaje && (
          <span className={`text-sm ${mensaje.tipo === "ok" ? "text-green-700" : "text-red-700"}`}>
            {mensaje.texto}
          </span>
        )}
      </div>
    </div>
  );
}
