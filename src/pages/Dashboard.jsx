
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const [healthRecords, setHealthRecords] = useState([]);
  const [healthRecordsLoading, setHealthRecordsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setAppointmentsLoading(true);
    setHealthRecordsLoading(true);

    try {
      // Check the current logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
      }

      if (!user) {
        setUser(null);
        setProfile(null);
        setAppointments([]);
        setHealthRecords([]);
        return;
      }

      setUser(user);

      // Load the user's profile
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      setProfile(profileData || null);

      // Find the patient record for this user
      const { data: patient, error: patientError } =
        await supabase
          .from("patients")
          .select("id")
          .eq("profile_id", user.id)
          .single();

      if (patientError || !patient) {
        console.error("Patient lookup error:", patientError);

        setAppointments([]);
        setHealthRecords([]);
        return;
      }

      // Load this patient's health records
      const { data: healthRecordData, error: healthRecordError } =
        await supabase
          .from("health_records")
          .select("*")
          .eq("patient_id", patient.id)
          .order("recorded_at", { ascending: false });

      if (healthRecordError) {
        console.error("Health records error:", healthRecordError);
        setHealthRecords([]);
      } else {
        setHealthRecords(healthRecordData || []);
      }

      setHealthRecordsLoading(false);

      // Load only this patient's appointments
      const { data: appointmentData, error: appointmentError } =
        await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patient.id)
          .order("appointment_date", { ascending: true });

      if (appointmentError) {
        console.error("Appointments error:", appointmentError);
        setAppointments([]);
      } else {
        const loadedAppointments = appointmentData || [];

        // Collect the unique doctor IDs for these appointments
        const doctorIds = [
          ...new Set(
            loadedAppointments
              .map((appointment) => appointment.doctor_id)
              .filter(Boolean)
          ),
        ];

        let doctorsById = {};

        // Fetch doctor details separately; no foreign-key join is required
        if (doctorIds.length > 0) {
          const { data: doctorData, error: doctorError } =
            await supabase
              .from("doctors")
              .select("id, full_name, specialization")
              .in("id", doctorIds);

          if (doctorError) {
            console.error("Doctor lookup error:", doctorError);
          } else {
            doctorsById = Object.fromEntries(
              (doctorData || []).map((doctor) => [
                doctor.id,
                doctor,
              ])
            );
          }
        }

        // Attach doctor details to each appointment
        const appointmentsWithDoctors = loadedAppointments.map(
          (appointment) => ({
            ...appointment,
            doctor: doctorsById[appointment.doctor_id] || null,
          })
        );

        setAppointments(appointmentsWithDoctors);
      }

      setAppointmentsLoading(false);
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setLoading(false);
      setAppointmentsLoading(false);
      setHealthRecordsLoading(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
      return;
    }

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Please log in first.</h2>
        <button onClick={() => (window.location.href = "/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "900px",
        margin: "auto",
      }}
    >
      <h1>🏥 Jeeva Patient Dashboard</h1>

      <p>
        <strong>Email:</strong> {user.email}
      </p>

      <p>
        <strong>Name:</strong>{" "}
        {profile?.full_name || "Not set yet"}
      </p>

      <p>
        <strong>Role:</strong>{" "}
        {profile?.role || "patient"}
      </p>

      <hr />

      <h2>Appointments</h2>

      {appointmentsLoading ? (
        <p>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <div>
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "15px",
              }}
            >
              <h3>🏥 Doctor Appointment</h3>

              <p>
                <strong>Date:</strong>{" "}
                {appointment.appointment_date || "Not available"}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {appointment.appointment_time || "Not available"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {appointment.status || "Scheduled"}
              </p>

              <p>
                <strong>Reason:</strong>{" "}
                {appointment.reason || "Not provided"}
              </p>

              <p>
                <strong>Doctor:</strong>{" "}
                {appointment.doctor?.full_name ||
                  "Doctor details unavailable"}
              </p>

              <p>
                <strong>Specialization:</strong>{" "}
                {appointment.doctor?.specialization ||
                  "Not available"}
              </p>
            </div>
          ))}
        </div>
      )}

      <hr />

      <h2>Health Records</h2>

      {healthRecordsLoading ? (
        <p>Loading health records...</p>
      ) : healthRecords.length === 0 ? (
        <p>No health records found.</p>
      ) : (
        <div>
          {healthRecords.map((record) => (
            <div
              key={record.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "15px",
              }}
            >
              <h3>📋 {record.record_type || "Health Record"}</h3>

              <p>
                <strong>Diagnosis:</strong>{" "}
                {record.diagnosis || "Not provided"}
              </p>

              <p>
                <strong>Symptoms:</strong>{" "}
                {record.symptoms || "Not provided"}
              </p>

              <p>
                <strong>Treatment:</strong>{" "}
                {record.treatment || "Not provided"}
              </p>

              <p>
                <strong>Notes:</strong>{" "}
                {record.notes || "Not provided"}
              </p>

              <p>
                <strong>Recorded:</strong>{" "}
                {record.recorded_at
                  ? new Date(record.recorded_at).toLocaleString()
                  : "Not available"}
              </p>
            </div>
          ))}
        </div>
      )}

      <button onClick={loadDashboard}>
        Refresh Dashboard
      </button>

      <button
        onClick={handleLogout}
        style={{ marginLeft: "10px" }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
