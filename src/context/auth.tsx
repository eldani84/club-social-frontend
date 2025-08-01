import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
interface Usuario {
  id: number;
  nombre: string;
  rol: string;
}

interface AuthContextType {
  token: string | null;
  usuario: Usuario | null;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [usuario, setUsuario] = useState<Usuario | null>(
    localStorage.getItem("usuario")
      ? JSON.parse(localStorage.getItem("usuario") || "")
      : null
  );

  const login = (newToken: string, usuario: Usuario) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("usuario", JSON.stringify(usuario));
    setToken(newToken);
    setUsuario(usuario);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
