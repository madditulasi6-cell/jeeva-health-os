
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [healthRecordsLoading, setHealthRecordsLoading] = useState(true);

  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setAppointmentsLoading(true);
    setHealthRecordsLoading(true);
    setDashboardError("");

    try {
      console.log("Checking Jeeva Hospital OS session...");

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setAppointments([]);
        setHealthRecords([]);
        return;
      }

      setUser(currentUser);

      // Load the logged-in user's profile.
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

      if (profileError) {
        console.error("Jeeva profile error:", profileError);
      }

      setProfile(profileData || null);

      // Find the patient record belonging to this user.
      const { data: patient, error: patientError } =
        await supabase
          .from("patients")
          .select("id")
          .eq("profile_id", currentUser.id)
          .maybeSingle();

      if (patientError) {
        console.error("Jeeva patient lookup error:", patientError);
        setDashboardError("Unable to load your patient information.");
        return;
      }

      if (!patient) {
        console.warn("No patient record found for this account.");
        setAppointments([]);
        setHealthRecords([]);
        return;
      }

      console.log("JEEVA PATIENT ID:", patient.id);

      // Load this patient's health records.
      const {
        data: healthRecordData,
        error: healthRecordError,
      } = await supabase
        .from("health_records")
        .select("*")
        .eq("patient_id", patient.id)
        .order("recorded_at", { ascending: false });

      if (healthRecordError) {
        console.error(
          "Jeeva health records error:",
          healthRecordError
        );
        setHealthRecords([]);
      } else {
        setHealthRecords(healthRecordData || []);
        console.log(
          "JEEVA HEALTH RECORDS FOUND:",
          healthRecordData
        );
      }

      setHealthRecordsLoading(false);

      // Load this patient's appointments.
      const {
        data: appointmentData,
        error: appointmentError,
      } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patient.id)
        .order("appointment_date", { ascending: true });

      if (appointmentError) {
        console.error(
          "Jeeva appointments error:",
          appointmentError
        );
        setAppointments([]);
        setDashboardError("Unable to load appointments.");
        return;
      }

      const loadedAppointments = appointmentData || [];

      console.log(
        "JEEVA APPOINTMENTS FOUND:",
        loadedAppointments
      );

      // Collect the unique doctor IDs used by these appointments.
      const doctorIds = [
        ...new Set(
          loadedAppointments
            .map((appointment) => appointment.doctor_id)
            .filter(Boolean)
        ),
      ];

      const doctorsById = {};

      console.log("JEEVA DOCTOR IDS:", doctorIds);

      // Look up doctors using the confirmed doctors table columns.
      if (doctorIds.length > 0) {
        const { data: doctorData, error: doctorError } =
          await supabase
            .from("doctors")
            .select(
              "id, full_name, specialization, doctor_code"
            )
            .in("id", doctorIds);

        if (doctorError) {
          console.error(
            "JEEVA DOCTOR LOOKUP ERROR:",
            doctorError
          );
        } else {
          console.log("JEEVA DOCTORS FOUND:", doctorData);

          (doctorData || []).forEach((doctor) => {
            doctorsById[String(doctor.id)] = doctor;
          });
        }
      }

      // Attach the matching doctor to each appointment.
      const appointmentsWithDoctors = loadedAppointments.map(
        (appointment) => {
          const doctor = appointment.doctor_id
            ? doctorsById[String(appointment.doctor_id)] || null
            : null;

          if (!doctor && appointment.doctor_id) {
            console.warn(
              "Doctor details not returned for appointment:",
              appointment.id,
              "Doctor ID:",
              appointment.doctor_id
            );
          }

          return {
            ...appointment,
            doctor,
          };
        }
      );

      setAppointments(appointmentsWithDoctors);
    } catch (error) {
      console.error("Jeeva dashboard loading error:", error);
      setDashboardError(
        error?.message || "Unable to load the dashboard."
      );
    } finally {
      setLoading(false);
      setAppointmentsLoading(false);
      setHealthRecordsLoading(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Jeeva logout error:", error);
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

      {dashboardError && (
        <p style={{ color: "red" }} role="alert">
          {dashboardError}
        </p>
      )}

      <p>
        <strong>Email:</strong> {user.email}
      </p>

      <p>
        <strong>Name:</strong>{" "}
        {profile?.full_name || "Not set yet"}
      </p>

      <p>
        <strong>Role:</strong> {profile?.role || "patient"}
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
                  (appointment.doctor?.doctor_code
                    ? `Doctor ${appointment.doctor.doctor_code}`
                    : "Doctor details unavailable")}
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
              <h3>
                📋 {record.record_type || "Health Record"}
              </h3>

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
