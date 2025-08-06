import React, { useState, useEffect } from "react";

type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  grupo_familiar_id?: number | null;
};

export default function CrearGrupoFamiliar() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [busqueda, setBusqueda] = useState("");
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
    const valor = busqueda.trim().toLowerCase();
    if (valor.length < 2) {
      setResultados([]);
      return;
    }
    setResultados(
      socios
        .filter(
          (s) =>
            s.nombre.toLowerCase().includes(valor) ||
            s.apellido.toLowerCase().includes(valor) ||
            s.dni.toLowerCase().includes(valor) ||
            (`${s.nombre} ${s.apellido}`).toLowerCase().includes(valor)
        )
        .filter((s) => !seleccionados.some((sel) => sel.id === s.id))
    );
  }, [busqueda, socios, seleccionados]);

  const agregarSocio = (socio: Socio) => {
    setSeleccionados([...seleccionados, socio]);
    setBusqueda("");
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

      <label>Buscar socio (DNI, nombre o apellido):</label>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          autoComplete="off"
          style={{ width: 260 }}
        />
        {resultados.length > 0 && (
          <ul
            style={{
              border: "1.5px solid #b91c1c88",
              position: "absolute",
              zIndex: 30,
              background: "#fff",
              width: 320,
              maxHeight: 150,
              overflowY: "auto",
              paddingLeft: 0,
              marginTop: 2,
              borderRadius: 8,
              listStyle: "none",
              boxShadow: "0 4px 12px #b91c1c15"
            }}
          >
            {resultados.map((s) => (
              <li
                key={s.id}
                style={{
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderBottom: "1px solid #eee",
                  borderRadius: 6
                }}
                onClick={() => agregarSocio(s)}
                onMouseDown={(e) => e.preventDefault()}
              >
                <b>{s.nombre} {s.apellido}</b> — DNI: {s.dni}
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
