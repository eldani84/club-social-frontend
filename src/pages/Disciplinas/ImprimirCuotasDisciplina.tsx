import { useEffect, useState } from "react";

type Socio = { id: number; nombre: string; apellido: string; dni: string; };
type Disciplina = { id: number; nombre: string; estado: "activa"|"inactiva" };

function currentYYYYMM() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function ImprimirCuotasDisciplina() {
  const API = import.meta.env.VITE_API_URL;

  const [mostrarTodos, setMostrarTodos] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [socios, setSocios] = useState<Socio[]>([]);
  const [socioSel, setSocioSel] = useState<Socio | null>(null);

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinaId, setDisciplinaId] = useState<string>("");

  const [periodo, setPeriodo] = useState(currentYYYYMM());

  useEffect(() => {
    fetch(`${API}/disciplinas`)
      .then(r => r.json())
      .then((rows: Disciplina[]) => setDisciplinas(rows))
      .catch(() => setDisciplinas([]));
  }, [API]);

  useEffect(() => {
    if (mostrarTodos || busqueda.trim().length < 2) return;
    fetch(`${API}/socios/buscar?busqueda=${encodeURIComponent(busqueda)}`)
      .then(r => r.json())
      .then((rows: Socio[]) => setSocios(rows))
      .catch(() => setSocios([]));
  }, [busqueda, mostrarTodos, API]);

  const pickSocio = (s: Socio) => {
    setSocioSel(s);
    setBusqueda(`${s.nombre} ${s.apellido}`);
    setSocios([]);
  };

  const imprimir = () => {
    const backendBase = API.replace("/api", "");
    if (mostrarTodos) {
      let url = `${backendBase}/api/disciplinas/imprimir/cupones?periodo=${periodo}`;
      if (disciplinaId) url += `&disciplina_id=${encodeURIComponent(disciplinaId)}`;
      window.open(url, "_blank");
    } else if (socioSel) {
      let url = `${backendBase}/api/disciplinas/imprimir/cupon-individual?socio_id=${socioSel.id}&periodo=${periodo}`;
      if (disciplinaId) url += `&disciplina_id=${encodeURIComponent(disciplinaId)}`;
      window.open(url, "_blank");
    } else {
      alert("Elegí 'Todos' o seleccioná un socio.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-red-700 mb-6 text-center">Imprimir Cuotas de Disciplinas</h2>

      <form onSubmit={(e) => { e.preventDefault(); imprimir(); }} className="flex flex-col gap-4">
        <div className="flex gap-6 items-center mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={mostrarTodos} onChange={() => { setMostrarTodos(true); setSocioSel(null); setBusqueda(""); }} />
            <span className="font-semibold">Todos</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={!mostrarTodos} onChange={() => setMostrarTodos(false)} />
            <span className="font-semibold">Buscar socio</span>
          </label>
        </div>

        {!mostrarTodos && (
          <div>
            <input
              type="text"
              placeholder="Nombre / apellido / DNI"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setSocioSel(null); }}
              className="input-modern w-full"
              autoComplete="off"
            />
            {socios.length > 0 && (
              <ul className="border rounded-lg bg-white max-h-32 overflow-y-auto shadow mt-1">
                {socios.map((s) => (
                  <li
                    key={s.id}
                    className="px-3 py-1 hover:bg-red-50 cursor-pointer"
                    onClick={() => pickSocio(s)}
                  >
                    {s.nombre} {s.apellido} (DNI: {s.dni})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="font-semibold">Período:</label>
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="input-modern"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold">Disciplina (opcional):</label>
          <select
            value={disciplinaId}
            onChange={(e) => setDisciplinaId(e.target.value)}
            className="input-modern"
          >
            <option value="">Todas</option>
            {disciplinas.map(d => (
              <option key={d.id} value={String(d.id)}>
                {d.nombre} {d.estado !== "activa" ? "(inactiva)" : ""}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-xl shadow">
          Imprimir comprobante
        </button>
      </form>
    </div>
  );
}
