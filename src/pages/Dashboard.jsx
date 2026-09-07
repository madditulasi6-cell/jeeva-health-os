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
    console.log("Checking Jeeva session...");

const { data: sessionData, error: sessionError } =
  await supabase.auth.getSession();

console.log("JEEVA SESSION:", sessionData.session);
console.log("SESSION ERROR:", sessionError);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setAppointmentsLoading(false);
      return;
    }

    setUser(user);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
    }

    setProfile(profileData);

    // Find the patient record belonging to this logged-in user
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (patientError || !patient) {
      console.error("Patient lookup error:", patientError);
      setAppointments([]);
      setAppointmentsLoading(false);
      setLoading(false);
      return;
    }

        // Load this patient's health records
    setHealthRecordsLoading(true);

    const { data: healthRecordData, error: healthRecordError } =
      await supabase
        .from("health_records")
        .select("*")
        .eq("patient_id", patient.id)
        .order("recorded_at", { ascending: false });

    if (healthRecordError) {
      console.error("Health Records error:", healthRecordError);
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
      setAppointments(appointmentData || []);
    }

    setAppointmentsLoading(false);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
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
    <div style={{ padding: "40px", maxWidth: "900px", margin: "auto" }}>
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
                {appointment.appointment_date}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {appointment.appointment_time}
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
                <strong>Doctor ID:</strong>{" "}
                {appointment.doctor_id}
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
        <h3>📋 {record.record_type}</h3>

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