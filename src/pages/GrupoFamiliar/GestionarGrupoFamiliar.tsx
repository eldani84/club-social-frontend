// C:\Users\Daniel\Documents\VCC CURSO\club-social-frontend\src\pages\GrupoFamiliar\GestionarGrupoFamiliar.tsx
import { useEffect, useRef, useState } from "react";
type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  grupo_familiar_id: number | null;
};

type Integrante = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  es_titular: boolean;
};

type Grupo = {
  grupo_id: number;
  id_titular: number;
  titular_nombre: string;
  titular_apellido: string;
  integrantes: Integrante[];
};

export default function GestionarGrupoFamiliar() {
  const [socios, setSocios] = useState<Socio[]>([]); // catálogo base para conocer grupo_familiar_id
  const [busqueda, setBusqueda] = useState("");
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [nuevoSocioBusqueda, setNuevoSocioBusqueda] = useState("");
  const [resultadosAgregar, setResultadosAgregar] = useState<Socio[]>([]);
  const [resultados, setResultados] = useState<Socio[]>([]);

  const [loadingBuscar, setLoadingBuscar] = useState(false);
  const [loadingAgregar, setLoadingAgregar] = useState(false);
  const [errBuscar, setErrBuscar] = useState<string | null>(null);
  const [errAgregar, setErrAgregar] = useState<string | null>(null);

  const API = import.meta.env.VITE_API_URL;
  const acBuscarRef = useRef<AbortController | null>(null);
  const acAgregarRef = useRef<AbortController | null>(null);

  // Carga catálogo base (para saber grupo_familiar_id y poder mostrar "(En grupo)")
  useEffect(() => {
    fetch(`${API}/socios`)
      .then(res => res.json())
      .then(setSocios)
      .catch(() => setMensaje("Error al cargar la lista de socios."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al elegir socio, cargar su grupo (si tiene)
  useEffect(() => {
    if (!socioSeleccionado || !socioSeleccionado.grupo_familiar_id) {
      setGrupo(null);
      return;
    }
    fetch(`${API}/grupos/por-socio/${socioSeleccionado.id}`)
      .then(res => res.json())
      .then(setGrupo)
      .catch(() => setMensaje("Error al cargar el grupo familiar."));
  }, [socioSeleccionado, API]);

  // Helper: enriquece con grupo_familiar_id usando el catálogo local
  const enrichWithGrupo = (rows: Array<Pick<Socio, "id" | "nombre" | "apellido" | "dni">>): Socio[] => {
    const map = new Map(socios.map(s => [s.id, s.grupo_familiar_id]));
    return rows.map(r => ({
      ...r,
      grupo_familiar_id: map.get(r.id) ?? null,
    }));
  };

  // Autocomplete principal (elegir socio): busca en backend tokenizado
  useEffect(() => {
    const q = busqueda.trim();
    setErrBuscar(null);
    if (q.length < 2) {
      setResultados([]);
      if (acBuscarRef.current) acBuscarRef.current.abort();
      return;
    }
    const t = setTimeout(() => {
      if (acBuscarRef.current) acBuscarRef.current.abort();
      const ac = new AbortController();
      acBuscarRef.current = ac;
      setLoadingBuscar(true);
      fetch(`${API}/socios/buscar?busqueda=${encodeURIComponent(q)}`, { signal: ac.signal })
        .then(async r => {
          if (!r.ok) throw new Error(await r.text().catch(() => "Error"));
          return r.json();
        })
        .then((rows: Array<Pick<Socio, "id" | "nombre" | "apellido" | "dni">>) => {
          setResultados(enrichWithGrupo(rows));
        })
        .catch(e => {
          if (e.name !== "AbortError") setErrBuscar("Error buscando socios");
        })
        .finally(() => setLoadingBuscar(false));
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda, API, socios]);

  // Autocomplete "Agregar integrante": busca en backend y filtra fuera los que ya están en grupo o ya son integrantes
  useEffect(() => {
    const q = nuevoSocioBusqueda.trim();
    setErrAgregar(null);
    if (!grupo || q.length < 2) {
      setResultadosAgregar([]);
      if (acAgregarRef.current) acAgregarRef.current.abort();
      return;
    }
    const integrantesIds = new Set(grupo.integrantes.map(i => i.id));
    const t = setTimeout(() => {
      if (acAgregarRef.current) acAgregarRef.current.abort();
      const ac = new AbortController();
      acAgregarRef.current = ac;
      setLoadingAgregar(true);
      fetch(`${API}/socios/buscar?busqueda=${encodeURIComponent(q)}`, { signal: ac.signal })
        .then(async r => {
          if (!r.ok) throw new Error(await r.text().catch(() => "Error"));
          return r.json();
        })
        .then((rows: Array<Pick<Socio, "id" | "nombre" | "apellido" | "dni">>) => {
          const withGrupo = enrichWithGrupo(rows);
          // igual que antes: solo mostrar los que NO tienen grupo y no están ya en este grupo
          setResultadosAgregar(
            withGrupo.filter(s => !s.grupo_familiar_id && !integrantesIds.has(s.id))
          );
        })
        .catch(e => {
          if (e.name !== "AbortError") setErrAgregar("Error buscando socios");
        })
        .finally(() => setLoadingAgregar(false));
    }, 300);
    return () => clearTimeout(t);
  }, [nuevoSocioBusqueda, API, grupo, socios]);

  const handleElegirSocio = (socio: Socio) => {
    setSocioSeleccionado(socio);
    setBusqueda("");
    setResultados([]);
    setMensaje(null);
  };

  const eliminarIntegrante = async (id_socio: number) => {
    if (!grupo) return;
    if (!window.confirm("¿Seguro que deseas quitar este integrante del grupo?")) return;
    const res = await fetch(`${API}/grupos/${grupo.grupo_id}/eliminar-integrante`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_socio })
    });
    const data = await res.json();
    if (data.success) {
      setMensaje("Integrante eliminado con éxito.");
      actualizarGrupoYLista();
    } else {
      setMensaje(data.error || "Error eliminando integrante.");
    }
  };

  const agregarIntegrante = async (socioAgregar: Socio) => {
    if (!grupo) return;
    const res = await fetch(`${API}/grupos/${grupo.grupo_id}/agregar-integrante`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_socio: socioAgregar.id })
    });
    const data = await res.json();
    if (data.success) {
      setMensaje("Integrante agregado con éxito.");
      setNuevoSocioBusqueda("");
      setResultadosAgregar([]);
      actualizarGrupoYLista();
    } else {
      setMensaje(data.error || "Error agregando integrante.");
    }
  };

  const eliminarGrupo = async () => {
    if (!grupo) return;
    if (!window.confirm("¿Seguro que deseas eliminar el grupo completo? Se quitarán todos los integrantes.")) return;
    const res = await fetch(`${API}/grupos/${grupo.grupo_id}/eliminar-grupo`, {
      method: "POST"
    });
    const data = await res.json();
    if (data.success) {
      setMensaje("Grupo eliminado con éxito.");
      setGrupo(null);
      setSocioSeleccionado(null);
      // refresco catálogo base
      fetch(`${API}/socios`).then(res => res.json()).then(setSocios);
    } else {
      setMensaje(data.error || "Error eliminando el grupo.");
    }
  };

  const actualizarGrupoYLista = () => {
    if (!socioSeleccionado) return;
    fetch(`${API}/grupos/por-socio/${socioSeleccionado.id}`)
      .then(res => res.json())
      .then(setGrupo);
    // refresco catálogo base (por si cambió grupo_familiar_id de alguien)
    fetch(`${API}/socios`).then(res => res.json()).then(setSocios);
  };

  return (
    <form className="form-modern" style={{ maxWidth: 950, margin: "auto" }} onSubmit={e => e.preventDefault()}>
      <div className="form-section-title">Gestionar Grupo Familiar</div>

      <label>
        Buscar socio (DNI, nombre o apellido):
        <input
          type="text"
          placeholder='Ej: "eberhardt d"'
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          autoComplete="off"
          style={{ width: 260, marginBottom: 8 }}
        />
        {(loadingBuscar || errBuscar || resultados.length > 0 || busqueda.trim().length >= 2) && (
          <ul style={{
            border: "1.5px solid #b91c1c88",
            position: "absolute",
            zIndex: 30,
            background: "#fff",
            width: 340,
            maxHeight: 180,
            overflowY: "auto",
            paddingLeft: 0,
            marginTop: 2,
            borderRadius: 8,
            listStyle: "none",
            boxShadow: "0 4px 12px #b91c1c15"
          }}>
            {loadingBuscar && <li style={{ padding: "6px 12px" }}>Buscando…</li>}
            {!loadingBuscar && errBuscar && (
              <li style={{ padding: "6px 12px", color: "#b91c1c" }}>{errBuscar}</li>
            )}
            {!loadingBuscar && !errBuscar && resultados.length === 0 && busqueda.trim().length >= 2 && (
              <li style={{ padding: "6px 12px", opacity: 0.7 }}>Sin resultados</li>
            )}
            {!loadingBuscar && !errBuscar && resultados.map(s => (
              <li
                key={s.id}
                style={{
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderBottom: "1px solid #eee",
                  borderRadius: 6
                }}
                onClick={() => handleElegirSocio(s)}
                onMouseDown={e => e.preventDefault()}
              >
                <b>{s.apellido} {s.nombre}</b> — DNI: {s.dni}
                {s.grupo_familiar_id && (
                  <span style={{ color: "#1976d2", marginLeft: 8 }}>(En grupo)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </label>

      {mensaje && (
        <div style={{ color: mensaje.startsWith("Grupo eliminado") ? "#008000" : "#b91c1c", margin: "10px 0" }}>
          {mensaje}
        </div>
      )}

      {socioSeleccionado && (
        <div style={{ marginBottom: 14, fontWeight: 600 }}>
          Socio: {socioSeleccionado.apellido} {socioSeleccionado.nombre} — DNI: {socioSeleccionado.dni}
        </div>
      )}
      {socioSeleccionado && !socioSeleccionado.grupo_familiar_id && (
        <div style={{ color: "#1976d2", marginBottom: 8 }}>NO PERTENECE A NINGÚN GRUPO FAMILIAR</div>
      )}

      {grupo && (
        <div style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>
              <b>Grupo #{grupo.grupo_id}</b> — Titular: {grupo.titular_apellido} {grupo.titular_nombre}
            </span>
            <button
              style={{
                background: "#b91c1c",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "2px 16px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
              onClick={eliminarGrupo}
            >
              Eliminar grupo
            </button>
          </div>

          <table className="modern-table">
            <thead>
              <tr>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>DNI</th>
                <th>¿Titular?</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grupo.integrantes.map(integ => (
                <tr key={integ.id}>
                  <td>{integ.apellido}</td>
                  <td>{integ.nombre}</td>
                  <td>{integ.dni}</td>
                  <td style={{ textAlign: "center" }}>{integ.es_titular ? "✅" : ""}</td>
                  <td>
                    {!integ.es_titular && (
                      <button
                        style={{
                          background: "#b91c1c",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "2px 8px",
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                        onClick={() => eliminarIntegrante(integ.id)}
                      >
                        Quitar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 18, position: "relative" }}>
            <label>
              Agregar integrante:
              <input
                type="text"
                placeholder='Buscar socio (DNI, nombre o apellido)'
                value={nuevoSocioBusqueda}
                onChange={e => setNuevoSocioBusqueda(e.target.value)}
                style={{ marginRight: 6, width: 270 }}
                autoComplete="off"
              />
            </label>
            {(loadingAgregar || errAgregar || resultadosAgregar.length > 0 || nuevoSocioBusqueda.trim().length >= 2) && (
              <ul style={{
                border: "1.5px solid #b91c1c88",
                position: "absolute",
                zIndex: 31,
                background: "#fff",
                width: 340,
                maxHeight: 180,
                overflowY: "auto",
                paddingLeft: 0,
                marginTop: 2,
                borderRadius: 8,
                listStyle: "none",
                boxShadow: "0 4px 12px #b91c1c15"
              }}>
                {loadingAgregar && <li style={{ padding: "6px 12px" }}>Buscando…</li>}
                {!loadingAgregar && errAgregar && (
                  <li style={{ padding: "6px 12px", color: "#b91c1c" }}>{errAgregar}</li>
                )}
                {!loadingAgregar && !errAgregar && resultadosAgregar.length === 0 && nuevoSocioBusqueda.trim().length >= 2 && (
                  <li style={{ padding: "6px 12px", opacity: 0.7 }}>Sin resultados</li>
                )}
                {!loadingAgregar && !errAgregar && resultadosAgregar.map(s => (
                  <li
                    key={s.id}
                    style={{
                      cursor: "pointer",
                      padding: "6px 12px",
                      borderBottom: "1px solid #eee",
                      borderRadius: 6
                    }}
                    onClick={() => agregarIntegrante(s)}
                    onMouseDown={e => e.preventDefault()}
                  >
                    <b>{s.apellido} {s.nombre}</b> — DNI: {s.dni}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
