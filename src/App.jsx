import { useState, useEffect } from "react";
import { supabase } from './supabase';

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
      // Demo: Create local patient account
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
      // Demo patient: demo@clinicflow.com / demo123
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

  const handleLogout = () => {
    setAuth({ user: null, role: null });
    setView("landing");
    setForm({ name: "", phone: "", reason: "", email: "", password: "" });
    setConfirmed(false);
  };

  useEffect(() => {
    if (view === "queue" && auth.role === "staff") {
      fetchQueue();
      const interval = setInterval(fetchQueue, 5000);
      return () => clearInterval(interval);
    }
  }, [view, selectedDoctorId, auth.role]);

  const fetchQueue = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('status', 'scheduled')
        .order('appointment_date, appointment_time', { ascending: true });
      
      if (selectedDoctorId) {
        query = query.eq('doctor_id', selectedDoctorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setQueue(data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    const ref = `CF-${Math.floor(Math.random() * 9000 + 1000)}`;

    const { error } = await supabase.from('appointments').insert([{
      patient_name: form.name,
      phone: form.phone,
      reason: form.reason,
      doctor_id: selected.doctor,
      doctor_name: doctor?.name,
      appointment_date: selected.date,
      appointment_time: selected.time,
      reference: ref,
      status: 'scheduled'
    }]);

    setLoading(false);

    if (error) {
      alert('Booking failed. Please try again.');
      console.error(error);
      return;
    }

    setReference(ref);
    // Call WhatsApp reminder function
await supabase.functions.invoke('send-whatsapp-reminder', {
  body: {
    patient_name: form.name,
    phone: form.phone,
    doctor_name: doctor?.name,
    appointment_date: selected.date,
    appointment_time: selected.time,
    reference: ref
  }
})
    setConfirmed(true);
    setView('confirm');
  };

  const reset = () => {
    setStep(1);
    setSelected({ doctor: null, date: null, time: null });
    setForm(f => ({ ...f, name: "", reason: "" }));
    setConfirmed(false);
    setView("book");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F2EE", fontFamily: "'Georgia', serif", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "#0F2419", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <span style={{ color: "#F5F2EE", fontWeight: 700, fontSize: 20 }}>Clinic<span style={{ color: "#4CAF82" }}>Flow</span></span>
        {auth.user && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#A8C5B5", fontSize: 14 }}>{auth.role === "staff" ? "👤 Staff" : auth.role === "admin" ? "⚙️ Admin" : "👤 " + (auth.name || form.name)}</span>
            <button onClick={handleLogout} style={{ background: "#8B2D2D", color: "#F5F2EE", border: "none", borderRadius: 20, padding: "6px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              Logout
            </button>
          </div>
        )}
      </header>

      <main style={{ flex: 1, padding: "24px 16px", maxWidth: 560, margin: "0 auto", width: "100%" }}>

        {/* LANDING PAGE */}
        {view === "landing" && !auth.user && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🏥</div>
            <h1 style={{ fontSize: 32, color: "#0F2419", margin: "0 0 8px" }}>ClinicFlow</h1>
            <p style={{ fontSize: 16, color: "#6B6560", margin: "0 0 40px" }}>Healthcare booking made simple</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => setView("patient-auth")} style={{ background: "#4CAF82", color: "#0F2419", border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                👤 Patient Login / Sign Up
              </button>
              <button onClick={() => setView("staff-login")} style={{ background: "#1B4965", color: "#F5F2EE", border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                👨‍💼 Staff Login
              </button>
              <button onClick={() => setView("admin-login")} style={{ background: "#6B2D8B", color: "#F5F2EE", border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                ⚙️ Admin Login
              </button>
            </div>
          </div>
        )}

        {/* PATIENT AUTH */}
        {view === "patient-auth" && !auth.user && (
          <div>
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: "#4CAF82", cursor: "pointer", marginBottom: 20, fontSize: 14, fontWeight: 600 }}>← Back</button>
            
            <h2 style={{ fontSize: 24, color: "#0F2419", margin: "0 0 20px" }}>Patient Portal</h2>            <p style={{ fontSize: 14, color: "#6B6560", margin: "0 0 20px" }}>Demo login: demo@clinicflow.com / demo123</p>            
            {authError && <div style={{ background: "#8B2D2D", color: "#F5F2EE", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {authError}</div>}
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>FULL NAME</label>
              <input type="text" placeholder="Your name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>PHONE</label>
              <input type="tel" placeholder="Your phone" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>EMAIL</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>PASSWORD</label>
              <input type="password" placeholder="At least 6 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handlePatientSignup} disabled={!form.email || !form.password || loading} style={{ flex: 1, padding: "14px", background: form.email && form.password ? "#4CAF82" : "#C8C3BC", color: "#0F2419", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {loading ? "Creating..." : "Sign Up"}
              </button>
              <button onClick={handlePatientLogin} disabled={!form.email || !form.password || loading} style={{ flex: 1, padding: "14px", background: form.email && form.password ? "#1B4965" : "#C8C3BC", color: form.email && form.password ? "#F5F2EE" : "#0F2419", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </div>
        )}

        {/* STAFF LOGIN */}
        {view === "staff-login" && !auth.user && (
          <div>
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: "#4CAF82", cursor: "pointer", marginBottom: 20, fontSize: 14, fontWeight: 600 }}>← Back</button>
            
            <h2 style={{ fontSize: 24, color: "#0F2419", margin: "0 0 8px" }}>Staff Login</h2>
            <p style={{ fontSize: 14, color: "#6B6560", margin: "0 0 20px" }}>Demo credentials: staff@clinicflow.com / staff123</p>
            
            {authError && <div style={{ background: "#8B2D2D", color: "#F5F2EE", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {authError}</div>}
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>EMAIL</label>
              <input type="email" placeholder="staff@clinicflow.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>PASSWORD</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>

            <button onClick={handleStaffLogin} disabled={!form.email || !form.password || loading} style={{ width: "100%", padding: "14px", background: form.email && form.password ? "#1B4965" : "#C8C3BC", color: form.email && form.password ? "#F5F2EE" : "#0F2419", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Logging in..." : "Staff Login →"}
            </button>
          </div>
        )}

        {/* ADMIN LOGIN */}
        {view === "admin-login" && !auth.user && (
          <div>
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: "#4CAF82", cursor: "pointer", marginBottom: 20, fontSize: 14, fontWeight: 600 }}>← Back</button>
            
            <h2 style={{ fontSize: 24, color: "#0F2419", margin: "0 0 8px" }}>Admin Login</h2>
            <p style={{ fontSize: 14, color: "#6B6560", margin: "0 0 20px" }}>Demo credentials: admin@clinicflow.com / admin123</p>
            
            {authError && <div style={{ background: "#8B2D2D", color: "#F5F2EE", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {authError}</div>}
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>EMAIL</label>
              <input type="email" placeholder="admin@clinicflow.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>PASSWORD</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>

            <button onClick={handleAdminLogin} disabled={!form.email || !form.password || loading} style={{ width: "100%", padding: "14px", background: form.email && form.password ? "#6B2D8B" : "#C8C3BC", color: form.email && form.password ? "#F5F2EE" : "#0F2419", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Logging in..." : "Admin Login →"}
            </button>
          </div>
        )}

        {/* STAFF LOGIN */}
        {view === "staff-login" && !auth.user && (
          <div>
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: "#4CAF82", cursor: "pointer", marginBottom: 20, fontSize: 14, fontWeight: 600 }}>← Back</button>
            
            <h2 style={{ fontSize: 24, color: "#0F2419", margin: "0 0 8px" }}>Staff Login</h2>
            <p style={{ fontSize: 14, color: "#6B6560", margin: "0 0 20px" }}>Demo credentials: staff@clinicflow.com / staff123</p>
            
            {authError && <div style={{ background: "#8B2D2D", color: "#F5F2EE", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {authError}</div>}
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>EMAIL</label>
              <input type="email" placeholder="staff@clinicflow.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>PASSWORD</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
            </div>

            <button onClick={handleStaffLogin} disabled={!form.email || !form.password || loading} style={{ width: "100%", padding: "14px", background: form.email && form.password ? "#1B4965" : "#C8C3BC", color: form.email && form.password ? "#F5F2EE" : "#0F2419", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Logging in..." : "Staff Login →"}
            </button>
          </div>
        )}

        {/* BOOKING (Patient only) */}
        {view === "book" && auth.role === "patient" && !confirmed && (
          <div>
            {/* Steps */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
              {["Doctor", "Date", "Time", "Details"].map((label, i) => {
                const n = i + 1;
                return (
                  <div key={n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: step > n ? "#4CAF82" : step === n ? "#0F2419" : "#D4CFC8", color: step > n ? "#0F2419" : step === n ? "#4CAF82" : "#8C8479", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, border: step === n ? "2px solid #4CAF82" : "none" }}>
                        {step > n ? "✓" : n}
                      </div>
                      <span style={{ fontSize: 10, color: step === n ? "#0F2419" : "#8C8479", marginTop: 3 }}>{label}</span>
                    </div>
                    {i < 3 && <div style={{ flex: 1, height: 2, background: step > n ? "#4CAF82" : "#D4CFC8", marginBottom: 14 }} />}
                  </div>
                );
              })}
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 22, color: "#0F2419", margin: "0 0 16px" }}>Choose a Doctor</h2>
                {doctors.map(doc => (
                  <button key={doc.id} onClick={() => { setSelected(s => ({ ...s, doctor: doc.id })); goStep(2); }}
                    style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 14, padding: "16px 18px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14, width: "100%", marginBottom: 12 }}>
                    {doc.image ? (
                      <img src={doc.image} alt={doc.name} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 46, height: 46, borderRadius: "50%", background: doc.color, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{doc.avatar}</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, color: "#0F2419" }}>{doc.name}</div>
                      <div style={{ fontSize: 13, color: "#6B6560" }}>{doc.specialty}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <button onClick={() => goStep(1)} style={{ background: "none", border: "none", color: "#4CAF82", cursor: "pointer", marginBottom: 12 }}>← Back</button>
                <h2 style={{ fontSize: 22, color: "#0F2419", margin: "0 0 16px" }}>Pick a Date</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {DATES.map((d, i) => (
                    <button key={i} onClick={() => { setSelected(s => ({ ...s, date: d.full })); goStep(3); }}
                      style={{ background: selected.date === d.full ? "#0F2419" : "#fff", border: selected.date === d.full ? "2px solid #4CAF82" : "2px solid #E8E4DF", borderRadius: 12, padding: "14px 8px", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: selected.date === d.full ? "#4CAF82" : "#8C8479" }}>{d.label.toUpperCase()}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: selected.date === d.full ? "#F5F2EE" : "#0F2419" }}>{d.date}</div>
                      <div style={{ fontSize: 11, color: selected.date === d.full ? "#A8C5B5" : "#9C9690" }}>{d.month}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div>
                <button onClick={() => goStep(2)} style={{ background: "none", border: "none", color: "#4CAF82", cursor: "pointer", marginBottom: 12 }}>← Back</button>
                <h2 style={{ fontSize: 22, color: "#0F2419", margin: "0 0 16px" }}>Select a Time</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {doctor?.available.map(t => (
                    <button key={t} onClick={() => { setSelected(s => ({ ...s, time: t })); goStep(4); }}
                      style={{ background: selected.time === t ? "#0F2419" : "#fff", border: selected.time === t ? "2px solid #4CAF82" : "2px solid #E8E4DF", borderRadius: 12, padding: "16px 8px", cursor: "pointer", fontSize: 16, fontWeight: 700, color: selected.time === t ? "#4CAF82" : "#0F2419" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div>
                <button onClick={() => goStep(3)} style={{ background: "none", border: "none", color: "#4CAF82", cursor: "pointer", marginBottom: 12 }}>← Back</button>
                <h2 style={{ fontSize: 22, color: "#0F2419", margin: "0 0 16px" }}>Your Details</h2>
                {[
                  { key: "name", label: "Full Name", placeholder: "e.g. Amaka Johnson", type: "text" },
                  { key: "phone", label: "Phone / WhatsApp", placeholder: "e.g. 0801 234 5678", type: "tel" },
                  { key: "reason", label: "Reason for Visit", placeholder: "Brief description...", type: "text" },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 6 }}>{field.label.toUpperCase()}</label>
                    <input type={field.type} placeholder={field.placeholder} value={form[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{ width: "100%", padding: "12px 14px", border: "2px solid #E8E4DF", borderRadius: 10, fontSize: 15, fontFamily: "Georgia", background: "#fff", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
                <button onClick={handleConfirm} disabled={!form.name || !form.phone || loading}
                  style={{ width: "100%", padding: "16px", background: form.name && form.phone ? "#4CAF82" : "#C8C3BC", color: "#0F2419", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "Georgia" }}>
                  {loading ? "Saving..." : "Confirm Appointment →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* QUEUE (Staff only) */}
        {view === "queue" && auth.role === "staff" && (
          <div>
            <h2 style={{ fontSize: 22, color: "#0F2419", margin: "0 0 16px" }}>Patient Queue</h2>
            
            {/* Doctor Filter */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                <button
                  onClick={() => setSelectedDoctorId(null)}
                  style={{
                    background: selectedDoctorId === null ? "#0F2419" : "#fff",
                    color: selectedDoctorId === null ? "#4CAF82" : "#0F2419",
                    border: "2px solid #E8E4DF",
                    borderRadius: 20,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap"
                  }}
                >
                  All Doctors
                </button>
                {doctors.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    style={{
                      background: selectedDoctorId === doc.id ? doc.color : "#fff",
                      color: selectedDoctorId === doc.id ? "#fff" : "#0F2419",
                      border: "2px solid #E8E4DF",
                      borderRadius: 20,
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {doc.avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue List */}
            {queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#8C8479" }}>
                <p style={{ fontSize: 16 }}>No patients in queue</p>
              </div>
            ) : (
              <div>
                {queue.map((appt, idx) => (
                  <div key={appt.id || idx} style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F2419" }}>{appt.patient_name}</div>
                        <div style={{ fontSize: 13, color: "#6B6560", marginTop: 2 }}>{appt.doctor_name}</div>
                      </div>
                      <div style={{ background: "#4CAF82", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        #{idx + 1}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                      <div>
                        <span style={{ color: "#8C8479" }}>📅 Time</span>
                        <div style={{ color: "#0F2419", fontWeight: 600 }}>{appt.appointment_time}</div>
                      </div>
                      <div>
                        <span style={{ color: "#8C8479" }}>🆔 Ref</span>
                        <div style={{ color: "#0F2419", fontWeight: 600 }}>{appt.reference}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, padding: "8px 12px", background: "#F5F2EE", borderRadius: 8, fontSize: 12, color: "#6B6560" }}>
                      {appt.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONFIRMATION (Patient only) */}
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
            
            {/* Analytics */}
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

            {/* Doctor Management */}
            <h3 style={{ fontSize: 18, color: "#0F2419", margin: "24px 0 16px" }}>👨‍⚕️ Doctor Management</h3>

            {authError && <div style={{ background: "#8B2D2D", color: "#F5F2EE", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {authError}</div>}

            {/* Add Doctor Form */}
            <div style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 12, padding: "16px", marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, color: "#0F2419", margin: "0 0 12px" }}>Add New Doctor</h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>FULL NAME</label>
                <input type="text" placeholder="Dr. Name" value={adminForm.name}
                  onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", border: "2px solid #E8E4DF", borderRadius: 8, fontSize: 14, fontFamily: "Georgia", background: "#F5F2EE", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>SPECIALTY</label>
                <input type="text" placeholder="e.g. Cardiology" value={adminForm.specialty}
                  onChange={e => setAdminForm(f => ({ ...f, specialty: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", border: "2px solid #E8E4DF", borderRadius: 8, fontSize: 14, fontFamily: "Georgia", background: "#F5F2EE", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>INITIALS</label>
                <input type="text" placeholder="e.g. AO" maxLength="2" value={adminForm.avatar}
                  onChange={e => setAdminForm(f => ({ ...f, avatar: e.target.value.toUpperCase() }))}
                  style={{ width: "100%", padding: "10px 12px", border: "2px solid #E8E4DF", borderRadius: 8, fontSize: 14, fontFamily: "Georgia", background: "#F5F2EE", color: "#0F2419", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>AVATAR COLOR</label>
                <input type="color" value={adminForm.color}
                  onChange={e => setAdminForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: "100%", padding: "8px", border: "2px solid #E8E4DF", borderRadius: 8, cursor: "pointer" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#5A5550", display: "block", marginBottom: 4 }}>DOCTOR PHOTO</label>
                <input type="file" accept="image/*" onChange={handleImageUpload}
                  style={{ width: "100%", padding: "8px", border: "2px solid #E8E4DF", borderRadius: 8, fontSize: 12, cursor: "pointer" }} />
                {adminForm.image && <div style={{ fontSize: 10, color: "#4CAF82", marginTop: 4 }}>✓ Image selected</div>}
              </div>
              <button onClick={addDoctor} style={{ width: "100%", padding: "10px", background: "#4CAF82", color: "#0F2419", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Add Doctor
              </button>
            </div>

            {/* Doctors List */}
            <h4 style={{ fontSize: 14, color: "#0F2419", margin: "16px 0 12px" }}>Active Doctors ({doctors.length})</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {doctors.map(doc => (
                <div key={doc.id} style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 12, padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    {doc.image ? (
                      <img src={doc.image} alt={doc.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: doc.color, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                        {doc.avatar}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F2419" }}>{doc.name}</div>
                      <div style={{ fontSize: 10, color: "#8C8479" }}>{doc.specialty}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteDoctor(doc.id)} style={{ width: "100%", padding: "6px", background: "#8B2D2D", color: "#F5F2EE", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#B0AAA3", borderTop: "1px solid #E8E4DF" }}>
        ClinicFlow · Built for Lagos Private Healthcare
      </footer>
    </div>);
}