import { useState, useEffect } from "react";
import { usePrompt } from "../hooks/usePrompt";

export default function Socios() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    instagram: "",
    telefono: "",
    fecha_nacimiento: "",
    estado: "habilitado",
    grupo_familiar_id: "",
    categoria_id: "",
    es_titular: true,
  });

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [categorias, setCategorias] = useState([]);
  const [socios, setSocios] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/categorias")
      .then((res) => res.json())
      .then((data) => setCategorias(data))
      .catch((err) => console.error("Error al cargar categorías", err));
  }, []);

  const fetchSocios = async () => {
    try {
      const res = await fetch("http://localhost:3000/socios");
      const data = await res.json();
      setSocios(data);
    } catch (err) {
      console.error("Error al cargar socios", err);
    }
  };

  useEffect(() => {
    fetchSocios();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validarFormulario = () => {
    if (!form.nombre || !form.apellido || !form.dni || !form.email) {
      alert("Todos los campos son obligatorios.");
      return false;
    }
    if (!/^\d+$/.test(form.dni)) {
      alert("El DNI debe contener solo números.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      alert("El correo electrónico no es válido.");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      apellido: "",
      dni: "",
      email: "",
      instagram: "",
      telefono: "",
      fecha_nacimiento: "",
      estado: "habilitado",
      grupo_familiar_id: "",
      categoria_id: "",
      es_titular: true,
    });
    setEditandoId(null);
  };

  const hayCambiosPendientes = () => {
    return editandoId !== null;
  };

  const confirmarDescarte = (continuar: () => void) => {
    if (hayCambiosPendientes()) {
      const confirmar = window.confirm("Tienes cambios sin guardar. ¿Deseas descartarlos?");
      if (!confirmar) return;
      resetForm();
    }
    continuar();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const url = editandoId
      ? `http://localhost:3000/socios/${editandoId}`
      : "http://localhost:3000/socios";

    const method = editandoId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          grupo_familiar_id: form.grupo_familiar_id || null,
          categoria_id: parseInt(form.categoria_id),
        }),
      });

      if (!res.ok) throw new Error(editandoId ? "Error al actualizar socio" : "Error al registrar socio");

      alert(editandoId ? "Socio actualizado correctamente" : "Socio registrado correctamente");
      resetForm();
      fetchSocios();
    } catch (err) {
      alert("Error: " + err);
    }
  };

  const eliminarSocio = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este socio?")) return;
    try {
      const res = await fetch(`http://localhost:3000/socios/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("No se pudo eliminar el socio");

      alert("Socio eliminado correctamente");
      fetchSocios();
    } catch (err) {
      alert("Error eliminando socio: " + err);
    }
  };

  // ⛔ Interceptar navegación
  usePrompt(editandoId !== null, "Tienes cambios sin guardar. ¿Estás seguro que deseas salir?");

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Agregar Nuevo Socio</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} className="border p-2 rounded" />
        <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} className="border p-2 rounded" />
        <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} className="border p-2 rounded" />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="border p-2 rounded" />
        <input name="instagram" placeholder="Instagram" value={form.instagram} onChange={handleChange} className="border p-2 rounded" />
        <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} className="border p-2 rounded" />
        <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} className="border p-2 rounded" />

        <select name="estado" value={form.estado} onChange={handleChange} className="border p-2 rounded">
          <option value="activo">Activo</option>
          <option value="baja">Baja</option>
        </select>

        <input name="grupo_familiar_id" placeholder="ID Grupo Familiar (opcional)" value={form.grupo_familiar_id} onChange={handleChange} className="border p-2 rounded" />

        <select name="categoria_id" value={form.categoria_id} onChange={handleChange} className="border p-2 rounded" required>
          <option value="">Seleccione una categoría</option>
          {categorias.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        <label className="col-span-2 flex items-center space-x-2">
          <input type="checkbox" name="es_titular" checked={form.es_titular} onChange={handleChange} />
          <span>¿Es titular del grupo familiar?</span>
        </label>

        <button type="submit" className="col-span-2 bg-blue-600 text-white py-2 px-4 rounded">
          {editandoId ? "Actualizar" : "Registrar"}
        </button>
      </form>

      <h3 className="text-xl font-semibold mt-8 mb-2">Socios registrados</h3>
      <ul className="border rounded p-4 space-y-2 max-h-96 overflow-y-auto">
        {socios.length === 0 ? (
          <li>No hay socios registrados.</li>
        ) : (
          socios.map((s: any) => (
            <li key={s.id} className="border-b pb-2 flex justify-between items-center">
              <span>{s.apellido}, {s.nombre} – DNI: {s.dni}</span>
              <div className="space-x-2">
                <button onClick={() => eliminarSocio(s.id)} className="text-red-600 hover:underline">Eliminar</button>
                <button
                  onClick={() =>
                    confirmarDescarte(() => {
                      setEditandoId(s.id);
                      setForm({
                        ...s,
                        estado: String(s.estado),
                        categoria_id: String(s.categoria_id),
                        fecha_nacimiento: s.fecha_nacimiento ? s.fecha_nacimiento.slice(0, 10) : "",
                      });
                    })
                  }
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
