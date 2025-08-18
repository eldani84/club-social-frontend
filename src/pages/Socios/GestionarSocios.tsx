// src/pages/Socios/GestionarSocios.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../../styles/ModernUI.css";

const API = import.meta.env.VITE_API_URL;

interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  dni: string | null;
  email: string | null;
  instagram: string | null;
  telefono: string | null;
  localidad: string | null;
  provincia: string | null;
  direccion: string | null;
  ocupacion: string | null;
  observaciones: string | null;
  foto_url: string | null;
  nro_carnet: string | null;
  fecha_nacimiento: string | null; // YYYY-MM-DD
  fecha_alta: string | null;       // YYYY-MM-DD
  estado: "activo" | "baja" | string;
  grupo_familiar_id: number | null;
  categoria_id: number | null;
  es_titular: boolean;
  forma_pago_id: number | null;    // NOT NULL en BD -> validamos
  clave: string | null;
  email_recuperacion: string | null;
}

interface Categoria { id: number; nombre: string; }
interface FormaPago { id: number; forma_de_pago: string; }

type PaginadoResp = {
  rows: Socio[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export default function GestionarSocios() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Socio>>({});

  // Filtros UI
  const [busqueda, setBusqueda] = useState("");
  const [filtroMesNacimiento, setFiltroMesNacimiento] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTitular, setFiltroTitular] = useState("");
  const [filtroFormaPago, setFiltroFormaPago] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

  // Refs para UX
  const apellidoInputRef = useRef<HTMLInputElement>(null);
  const editRowRef = useRef<HTMLTableRowElement>(null);

  // Helpers
  const toIntOrNull = (v: any): number | null => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const normFecha = (v?: string | null): string | "" => {
    if (!v) return "";
    const s = String(v).slice(0, 10);
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const [_, d, mm, yyyy] = m;
      return `${yyyy}-${mm.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return s;
  };

  const todayISO = (): string => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  };

  // Carga combos
  useEffect(() => {
    fetch(`${API}/categorias`).then((res) => res.json()).then(setCategorias);
    fetch(`${API}/formas_pago`).then((res) => res.json()).then(setFormasPago);
  }, [API]);

  // Armado de query server-side con filtros y paginación
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));

    if (busqueda.trim()) p.set("search", busqueda.trim());
    if (filtroMesNacimiento.trim()) p.set("mes_nac", filtroMesNacimiento.trim()); // 01..12
    if (filtroEstado) p.set("estado", filtroEstado);
    if (filtroCategoria) p.set("categoria_id", filtroCategoria);
    if (filtroTitular) p.set("titular", filtroTitular); // "true"/"false"
    if (filtroFormaPago) p.set("forma_pago_id", filtroFormaPago);

    // Orden por defecto: Apellido, Nombre
    p.set("orderBy", "apellido");
    p.set("orderDir", "asc");

    return p.toString();
  }, [
    page,
    pageSize,
    busqueda,
    filtroMesNacimiento,
    filtroEstado,
    filtroCategoria,
    filtroTitular,
    filtroFormaPago,
  ]);

  // Cargar página (append si page>1)
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetch(`${API}/socios/paginar?${queryString}`)
      .then((r) => r.json())
      .then((json: PaginadoResp) => {
        if (cancel) return;
        if (page === 1) setSocios(json.rows);
        else setSocios((prev) => [...prev, ...json.rows]);
        setTotal(json.total);
        setHasMore(json.hasMore);
      })
      .catch(() => {})
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [API, queryString, page]);

  // Cambio de filtros => reinicia a página 1
  function aplicarFiltros() {
    setEditandoId(null);
    setForm({});
    setPage(1);
  }

  // Change control
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const updatedValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: updatedValue }));
  };

  // Iniciar edición
  const handleEdit = (socio: Socio) => {
    setEditandoId(socio.id);
    setForm({
      ...socio,
      fecha_nacimiento: normFecha(socio.fecha_nacimiento),
      fecha_alta: normFecha(socio.fecha_alta),
      grupo_familiar_id: socio.grupo_familiar_id ?? null,
      categoria_id: socio.categoria_id ?? null,
      forma_pago_id: socio.forma_pago_id ?? null,
    });
  };

  // Scroll a la fila en edición y foco en "Apellido"
  useEffect(() => {
    if (!editandoId) return;
    requestAnimationFrame(() => {
      if (editRowRef.current) {
        editRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setTimeout(() => {
        if (apellidoInputRef.current) {
          apellidoInputRef.current.focus();
          apellidoInputRef.current.select();
        }
      }, 200);
    });
  }, [editandoId]);

  // Guardar
  const handleGuardar = async () => {
    if (!editandoId) return;
    const original = socios.find((s) => s.id === editandoId);
    if (!original) return;

    const nuevoEstado = String(form.estado ?? original.estado).toLowerCase().trim();
    const estadoValido =
      nuevoEstado === "activo" || nuevoEstado === "baja"
        ? (nuevoEstado as "activo" | "baja")
        : (original.estado as "activo" | "baja");

    let nuevaFechaAlta = normFecha(form.fecha_alta ?? original.fecha_alta) || null;
    const cambioDeBajaAActivo = original.estado === "baja" && estadoValido === "activo";
    if (cambioDeBajaAActivo) {
      nuevaFechaAlta = todayISO();
    }

    const merged: Socio = {
      ...original,
      ...form,
      categoria_id: toIntOrNull(form.categoria_id ?? original.categoria_id),
      forma_pago_id: toIntOrNull(form.forma_pago_id ?? original.forma_pago_id),
      grupo_familiar_id: toIntOrNull(form.grupo_familiar_id ?? original.grupo_familiar_id),
      es_titular: typeof form.es_titular === "boolean" ? form.es_titular : original.es_titular,

      nombre: String(form.nombre ?? original.nombre).toUpperCase().trim(),
      apellido: String(form.apellido ?? original.apellido).toUpperCase().trim(),
      dni: (form.dni ?? original.dni ?? "") as string,
      email: (form.email ?? original.email ?? "") as string,
      instagram: (form.instagram ?? original.instagram ?? "") as string,
      telefono: String((form.telefono ?? original.telefono) || "").toUpperCase().trim(),

      localidad: (form.localidad ?? original.localidad ?? "") as string,
      provincia: (form.provincia ?? original.provincia ?? "") as string,
      direccion: (form.direccion ?? original.direccion ?? "") as string,
      ocupacion: (form.ocupacion ?? original.ocupacion ?? "") as string,
      observaciones: (form.observaciones ?? original.observaciones ?? "") as string,
      foto_url: (form.foto_url ?? original.foto_url ?? "") as string,
      nro_carnet: (form.nro_carnet ?? original.nro_carnet ?? "") as string,

      fecha_nacimiento: (normFecha(form.fecha_nacimiento ?? original.fecha_nacimiento) || null) as any,
      fecha_alta: (nuevaFechaAlta as any),
      estado: estadoValido,

      clave: (form.clave ?? original.clave ?? "") as string,
      email_recuperacion: (form.email_recuperacion ?? original.email_recuperacion ?? "") as string,
    };

    if (merged.forma_pago_id === null || merged.forma_pago_id === undefined) {
      alert("La forma de pago es obligatoria.");
      return;
    }

    try {
      const res = await fetch(`${API}/socios/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Error al actualizar socio");
      }
      alert("Socio actualizado correctamente");
      setEditandoId(null);
      setForm({});
      // Refrescar página 1 con los filtros vigentes
      setPage(1);
    } catch (err: any) {
      alert("Error al actualizar socio: " + (err?.message || err));
    }
  };

  const handleCancelar = () => {
    setEditandoId(null);
    setForm({});
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Deseas eliminar este socio?")) return;
    try {
      const res = await fetch(`${API}/socios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar socio");
      alert("Socio eliminado correctamente");
      // Refrescar desde página 1 con filtros
      setPage(1);
    } catch (err) {
      alert("Error eliminando socio: " + err);
    }
  };

  // Exportar lo visible (filtrado/paginado actual)
  const exportarExcel = () => {
    const data = socios.map((s) => ({
      "N° Socio": s.id,
      "Apellido Nombre": `${s.apellido} ${s.nombre}`,
      DNI: s.dni || "",
      Email: s.email || "",
      Instagram: s.instagram || "",
      Teléfono: s.telefono || "",
      "Fecha Nacimiento": s.fecha_nacimiento?.slice(0, 10) || "",
      Estado: s.estado,
      "Forma de Cobro":
        formasPago.find((f) => String(f.id) === String(s.forma_pago_id ?? ""))?.forma_de_pago || "-",
    }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Socios");
    writeFile(wb, "socios.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const columns = [
      "N° Socio","Apellido Nombre","DNI","Email","Instagram","Teléfono","Fecha Nacimiento","Estado","Forma de Cobro"
    ];
    const rows = socios.map((s) => [
      s.id,
      `${s.apellido} ${s.nombre}`,
      s.dni || "",
      s.email || "",
      s.instagram || "",
      s.telefono || "",
      s.fecha_nacimiento?.slice(0, 10) || "",
      s.estado,
      formasPago.find((f) => String(f.id) === String(s.forma_pago_id ?? ""))?.forma_de_pago || "-",
    ]);
    autoTable(doc, { head: [columns], body: rows, margin: { top: 20 }, styles: { fontSize: 8 } });
    doc.save("socios.pdf");
  };

  return (
    <div className="gestionar-socios max-w-[100vw] mx-auto p-2 md:p-6">
      <h2 className="form-section-title">Gestión de Socios</h2>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-4 items-end text-xs mb-4">
        <label className="flex flex-col">
          Buscar:
          <input
            type="text"
            value={busqueda}
            placeholder="Nombre, Apellido o DNI"
            onChange={(e) => setBusqueda(e.target.value)}
            className="border px-2 py-1 text-xs"
          />
        </label>
        <label className="flex flex-col">
          Mes cumpleaños:
          <input
            type="text"
            maxLength={2}
            placeholder="Ej: 05"
            value={filtroMesNacimiento}
            onChange={(e) => setFiltroMesNacimiento(e.target.value)}
            className="border px-2 py-1 text-xs"
          />
        </label>
        <label className="flex flex-col">
          Estado:
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border px-2 py-1 text-xs"
          >
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="baja">Baja</option>
          </select>
        </label>
        <label className="flex flex-col">
          Categoría:
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="border px-2 py-1 text-xs"
          >
            <option value="">Todas</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>{cat.nombre}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          ¿Titular?:
          <select
            value={filtroTitular}
            onChange={(e) => setFiltroTitular(e.target.value)}
            className="border px-2 py-1 text-xs"
          >
            <option value="">Todos</option>
            <option value="true">Titular</option>
            <option value="false">No titular</option>
          </select>
        </label>
        <label className="flex flex-col">
          Forma de pago:
          <select
            value={filtroFormaPago}
            onChange={(e) => setFiltroFormaPago(e.target.value)}
            className="border px-2 py-1 text-xs"
          >
            <option value="">Todas</option>
            {formasPago.map((fp) => (
              <option key={fp.id} value={String(fp.id)}>{fp.forma_de_pago}</option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button onClick={aplicarFiltros} className="btn-icon text-sm" title="Aplicar filtros">🔎 Aplicar</button>
          <button onClick={exportarExcel} className="btn-icon text-sm" title="Exportar Excel">📤 Excel</button>
          <button onClick={exportarPDF} className="btn-icon text-sm" title="Exportar PDF">📄 PDF</button>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="flex gap-4 bg-white p-3 rounded-xl shadow-sm text-xs mb-2">
        <div><strong>Total filtrado:</strong> {total}</div>
        <div><strong>Cargados en pantalla:</strong> {socios.length}</div>
      </div>

      {/* TABLA */}
      <table className="modern-table mt-2 text-xs">
        <thead>
          <tr>
            <th>N°</th>
            <th>Apellido</th>
            <th>Nombre</th>
            <th>DNI</th>
            <th>Email</th>
            <th>Instagram</th>
            <th>Teléfono</th>
            <th>Localidad</th>
            <th>Provincia</th>
            <th>Dirección</th>
            <th>Ocupación</th>
            <th>Observaciones</th>
            <th>Foto URL</th>
            <th>N° Carnet</th>
            <th>Nacimiento</th>
            <th>Fecha Alta</th>
            <th>Estado</th>
            <th>Forma Cobro</th>
            <th>Categoría</th>
            <th>Titular</th>
            <th>Grupo Fliar</th>
            <th>Email Recuperación</th>
            <th>Clave</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {socios.map((s) => {
            const editando = editandoId === s.id;
            return (
              <tr
                key={s.id}
                className={editando ? "row-editing" : ""}
                ref={editando ? editRowRef : undefined}
              >
                {editando ? (
                  <>
                    <td>{s.id}</td>
                    <td>
                      <input
                        ref={apellidoInputRef}
                        name="apellido"
                        className="input-cell w-full"
                        value={form.apellido ?? s.apellido ?? ""}
                        onChange={handleChange}
                      />
                    </td>
                    <td><input name="nombre" className="input-cell w-full" value={form.nombre ?? s.nombre ?? ""} onChange={handleChange} /></td>
                    <td><input name="dni" className="input-cell w-full" value={form.dni ?? s.dni ?? ""} onChange={handleChange} /></td>
                    <td><input name="email" className="input-cell w-full" value={form.email ?? s.email ?? ""} onChange={handleChange} /></td>
                    <td><input name="instagram" className="input-cell w-full" value={form.instagram ?? s.instagram ?? ""} onChange={handleChange} /></td>
                    <td><input name="telefono" className="input-cell w-full" value={form.telefono ?? s.telefono ?? ""} onChange={handleChange} /></td>
                    <td><input name="localidad" className="input-cell w-full" value={form.localidad ?? s.localidad ?? ""} onChange={handleChange} /></td>
                    <td><input name="provincia" className="input-cell w-full" value={form.provincia ?? s.provincia ?? ""} onChange={handleChange} /></td>
                    <td><input name="direccion" className="input-cell w-full" value={form.direccion ?? s.direccion ?? ""} onChange={handleChange} /></td>
                    <td><input name="ocupacion" className="input-cell w-full" value={form.ocupacion ?? s.ocupacion ?? ""} onChange={handleChange} /></td>
                    <td>
                      <textarea name="observaciones" className="input-cell w-full" rows={2} value={form.observaciones ?? s.observaciones ?? ""} onChange={handleChange} />
                    </td>
                    <td><input name="foto_url" className="input-cell w-full" value={form.foto_url ?? s.foto_url ?? ""} onChange={handleChange} /></td>
                    <td><input name="nro_carnet" className="input-cell w-full" value={form.nro_carnet ?? s.nro_carnet ?? ""} onChange={handleChange} /></td>
                    <td>
                      <input type="date" name="fecha_nacimiento" className="input-cell w-full"
                        value={normFecha(form.fecha_nacimiento ?? s.fecha_nacimiento)} onChange={handleChange} />
                    </td>
                    <td>
                      <input type="date" name="fecha_alta" className="input-cell w-full"
                        value={normFecha(form.fecha_alta ?? s.fecha_alta) || todayISO()} onChange={handleChange} />
                    </td>
                    <td>
                      <select name="estado" className="input-cell w-full"
                        value={(form.estado ?? s.estado ?? "activo").toString()}
                        onChange={handleChange}>
                        <option value="activo">Activo</option>
                        <option value="baja">Baja</option>
                      </select>
                    </td>
                    <td>
                      <select name="forma_pago_id" className="input-cell w-full"
                        value={String(form.forma_pago_id ?? s.forma_pago_id ?? "")} onChange={handleChange}>
                        <option value="">Seleccione</option>
                        {formasPago.map((fp) => (
                          <option key={fp.id} value={String(fp.id)}>{fp.forma_de_pago}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select name="categoria_id" className="input-cell w-full"
                        value={String(form.categoria_id ?? s.categoria_id ?? "")} onChange={handleChange}>
                        <option value="">Sin categoría</option>
                        {categorias.map((cat) => (
                          <option key={cat.id} value={String(cat.id)}>{cat.nombre}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-center">
                      <input type="checkbox" name="es_titular"
                        checked={Boolean(form.es_titular ?? s.es_titular)} onChange={handleChange} />
                    </td>
                    <td>
                      <input name="grupo_familiar_id" className="input-cell w-full"
                        value={String(form.grupo_familiar_id ?? s.grupo_familiar_id ?? "")}
                        onChange={handleChange} placeholder="ID" />
                    </td>
                    <td><input name="email_recuperacion" className="input-cell w-full" value={form.email_recuperacion ?? s.email_recuperacion ?? ""} onChange={handleChange} /></td>
                    <td><input name="clave" className="input-cell w-full" value={form.clave ?? s.clave ?? ""} onChange={handleChange} /></td>
                    <td>
                      <button onClick={handleGuardar} title="Guardar" className="btn-icon">💾</button>
                      <button onClick={handleCancelar} className="btn-icon">✖</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{s.id}</td>
                    <td>{s.apellido}</td>
                    <td>{s.nombre}</td>
                    <td>{s.dni}</td>
                    <td>{s.email}</td>
                    <td>{s.instagram}</td>
                    <td>{s.telefono}</td>
                    <td>{s.localidad}</td>
                    <td>{s.provincia}</td>
                    <td>{s.direccion}</td>
                    <td>{s.ocupacion}</td>
                    <td>{s.observaciones?.slice(0, 40) || ""}{s.observaciones && s.observaciones.length > 40 ? "…" : ""}</td>
                    <td>{s.foto_url}</td>
                    <td>{s.nro_carnet}</td>
                    <td>{s.fecha_nacimiento?.slice(0, 10)}</td>
                    <td>{s.fecha_alta?.slice(0, 10)}</td>
                    <td>{s.estado}</td>
                    <td>{formasPago.find((f) => String(f.id) === String(s.forma_pago_id ?? ""))?.forma_de_pago || "-"}</td>
                    <td>{categorias.find((c) => String(c.id) === String(s.categoria_id ?? ""))?.nombre || "-"}</td>
                    <td className="text-center">{s.es_titular ? "Sí" : "No"}</td>
                    <td>{s.grupo_familiar_id ?? "-"}</td>
                    <td>{s.email_recuperacion || ""}</td>
                    <td>{s.clave ? "********" : ""}</td>
                    <td>
                      <button onClick={() => handleEdit(s)} className="btn-icon" title="Editar">✏️</button>
                      <button onClick={() => handleEliminar(s.id)} className="btn-icon" title="Eliminar">🗑️</button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Paginación */}
      <div className="flex gap-8 items-center mt-3 text-sm">
        <div>Mostrando {socios.length} de {total}</div>
        {hasMore ? (
          <button disabled={loading} onClick={() => setPage(p => p + 1)} className="btn">
            {loading ? "Cargando..." : "Cargar más"}
          </button>
        ) : (
          <span className="opacity-70">No hay más resultados</span>
        )}
      </div>
    </div>
  );
}
