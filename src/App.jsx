import { useState, useEffect } from "react";
import { supabase } from './supabase';
import LandingPage from './LandingPage';

const DOCTORS = [
  { id: 1, name: "Dr. Adaeze Okafor", specialty: "General Practice", avatar: "AO", available: ["09:00", "10:00", "11:30", "14:00", "15:30"], color: "#2D6A4F" },
  { id: 2, name: "Dr. Emeka Nwosu", specialty: "Cardiology", avatar: "EN", available: ["09:30", "11:00", "14:30", "16:00"], color: "#1B4965" },
  { id: 3, name: "Dr. Fatima Bello", specialty: "Paediatrics", avatar: "FB", available: ["08:30", "10:30", "13:00", "15:00"], color: "#6B2D8B" },
  { id: 4, name: "Dr. Chidi Eze", specialty: "Dermatology", avatar: "CE", available: ["09:00", "12:00", "14:00", "16:30"], color: "#8B2D2D" },
];

const DATES = (() => {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: i === 0 ? "Today" : days[d.getDay()],
      date: d.getDate(),
      month: months[d.getMonth()],
      full: d.toDateString(),
    };
  });
})();

export default function App() {
  // showLanding controls whether we show the landing page or the app
  const [showLanding, setShowLanding] = useState(true);

  const [auth, setAuth] = useState({ user: null, role: null });
  const [view, setView] = useState("landing");
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({ doctor: null, date: null, time: null });
  const [form, setForm] = useState({ name: "", phone: "", reason: "", email: "", password: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");
  const [queue, setQueue] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  useEffect(() => {
    if (auth.role === "staff") {
      const fetchQueue = async () => {
        const { data } = await supabase
          .from('appointments')
          .select('*')
          .order('appointment_time', { ascending: true });
        if (data) setQueue(data);
      };
      fetchQueue();
      const interval = setInterval(fetchQueue, 30000);
      return () => clearInterval(interval);
    }
  }, [auth.role]);
  const [authError, setAuthError] = useState("");
  const [doctors, setDoctors] = useState(DOCTORS);
  const [analytics, setAnalytics] = useState({ total: 0, today: 0, completed: 0 });
  const [adminForm, setAdminForm] = useState({ name: "", specialty: "", avatar: "", color: "#2D6A4F", image: null });

  const goStep = (n) => setStep(n);
  const doctor = DOCTORS.find(d => d.id === selected.doctor);

  const handlePatientSignup = async () => {
    setLoading(true);
    setAuthError("");
    try {
      if (form.email && form.password && form.name) {
        setAuth({ user: { email: form.email }, role: "patient", name: form.name });
        setView("book");
        setForm({ name: "", phone: "", reason: "", email: "", password: "" });
        return;
      }
      setAuthError("Please fill all fields");
    } catch (error) {
      setAuthError(error?.message || "Signup failed");
    }
    setLoading(false);
  };

  const handlePatientLogin = async () => {
    setLoading(true);
    setAuthError("");
    try {
      if (form.email === "demo@clinicflow.com" && form.password === "demo123") {
        setAuth({ user: { email: form.email }, role: "patient", name: "Demo Patient" });
        setView("book");
        setForm({ name: "", phone: "", reason: "", email: "", password: "" });
      } else {
        setAuthError("Use demo@clinicflow.com / demo123 or sign up");
      }
    } catch (error) {
      setAuthError(error?.message || "Login failed");
    }
    setLoading(false);
  };

  const handleStaffLogin = async () => {
    setLoading(true);
    setAuthError("");
    if (form.email === "staff@clinicflow.com" && form.password === "staff123") {
      setAuth({ user: { email: form.email }, role: "staff" });
      setView("queue");
      setForm({ name: "", phone: "", reason: "", email: "", password: "" });
    } else {
      setAuthError("Invalid staff credentials");
    }
    setLoading(false);
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    setAuthError("");
    if (form.email === "admin@clinicflow.com" && form.password === "admin123") {
      setAuth({ user: { email: form.email }, role: "admin" });
      setView("admin");
      setForm({ name: "", phone: "", reason: "", email: "", password: "" });
      fetchAnalytics();
    } else {
      setAuthError("Invalid admin credentials");
    }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase.from('appointments').select('*');
      if (error) throw error;
      const today = new Date().toDateString();
      setAnalytics({
        total: data?.length || 0,
        today: data?.filter(a => a.appointment_date === today).length || 0,
        completed: data?.filter(a => a.status === 'completed').length || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const addDoctor = () => {
    if (!adminForm.name || !adminForm.specialty || !adminForm.avatar) {
      setAuthError("Please fill all doctor details");
      return;
    }
    const newDoctor = {
      id: Math.max(...doctors.map(d => d.id), 0) + 1,
      name: adminForm.name,
      specialty: adminForm.specialty,
      avatar: adminForm.avatar,
      color: adminForm.color,
      image: adminForm.image,
      available: ["09:00", "10:00", "11:00", "14:00", "15:00"]
    };
    setDoctors([...doctors, newDoctor]);
    setAdminForm({ name: "", specialty: "", avatar: "", color: "#2D6A4F", image: null });
    setAuthError("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminForm(f => ({ ...f, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteDoctor = (id) => {
    setDoctors(doctors.filter(d => d.id !== id));
  };

  const reset = () => {
    setStep(1);
    setSelected({ doctor: null, date: null, time: null });
    setForm({ name: "", phone: "", reason: "", email: "", password: "" });
    setConfirmed(false);
    setReference("");
    setView("book");
  };

  // If showing landing page, render LandingPage with a callback to enter the app
  if (showLanding) {
    return <LandingPage onGetStarted={() => { setShowLanding(false); setView("landing"); }} />;
  }

  // Otherwise render the existing clinic app
  return (
    <div style={{ minHeight: "100vh", background: "#F5F2EE", fontFamily: "Georgia, serif" }}>
      {/* HEADER */}
      <header style={{ background: "#0F2419", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#4CAF82", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏥</div>
<span onClick={() => setShowLanding(true)} style={{ color: "#F5F2EE", fontWeight: 700, fontSize: 18, cursor: "pointer" }}>ClinicFlow</span>
        </div>
        {auth.user && (
          <button onClick={() => { setAuth({ user: null, role: null }); setView("landing"); setShowLanding(true); }}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#F5F2EE", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
            Sign Out
          </button>
        )}
      </header>

      <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>

        {/* LOGIN SELECTION */}
        {view === "landing" && (
          <div style={{ textAlign: "center", paddingTop: 32 }}>
            <div style={{ width: 72, height: 72, background: "#4CAF82", borderRadius: 20, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏥</div>
            <h1 style={{ fontSize: 28, color: "#0F2419", margin: "0 0 8px" }}>ClinicFlow</h1>
            <p style={{ fontSize: 15, color: "#6B6560", margin: "0 0 40px" }}>Healthcare booking made simple</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => setView("patientAuth")} style={{ background: "#4CAF82", color: "#0F2419", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>🧑‍⚕️ Patient Login / Sign Up</button>
              <button onClick={() => setView("staffAuth")} style={{ background: "#1B4965", color: "#F5F2EE", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>👨‍💼 Staff Login</button>
              <button onClick={() => setView("adminAuth")} style={{ background: "#6B2D8B", color: "#F5F2EE", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>⚙️ Admin Login</button>
            </div>
          </div>
        )}

        {/* PATIENT AUTH */}
        {view === "patientAuth" && (
          <div>
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: "#4CAF82", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>← Back</button>
            <h2 style={{ fontSize: 22, color: "#0F2419", margin: "0 0 24px" }}>Patient Portal</h2>
            {authError && <div style={{ background: "#8B2D2D", color: "#F5F2EE", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {authError}</div>}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>FULL NAME</label>
              <input type="text" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>EMAIL</label>
              <input type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>PASSWORD</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={handlePatientSignup} disabled={loading}
              style={{ width: "100%", padding: "14px", background: "#4CAF82", color: "#0F2419", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
              {loading ? "..." : "Sign Up"}
            </button>
            <button onClick={handlePatientLogin} disabled={loading}
              style={{ width: "100%", padding: "14px", background: "#0F2419", color: "#4CAF82", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "..." : "Log In"}
            </button>
          </div>
        )}

        {/* STAFF AUTH */}
        {view === "staffAuth" && (
          <div>
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: "#4CAF82", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>← Back</button>
            <h2 style={{ fontSize: 22, color: "#0F2419", margin: "0 0 24px" }}>Staff Login</h2>
            {authError && <div style={{ background: "#8B2D2D", color: "#F5F2EE", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {authError}</div>}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>EMAIL</label>
              <input type="email" placeholder="staff@clinicflow.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>PASSWORD</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={handleStaffLogin} disabled={loading}
              style={{ width: "100%", padding: "14px", background: "#1B4965", color: "#F5F2EE", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "..." : "Log In as Staff"}
            </button>
          </div>
        )}

        {/* ADMIN AUTH */}
        {view === "adminAuth" && (
          <div>
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: "#4CAF82", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>← Back</button>
            <h2 style={{ fontSize: 22, color: "#0F2419", margin: "0 0 24px" }}>Admin Login</h2>
            {authError && <div style={{ background: "#8B2D2D", color: "#F5F2EE", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {authError}</div>}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>EMAIL</label>
              <input type="email" placeholder="admin@clinicflow.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>PASSWORD</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={handleAdminLogin} disabled={loading}
              style={{ width: "100%", padding: "14px", background: "#6B2D8B", color: "#F5F2EE", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "..." : "Log In as Admin"}
            </button>
          </div>
        )}

        {/* BOOKING FLOW */}
        {view === "book" && auth.role === "patient" && (
          <div>
            <h2 style={{ fontSize: 22, color: "#0F2419", margin: "0 0 20px" }}>Book Appointment</h2>

            {step === 1 && (
              <div>
                <p style={{ fontSize: 13, color: "#8C8479", marginBottom: 16 }}>Select a doctor</p>
                {doctors.map(doc => (
                  <div key={doc.id} onClick={() => { setSelected(s => ({ ...s, doctor: doc.id })); goStep(2); }}
                    style={{ background: "#fff", border: `2px solid ${selected.doctor === doc.id ? "#4CAF82" : "#E8E4DF"}`, borderRadius: 14, padding: "16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                    {doc.image ? (
                      <img src={doc.image} alt={doc.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: doc.color, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{doc.avatar}</div>
                    )}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0F2419" }}>{doc.name}</div>
                      <div style={{ fontSize: 13, color: "#8C8479" }}>{doc.specialty}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div>
                <button onClick={() => goStep(1)} style={{ background: "none", border: "none", color: "#4CAF82", fontSize: 14, cursor: "pointer", marginBottom: 16 }}>← Back</button>
                <p style={{ fontSize: 13, color: "#8C8479", marginBottom: 16 }}>Select a date</p>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, marginBottom: 20 }}>
                  {DATES.map(d => (
                    <div key={d.full} onClick={() => setSelected(s => ({ ...s, date: d.full }))}
                      style={{ minWidth: 64, background: selected.date === d.full ? "#4CAF82" : "#fff", border: `2px solid ${selected.date === d.full ? "#4CAF82" : "#E8E4DF"}`, borderRadius: 12, padding: "12px 8px", textAlign: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: 11, color: selected.date === d.full ? "#0F2419" : "#8C8479" }}>{d.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: selected.date === d.full ? "#0F2419" : "#0F2419" }}>{d.date}</div>
                      <div style={{ fontSize: 11, color: selected.date === d.full ? "#0F2419" : "#8C8479" }}>{d.month}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: "#8C8479", marginBottom: 12 }}>Select a time</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                  {doctor?.available.map(t => (
                    <div key={t} onClick={() => setSelected(s => ({ ...s, time: t }))}
                      style={{ background: selected.time === t ? "#4CAF82" : "#fff", border: `2px solid ${selected.time === t ? "#4CAF82" : "#E8E4DF"}`, borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 14, fontWeight: 600, color: selected.time === t ? "#0F2419" : "#0F2419", cursor: "pointer" }}>
                      {t}
                    </div>
                  ))}
                </div>
                <button onClick={() => selected.date && selected.time && goStep(3)} disabled={!selected.date || !selected.time}
                  style={{ width: "100%", padding: "14px", background: selected.date && selected.time ? "#4CAF82" : "#E8E4DF", color: "#0F2419", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: selected.date && selected.time ? "pointer" : "not-allowed" }}>
                  Continue →
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <button onClick={() => goStep(2)} style={{ background: "none", border: "none", color: "#4CAF82", fontSize: 14, cursor: "pointer", marginBottom: 16 }}>← Back</button>
                <p style={{ fontSize: 13, color: "#8C8479", marginBottom: 16 }}>Your details</p>
                {["name", "phone", "reason"].map(field => (
                  <div key={field} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>{field.toUpperCase()}</label>
                    <input type="text" placeholder={field === "name" ? "Full name" : field === "phone" ? "08012345678" : "Reason for visit"}
                      value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
                <button onClick={async () => {
                  if (!form.name || !form.phone) return;
                  setLoading(true);
                  const ref = "CF-" + Math.random().toString(36).substr(2, 6).toUpperCase();
                  setReference(ref);
                  try {
                    await supabase.from('appointments').insert([{
                      patient_name: form.name, phone: form.phone, reason: form.reason,
                      doctor_id: selected.doctor, doctor_name: doctor?.name,
                      appointment_date: selected.date, appointment_time: selected.time,
                      reference: ref, status: 'pending'
                    }]);
                  } catch (e) { console.error(e); }
                  setLoading(false);
                  setView("confirm");
                }} disabled={loading || !form.name || !form.phone}
                  style={{ width: "100%", padding: "14px", background: "#4CAF82", color: "#0F2419", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                  {loading ? "Booking..." : "Confirm Booking →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STAFF QUEUE */}
        {view === "queue" && auth.role === "staff" && (
          <div>
            <h2 style={{ fontSize: 22, color: "#0F2419", margin: "0 0 20px" }}>📋 Today's Queue</h2>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, overflowX: "auto" }}>
              <button onClick={() => setSelectedDoctorId(null)}
                style={{ padding: "8px 16px", background: selectedDoctorId === null ? "#4CAF82" : "#fff", border: "2px solid #E8E4DF", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                All
              </button>
              {doctors.map(d => (
                <button key={d.id} onClick={() => setSelectedDoctorId(d.id)}
                  style={{ padding: "8px 16px", background: selectedDoctorId === d.id ? "#4CAF82" : "#fff", border: "2px solid #E8E4DF", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {d.name.split(" ")[1]}
                </button>
              ))}
            </div>
            {queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#8C8479" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <p>No appointments yet</p>
              </div>
            ) : (
              <div>
                {queue.filter(a => !selectedDoctorId || a.doctor_id === selectedDoctorId).map((appt, idx) => (
                  <div key={appt.id || idx} style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F2419" }}>{appt.patient_name}</div>
                        <div style={{ fontSize: 13, color: "#6B6560", marginTop: 2 }}>{appt.doctor_name}</div>
                      </div>
                      <div style={{ background: "#4CAF82", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>#{idx + 1}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                      <div><span style={{ color: "#8C8479" }}>📅 Time</span><div style={{ color: "#0F2419", fontWeight: 600 }}>{appt.appointment_time}</div></div>
                      <div><span style={{ color: "#8C8479" }}>🆔 Ref</span><div style={{ color: "#0F2419", fontWeight: 600 }}>{appt.reference}</div></div>
                    </div>
                    <div style={{ marginTop: 12, padding: "8px 12px", background: "#F5F2EE", borderRadius: 8, fontSize: 12, color: "#6B6560" }}>{appt.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONFIRMATION */}
        {view === "confirm" && auth.role === "patient" && (
          <div style={{ textAlign: "center", paddingTop: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#4CAF82", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✓</div>
            <h2 style={{ fontSize: 24, color: "#0F2419", margin: "0 0 8px" }}>Booked!</h2>
            <p style={{ fontSize: 15, color: "#6B6560", margin: "0 0 28px" }}>Your appointment is confirmed.</p>
            <div style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 16, padding: "20px", textAlign: "left", marginBottom: 24 }}>
              {[["Patient", form.name], ["Doctor", doctor?.name], ["Date", selected.date], ["Time", selected.time], ["Reference", reference]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F0EDE8" }}>
                  <span style={{ fontSize: 13, color: "#8C8479" }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#0F2419", fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={reset} style={{ background: "#0F2419", color: "#4CAF82", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Book Another →</button>
          </div>
        )}

        {/* ADMIN DASHBOARD */}
        {view === "admin" && auth.role === "admin" && (
          <div>
            <h2 style={{ fontSize: 24, color: "#0F2419", margin: "0 0 20px" }}>📊 Admin Dashboard</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              <div style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#4CAF82" }}>{analytics.total}</div>
                <div style={{ fontSize: 12, color: "#8C8479", marginTop: 6 }}>Total Bookings</div>
              </div>
              <div style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#1B4965" }}>{analytics.today}</div>
                <div style={{ fontSize: 12, color: "#8C8479", marginTop: 6 }}>Today</div>
              </div>
              <div style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#6B2D8B" }}>{analytics.completed}</div>
                <div style={{ fontSize: 12, color: "#8C8479", marginTop: 6 }}>Completed</div>
              </div>
            </div>

            <h3 style={{ fontSize: 18, color: "#0F2419", margin: "24px 0 16px" }}>👨‍⚕️ Doctor Management</h3>
            {authError && <div style={{ background: "#8B2D2D", color: "#F5F2EE", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {authError}</div>}

            <div style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 12, padding: "16px", marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, color: "#0F2419", margin: "0 0 12px" }}>Add New Doctor</h4>
              {["name", "specialty", "avatar"].map(field => (
                <div key={field} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>{field === "avatar" ? "INITIALS" : field.toUpperCase()}</label>
                  <input type="text" placeholder={field === "name" ? "Dr. Name" : field === "specialty" ? "e.g. Cardiology" : "e.g. AO"} maxLength={field === "avatar" ? 2 : undefined}
                    value={adminForm[field]} onChange={e => setAdminForm(f => ({ ...f, [field]: field === "avatar" ? e.target.value.toUpperCase() : e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #E8E4DF", borderRadius: 8, fontSize: 14, fontFamily: "Georgia", background: "#F5F2EE", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>AVATAR COLOR</label>
                <input type="color" value={adminForm.color} onChange={e => setAdminForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: "100%", padding: "8px", border: "2px solid #E8E4DF", borderRadius: 8, cursor: "pointer" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>DOCTOR PHOTO</label>
                <input type="file" accept="image/*" onChange={handleImageUpload}
                  style={{ width: "100%", padding: "8px", border: "2px solid #E8E4DF", borderRadius: 8, fontSize: 12, cursor: "pointer" }} />
                {adminForm.image && <div style={{ fontSize: 10, color: "#4CAF82", marginTop: 4 }}>✓ Image selected</div>}
              </div>
              <button onClick={addDoctor} style={{ width: "100%", padding: "10px", background: "#4CAF82", color: "#0F2419", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Doctor</button>
            </div>

            <h4 style={{ fontSize: 14, color: "#0F2419", margin: "16px 0 12px" }}>Active Doctors ({doctors.length})</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {doctors.map(doc => (
                <div key={doc.id} style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 12, padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    {doc.image ? (
                      <img src={doc.image} alt={doc.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: doc.color, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{doc.avatar}</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2419" }}>{doc.name}</div>
                      <div style={{ fontSize: 10, color: "#8C8479" }}>{doc.specialty}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteDoctor(doc.id)} style={{ width: "100%", padding: "6px", background: "#8B2D2D", color: "#F5F2EE", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#B0AAA3", borderTop: "1px solid #E8E4DF" }}>
        ClinicFlow · Built for Lagos Private Healthcare
      </footer>
    </div>
  );
}