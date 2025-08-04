import { useState } from "react";

export default function GenerarLinksMasivosMP() {
  const [mes, setMes] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<{ socio: string; url: string }[]>([]);

  const API = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setErrores([]);
    setLinks([]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/mercadopago/generar-links-masivos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes }),
      });
      const data = await res.json();
      setMensaje(data.message || "Links generados.");
      setErrores(data.errores || []);
      setLinks(data.links || []);
    } catch {
      setMensaje("Error de conexión o del servidor.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: 480,
      margin: "40px auto",
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 4px 24px rgba(0,0,0,.13)",
      padding: 24,
      fontFamily: "Segoe UI, Arial, sans-serif"
    }}>
      <h2 style={{
        color: "#b91c1c",
        fontWeight: 700,
        fontSize: "1.35rem",
        marginBottom: 20
      }}>
        Generar Links de Mercado Pago MASIVOS
      </h2>
      <form onSubmit={handleSubmit}>
        <label style={{ fontWeight: 600 }}>Mes (YYYY-MM):</label>
        <input
          type="month"
          value={mes}
          onChange={e => setMes(e.target.value)}
          style={{
            width: "100%",
            margin: "8px 0 14px 0",
            fontSize: 17,
            padding: 8,
            borderRadius: 7,
            border: "1px solid #bbb"
          }}
          required
        />
        <button
          type="submit"
          disabled={loading || !mes}
          style={{
            width: "100%",
            padding: "11px",
            background: "#059669",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            borderRadius: 7,
            fontSize: 17,
            cursor: "pointer"
          }}
        >
          {loading ? "Generando..." : "Generar Links de Pago"}
        </button>
      </form>
      {mensaje && (
        <div style={{
          marginTop: 16,
          background: "#f1f5f9",
          color: "#2563eb",
          borderRadius: 8,
          padding: "8px 12px",
          fontWeight: 600
        }}>
          {mensaje}
        </div>
      )}
      {links.length > 0 && (
        <div style={{
          marginTop: 18,
          color: "#059669",
          background: "#e0ffe5",
          borderRadius: 8,
          padding: "10px 12px",
          fontWeight: 600
        }}>
          <div>Links generados:</div>
          {links.map((l, idx) => (
            <div key={idx}>
              <b>{l.socio}:</b>{" "}
              <a href={l.url} target="_blank" rel="noopener noreferrer">{l.url}</a>
            </div>
          ))}
        </div>
      )}
      {errores.length > 0 && (
        <div style={{
          marginTop: 10,
          color: "#c00",
          background: "#ffeaea",
          borderRadius: 8,
          padding: "7px 11px",
          fontWeight: 500
        }}>
          Errores:<br />
          {errores.map(err => <div key={err}>{err}</div>)}
        </div>
      )}
    </div>
  );
}
