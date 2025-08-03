import { useState } from "react";

export default function LoginSocio() {
  const [dni, setDni] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!dni || !clave) {
      setError("Debe ingresar DNI y contraseña");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL;

    try {
      const res = await fetch(`${API_URL}/socios/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni, clave }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      // Limpieza de posibles tokens previos (admin)
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");

      // Guardar token y datos del socio
      localStorage.setItem("socioToken", data.token);
      localStorage.setItem("socioData", JSON.stringify(data.socio));

      // Verificación en consola (útil en desarrollo)
      console.log("✅ socioToken:", data.token);
      console.log("✅ socioData:", data.socio);

      // Redirección segura al dashboard del socio
      window.location.href = "/socio/perfil";
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error al conectar con el servidor");
    }
  };

  return (
    <div className="main-content">
      <div className="form-modern" style={{ maxWidth: 400, margin: "auto" }}>
        <h2 className="form-section-title">Ingreso Socio</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          <label>DNI
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="border p-1 text-sm w-full"
              required
            />
          </label>
          <label>Contraseña
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="border p-1 text-sm w-full"
              required
            />
          </label>
          {error && <div className="text-red-600 text-xs">{error}</div>}
          <button type="submit" className="modern-btn w-full">Ingresar</button>
        </form>
      </div>
    </div>
  );
}
