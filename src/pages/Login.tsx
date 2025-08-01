import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";

interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    rol: string;
  };
}

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post<LoginResponse>(
        "http://localhost:3000/api/auth/login",
        { usuario, password }
      );

      const { token, usuario: usuarioData } = res.data;
      login(token, usuarioData);
      navigate("/"); // Redirige correctamente
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Error al iniciar sesión. Intente nuevamente."
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold mb-4 text-center text-red-700">
          Iniciar sesión
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 text-sm p-2 mb-4 rounded">
            {error}
          </div>
        )}

        <label className="block mb-2 text-sm">
          Usuario:
          <input
            type="text"
            required
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full mt-1 p-2 border rounded text-sm"
          />
        </label>

        <label className="block mb-4 text-sm">
          Contraseña:
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 p-2 border rounded text-sm"
          />
        </label>

        <button
          type="submit"
          className="w-full bg-red-700 text-white py-2 rounded hover:bg-red-800 text-sm"
        >
          Ingresar
        </button>
      </form>
    </div>
  );
}
