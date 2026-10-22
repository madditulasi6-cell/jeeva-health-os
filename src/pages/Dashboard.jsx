
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [healthRecordsLoading, setHealthRecordsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setAppointmentsLoading(true);
    setHealthRecordsLoading(true);
    setErrorMessage("");

    try {
      // 1. Verify the currently logged-in user.
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setAppointments([]);
        setHealthRecords([]);
        return;
      }

      setUser(currentUser);

      // 2. Load the patient's profile.
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, full_name, created_at")
          .eq("id", currentUser.id)
          .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      setProfile(profileData || null);

      // 3. Find the patient record belonging to this user.
      const { data: patient, error: patientError } =
        await supabase
          .from("patients")
          .select("id")
          .eq("profile_id", currentUser.id)
          .maybeSingle();

      if (patientError) {
        console.error("Patient lookup error:", patientError);
        setErrorMessage(
          "Unable to load your patient profile. Please try again."
        );
        return;
      }

      if (!patient) {
        setErrorMessage(
          "Your account is logged in, but no patient profile was found."
        );
        return;
      }

      // 4. Load this patient's health records.
      const {
        data: recordData,
        error: recordError,
      } = await supabase
        .from("health_records")
        .select("*")
        .eq("patient_id", patient.id)
        .order("recorded_at", { ascending: false });

      if (recordError) {
        console.error("Health records error:", recordError);
        setHealthRecords([]);
      } else {
        setHealthRecords(recordData || []);
      }

      // 5. Load this patient's appointments.
      const {
        data: appointmentData,
        error: appointmentError,
      } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patient.id)
        .order("appointment_date", { ascending: true });

      if (appointmentError) {
        console.error("Appointments error:", appointmentError);
        setAppointments([]);
        setErrorMessage(
          "Unable to load appointments. Check your database permissions."
        );
        return;
      }

      const appointmentList = appointmentData || [];

      // 6. Collect the doctor IDs used by these appointments.
      const doctorIds = [
        ...new Set(
          appointmentList
            .map((appointment) => appointment.doctor_id)
            .filter(Boolean)
        ),
      ];

      let doctorsById = {};
      let profilesById = {};

      // 7. Fetch the matching doctors without requiring a joined query.
      if (doctorIds.length > 0) {
        const { data: doctorData, error: doctorError } =
          await supabase
            .from("doctors")
            .select("id, profile_id, specialization, doctor_code")
            .in("id", doctorIds);

        if (doctorError) {
          console.error("Doctor lookup error:", doctorError);
        } else {
          const doctorList = doctorData || [];

          doctorsById = Object.fromEntries(
            doctorList.map((doctor) => [doctor.id, doctor])
          );

          // 8. Fetch doctor names from the profiles table.
          const doctorProfileIds = [
            ...new Set(
              doctorList
                .map((doctor) => doctor.profile_id)
                .filter(Boolean)
            ),
          ];

          if (doctorProfileIds.length > 0) {
            const {
              data: doctorProfiles,
              error: doctorProfilesError,
            } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", doctorProfileIds);

            if (doctorProfilesError) {
              console.error(
                "Doctor profiles error:",
                doctorProfilesError
              );
            } else {
              profilesById = Object.fromEntries(
                (doctorProfiles || []).map((item) => [
                  item.id,
                  item,
                ])
              );
            }
          }
        }
      }

      // 9. Attach the doctor name and specialization to each appointment.
      const appointmentsWithDoctors = appointmentList.map(
        (appointment) => {
          const doctor = doctorsById[appointment.doctor_id];

          const doctorProfile = doctor
            ? profilesById[doctor.profile_id]
            : null;

          return {
            ...appointment,
            doctor: {
              full_name:
                doctorProfile?.full_name ||
                (doctor?.doctor_code
                  ? `Doctor ${doctor.doctor_code}`
                  : "Doctor name unavailable"),
              specialization:
                doctor?.specialization || "Not provided",
            },
          };
        }
      );

      setAppointments(appointmentsWithDoctors);
    } catch (error) {
      console.error("Dashboard error:", error);
      setErrorMessage(
        "Unable to load your dashboard. Please try again."
      );
    } finally {
      setLoading(false);
      setAppointmentsLoading(false);
      setHealthRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      setErrorMessage("Unable to log out. Please try again.");
      return;
    }

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main style={styles.container}>
        <h2>Loading Jeeva Healthcare OS...</h2>
        <p>Please wait while we load your dashboard.</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.container}>
        <h1>🏥 Jeeva Healthcare OS</h1>
        <h2>Please log in first</h2>
        <p>
          Log in to access your appointments and private health records.
        </p>
        <button
          style={styles.primaryButton}
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          Go to Login
        </button>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>🏥 Jeeva Patient Dashboard</h1>
          <p>Welcome to your healthcare dashboard.</p>
        </div>

        <button
          style={styles.secondaryButton}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </header>

      {errorMessage && (
        <div role="alert" style={styles.error}>
          <p>{errorMessage}</p>
          <button
            style={styles.secondaryButton}
            onClick={handleRefresh}
          >
            Try Again
          </button>
        </div>
      )}

      <section style={styles.card}>
        <h2>My Profile</h2>
        <p>
          <strong>Email:</strong> {user.email || "Not available"}
        </p>
        <p>
          <strong>Name:</strong>{" "}
          {profile?.full_name || "Not set yet"}
        </p>
        <p>
          <strong>Role:</strong> {profile?.role || "patient"}
        </p>
      </section>

      <section style={styles.card}>
        <h2>📅 My Appointments</h2>

        {appointmentsLoading ? (
          <p>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          appointments.map((appointment) => (
            <article key={appointment.id} style={styles.item}>
              <h3>🏥 Doctor Appointment</h3>

              <p>
                <strong>Date:</strong>{" "}
                {appointment.appointment_date || "Not provided"}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {appointment.appointment_time || "Not provided"}
              </p>

              <p>
                <strong>Doctor:</strong>{" "}
                {appointment.doctor?.full_name ||
                  "Doctor name unavailable"}
              </p>

              <p>
                <strong>Specialization:</strong>{" "}
                {appointment.doctor?.specialization ||
                  "Not provided"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {appointment.status || "Scheduled"}
              </p>

              <p>
                <strong>Reason:</strong>{" "}
                {appointment.reason || "Not provided"}
              </p>
            </article>
          ))
        )}
      </section>

      <section style={styles.card}>
        <h2>📋 My Health Records</h2>

        {healthRecordsLoading ? (
          <p>Loading health records...</p>
        ) : healthRecords.length === 0 ? (
          <p>No health records found.</p>
        ) : (
          healthRecords.map((record) => (
            <article key={record.id} style={styles.item}>
              <h3>{record.record_type || "Health Record"}</h3>

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
            </article>
          ))
        )}
      </section>

      <footer style={styles.footer}>
        <button
          style={styles.logoutButton}
          onClick={handleLogout}
        >
          Logout
        </button>
      </footer>
    </main>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#1f2937",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    overflowWrap: "anywhere",
  },
  item: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  primaryButton: {
    background: "#087f8c",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 18px",
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
  },
  logoutButton: {
    background: "#b91c1c",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 18px",
    cursor: "pointer",
  },
  error: {
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  footer: {
    padding: "8px 0 32px",
  },
};

export default Dashboard;
