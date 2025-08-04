import { useEffect, useState } from "react";

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
  const [socios, setSocios] = useState<Socio[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [nuevoSocioBusqueda, setNuevoSocioBusqueda] = useState("");
  const [resultadosAgregar, setResultadosAgregar] = useState<Socio[]>([]);
  const [resultados, setResultados] = useState<Socio[]>([]);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API}/socios`)
      .then(res => res.json())
      .then(setSocios);
  }, []);

  useEffect(() => {
    if (!socioSeleccionado || !socioSeleccionado.grupo_familiar_id) {
      setGrupo(null);
      return;
    }
    fetch(`${API}/grupos/por-socio/${socioSeleccionado.id}`)
      .then(res => res.json())
      .then(setGrupo)
      .catch(() => setMensaje("Error al cargar el grupo familiar."));
  }, [socioSeleccionado]);

  useEffect(() => {
    const valor = busqueda.trim().toLowerCase();
    if (valor.length < 2) {
      setResultados([]);
      return;
    }
    setResultados(
      socios.filter(s =>
        s.nombre.toLowerCase().includes(valor) ||
        s.apellido.toLowerCase().includes(valor) ||
        s.dni.toLowerCase().includes(valor) ||
        (`${s.nombre} ${s.apellido}`).toLowerCase().includes(valor)
      )
    );
  }, [busqueda, socios]);

  useEffect(() => {
    const valor = nuevoSocioBusqueda.trim().toLowerCase();
    if (!grupo || valor.length < 2) {
      setResultadosAgregar([]);
      return;
    }
    setResultadosAgregar(
      socios.filter(s =>
        !s.grupo_familiar_id && (
          s.nombre.toLowerCase().includes(valor) ||
          s.apellido.toLowerCase().includes(valor) ||
          s.dni.toLowerCase().includes(valor) ||
          (`${s.nombre} ${s.apellido}`).toLowerCase().includes(valor)
        )
      )
    );
  }, [nuevoSocioBusqueda, socios, grupo]);

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
      fetch(`${API}/grupos/por-socio/${socioSeleccionado!.id}`)
        .then(res => res.json())
        .then(setGrupo);
      fetch(`${API}/api/socios`)
        .then(res => res.json())
        .then(setSocios);
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
      fetch(`${API}/grupos/por-socio/${socioSeleccionado!.id}`)
        .then(res => res.json())
        .then(setGrupo);
      fetch(`${API}/socios`)
        .then(res => res.json())
        .then(setSocios);
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
      fetch(`${API}/api/socios`)
        .then(res => res.json())
        .then(setSocios);
    } else {
      setMensaje(data.error || "Error eliminando el grupo.");
    }
  };

  return (
    <form className="form-modern" style={{ maxWidth: 950, margin: "auto" }} onSubmit={e => e.preventDefault()}>
      <div className="form-section-title">Gestionar Grupo Familiar</div>

      <label>
        Buscar socio (DNI, nombre o apellido):
        <input
          type="text"
          placeholder="Buscar..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          autoComplete="off"
          style={{ width: 260, marginBottom: 8 }}
        />
        {resultados.length > 0 && (
          <ul style={{
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
          }}>
            {resultados.map(s => (
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
                <b>{s.nombre} {s.apellido}</b> — DNI: {s.dni}
                {s.grupo_familiar_id && (
                  <span style={{ color: "#1976d2", marginLeft: 8 }}>(En grupo)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </label>
      {mensaje && <div style={{ color: mensaje.startsWith("Grupo eliminado") ? "#008000" : "#b91c1c", margin: "10px 0" }}>{mensaje}</div>}

      {socioSeleccionado && (
        <div style={{ marginBottom: 14, fontWeight: 600 }}>
          Socio: {socioSeleccionado.nombre} {socioSeleccionado.apellido} — DNI: {socioSeleccionado.dni}
        </div>
      )}
      {socioSeleccionado && !socioSeleccionado.grupo_familiar_id && (
        <div style={{ color: "#1976d2", marginBottom: 8 }}>NO PERTENECE A NINGÚN GRUPO FAMILIAR</div>
      )}
      {grupo && (
        <div style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>
              <b>Grupo #{grupo.grupo_id}</b> — Titular: {grupo.titular_nombre} {grupo.titular_apellido}
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
                <th>Nombre</th>
                <th>Apellido</th>
                <th>DNI</th>
                <th>¿Titular?</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grupo.integrantes.map(integ => (
                <tr key={integ.id}>
                  <td>{integ.nombre}</td>
                  <td>{integ.apellido}</td>
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
                placeholder="Buscar socio (DNI, nombre o apellido)"
                value={nuevoSocioBusqueda}
                onChange={e => setNuevoSocioBusqueda(e.target.value)}
                style={{ marginRight: 6, width: 270 }}
                autoComplete="off"
              />
            </label>
            {resultadosAgregar.length > 0 && (
              <ul style={{
                border: "1.5px solid #b91c1c88",
                position: "absolute",
                zIndex: 31,
                background: "#fff",
                width: 320,
                maxHeight: 150,
                overflowY: "auto",
                paddingLeft: 0,
                marginTop: 2,
                borderRadius: 8,
                listStyle: "none",
                boxShadow: "0 4px 12px #b91c1c15"
              }}>
                {resultadosAgregar.map(s => (
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
                    <b>{s.nombre} {s.apellido}</b> — DNI: {s.dni}
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
