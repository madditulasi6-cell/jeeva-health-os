import { useState } from "react";

function App() {
  const [showAppointment, setShowAppointment] = useState(false);

  const handleAppointment = (event) => {
    event.preventDefault();
    alert("Appointment request submitted successfully!");
    setShowAppointment(false);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          🏥 <span>Jeeva Healthcare OS</span>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#doctors">Doctors</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      {/* Hero */}
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

        {/* Services */}
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

        {/* Doctors */}
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

              <button
                onClick={() => setShowAppointment(true)}
              >
                Book Appointment
              </button>
            </div>

            <div className="doctor-card">
              <div className="doctor-avatar">👩‍⚕️</div>
              <h3>Dr. Wellness</h3>
              <p>Specialist Doctor</p>

              <button
                onClick={() => setShowAppointment(true)}
              >
                Book Appointment
              </button>
            </div>

            <div className="doctor-card">
              <div className="doctor-avatar">👨‍⚕️</div>
              <h3>Dr. Care</h3>
              <p>Medical Specialist</p>

              <button
                onClick={() => setShowAppointment(true)}
              >
                Book Appointment
              </button>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="contact-section">
          <h2>Ready to take control of your healthcare?</h2>

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

      {/* Appointment Modal */}
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
                placeholder="Enter your name"
                required
              />

              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                required
              />

              <label>Email</label>
              <input
                type="email"
                placeholder="Enter email address"
                required
              />

              <label>Choose Doctor</label>
              <select required>
                <option value="">Select a doctor</option>
                <option>Dr. Healthcare</option>
                <option>Dr. Wellness</option>
                <option>Dr. Care</option>
              </select>

              <label>Preferred Date</label>
              <input type="date" required />

              <label>Preferred Time</label>
              <input type="time" required />

              <label>Reason for Visit</label>
              <textarea
                placeholder="Briefly describe your reason for the visit"
                rows="3"
              ></textarea>

              <button type="submit" className="primary-btn submit-btn">
                Submit Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer>
        <div>
          <strong>🏥 Jeeva Healthcare OS</strong>
          <p>Intelligent healthcare for everyone.</p>
        </div>

        <p>© 2026 Jeeva Healthcare OS. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;