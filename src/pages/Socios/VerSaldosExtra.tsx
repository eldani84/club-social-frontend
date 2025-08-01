import { useEffect, useState } from "react";

interface SaldoExtra {
  id: number;
  concepto: string;
  monto: number;
  fecha: string;
  observaciones: string;
  nombre: string;
  apellido: string;
  dni: string;
}

export default function VerSaldosExtra() {
  const [saldos, setSaldos] = useState<SaldoExtra[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const socioData = localStorage.getItem("socioData");
    if (!socioData) {
      setError("No se encontró el socio.");
      return;
    }

    const socio = JSON.parse(socioData);

    fetch(`http://localhost:3000/api/saldos/grupo?dni=${socio.dni}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSaldos(data);
        } else {
          setError(data.error || "Error al obtener saldos.");
        }
      })
      .catch(() => setError("Error al conectar con el servidor."));
  }, []);

  return (
    <div className="main-content">
      <div className="form-modern">
        <h2 className="form-section-title">Saldos Cargados Manualmente</h2>

        {error && <p className="text-red-600">{error}</p>}

        {saldos.length === 0 && !error && <p>No hay saldos cargados.</p>}

        {saldos.length > 0 && (
          <table className="modern-table mt-4">
            <thead>
              <tr>
                <th>Socio</th>
                <th>DNI</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {saldos.map((s) => (
                <tr key={s.id}>
                  <td>{`${s.apellido} ${s.nombre}`}</td>
                  <td>{s.dni}</td>
                  <td>{s.concepto}</td>
                  <td>${s.monto.toFixed(2)}</td>
                  <td>{new Date(s.fecha).toLocaleDateString()}</td>
                  <td>{s.observaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
