import { useState } from "react";

export default function GenerarLinkPago() {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const generarLink = async () => {
    setLoading(true);
    setMensaje("");
    setLink("");

    const socioData = localStorage.getItem("socioData");
    if (!socioData) {
      setMensaje("No se encontró el DNI del socio.");
      setLoading(false);
      return;
    }

    const socio = JSON.parse(socioData);

    try {
      const res = await fetch(`http://localhost:3000/api/mp/pago-grupo?dni=${socio.dni}`);
      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || "Error al generar el link de pago.");
      } else {
        setLink(data.link);
      }
    } catch (err) {
      setMensaje("Error inesperado al generar el link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="form-modern">
        <h2 className="form-section-title">Generar Link de Pago</h2>
        <p>Este link incluye todas las cuotas impagas de su grupo familiar.</p>
        <button className="modern-btn mt-2" onClick={generarLink} disabled={loading}>
          {loading ? "Generando..." : "Generar Link de Mercado Pago"}
        </button>

        {mensaje && <p className="mt-4 text-red-600">{mensaje}</p>}

        {link && (
          <div className="mt-4">
            <p className="mb-2 text-green-600">¡Link generado!</p>
            <a href={link} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">
              Ir a pagar ahora
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
