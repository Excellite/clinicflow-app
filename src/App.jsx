import { useState } from "react";
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
  const [view, setView] = useState("book");
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({ doctor: null, date: null, time: null });
  const [form, setForm] = useState({ name: "", phone: "", reason: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");

  const goStep = (n) => setStep(n);
  const doctor = DOCTORS.find(d => d.id === selected.doctor);

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
    setForm({ name: "", phone: "", reason: "" });
    setConfirmed(false);
    setView("book");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F2EE", fontFamily: "'Georgia', serif", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "#0F2419", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <span style={{ color: "#F5F2EE", fontWeight: 700, fontSize: 20 }}>Clinic<span style={{ color: "#4CAF82" }}>Flow</span></span>
        <nav style={{ display: "flex", gap: 6 }}>
          {[{ id: "book", label: "Book" }, { id: "queue", label: "Queue" }].map(tab => (
            <button key={tab.id} onClick={() => { setView(tab.id); if (tab.id === "book") reset(); }}
              style={{ background: view === tab.id ? "#4CAF82" : "transparent", color: view === tab.id ? "#0F2419" : "#A8C5B5", border: "none", borderRadius: 20, padding: "6px 18px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1, padding: "24px 16px", maxWidth: 560, margin: "0 auto", width: "100%" }}>

        {/* BOOKING */}
        {view === "book" && !confirmed && (
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
                {DOCTORS.map(doc => (
                  <button key={doc.id} onClick={() => { setSelected(s => ({ ...s, doctor: doc.id })); goStep(2); }}
                    style={{ background: "#fff", border: "2px solid #E8E4DF", borderRadius: 14, padding: "16px 18px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14, width: "100%", marginBottom: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", background: doc.color, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{doc.avatar}</div>
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

        {/* CONFIRMATION */}
        {view === "confirm" && (
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
      </main>

      <footer style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#B0AAA3", borderTop: "1px solid #E8E4DF" }}>
        ClinicFlow · Built for Lagos Private Healthcare
      </footer>
    </div>);
}