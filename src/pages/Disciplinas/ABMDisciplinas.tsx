import { useEffect, useMemo, useRef, useState } from "react";

type Disciplina = {
  id: number;
  nombre: string;
  estado: "activa" | "inactiva";
  precio_actual: number;
};

type Msg = { tipo: "ok" | "error"; texto: string } | null;

/** ✅ Parseo correcto de montos: 30.000,50 | 30000,50 | 30000.50 | 30000 */
function parseMonto(value: string): number {
  const raw = (value ?? "").toString().trim().replace(/\s/g, "");
  if (!raw) return 0;

  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");

  let norm = raw;
  if (hasComma && hasDot) {
    // Formato es-AR: '.' miles, ',' decimal
    norm = raw.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // Solo coma -> decimal
    norm = raw.replace(",", ".");
  } else {
    // Solo punto o sin separador -> ya está OK
    norm = raw;
  }

  const n = Number(norm);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

/** Limpia entrada mientras tipeás: deja dígitos y UN solo punto decimal */
function sanitizeMoney(value: string): string {
  let v = (value || "").replace(",", ".").replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  return v;
}
function toFixed2Str(value: string): string {
  const n = parseMonto(value);
  return n.toFixed(2);
}

export default function ABMDisciplinas() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [lista, setLista] = useState<Disciplina[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<Msg>(null);

  // Alta
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState<string>("0");
  const [estado, setEstado] = useState<"activa" | "inactiva">("activa");
  const [guardando, setGuardando] = useState(false);

  // Edición (panel completo)
  const [editRow, setEditRow] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPrecio, setEditPrecio] = useState<string>("0");
  const [editEstado, setEditEstado] = useState<"activa" | "inactiva">("activa");
  const focusRef = useRef<HTMLInputElement>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const r = await fetch(`${API_URL}/disciplinas`);
      const data: Disciplina[] = await r.json();
      const orden = [...(data || [])].sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === "activa" ? -1 : 1;
        return a.nombre.localeCompare(b.nombre);
      });
      setLista(orden);
    } catch {
      setLista([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [API_URL]);

  const onCrear = async () => {
    setMensaje(null);
    if (!nombre.trim()) {
      setMensaje({ tipo: "error", texto: "Ingresá un nombre" });
      return;
    }
    const monto = parseMonto(precio);
    if (monto < 0) {
      setMensaje({ tipo: "error", texto: "El importe no puede ser negativo" });
      return;
    }
    setGuardando(true);
    try {
      const body = {
        nombre: nombre.trim().toUpperCase(),
        estado,
        precio_actual: monto,
      };
      const r = await fetch(`${API_URL}/disciplinas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "No se pudo crear");
      setMensaje({ tipo: "ok", texto: "Disciplina creada" });
      setNombre("");
      setPrecio("0");
      setEstado("activa");
      await cargar();
    } catch (e: any) {
      setMensaje({ tipo: "error", texto: e?.message || "Error al crear" });
    } finally {
      setGuardando(false);
    }
  };

  const abrirEdicion = (d: Disciplina) => {
    setEditRow(d.id);
    setEditNombre(d.nombre);
    setEditPrecio(String(d.precio_actual ?? 0));
    setEditEstado(d.estado);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => focusRef.current?.focus(), 250);
    });
  };

  const cancelarEdicion = () => setEditRow(null);

  const guardarEdicion = async (id: number) => {
    setMensaje(null);
    if (!editNombre.trim()) {
      setMensaje({ tipo: "error", texto: "Ingresá un nombre" });
      return;
    }
    const monto = parseMonto(editPrecio);
    if (monto < 0) {
      setMensaje({ tipo: "error", texto: "El importe no puede ser negativo" });
      return;
    }
    setGuardando(true);
    try {
      const body: any = {
        nombre: editNombre.trim().toUpperCase(),
        estado: editEstado,
        precio_actual: monto,
      };
      const r = await fetch(`${API_URL}/disciplinas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "No se pudo actualizar");
      setMensaje({ tipo: "ok", texto: "Disciplina actualizada" });
      setEditRow(null);
      await cargar();
    } catch (e: any) {
      setMensaje({ tipo: "error", texto: e?.message || "Error al actualizar" });
    } finally {
      setGuardando(false);
    }
  };

  const blockNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const invalid = ["e", "E", "+", "-"];
    if (invalid.includes(e.key)) e.preventDefault();
  };

  const totalActivas = useMemo(
    () => lista.filter((x) => x.estado === "activa").length,
    [lista]
  );

  return (
    <div className="p-4 max-w-none w-full">
      <h1 className="text-xl font-semibold mb-4">Gestionar disciplinas</h1>

      {/* Panel de edición full-width */}
      {editRow !== null && (
        <div className="mb-4 p-4 bg-white rounded-2xl shadow border border-red-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg text-red-700">
              Editar disciplina #{editRow}
            </h2>
            <button
              onClick={cancelarEdicion}
              className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
              title="Cerrar edición"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-7">
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input
                ref={focusRef}
                className="w-full rounded-2xl px-4 py-3 text-lg h-12 border"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Nombre de la disciplina"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Estado</label>
              <select
                className="w-full rounded-2xl px-4 py-3 text-lg h-12 border"
                value={editEstado}
                onChange={(e) =>
                  setEditEstado(e.target.value as "activa" | "inactiva")
                }
              >
                <option value="activa">Activa</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Importe ($)
              </label>
              <input
                inputMode="decimal"
                className="w-full rounded-2xl px-4 py-3 text-lg h-12 text-right border"
                value={editPrecio}
                onKeyDown={blockNonNumericKeys}
                onChange={(e) => setEditPrecio(sanitizeMoney(e.target.value))}
                onBlur={(e) => setEditPrecio(toFixed2Str(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-1 flex gap-2 md:justify-end">
              <button
                onClick={() => guardarEdicion(editRow)}
                disabled={guardando}
                className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3 text-base"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={cancelarEdicion}
                className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl px-4 py-3 text-base"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alta */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-medium mb-3">Crear nueva</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_160px_auto] gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Ej: VÓLEY"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Importe ($) <span className="text-gray-400">(ej: 2500)</span>
            </label>
            <input
              inputMode="decimal"
              className="border rounded-lg px-3 py-2 text-sm w-full text-right"
              placeholder="2500"
              value={precio}
              onKeyDown={blockNonNumericKeys}
              onChange={(e) => setPrecio(sanitizeMoney(e.target.value))}
              onBlur={(e) => setPrecio(toFixed2Str(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Estado</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-full"
              value={estado}
              onChange={(e) =>
                setEstado(e.target.value as "activa" | "inactiva")
              }
            >
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={onCrear}
              disabled={guardando}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 w-full"
            >
              {guardando ? "Guardando..." : "Crear"}
            </button>
          </div>
        </div>
        {mensaje && (
          <div
            className={`mt-2 text-sm ${
              mensaje.tipo === "ok" ? "text-green-700" : "text-red-700"
            }`}
          >
            {mensaje.texto}
          </div>
        )}
      </div>

      {/* Listado */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">
          Total: {lista.length} · Activas: {totalActivas}
        </div>
        <button
          onClick={cargar}
          className="px-3 py-1 rounded-lg border hover:bg-gray-50"
        >
          Recargar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-right p-3">Importe actual</th>
              <th className="text-right p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : lista.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Sin disciplinas
                </td>
              </tr>
            ) : (
              lista.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3">{d.nombre}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        d.estado === "activa"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {d.estado}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    ${Number(d.precio_actual).toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => abrirEdicion(d)}
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


