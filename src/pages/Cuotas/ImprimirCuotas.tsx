import { useState, useEffect } from "react";

interface Socio {
  id: number;
  nombre: string;
  apellido: string;
}

interface FormaPago {
  id: number | string;
  forma_de_pago: string;
}

export default function ImprimirCuotas() {
  const [busqueda, setBusqueda] = useState("");
  const [socios, setSocios] = useState<Socio[]>([]);
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(true);
  const [mes, setMes] = useState(() => {
    const m = new Date().getMonth() + 1;
    return m < 10 ? `0${m}` : `${m}`;
  });
  const [anio, setAnio] = useState(`${new Date().getFullYear()}`);
  const [formaPago, setFormaPago] = useState("");
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

  useEffect(() => {
    if (busqueda.length < 2) return;
    fetch(`http://localhost:3000/api/socios/buscar?busqueda=${busqueda}`)
      .then((res) => res.json())
      .then((data) => setSocios(data))
      .catch(() => setSocios([]));
  }, [busqueda]);

  useEffect(() => {
    fetch("http://localhost:3000/api/formas_pago")
      .then((res) => res.json())
      .then(setFormasPago)
      .catch(() => setFormasPago([]));
  }, []);

  const handleBuscarSocio = (socio: Socio) => {
    setSocioSeleccionado(socio);
    setBusqueda(`${socio.nombre} ${socio.apellido}`);
    setMostrarTodos(false);
    setSocios([]);
  };

  const handleImprimir = () => {
    const backendBase = "http://localhost:3000";
    const mesYYYYMM = `${anio}-${mes}`;
    if (mostrarTodos) {
      let url = `${backendBase}/api/imprimir/cupones?mes=${mesYYYYMM}`;
      if (formaPago) url += `&forma_pago=${encodeURIComponent(formaPago)}`;
      window.open(url, "_blank");
    } else if (socioSeleccionado) {
      let url = `${backendBase}/api/imprimir/cupon-individual?socio_id=${socioSeleccionado.id}&mes=${mesYYYYMM}`;
      window.open(url, "_blank");
    } else {
      alert("Por favor, seleccione un socio o elija 'Todos los socios'.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-xl rounded-2xl mt-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-red-700 mb-6 text-center">Imprimir Cuotas</h2>
      <form
        onSubmit={e => { e.preventDefault(); handleImprimir(); }}
        className="flex flex-col gap-4"
      >
        <div className="flex gap-6 items-center mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mostrarTodos}
              onChange={() => { setMostrarTodos(true); setSocioSeleccionado(null); setBusqueda(""); }}
              id="todos"
            />
            <span className="font-semibold">Todos los socios</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!mostrarTodos}
              onChange={() => setMostrarTodos(false)}
              id="buscar"
            />
            <span className="font-semibold">Buscar socio</span>
          </label>
        </div>

        {!mostrarTodos && (
          <div>
            <input
              type="text"
              placeholder="Nombre o apellido"
              value={busqueda}
              onChange={e => {
                setBusqueda(e.target.value);
                setSocioSeleccionado(null);
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
        )}

        <div className="flex gap-4 items-center">
          <label className="font-semibold">Mes:</label>
          <select value={mes} onChange={e => setMes(e.target.value)} className="input-modern">
            {[
              "01", "02", "03", "04", "05", "06",
              "07", "08", "09", "10", "11", "12"
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

        <div className="flex gap-2 items-center">
          <label className="font-semibold">Forma de pago:</label>
          <select
            value={formaPago}
            onChange={e => setFormaPago(e.target.value)}
            className="input-modern"
          >
            <option value="">Todas</option>
            {formasPago.map(fp => (
              <option key={fp.id} value={fp.id}>
                {fp.forma_de_pago}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-xl shadow"
        >
          Imprimir comprobante
        </button>
      </form>
    </div>
  );
}
