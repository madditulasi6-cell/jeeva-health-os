import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />

      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Welcome to Jeeva Healthcare OS</h1>
        <p>The Future of Intelligent Healthcare.</p>

        <button>Book Appointment</button>
      </div>
    </>
  );
}

export default App;