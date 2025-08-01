import "./Home.css"; // Asegurate de crear este archivo junto al TSX

export default function Home() {
  return (
    <div className="home-container">
      <img
        src="/logo_caf.png"
        alt="Logo CAF"
        className="home-logo"
      />
      <div className="home-title">
        <span className="home-subheading">
          Bienvenido al Sistema del
        </span>
        <br />
        <span className="home-heading">
          CLUB ATLÉTICO FRANCK
        </span>
      </div>
      <p className="home-description">
        Esta será la interfaz para gestionar socios, cuotas y comprobantes.
      </p>
    </div>
  );
}
