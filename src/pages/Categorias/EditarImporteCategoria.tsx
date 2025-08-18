import { useEffect, useMemo, useState } from "react";

/* =========================
   Tipos
========================= */
type Categoria = {
  id: number;
  nombre: string;
  aplica_a: "menor" | "mayor";
  condicion: "activo" | "adherente" | "jubilado" | "ex_jugador";
  importe: number;
  edad: number;
};

type EditState = Record<number, string>;     // id -> texto visible en el input
type SavingState = Record<number, boolean>;  // id -> guardando?

/* =========================
   Utils
========================= */
function toNumber(value: string | number): number {
  if (value === null || value === undefined) return NaN;
  const s = String(value).trim();
  if (s === "") return NaN;
  const norm = s.replace(/\./g, "").replace(",", ".");
  const n = Number(norm);
  return Number.isFinite(n) ? n : NaN;
}

/* =========================
   Toast & Confirm (sin libs)
========================= */
type Toast = { id: number; kind: "success" | "error" | "info"; msg: string };
let __toastId = 1;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (kind: Toast["kind"], msg: string, timeout = 2300) => {
    const t = { id: __toastId++, kind, msg };
    setToasts((prev) => [...prev, t]);
    if (timeout > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, timeout);
    }
  };
  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
  return { toasts, push, remove };
}

function Toasts({ items, onClose }: { items: Toast[]; onClose: (id: number) => void }) {
  return (
    <div style={toastContainer}>
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            ...toastBase,
            borderLeft:
              t.kind === "success"
                ? "4px solid #16a34a"
                : t.kind === "error"
                ? "4px solid #dc2626"
                : "4px solid #2563eb",
          }}
          role="status"
          aria-live="polite"
        >
          <div style={{ fontSize: "10pt" }}>
            {t.kind === "success" ? "✔️ " : t.kind === "error" ? "⚠️ " : "ℹ️ "}
            {t.msg}
          </div>
          <button onClick={() => onClose(t.id)} style={toastCloseBtn} aria-label="Cerrar">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function Confirm({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmText = "Actualizar",
  cancelText = "Cancelar",
}: {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}) {
  if (!open) return null;
  return (
    <div style={modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div style={modalCard}>
        <h3 id="confirm-title" style={{ margin: 0, fontSize: "11pt" }}>{title}</h3>
        <div style={{ marginTop: 8, fontSize: "10pt", color: "#333" }}>{message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={onCancel} style={btnGhost}>{cancelText}</button>
          <button onClick={onConfirm} style={btnPrimary}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Página
========================= */
export default function EditarImporteCategoria() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [edit, setEdit] = useState<EditState>({});
  const [saving, setSaving] = useState<SavingState>({});

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Categoria | null>(null);
  const [confirmParsed, setConfirmParsed] = useState<number>(0);

  // toasts
  const { toasts, push, remove } = useToasts();

  const money = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/categorias`);
      if (!res.ok) throw new Error("No se pudieron obtener las categorías");
      const data: Categoria[] = await res.json();
      setCategorias(data);

      // Inicial inputs
      const initial: EditState = {};
      data.forEach((c) => {
        initial[c.id] = String(Number(c.importe ?? 0).toFixed(2)).replace(".", ",");
      });
      setEdit(initial);
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
      push("error", "No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return categorias;
    return categorias.filter(
      (c) =>
        String(c.id).includes(q) ||
        c.nombre.toLowerCase().includes(q) ||
        c.aplica_a.toLowerCase().includes(q) ||
        c.condicion.toLowerCase().includes(q)
    );
  }, [busqueda, categorias]);

  const setSavingFlag = (id: number, v: boolean) =>
    setSaving((prev) => ({ ...prev, [id]: v }));

  const handleChange = (id: number, value: string) => {
    setEdit((prev) => ({ ...prev, [id]: value }));
  };

  const handleResetFila = (c: Categoria) => {
    setEdit((prev) => ({
      ...prev,
      [c.id]: String(Number(c.importe ?? 0).toFixed(2)).replace(".", ","),
    }));
  };

  // Abre confirm modal
  const handleGuardar = (c: Categoria) => {
    const visible = edit[c.id] ?? "";
    const parsed = toNumber(visible);

    if (!Number.isFinite(parsed) || parsed < 0) {
      push("error", "Ingrese un importe válido (ej: 1500,00 o 1500.00)");
      return;
    }

    const current = Number(c.importe ?? 0);
    if (Number(parsed.toFixed(2)) === Number(current.toFixed(2))) {
      push("info", "El importe no cambió.");
      return;
    }

    setConfirmTarget(c);
    setConfirmParsed(parsed);
    setConfirmOpen(true);
  };

  // Ejecuta PATCH
  const confirmarGuardar = async () => {
    if (!confirmTarget) return;
    const c = confirmTarget;
    const parsed = confirmParsed;

    try {
      setConfirmOpen(false);
      setSavingFlag(c.id, true);

      const res = await fetch(`${API_URL}/categorias/${c.id}/importe`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importe: parsed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "No se pudo actualizar el importe");
      }

      // Actualiza fila en memoria
      setCategorias((prev) =>
        prev.map((row) => (row.id === c.id ? { ...row, importe: parsed } : row))
      );
      // Sincroniza input
      setEdit((prev) => ({
        ...prev,
        [c.id]: String(parsed.toFixed(2)).replace(".", ","),
      }));

      push("success", `Importe de "${c.nombre}" actualizado a $${money.format(parsed)}.`);
    } catch (e: any) {
      push("error", e?.message || "Error al actualizar el importe");
    } finally {
      setSavingFlag(c.id, false);
      setConfirmTarget(null);
    }
  };

  return (
    // 👇 OJO: sin className="main-content" para no duplicar el margen del layout
    <div>
      <h2 className="modern-form-title" style={{ marginBottom: 12 }}>
        Categorías — Editar Importes
      </h2>

      <div
        className="modern-form"
        style={{
          background: "#fff",
          padding: 12,
          borderRadius: 12,
          boxShadow: "0 1px 6px rgba(0,0,0,.06)",
          marginBottom: 12,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por id, nombre, aplica_a o condición…"
          style={{
            flex: 1,
            height: 32,
            fontSize: "10pt",
            padding: "0 10px",
            border: "1px solid #eaeaea",
            borderRadius: 8,
            outline: "none",
          }}
        />
        <button onClick={cargarCategorias} style={btnPrimary} title="Refrescar">
          Refrescar
        </button>
      </div>

      {loading && <p style={{ fontSize: "10pt" }}>Cargando…</p>}
      {error && (
        <p style={{ color: "#da1d25", fontSize: "10pt" }}>
          ⚠️ {error}
        </p>
      )}

      {!loading && !error && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 6px rgba(0,0,0,.06)",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "10pt",
            }}
          >
            <thead style={{ background: "#f8f9fa" }}>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Nombre</th>
                <th style={th}>Aplica a</th>
                <th style={th}>Condición</th>
                <th style={th}>Edad</th>
                <th style={th}>Importe actual</th>
                <th style={th}>Nuevo Importe</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => {
                const v = edit[c.id] ?? "";
                const parsed = toNumber(v);
                const same =
                  Number.isFinite(parsed) &&
                  Number((parsed as number).toFixed(2)) ===
                    Number(Number(c.importe ?? 0).toFixed(2));
                const invalid = !Number.isFinite(parsed) || parsed < 0;

                return (
                  <tr key={c.id} style={{ borderTop: "1px solid #eaeaea" }}>
                    <td style={td}>{c.id}</td>
                    <td style={td}>{c.nombre}</td>
                    <td style={td}>{c.aplica_a}</td>
                    <td style={td}>{c.condicion}</td>
                    <td style={td}>{c.edad}</td>
                    <td style={td}>${money.format(Number(c.importe || 0))}</td>
                    <td style={td}>
                      <input
                        value={v}
                        onChange={(e) => handleChange(c.id, e.target.value)}
                        placeholder="0,00"
                        style={{
                          width: 110,
                          height: 30,
                          fontSize: "10pt",
                          padding: "0 8px",
                          border: invalid ? "1px solid #da1d25" : "1px solid #eaeaea",
                          borderRadius: 8,
                          outline: "none",
                        }}
                        inputMode="decimal"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleGuardar(c);
                          }
                          if (e.key === "Escape") {
                            handleResetFila(c);
                          }
                        }}
                        onBlur={() => handleGuardar(c)}
                      />
                      {invalid && (
                        <div style={{ color: "#da1d25", fontSize: "9pt", marginTop: 2 }}>
                          Importe inválido
                        </div>
                      )}
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => handleGuardar(c)}
                        disabled={saving[c.id] || invalid || same}
                        style={{
                          ...btnPrimary,
                          opacity: saving[c.id] || invalid || same ? 0.6 : 1,
                          cursor:
                            saving[c.id] || invalid || same ? "not-allowed" : "pointer",
                          marginRight: 6,
                        }}
                        title={
                          same
                            ? "El importe no cambió"
                            : invalid
                            ? "Ingrese un importe válido"
                            : "Guardar"
                        }
                      >
                        {saving[c.id] ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        onClick={() => handleResetFila(c)}
                        disabled={saving[c.id]}
                        style={{
                          ...btnGhost,
                          opacity: saving[c.id] ? 0.6 : 1,
                          cursor: saving[c.id] ? "not-allowed" : "pointer",
                        }}
                        title="Restaurar al valor actual"
                      >
                        Restaurar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td style={td} colSpan={8}>
                    No hay resultados para “{busqueda}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Toasts */}
      <Toasts items={toasts} onClose={remove} />

      {/* Confirmación */}
      <Confirm
        open={confirmOpen}
        title="Confirmar actualización"
        message={
          confirmTarget ? (
            <>
              ¿Actualizar el importe de <strong>{confirmTarget.nombre}</strong> a{" "}
              <strong>${money.format(confirmParsed)}</strong>?
            </>
          ) : (
            ""
          )
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmarGuardar}
      />
    </div>
  );
}

/* =========================
   Estilos inline mínimos
========================= */
const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
  borderBottom: "1px solid #eaeaea",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "8px 12px",
  whiteSpace: "nowrap",
};

const btnPrimary: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #da1d25",
  background: "#da1d25",
  color: "#fff",
  fontSize: "10pt",
};

const btnGhost: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid #eaeaea",
  background: "#fff",
  color: "#333",
  fontSize: "10pt",
};

/* Toast styles */
const toastContainer: React.CSSProperties = {
  position: "fixed",
  right: 16,
  bottom: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  zIndex: 9999,
};

const toastBase: React.CSSProperties = {
  background: "#fff",
  boxShadow: "0 6px 20px rgba(0,0,0,.12)",
  borderRadius: 10,
  padding: "10px 12px",
  minWidth: 260,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const toastCloseBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#666",
  fontSize: "14px",
  cursor: "pointer",
  lineHeight: 1,
};

/* Modal styles */
const modalBackdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 9998,
};

const modalCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,.18)",
  padding: 16,
  width: "100%",
  maxWidth: 420,
};

