import React, { useState, useEffect } from "react";

type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
};

export default function CrearGrupoFamiliar() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Socio[]>([]);
  const [seleccionados, setSeleccionados] = useState<Socio[]>([]);
  const [idTitular, setIdTitular] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API}/socios`)
      .then((res) => res.json())
      .then(setSocios)
      .catch(() => setMensaje("Error al obtener socios."));
  }, []);

  useEffect(() => {
    if (query.trim() === "") {
      setResultados([]);
      return;
    }
    const q = query.toLowerCase();
    setResultados(
      socios
        .filter(
          (s) =>
            s.nombre.toLowerCase().includes(q) ||
            s.apellido.toLowerCase().includes(q) ||
            (s.dni && s.dni.includes(q))
        )
        .filter((s) => !seleccionados.some((sel) => sel.id === s.id))
    );
  }, [query, socios, seleccionados]);

  const agregarSocio = (socio: Socio) => {
    setSeleccionados([...seleccionados, socio]);
    setQuery("");
    setResultados([]);
  };

  const quitarSocio = (id: number) => {
    setSeleccionados(seleccionados.filter((s) => s.id !== id));
    if (idTitular === id) setIdTitular(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seleccionados.length < 2) {
      setMensaje("Agregá al menos dos integrantes.");
      return;
    }
    if (!idTitular) {
      setMensaje("Seleccioná un titular.");
      return;
    }
    setMensaje(null);
    try {
      const res = await fetch(`${API}/grupos/crear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_titular: idTitular,
          integrantes: seleccionados.map((s) => s.id),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje("¡Grupo familiar creado exitosamente!");
        setSeleccionados([]);
        setIdTitular(null);
      } else {
        setMensaje(data.error || "Error al crear el grupo.");
      }
    } catch {
      setMensaje("Error de red al crear grupo.");
    }
  };

  return (
    <form className="form-modern" onSubmit={handleSubmit}>
      <div className="form-section-title">Crear Grupo Familiar</div>

      <label>Buscar socio (nombre, apellido o DNI):</label>
      <div style={{ position: "relative" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: Juampi, Donnet, 30123123..."
          autoComplete="off"
        />
        {resultados.length > 0 && (
          <ul
            className="dropdown-results"
            style={{
              position: "absolute",
              top: "100%",
              zIndex: 50,
              width: "100%",
            }}
          >
            {resultados.map((s) => (
              <li key={s.id} onMouseDown={(e) => e.preventDefault()} onClick={() => agregarSocio(s)}>
                {s.nombre} {s.apellido} ({s.dni})
              </li>
            ))}
          </ul>
        )}
      </div>

      {seleccionados.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>DNI</th>
                <th>Titular</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {seleccionados.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombre}</td>
                  <td>{s.apellido}</td>
                  <td>{s.dni}</td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="radio"
                      name="titular"
                      checked={idTitular === s.id}
                      onChange={() => setIdTitular(s.id)}
                      style={{ accentColor: "#b91c1c" }}
                    />
                  </td>
                  <td>
                    <button type="button" onClick={() => quitarSocio(s.id)} className="btn-icon">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <small className="text-xs mt-1 block">
            Elegí un solo titular con el círculo.
          </small>
        </div>
      )}

      <button type="submit" className="btn-primary mt-4" disabled={seleccionados.length < 2 || !idTitular}>
        Crear Grupo
      </button>

      {mensaje && (
        <div className="mt-2" style={{ color: mensaje.startsWith("¡") ? "#007e00" : "#b91c1c", fontWeight: 500 }}>
          {mensaje}
        </div>
      )}
    </form>
  );
}
