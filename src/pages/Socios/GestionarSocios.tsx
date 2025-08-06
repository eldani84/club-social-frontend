import { useEffect, useState } from "react";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../../styles/ModernUI.css";

const API = import.meta.env.VITE_API_URL;

interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  instagram: string;
  telefono: string;
  fecha_nacimiento: string;
  estado: string;
  grupo_familiar_id: string | null;
  categoria_id: string;
  es_titular: boolean;
  forma_pago_id: string | number;
}

interface Categoria {
  id: string;
  nombre: string;
}

interface FormaPago {
  id: string | number;
  forma_de_pago: string;
}

export default function GestionarSocios() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Socio>>({});
  const [busqueda, setBusqueda] = useState("");
  const [filtroMesNacimiento, setFiltroMesNacimiento] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTitular, setFiltroTitular] = useState("");
  const [filtroFormaPago, setFiltroFormaPago] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

  useEffect(() => {
    fetch(`${API}/socios`)
      .then((res) => res.json())
      .then(setSocios);

    fetch(`${API}/categorias`)
      .then((res) => res.json())
      .then(setCategorias);

    fetch(`${API}/formas_pago`)
      .then((res) => res.json())
      .then(setFormasPago);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const updatedValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: updatedValue }));
  };

  const handleEdit = (socio: Socio) => {
    setEditandoId(socio.id);
    setForm({ ...socio });
  };

  const handleGuardar = async () => {
    if (!form || !editandoId) return;
    try {
      const res = await fetch(`${API}/socios/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
          forma_pago_id: form.forma_pago_id ? Number(form.forma_pago_id) : null,
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar socio");
      alert("Socio actualizado correctamente");
      setEditandoId(null);
      setForm({});
      fetch(`${API}/socios`)
        .then((res) => res.json())
        .then(setSocios);
    } catch (err) {
      alert("Error al actualizar socio: " + err);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Deseas eliminar este socio?")) return;
    try {
      const res = await fetch(`${API}/socios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar socio");
      alert("Socio eliminado correctamente");
      fetch(`${API}/socios`)
        .then((res) => res.json())
        .then(setSocios);
    } catch (err) {
      alert("Error eliminando socio: " + err);
    }
  };

  const sociosFiltrados = socios.filter((s) => {
    const cumpleMes = filtroMesNacimiento
      ? s.fecha_nacimiento?.slice(5, 7) === filtroMesNacimiento
      : true;

    return (
      (`${s.nombre} ${s.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.dni.includes(busqueda)) &&
      cumpleMes &&
      (filtroEstado ? s.estado === filtroEstado : true) &&
      (filtroCategoria ? String(s.categoria_id) === filtroCategoria : true) &&
      (filtroFormaPago ? String(s.forma_pago_id) === filtroFormaPago : true) &&
      (filtroTitular ? String(s.es_titular) === filtroTitular : true)
    );
  });

  const exportarExcel = () => {
    const data = sociosFiltrados.map((s) => ({
      "N° Socio": s.id,
      "Apellido Nombre": `${s.apellido} ${s.nombre}`,
      DNI: s.dni,
      Email: s.email,
      Instagram: s.instagram,
      Teléfono: s.telefono,
      "Fecha Nacimiento": s.fecha_nacimiento?.slice(0, 10),
      Estado: s.estado,
      "Forma de Cobro":
        formasPago.find((f) => String(f.id) === String(s.forma_pago_id))?.forma_de_pago || "-",
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Socios");
    writeFile(wb, "socios.xlsx");
  };

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const columns = [
      "N° Socio",
      "Apellido Nombre",
      "DNI",
      "Email",
      "Instagram",
      "Teléfono",
      "Fecha Nacimiento",
      "Estado",
      "Forma de Cobro",
    ];

    const rows = sociosFiltrados.map((s) => [
      s.id,
      `${s.apellido} ${s.nombre}`,
      s.dni,
      s.email,
      s.instagram,
      s.telefono,
      s.fecha_nacimiento?.slice(0, 10),
      s.estado,
      formasPago.find((f) => String(f.id) === String(s.forma_pago_id))?.forma_de_pago || "-",
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      margin: { top: 20 },
      styles: { fontSize: 8 },
    });

    doc.save("socios.pdf");
  };

  return (
    <div className="max-w-[100vw] mx-auto p-2 md:p-6">
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
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
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
              <option key={fp.id} value={fp.id}>{fp.forma_de_pago}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button onClick={exportarExcel} className="btn-icon text-sm" title="Exportar Excel">📤 Excel</button>
          <button onClick={exportarPDF} className="btn-icon text-sm" title="Exportar PDF">📄 PDF</button>
        </div>
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
            <th>Nacimiento</th>
            <th>Estado</th>
            <th>Forma Cobro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sociosFiltrados.map((s) => {
            const editando = editandoId === s.id;
            return (
              <tr key={s.id}>
                {editando ? (
                  <>
                    <td>{s.id}</td>
                    <td><input name="apellido" value={form.apellido || ""} onChange={handleChange} className="input-cell" /></td>
                    <td><input name="nombre" value={form.nombre || ""} onChange={handleChange} className="input-cell" /></td>
                    <td><input name="dni" value={form.dni || ""} onChange={handleChange} className="input-cell" /></td>
                    <td><input name="email" value={form.email || ""} onChange={handleChange} className="input-cell" /></td>
                    <td><input name="instagram" value={form.instagram || ""} onChange={handleChange} className="input-cell" /></td>
                    <td><input name="telefono" value={form.telefono || ""} onChange={handleChange} className="input-cell" /></td>
                    <td><input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento?.slice(0, 10) || ""} onChange={handleChange} className="input-cell" /></td>
                    <td>
                      <select name="estado" value={form.estado || ""} onChange={handleChange} className="input-cell">
                        <option value="activo">Activo</option>
                        <option value="baja">Baja</option>
                      </select>
                    </td>
                    <td>
                      <select name="forma_pago_id" value={form.forma_pago_id || ""} onChange={handleChange} className="input-cell">
                        <option value="">Seleccione</option>
                        {formasPago.map(fp => (
                          <option key={fp.id} value={fp.id}>{fp.forma_de_pago}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button onClick={handleGuardar} title="Guardar" className="btn-icon">💾</button>
                      <button onClick={() => setEditandoId(null)} className="btn-icon">✖</button>
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
                    <td>{s.fecha_nacimiento?.slice(0, 10)}</td>
                    <td>{s.estado}</td>
                    <td>{formasPago.find(f => String(f.id) === String(s.forma_pago_id))?.forma_de_pago || "-"}</td>
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
    </div>
  );
}
