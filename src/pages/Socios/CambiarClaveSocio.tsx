import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CambiarClaveSocio() {
  const navigate = useNavigate();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const socioGuardado = localStorage.getItem("socioData");
    if (!socioGuardado) {
      alert("Debe iniciar sesión.");
      navigate("/socio/login");
      return;
    }

    if (nueva !== repetir) {
      alert("La nueva contraseña no coincide");
      return;
    }

    const socio = JSON.parse(socioGuardado);

    try {
      const res = await fetch("http://localhost:3000/api/socios/cambiar-clave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dni: socio.dni,
          actual,
          nueva
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al cambiar clave");
        return;
      }

      alert("Contraseña actualizada correctamente");
      navigate("/socio/perfil");
    } catch (err) {
      alert("Error de conexión");
    }
  };

  return (
    <div className="main-content">
      <div className="form-modern" style={{ maxWidth: 400, margin: "auto" }}>
        <h2 className="form-section-title">Cambiar Contraseña</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 text-sm">
          <label>
            Contraseña actual:
            <input
              type="password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              required
              className="border px-2 py-1 w-full"
            />
          </label>

          <label>
            Nueva contraseña:
            <input
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              required
              className="border px-2 py-1 w-full"
            />
          </label>

          <label>
            Repetir nueva contraseña:
            <input
              type="password"
              value={repetir}
              onChange={(e) => setRepetir(e.target.value)}
              required
              className="border px-2 py-1 w-full"
            />
          </label>

          <button type="submit" className="modern-btn w-full mt-2">Guardar</button>
        </form>
      </div>
    </div>
  );
}
