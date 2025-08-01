import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginSocio() {
  const navigate = useNavigate();
  const [dni, setDni] = useState("");
  const [clave, setClave] = useState(""); // CAMBIO: antes era "password"
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!dni || !clave) {
      setError("Debe ingresar DNI y contraseña");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/socios/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni, clave }), // CAMBIO: se envía como "clave"
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      // Guardar en localStorage
      localStorage.setItem("socioToken", data.token);
      localStorage.setItem("socioData", JSON.stringify(data.socio));

      navigate("/socio/perfil"); // no /socio solo

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
            />
          </label>
          <label>Contraseña
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)} // CAMBIO
              className="border p-1 text-sm w-full"
            />
          </label>
          {error && <div className="text-red-600 text-xs">{error}</div>}
          <button type="submit" className="modern-btn w-full">Ingresar</button>
        </form>
      </div>
    </div>
  );
}
