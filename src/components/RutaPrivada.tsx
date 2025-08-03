import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth";
import type { ReactElement } from "react";

interface Props {
  children: ReactElement;
}

export default function RutaPrivada({ children }: Props) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
