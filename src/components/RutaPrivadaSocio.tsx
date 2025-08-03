import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";

interface Props {
  children: ReactElement;
}

export default function RutaPrivadaSocio({ children }: Props) {
  const socioToken = localStorage.getItem("socioToken");

  if (!socioToken) {
    return <Navigate to="/socio/login" replace />;
  }

  return children;
}
