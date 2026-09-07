import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

function HomeApp() {
  const [showAppointment, setShowAppointment] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

const loadAppointments = async () => {
  setLoadingAppointments(true);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("JEEVA CURRENT USER:", user);

  if (!user) {
    setAppointments([]);
    setLoadingAppointments(false);
    return;
  }

  const { data, error } = await supabase
  .from("appointments")
 .select(`
  *,
  patients (
    patient_code,
    profile_id,
    profiles (
      full_name
    )
  ),
  doctors (
    full_name
  )
`)
  .order("created_at", { ascending: false });
  if (error) {
    console.error("APPOINTMENTS ERROR CODE:", error?.code);
console.error("APPOINTMENTS ERROR MESSAGE:", error?.message);
console.error("APPOINTMENTS ERROR DETAILS:", error?.details);
console.error("APPOINTMENTS ERROR HINT:", error?.hint);
    alert("Unable to load appointments.");
  } else {
    console.log("JEEVA APPOINTMENTS:", data);
   setAppointments(data || []);
  }

  setLoadingAppointments(false);
};
  useEffect(() => {
    loadAppointments();
  }, []);

  const handleAppointment = async (event) => {
    event.preventDefault();

    const form = event.target;

    const doctorIds = {
      "Dr. Healthcare": "f866925b-0980-431f-9040-51d620323871",
      "Dr. Wellness": "fbd3954c-e20d-43a1-bd78-5cbcbe53f14",
      "Dr. Care": "a8d25266-e6e4-4db6-a7f7-d5ec01cf52c0",
    };

  const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  alert("Please log in before booking an appointment.");
  return;
}

const { data: patient, error: patientError } = await supabase
  .from("patients")
  .select("id")
  .eq("profile_id", user.id)
  .single();

if (patientError || !patient) {
  console.error("Patient lookup error:", patientError);
  alert("Patient profile not found. Please complete your profile first.");
  return;
}

const appointment = {
  patient_id: patient.id,
  doctor_id: doctorIds[form.doctor.value],
  appointment_date: form.appointmentDate.value,
  appointment_time: form.appointmentTime.value,
  reason: form.reason.value,
};
    const { error } = await supabase
      .from("appointments")
      .insert([appointment]);

    if (error) {
      console.error("Appointment error:", error);
      alert("Unable to book appointment. Please try again.");
      return;
    }

    alert("Appointment booked successfully!");
    form.reset();
    setShowAppointment(false);

    await loadAppointments();
  };

  return (
    <div className="app">

      <header className="header">
        <div className="logo">
          🏥 <span>Jeeva Healthcare OS</span>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#doctors">Doctors</a>
          <a href="#contact">Contact</a>

          <button
            className="dashboard-btn"
            onClick={() => {
              setShowDashboard(true);
              loadAppointments();
            }}
          >
            Dashboard
          </button>
        </nav>
      </header>

      <main>

        <section id="home" className="hero">
          <div className="hero-content">

            <div className="badge">
              ● Intelligent Healthcare Platform
            </div>

            <h1>
              Smarter Healthcare.
              <br />
              <span>Better Lives.</span>
            </h1>

            <p>
              Jeeva Healthcare OS brings patients, doctors and healthcare
              services together in one simple digital platform.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-btn"
                onClick={() => setShowAppointment(true)}
              >
                Book Appointment
              </button>

              <a href="#services" className="secondary-btn">
                Explore Services
              </a>

            </div>
          </div>
        </section>

        <section id="services" className="section">

          <div className="section-title">
            <span>OUR SERVICES</span>
            <h2>Healthcare made simple</h2>

            <p>
              Everything you need to manage your healthcare journey.
            </p>
          </div>

          <div className="cards">

            <div className="card">
              <div className="card-icon">📅</div>
              <h3>Appointments</h3>
              <p>
                Book and manage doctor appointments quickly and easily.
              </p>
            </div>

            <div className="card">
              <div className="card-icon">👨‍⚕️</div>
              <h3>Find Doctors</h3>
              <p>
                Discover healthcare professionals and choose the right
                specialist.
              </p>
            </div>

            <div className="card">
              <div className="card-icon">💬</div>
              <h3>Health Assistant</h3>
              <p>
                Get help navigating healthcare information with our
                intelligent assistant.
              </p>
            </div>

            <div className="card">
              <div className="card-icon">📋</div>
              <h3>Health Records</h3>
              <p>
                Keep important healthcare information organized in one place.
              </p>
            </div>

          </div>
        </section>

        <section id="doctors" className="doctors-section">

          <div className="section-title">
            <span>OUR DOCTORS</span>
            <h2>Care from trusted professionals</h2>
          </div>

          <div className="doctor-cards">

            <div className="doctor-card">
              <div className="doctor-avatar">👨‍⚕️</div>
              <h3>Dr. Healthcare</h3>
              <p>General Physician</p>

              <button onClick={() => setShowAppointment(true)}>
                Book Appointment
              </button>
            </div>

            <div className="doctor-card">
              <div className="doctor-avatar">👩‍⚕️</div>
              <h3>Dr. Wellness</h3>
              <p>Specialist Doctor</p>

              <button onClick={() => setShowAppointment(true)}>
                Book Appointment
              </button>
            </div>

            <div className="doctor-card">
              <div className="doctor-avatar">👨‍⚕️</div>
              <h3>Dr. Care</h3>
              <p>Medical Specialist</p>

              <button onClick={() => setShowAppointment(true)}>
                Book Appointment
              </button>
            </div>

          </div>
        </section>

        <section id="contact" className="contact-section">

          <h2>
            Ready to take control of your healthcare?
          </h2>

          <p>
            Start your healthcare journey with Jeeva Healthcare OS.
          </p>

          <button
            className="primary-btn"
            onClick={() => setShowAppointment(true)}
          >
            Get Started
          </button>

        </section>

      </main>

      {/* DASHBOARD */}

      {showDashboard && (
        <div className="modal-overlay">

          <div className="appointment-modal">

            <button
              className="close-button"
              onClick={() => setShowDashboard(false)}
            >
              ×
            </button>

            <h2>Appointment Dashboard</h2>

            {loadingAppointments ? (

              <p>Loading appointments...</p>

            ) : appointments.length === 0 ? (

              <p>No appointments found.</p>

            ) : (

              appointments.map((appointment) => (

                <div className="card" key={appointment.id}>

                  <h3>Appointment</h3>

                  <p>
                    <strong>Date:</strong>{" "}
                    {appointment.appointment_date}
                  </p>

                  <p>
                    <strong>Time:</strong>{" "}
                    {appointment.appointment_time}
                  </p>

                <p>
  <strong>Patient:</strong>{" "}
  {appointment.patients?.profiles?.full_name || "Patient"}
</p>

<p>
  <strong>Doctor:</strong>{" "}
  {appointment.doctors?.full_name || "Doctor"}
</p>

<p>
  <strong>Status:</strong>{" "}
  {appointment.status || "Scheduled"}
</p>

<p>
  <strong>Reason:</strong>{" "}
  {appointment.reason || "Not provided"}
</p>

                </div>

              ))
            )}

            <button
              className="primary-btn"
              onClick={loadAppointments}
            >
              Refresh Appointments
            </button>

          </div>
        </div>
      )}

      {/* APPOINTMENT FORM */}

      {showAppointment && (

        <div className="modal-overlay">

          <div className="appointment-modal">

            <button
              className="close-button"
              onClick={() => setShowAppointment(false)}
            >
              ×
            </button>

            <h2>Book an Appointment</h2>

            <p>
              Please enter your details and preferred appointment time.
            </p>

            <form onSubmit={handleAppointment}>

              <label>Full Name</label>

              <input
                type="text"
                name="fullName"
                placeholder="Enter your name"
                required
              />

              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                required
              />

              <label>Email</label>

              <input
                type="email"
                name="email"
                placeholder="Enter email address"
                required
              />

              <label>Choose Doctor</label>

              <select name="doctor" required>

                <option value="">
                  Select a doctor
                </option>

                <option>
                  Dr. Healthcare
                </option>

                <option>
                  Dr. Wellness
                </option>

                <option>
                  Dr. Care
                </option>

              </select>

              <label>Preferred Date</label>

              <input
                type="date"
                name="appointmentDate"
                required
              />

              <label>Preferred Time</label>

              <input
                type="time"
                name="appointmentTime"
                required
              />

              <label>Reason for Visit</label>

              <textarea
                name="reason"
                placeholder="Briefly describe your reason for the visit"
                rows="3"
              />

              <button
                type="submit"
                className="primary-btn submit-btn"
              >
                Submit Appointment
              </button>

            </form>

          </div>

        </div>
      )}

      <footer>

        <div>
          <strong>🏥 Jeeva Healthcare OS</strong>

          <p>
            Intelligent healthcare for everyone.
          </p>
        </div>

        <p>
          © 2026 Jeeva Healthcare OS. All rights reserved.
        </p>

      </footer>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeApp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;