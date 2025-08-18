import { useEffect, useMemo, useRef, useState } from "react";

/** ===== Tipos ===== */
type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  grupo_familiar_id: number | null;
};

type Inscripcion = {
  id: number;                 // id de socios_disciplinas
  activo: 0 | 1;
  fecha_alta: string | null;
  fecha_baja: string | null;
  importe_mensual: number;
  descuento_tipo: "NINGUNO" | "PORCENTAJE" | "MONTO";
  descuento_valor: number;
  grupo_familiar_id: number | null;
  observaciones?: string | null;

  disciplina_id: number;
  disciplina: string;
  estado_disciplina: "activa" | "inactiva";
};

type Msg = { tipo: "ok" | "error"; texto: string } | null;

/** ===== Componente ===== */
export default function InscripcionesSocio() {
  const API_URL = import.meta.env.VITE_API_URL;

  // Buscar socio (token o DNI exacto)
  const [token, setToken] = useState("");
  const [dni, setDni] = useState("");
  const [sugerencias, setSugerencias] = useState<Socio[]>([]);
  const [cargandoSug, setCargandoSug] = useState(false);
  const [mostrarSug, setMostrarSug] = useState(false);
  const [socioSel, setSocioSel] = useState<Socio | null>(null);

  // Listado de inscripciones
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loadingIns, setLoadingIns] = useState(false);
  const [verEstado, setVerEstado] = useState<"activos" | "todos">("activos");

  // Editar (modal simple)
  const [editId, setEditId] = useState<number | null>(null);
  const [editTipo, setEditTipo] = useState<"NINGUNO" | "PORCENTAJE" | "MONTO">("NINGUNO");
  const [editValor, setEditValor] = useState<string>("0");
  const [editImporte, setEditImporte] = useState<string>("");
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState<Msg>(null);

  /** ====== búsqueda por token con debounce ====== */
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
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [token, API_URL]);

  const seleccionarSocio = (s: Socio) => {
    setSocioSel(s);
    setToken(`${s.apellido} ${s.nombre}`);
    setMostrarSug(false);
    setMensaje(null);
  };

  /** ====== Buscar por DNI (usa mismo endpoint /buscar) ====== */
  const buscarPorDni = async () => {
    setMensaje(null);
    setSocioSel(null);
    try {
      const res = await fetch(`${API_URL}/socios/buscar?busqueda=${encodeURIComponent(dni)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "No encontrado");
      }
      const data = await res.json();
      const arr: Socio[] = Array.isArray(data) ? data : [data].filter(Boolean);
      const s = arr.find((x) => String(x.dni) === String(dni));
      if (!s) throw new Error("No encontrado");
      seleccionarSocio(s);
    } catch (e: any) {
      setMensaje({ tipo: "error", texto: e?.message || "Error buscando por DNI" });
    }
  };

  /** ====== Cargar inscripciones del socio ====== */
  const cargarInscripciones = async () => {
    if (!socioSel?.id) return;
    setLoadingIns(true);
    try {
      const res = await fetch(
        `${API_URL}/socios/${socioSel.id}/disciplinas?estado=${verEstado}`
      );
      const data = await res.json();
      setInscripciones(Array.isArray(data) ? data : []);
    } catch {
      setInscripciones([]);
    } finally {
      setLoadingIns(false);
    }
  };

  useEffect(() => {
    if (socioSel) cargarInscripciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socioSel, verEstado]);

  /** ====== Baja ====== */
  const darBaja = async (id: number) => {
    if (!confirm("¿Dar de baja esta inscripción?")) return;
    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/socios_disciplinas/${id}/baja`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observaciones: "Baja desde panel" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo dar de baja");
      setMensaje({ tipo: "ok", texto: "Inscripción dada de baja" });
      await cargarInscripciones();
    } catch (e: any) {
      setMensaje({ tipo: "error", texto: e?.message || "Error al dar de baja" });
    } finally {
      setGuardando(false);
    }
  };

  /** ====== Abrir modal de edición ====== */
  const abrirEditar = (row: Inscripcion) => {
    setEditId(row.id);
    setEditTipo(row.descuento_tipo);
    setEditValor(String(row.descuento_valor ?? 0));
    setEditImporte(String(row.importe_mensual ?? 0));
  };

  /** ====== Guardar edición ====== */
  const guardarEdicion = async () => {
    if (!editId) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const body: any = {
        descuento_tipo: editTipo,
        descuento_valor: Number(editValor || 0),
        importe_mensual: Number(editImporte || 0),
      };
      const res = await fetch(`${API_URL}/socios_disciplinas/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar");
      setMensaje({ tipo: "ok", texto: "Inscripción actualizada" });
      setEditId(null);
      await cargarInscripciones();
    } catch (e: any) {
      setMensaje({ tipo: "error", texto: e?.message || "Error al actualizar" });
    } finally {
      setGuardando(false);
    }
  };

  const totalActivas = useMemo(
    () => inscripciones.filter((i) => i.activo === 1).length,
    [inscripciones]
  );

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Inscripciones de socio</h1>

      {/* Buscar socio */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Buscar apellido / nombre / DNI</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setSocioSel(null);
              }}
              onFocus={() => token.length >= 2 && setMostrarSug(true)}
              placeholder="Ej: PEREZ JUAN o 31163294"
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
                        <span>{s.apellido}, {s.nombre} — {s.dni}</span>
                        <span className="text-gray-500">GF: {s.grupo_familiar_id ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {socioSel && (
              <div className="mt-2 text-sm">
                <span className="font-medium">{socioSel.apellido}, {socioSel.nombre}</span>{" "}
                <span className="text-gray-500">
                  ({socioSel.dni}) · GF: {socioSel.grupo_familiar_id ?? "—"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-end">
            <div className="flex gap-2">
              <input
                className="border rounded-lg px-3 py-2 text-sm w-40"
                placeholder="DNI exacto"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
              />
              <button
                onClick={buscarPorDni}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Buscar DNI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros / Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">
          {socioSel ? `Mostrando inscripciones de ${socioSel.apellido}, ${socioSel.nombre}` : "Seleccioná un socio"}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">
            <input
              type="checkbox"
              className="mr-1"
              checked={verEstado === "todos"}
              onChange={(e) => setVerEstado(e.target.checked ? "todos" : "activos")}
            />
            Ver todas
          </label>
          <span className="text-xs text-gray-500">Activas: {totalActivas}</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Disciplina</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Alta</th>
              <th className="text-left p-3">Baja</th>
              <th className="text-right p-3">Importe</th>
              <th className="text-left p-3">Descuento</th>
              <th className="text-left p-3">Obs</th>
              <th className="text-right p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!socioSel ? (
              <tr><td colSpan={8} className="p-4 text-center text-gray-500">Elegí un socio para ver sus inscripciones</td></tr>
            ) : loadingIns ? (
              <tr><td colSpan={8} className="p-4 text-center text-gray-500">Cargando...</td></tr>
            ) : inscripciones.length === 0 ? (
              <tr><td colSpan={8} className="p-4 text-center text-gray-500">Sin inscripciones</td></tr>
            ) : (
              inscripciones.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3">{row.disciplina}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${row.activo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                      {row.activo ? "Activa" : "Baja"}
                    </span>
                  </td>
                  <td className="p-3">{row.fecha_alta ? new Date(row.fecha_alta).toLocaleDateString() : "—"}</td>
                  <td className="p-3">{row.fecha_baja ? new Date(row.fecha_baja).toLocaleDateString() : "—"}</td>
                  <td className="p-3 text-right">${Number(row.importe_mensual).toFixed(2)}</td>
                  <td className="p-3">
                    {row.descuento_tipo === "NINGUNO"
                      ? "Ninguno"
                      : row.descuento_tipo === "PORCENTAJE"
                      ? `${row.descuento_valor}%`
                      : `$${Number(row.descuento_valor).toFixed(2)}`}
                  </td>
                  <td className="p-3 max-w-[220px] truncate" title={row.observaciones || ""}>
                    {row.observaciones || "—"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => abrirEditar(row)}
                        className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => darBaja(row.id)}
                        disabled={!row.activo || guardando}
                        className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Baja
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mt-3 text-sm ${mensaje.tipo === "ok" ? "text-green-700" : "text-red-700"}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Modal Edición (simple) */}
      {editId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow p-4 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3">Editar inscripción</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Descuento</label>
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <select
                    className="border rounded-lg px-3 py-2 text-sm"
                    value={editTipo}
                    onChange={(e) => {
                      const v = e.target.value as "NINGUNO" | "PORCENTAJE" | "MONTO";
                      setEditTipo(v);
                      if (v === "NINGUNO") setEditValor("0");
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
                    value={editValor}
                    onChange={(e) => setEditValor(e.target.value)}
                    disabled={editTipo === "NINGUNO"}
                    placeholder={editTipo === "PORCENTAJE" ? "Ej: 10" : "Ej: 1500"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Importe mensual</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="border rounded-lg px-3 py-2 text-sm w-full"
                  value={editImporte}
                  onChange={(e) => setEditImporte(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditId(null)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
