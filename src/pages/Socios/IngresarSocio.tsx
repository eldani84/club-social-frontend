import { useState, useRef, useEffect } from "react";

type FormSocio = {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  instagram: string;
  telefono: string;
  fecha_nacimiento: string;
  estado: string;
  categoria_id: string;
  forma_pago_id: string;
  localidad: string;
  provincia: string;
  direccion: string;
  ocupacion: string;
  observaciones: string;
  foto_url: string;
  nro_carnet: string;
};

export default function IngresarSocio() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [formasPago, setFormasPago] = useState<any[]>([]);

  const [form, setForm] = useState<FormSocio>({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    instagram: "",
    telefono: "",
    fecha_nacimiento: "",
    estado: "activo",
    categoria_id: "",
    forma_pago_id: "",
    localidad: "",
    provincia: "",
    direccion: "",
    ocupacion: "",
    observaciones: "",
    foto_url: "",
    nro_carnet: "",
  });

  useEffect(() => {
    fetch("http://localhost:3000/api/categorias")
      .then((res) => res.json())
      .then((data) => setCategorias(data))
      .catch((err) => console.error("Error al cargar categorías", err));

    fetch("http://localhost:3000/api/formas_pago")
      .then((res) => res.json())
      .then((data) => setFormasPago(data))
      .catch((err) => {
        console.error("Error al cargar formas de pago", err);
        setFormasPago([]);
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const upper = ["nombre", "apellido", "telefono"].includes(name)
      ? value.toUpperCase()
      : value;
    setForm({ ...form, [name]: upper });
  };

  const validarFormulario = () => {
    const camposOblig = [
      { campo: "nombre", label: "Nombre" },
      { campo: "apellido", label: "Apellido" },
      { campo: "dni", label: "DNI" },
      { campo: "telefono", label: "Teléfono" },
      { campo: "email", label: "Correo" },
      { campo: "fecha_nacimiento", label: "Fecha de nacimiento" },
      { campo: "estado", label: "Estado" },
      { campo: "categoria_id", label: "Categoría" },
      { campo: "forma_pago_id", label: "Forma de pago" },
    ];
    const faltan = camposOblig.filter((f) => !form[f.campo as keyof FormSocio]);
    if (faltan.length > 0) {
      alert("Faltan completar: " + faltan.map((f) => f.label).join(", "));
      return false;
    }
    if (!/^\d+$/.test(form.dni)) {
      alert("El DNI debe contener solo números.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      alert("El correo electrónico no es válido.");
      return false;
    }
    return true;
  };

    const activarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCamaraActiva(true);
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      alert("No se pudo acceder a la cámara.");
    }
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCamaraActiva(false);
  };

  const capturarFoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0, 320, 240);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");
    const blob = await (await fetch(dataUrl)).blob();

    const formData = new FormData();
    formData.append("foto", blob, "foto.jpg");
    formData.append("dni", form.dni);

    try {
      const res = await fetch("http://localhost:3000/api/fotos/subir-foto", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert("Error al subir la foto: " + (data?.error || "Desconocido"));
        return;
      }

      const data = await res.json();
      setForm({ ...form, foto_url: data.url });
      detenerCamara();
      alert("Foto capturada correctamente.");
    } catch (err) {
      console.error("Error al capturar foto:", err);
      alert("Ocurrió un error al capturar la foto.");
    }
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validarFormulario()) return;

  try {
    const res = await fetch("http://localhost:3000/api/socios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        categoria_id: parseInt(form.categoria_id),
        forma_pago_id: parseInt(form.forma_pago_id),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data?.error || "Error al registrar socio");
      return;
    }

    // ✅ Obtener ID del socio creado
    const data = await res.json();
    const nuevoSocioId = data.id;

    // ✅ Preguntar si desea imprimir
    if (confirm("¿Desea imprimir la solicitud del socio?")) {
      window.open(`http://localhost:3000/api/ficha-socio/${nuevoSocioId}`, "_blank");
    }

    alert("Socio registrado correctamente");

    // Reset del formulario
    setForm({
      nombre: "",
      apellido: "",
      dni: "",
      email: "",
      instagram: "",
      telefono: "",
      fecha_nacimiento: "",
      estado: "activo",
      categoria_id: "",
      forma_pago_id: "",
      localidad: "",
      provincia: "",
      direccion: "",
      ocupacion: "",
      observaciones: "",
      foto_url: "",
      nro_carnet: "",
    });

    detenerCamara();

  } catch (err) {
    console.error("Error al registrar socio:", err);
    alert("Ocurrió un error inesperado.");
  }
};

  return (
    <div className="main-content">
      <div className="form-modern">
        <div className="form-section-title">Ingresar Socio</div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label>Nombre<input name="nombre" value={form.nombre} onChange={handleChange} /></label>
          <label>Apellido<input name="apellido" value={form.apellido} onChange={handleChange} /></label>
          <label>DNI<input name="dni" value={form.dni} onChange={handleChange} /></label>
          <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} /></label>
          <label>Instagram<input name="instagram" value={form.instagram} onChange={handleChange} /></label>
          <label>Teléfono<input name="telefono" value={form.telefono} onChange={handleChange} /></label>
          <label>Fecha de nacimiento<input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} /></label>
          <label>Estado
            <select name="estado" value={form.estado} onChange={handleChange}>
              <option value="activo">Activo</option>
              <option value="baja">Baja</option>
            </select>
          </label>
          <label>Categoría
            <select name="categoria_id" value={form.categoria_id} onChange={handleChange}>
              <option value="">Seleccione una categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </label>
          <label>Forma de pago
            <select name="forma_pago_id" value={form.forma_pago_id} onChange={handleChange}>
              <option value="">Seleccione una forma de pago</option>
              {formasPago.map((fp) => (
                <option key={fp.id} value={fp.id}>{fp.forma_de_pago}</option>
              ))}
            </select>
          </label>
          <label>Localidad<input name="localidad" value={form.localidad} onChange={handleChange} /></label>
          <label>Provincia<input name="provincia" value={form.provincia} onChange={handleChange} /></label>
          <label>Dirección<input name="direccion" value={form.direccion} onChange={handleChange} /></label>
          <label>Ocupación<input name="ocupacion" value={form.ocupacion} onChange={handleChange} /></label>
          <label>N° Carnet<input name="nro_carnet" value={form.nro_carnet} onChange={handleChange} /></label>

          {/* FOTO */}
          <div className="md:col-span-2">
  <label>Capturar Foto</label>
  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
    <video ref={videoRef} width="320" height="240" style={{ borderRadius: 8, border: "1px solid #ccc" }} />
    <canvas ref={canvasRef} width="320" height="240" style={{ display: "none" }} />
    
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button type="button" className="modern-btn" onClick={activarCamara}>
        🎥 Activar Cámara
      </button>
      <button type="button" className="modern-btn" onClick={capturarFoto}>
        📸 Tomar Foto
      </button>
    </div>
  </div>

  {form.foto_url && (
    <div style={{ marginTop: "10px" }}>
      <strong>Foto guardada:</strong><br />
      <img src={form.foto_url} alt="Foto del socio" width="160" style={{ borderRadius: 6, border: "1px solid #ccc" }} />
    </div>
  )}
</div>


          <label className="md:col-span-2">Observaciones
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} />
          </label>

          <div className="md:col-span-2">
            <button type="submit" className="modern-btn w-full">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
