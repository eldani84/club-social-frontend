// C:\Users\Daniel\Documents\VCC CURSO\club-social-frontend\src\pages\GrupoFamiliar\CrearGrupoFamiliar.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  grupo_familiar_id?: number | null;
};

export default function CrearGrupoFamiliar() {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Socio[]>([]);
  const [idTitular, setIdTitular] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorBusq, setErrorBusq] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL;
  const acRef = useRef<AbortController | null>(null);

  // Autocomplete: consulta al backend (tokenizado apellido nombre dni)
  useEffect(() => {
    const q = busqueda.trim();
    setErrorBusq(null);

    // limpiar resultados si menos de 2 caracteres
    if (q.length < 2) {
      setResultados([]);
      if (acRef.current) acRef.current.abort();
      return;
    }

    // debounce 300ms
    const t = setTimeout(() => {
      if (acRef.current) acRef.current.abort();
      const ac = new AbortController();
      acRef.current = ac;
      setLoading(true);

      fetch(`${API}/socios/buscar?busqueda=${encodeURIComponent(q)}`, {
        signal: ac.signal,
      })
        .then(async (r) => {
          if (!r.ok) throw new Error(await r.text().catch(() => "Error"));
          return r.json();
        })
        .then((rows: Socio[]) => {
          // filtrar los que ya están seleccionados
          const yaIds = new Set(seleccionados.map((s) => s.id));
          setResultados(rows.filter((r) => !yaIds.has(r.id)));
        })
        .catch((e) => {
          if (e.name !== "AbortError") setErrorBusq("Error buscando socios");
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(t);
  }, [busqueda, API, seleccionados]);

  const agregarSocio = (socio: Socio) => {
    setSeleccionados((prev) => [...prev, socio]);
    setBusqueda("");
    setResultados([]);
  };

  const quitarSocio = (id: number) => {
    setSeleccionados((prev) => prev.filter((s) => s.id !== id));
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
      if (res.ok && data?.success) {
        setMensaje("¡Grupo familiar creado exitosamente!");
        setSeleccionados([]);
        setIdTitular(null);
      } else {
        setMensaje(data?.error || "Error al crear el grupo.");
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
          placeholder='Ej: "eberhardt d"'
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          autoComplete="off"
          style={{ width: 320 }}
        />
        {(loading || resultados.length > 0 || errorBusq || busqueda.trim().length >= 2) && (
          <ul
            style={{
              border: "1.5px solid #b91c1c88",
              position: "absolute",
              zIndex: 30,
              background: "#fff",
              width: 360,
              maxHeight: 220,
              overflowY: "auto",
              paddingLeft: 0,
              marginTop: 2,
              borderRadius: 8,
              listStyle: "none",
              boxShadow: "0 4px 12px #b91c1c15",
            }}
          >
            {loading && (
              <li style={{ padding: "8px 12px" }}>Buscando…</li>
            )}
            {!loading && errorBusq && (
              <li style={{ padding: "8px 12px", color: "#b91c1c" }}>{errorBusq}</li>
            )}
            {!loading && !errorBusq && resultados.length === 0 && busqueda.trim().length >= 2 && (
              <li style={{ padding: "8px 12px", opacity: 0.7 }}>Sin resultados</li>
            )}
            {!loading &&
              !errorBusq &&
              resultados.map((s) => (
                <li
                  key={s.id}
                  style={{
                    cursor: "pointer",
                    padding: "6px 12px",
                    borderBottom: "1px solid #eee",
                    borderRadius: 6,
                  }}
                  onClick={() => agregarSocio(s)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <b>
                    {s.apellido} {s.nombre}
                  </b>{" "}
                  — DNI: {s.dni}
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
                <th>Apellido</th>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Titular</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {seleccionados.map((s) => (
                <tr key={s.id}>
                  <td>{s.apellido}</td>
                  <td>{s.nombre}</td>
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
                    <button
                      type="button"
                      onClick={() => quitarSocio(s.id)}
                      className="btn-icon"
                    >
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

      <button
        type="submit"
        className="btn-primary mt-4"
        disabled={seleccionados.length < 2 || !idTitular}
      >
        Crear Grupo
      </button>

      {mensaje && (
        <div
          className="mt-2"
          style={{
            color: mensaje.startsWith("¡") ? "#007e00" : "#b91c1c",
            fontWeight: 500,
          }}
        >
          {mensaje}
        </div>
      )}
    </form>
  );
}
