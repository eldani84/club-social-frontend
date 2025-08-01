import { useState, useRef, useEffect } from "react";

type Cuota = {
  id: number;
  socio_id: number;
  nombre: string;
  apellido: string;
  importe: number;
  forma_pago_id: number;
  estado: string;
  codigo_barra: string;
  monto_pago: number; // campo de la base
};

type FormaPago = {
  id: number;
  forma_de_pago: string;
};

export default function PagoPorCB() {
  const [codigoBarra, setCodigoBarra] = useState("");
  const [cuota, setCuota] = useState<Cuota | null>(null);
  const [montoPago, setMontoPago] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const inputCodigo = useRef<HTMLInputElement>(null);

  // Formas de pago
  const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
  useEffect(() => {
    fetch("http://localhost:3000/api/formas_pago")
      .then(res => res.json())
      .then(data => setFormasPago(data))
      .catch(() => setFormasPago([]));
  }, []);

  function nombreFormaPago(id: number): string {
    const fp = formasPago.find(f => f.id === id);
    return fp ? fp.forma_de_pago : id ? `ID:${id}` : "";
  }

  // Buscar cuota por código de barra
  const buscarCuota = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCuota(null);
    setMontoPago("");
    setObservaciones("");
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:3000/api/pagos_cb/buscar_codigo_barra?codigo_barra=${encodeURIComponent(
          codigoBarra.trim()
        )}`
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "No se encontró la cuota.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCuota(data);

      // Monto pendiente: Importe - ya pagado
      const saldo = Math.max(0, Number(data.importe) - Number(data.monto_pago || 0));
      setMontoPago(saldo > 0 ? String(saldo) : "");
      setTimeout(() => {
        const el = document.getElementById("inputMontoPago");
        if (el) (el as HTMLInputElement).focus();
      }, 100);
    } catch {
      setError("Error de conexión.");
    }
    setLoading(false);
  };

  // Registrar pago
  const registrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    if (!cuota) return;

    // Saldo restante
    const saldo = Math.max(0, Number(cuota.importe) - Number(cuota.monto_pago || 0));

    const monto = parseFloat(montoPago);
    if (isNaN(monto) || monto <= 0) {
      setError("El monto de pago debe ser mayor a cero.");
      return;
    }
    if (monto > saldo) {
      setError("El monto no puede ser mayor al saldo pendiente.");
      return;
    }

    const hoy = new Date().toISOString().split("T")[0];

    try {
      const res = await fetch(
        `http://localhost:3000/api/pagos_cb/${cuota.id}/pagar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fecha_pago: hoy,
            monto_pago: monto,
            observaciones: observaciones.trim() || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error registrando pago");
        return;
      }
      setMensaje("✅ Pago registrado correctamente");
      setCuota(null);
      setCodigoBarra("");
      setMontoPago("");
      setObservaciones("");
      setTimeout(() => {
        inputCodigo.current?.focus();
      }, 200);
    } catch {
      setError("Error de conexión al registrar pago.");
    }
  };

  // Si hay cuota, calculo los valores para mostrar
  const importe = cuota ? Number(cuota.importe) : 0;
  const pagado = cuota ? Number(cuota.monto_pago || 0) : 0;
  const saldo = cuota ? Math.max(0, importe - pagado) : 0;

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "30px auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 24px rgba(0,0,0,.13)",
        padding: 18,
        fontFamily: "Segoe UI, Arial, sans-serif"
      }}
    >
      <h2 style={{
        marginBottom: 14,
        color: "#b91c1c",
        fontWeight: 700,
        fontSize: "1.6rem",
        letterSpacing: ".5px"
      }}>
        Registrar Pago (Código de Barra)
      </h2>

      <form onSubmit={buscarCuota} autoComplete="off" style={{ marginBottom: 10 }}>
        <label style={{ fontWeight: 600 }}>Código de barra</label>
        <input
          type="text"
          ref={inputCodigo}
          value={codigoBarra}
          autoFocus
          onChange={e => setCodigoBarra(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") buscarCuota(e);
          }}
          style={{
            width: "100%",
            margin: "5px 0 12px 0",
            fontSize: 19,
            padding: 8,
            borderRadius: 7,
            border: "1px solid #bbb"
          }}
          placeholder="Escanear o ingresar código"
        />
        <button
          type="submit"
          disabled={!codigoBarra || loading}
          style={{
            padding: "9px 18px",
            background: "#b91c1c",
            color: "#fff",
            fontWeight: 600,
            border: "none",
            borderRadius: 6,
            fontSize: 16,
            marginBottom: 8,
            width: "100%",
            cursor: "pointer"
          }}
        >
          Buscar cuota
        </button>
      </form>

      {error && (
        <div style={{
          background: "#ffeaea",
          color: "#c00",
          borderRadius: 7,
          marginBottom: 8,
          fontWeight: "bold",
          padding: "8px 10px"
        }}>{error}</div>
      )}
      {mensaje && (
        <div style={{
          background: "#d1fae5",
          color: "#059669",
          borderRadius: 7,
          marginBottom: 8,
          fontWeight: "bold",
          padding: "8px 10px"
        }}>{mensaje}</div>
      )}

      {cuota && (
        <form onSubmit={registrarPago}>
          <div
            style={{
              background: "#f9fafb",
              borderRadius: 10,
              padding: "12px 10px",
              marginBottom: 12,
              border: "1px solid #e5e7eb"
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 17 }}>
              {cuota.nombre} {cuota.apellido}
            </div>
            <div style={{ fontSize: 14, color: "#555" }}>
              Importe total: <strong style={{ color: "#b91c1c" }}>${importe}</strong>
            </div>
            <div style={{ fontSize: 14, color: "#555" }}>
              Monto pagado: <strong style={{ color: "#059669" }}>${pagado}</strong>
            </div>
            <div style={{ fontSize: 15, color: "#eab308", fontWeight: 500 }}>
              Saldo pendiente: <strong style={{ color: "#eab308" }}>${saldo}</strong>
            </div>
            <div style={{ fontSize: 14, color: "#555" }}>
              Forma de pago habitual: <strong>{nombreFormaPago(cuota.forma_pago_id)}</strong>
            </div>
          </div>
          <label style={{ fontWeight: 500 }}>
            Monto a pagar:
            <input
              id="inputMontoPago"
              type="number"
              step="0.01"
              value={montoPago}
              min={0}
              max={saldo}
              onChange={e => setMontoPago(e.target.value)}
              style={{
                width: "100%",
                margin: "6px 0 8px 0",
                fontSize: 18,
                borderRadius: 7,
                border: "1px solid #bbb",
                padding: 7
              }}
              required
            />
          </label>
          <label style={{ fontWeight: 500 }}>
            Observaciones:
            <input
              type="text"
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              style={{
                width: "100%",
                margin: "6px 0 12px 0",
                fontSize: 16,
                borderRadius: 7,
                border: "1px solid #bbb",
                padding: 7
              }}
              placeholder="Ej: Pagó en efectivo"
            />
          </label>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "#059669",
              color: "#fff",
              fontWeight: "bold",
              border: "none",
              borderRadius: 7,
              fontSize: 18,
              cursor: "pointer"
            }}
          >
            Registrar pago
          </button>
        </form>
      )}
    </div>
  );
}
