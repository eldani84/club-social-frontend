import React, { useState, useEffect } from "react";

type Socio = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
};

type Props = {
  onSeleccionar: (socio: Socio) => void;
};

const BuscadorSocio: React.FC<Props> = ({ onSeleccionar }) => {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Socio[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResultados([]);
      return;
    }
    const timeoutId = setTimeout(() => {
      fetch(`http://localhost:3000/api/socios/buscar?query=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then(setResultados)
        .catch(() => setResultados([]));
    }, 250); // Espera para evitar demasiadas consultas

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        placeholder="Buscar socio por DNI, nombre o apellido"
        autoComplete="off"
      />
      {showDropdown && resultados.length > 0 && (
        <ul
          style={{
            position: "absolute",
            zIndex: 10,
            background: "#fff",
            border: "1px solid #ddd",
            listStyle: "none",
            margin: 0,
            padding: 0,
            width: "100%",
            maxHeight: 160,
            overflowY: "auto",
          }}
        >
          {resultados.map((socio) => (
            <li
              key={socio.id}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
              onClick={() => {
                onSeleccionar(socio);
                setQuery(`${socio.nombre} ${socio.apellido} (${socio.dni})`);
                setShowDropdown(false);
              }}
            >
              {socio.nombre} {socio.apellido} - DNI: {socio.dni}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BuscadorSocio;
