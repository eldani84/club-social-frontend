import { useState, useEffect } from "react";
import axios from "axios";

interface Disciplina {
  id: number;
  nombre: string;
}

export default function CrearUsuario() {
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("admin");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (rol === "profesor") {
      axios
        .get<Disciplina[]>("http://localhost:3000/api/disciplinas")
        .then((res) => setDisciplinas(res.data))
        .catch((err) => console.error("Error al cargar disciplinas", err));
    }
  }, [rol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");

    try {
      await axios.post("http://localhost:3000/api/usuarios", {
        nombre,
        usuario,
        password,
        rol,
        disciplina_id: rol === "profesor" ? disciplinaId : null,
      });

      setMensaje("Usuario creado correctamente");
      setNombre("");
      setUsuario("");
      setPassword("");
      setRol("admin");
      setDisciplinaId("");
        } catch (err: any) {
        console.error("Detalle del error:", err.response);
        setMensaje(err.response?.data?.error || "Error al crear usuario");
        }
  };

  return (
    <div className="flex justify-center items-start p-8 bg-gray-100 min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-lg font-semibold text-red-700 mb-4">
          Crear Usuario
        </h2>

        {mensaje && (
          <div className="mb-4 text-sm text-green-600 bg-green-100 p-2 rounded">
            {mensaje}
          </div>
        )}

        <label className="block mb-2 text-sm">
          Nombre completo:
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 border rounded text-sm mt-1"
            required
          />
        </label>

        <label className="block mb-2 text-sm">
          Usuario:
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full p-2 border rounded text-sm mt-1"
            required
          />
        </label>

        <label className="block mb-2 text-sm">
          Contraseña:
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded text-sm mt-1"
            required
          />
        </label>

        <label className="block mb-2 text-sm">
          Rol:
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="w-full p-2 border rounded text-sm mt-1"
          >
            <option value="admin">Administrador</option>
            <option value="profesor">Profesor</option>
          </select>
        </label>

        {rol === "profesor" && (
          <label className="block mb-4 text-sm">
            Disciplina:
            <select
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              className="w-full p-2 border rounded text-sm mt-1"
              required
            >
              <option value="">Seleccionar</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="submit"
          className="w-full bg-red-700 text-white py-2 rounded hover:bg-red-800 text-sm"
        >
          Crear Usuario
        </button>
      </form>
    </div>
  );
}
