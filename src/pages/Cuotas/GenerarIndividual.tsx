import { useState, useEffect } from "react";

interface Socio {
  id: number;
  nombre: string;
  apellido: string;
}

export default function GenerarCuotaIndividual() {
  const [busqueda, setBusqueda] = useState("");
  const [socios, setSocios] = useState<Socio[]>([]);
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);
  const [mes, setMes] = useState(() => {
    const m = new Date().getMonth() + 1;
    return m < 10 ? `0${m}` : `${m}`;
  });
  const [anio, setAnio] = useState(`${new Date().getFullYear()}`);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Autocomplete de socio por similitud
  useEffect(() => {
    if (busqueda.length < 2) return;
    fetch(`http://localhost:3000/api/socios/buscar?busqueda=${busqueda}`)
      .then((res) => res.json())
      .then((data) => setSocios(data))
      .catch(() => setSocios([]));
  }, [busqueda]);


  const handleBuscarSocio = (socio: Socio) => {
    setSocioSeleccionado(socio);
    setBusqueda(`${socio.nombre} ${socio.apellido}`);
    setSocios([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (!socioSeleccionado) {
      setMsg("Por favor, seleccione un socio.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/cuotas/individual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socio_id: socioSeleccionado.id,
          mes,
          anio
        }),
    });
      const data = await res.json();
      if (res.ok) {
        setMsg("✅ Cuota generada correctamente.");
      } else {
        setMsg(data.error || "❌ Error al generar cuota.");
      }
    } catch {
      setMsg("❌ Error de red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-red-700 mb-6 text-center">
        Generar Cuota Individual
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="font-semibold block mb-1">Buscar socio:</label>
          <input
            type="text"
            placeholder="Nombre o apellido"
            value={busqueda}
            onChange={e => {
              setBusqueda(e.target.value);
              setSocioSeleccionado(null);
              setMsg("");
            }}
            className="input-modern w-full"
            autoComplete="off"
          />
          {socios.length > 0 && (
            <ul className="border rounded-lg bg-white max-h-32 overflow-y-auto shadow mt-1">
              {socios.map((s) => (
                <li
                  key={s.id}
                  className="px-3 py-1 hover:bg-red-50 cursor-pointer"
                  onClick={() => handleBuscarSocio(s)}
                >
                  {s.nombre} {s.apellido} (ID: {s.id})
                </li>
              ))}
            </ul>
          )}
        </div>
        {socioSeleccionado && (
          <div className="px-2 py-1 bg-green-100 rounded text-green-700 mb-2">
            Seleccionado: <strong>{socioSeleccionado.nombre} {socioSeleccionado.apellido} (ID: {socioSeleccionado.id})</strong>
          </div>
        )}
        <div className="flex gap-4 items-center">
          <label className="font-semibold">Mes:</label>
          <select value={mes} onChange={e => setMes(e.target.value)} className="input-modern">
            {[
              "01","02","03","04","05","06","07","08","09","10","11","12"
            ].map((m, idx) => (
              <option key={m} value={m}>
                {new Date(0, idx).toLocaleString("es", { month: "long" })}
              </option>
            ))}
          </select>
          <label className="font-semibold ml-4">Año:</label>
          <input
            type="number"
            min={2020}
            max={2100}
            value={anio}
            onChange={e => setAnio(e.target.value)}
            className="input-modern w-24"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-xl shadow"
        >
          {loading ? "Generando..." : "Generar cuota"}
        </button>
        {msg && (
          <div className={`text-center mt-2 ${msg.startsWith("✅") ? "text-green-700" : "text-red-700"}`}>
            {msg}
          </div>
        )}
      </form>
    </div>
  );
}
