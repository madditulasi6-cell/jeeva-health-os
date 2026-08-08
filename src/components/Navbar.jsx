function Navbar() {
  return (
    <nav
      style={{
        background: "#0B5ED7",
        color: "white",
        padding: "15px",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <h2>🏥 Jeeva Healthcare OS</h2>

      <div>
        <button>Home</button>
        <button>Services</button>
        <button>Doctors</button>
        <button>Contact</button>
      </div>
    </nav>
  );
}

export default Navbar;