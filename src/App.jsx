import { useState, useEffect, createContext, useContext } from "react";

const SURL = "https://gjzbzugjatdqjdafhqsx.supabase.co";
const SKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqemJ6dWdqYXRkcWpkYWZocXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDgwMTYsImV4cCI6MjA5MjQyNDAxNn0.PmqN2EH9mE1cv9Z0x8oVYZjXipFKAv-mbp2mPGcJjzY";

let TOKEN = SKEY;
const H = () => ({ "Content-Type": "application/json", apikey: SKEY, Authorization: `Bearer ${TOKEN}` });
const db = (table) => {
  const url = (q = "") => `${SURL}/rest/v1/${table}${q}`;
  return {
    getAll: (select = "*", order = "created_at.desc") => fetch(url(`?select=${select}&order=${order}`), { headers: H() }).then(r => r.json()),
    getWhere: (col, val, select = "*") => fetch(url(`?select=${select}&${col}=eq.${val}`), { headers: H() }).then(r => r.json()),
    insert: (body) => fetch(url(""), { method: "POST", headers: { ...H(), Prefer: "return=representation" }, body: JSON.stringify(body) }).then(r => r.json()),
    update: (col, val, body) => fetch(url(`?${col}=eq.${val}`), { method: "PATCH", headers: { ...H(), Prefer: "return=minimal" }, body: JSON.stringify(body) }).then(r => r.ok),
    remove: (col, val) => fetch(url(`?${col}=eq.${val}`), { method: "DELETE", headers: H() }).then(r => r.ok),
  };
};
const auth = {
  login: async (email, password) => {
    const r = await fetch(`${SURL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SKEY }, body: JSON.stringify({ email, password }) });
    const d = await r.json();
    if (d.access_token) { TOKEN = d.access_token; localStorage.setItem("cm_tok", d.access_token); localStorage.setItem("cm_email", email); return { ok: true, email }; }
    return { ok: false, msg: d.error_description || "Login failed" };
  },
  logout: () => { TOKEN = SKEY; localStorage.removeItem("cm_tok"); localStorage.removeItem("cm_email"); },
  restore: () => { const t = localStorage.getItem("cm_tok"); if (t) { TOKEN = t; return localStorage.getItem("cm_email"); } return null; },
};

const TC = createContext(null);
const AC = createContext(null);
const useToast = () => useContext(TC);
const useAuth = () => useContext(AC);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const inp = { width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const PB = { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 12, padding: "12px 20px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%" };

function Toasts({ children }) {
  const [list, set] = useState([]);
  const add = (msg, type = "ok") => { const id = Date.now(); set(t => [...t, { id, msg, type }]); setTimeout(() => set(t => t.filter(x => x.id !== id)), 3000); };
  return (
    <TC.Provider value={add}>
      {children}
      <div style={{ position: "fixed", bottom: 80, right: 12, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map(t => <div key={t.id} style={{ background: t.type === "err" ? "#ef4444" : "#22c55e", color: "#fff", padding: "11px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", maxWidth: 260 }}>{t.msg}</div>)}
      </div>
    </TC.Provider>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1a1f2e", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#fff", fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function F({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>{children}</div>;
}

function Stat({ label, value, color, sub }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 16px" }}>
      <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      <div style={{ color, fontSize: 26, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ color: "#475569", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const go = async (e) => {
    e.preventDefault(); setLoading(true); setErr("");
    const res = await auth.login(email, pass);
    setLoading(false);
    if (res.ok) onLogin(res.email);
    else setErr(res.msg);
  };
  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🎓</div>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Course Manager</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Summer Institute Portal</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
          <form onSubmit={go}>
            <F label="Email"><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@institute.com" required /></F>
            <F label="Password"><input style={inp} type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required /></F>
            {err && <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 14, marginBottom: 14 }}>{err}</div>}
            <button type="submit" disabled={loading} style={{ ...PB, marginTop: 4, opacity: loading ? 0.7 : 1 }}>{loading ? "Signing in…" : "Sign In →"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [s, setS] = useState({ students: 0, courses: 0, fees: 0, paid: 0, recent: [] });
  useEffect(() => {
    (async () => {
      const [students, courses, fees, payments, recent] = await Promise.all([
        db("Student").getAll("id"),
        db("Course").getAll("id"),
        db("Fees").getAll("Amount"),
        db("Payment").getAll("Amount"),
        db("Student").getAll("id,Name,Mail,created_at"),
      ]);
      setS({
        students: students.length || 0,
        courses: courses.length || 0,
        fees: (fees || []).reduce((a, x) => a + (x.Amount || 0), 0),
        paid: (payments || []).reduce((a, x) => a + (x.Amount || 0), 0),
        recent: (recent || []).slice(0, 5),
      });
    })();
  }, []);
  return (
    <div>
      <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Dashboard</h1>
      <p style={{ color: "#64748b", margin: "0 0 20px", fontSize: 14 }}>Summer overview</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <Stat label="Students" value={s.students} color="#818cf8" />
        <Stat label="Courses" value={s.courses} color="#4ade80" />
        <Stat label="Total Fees" value={`₹${s.fees.toLocaleString()}`} color="#fbbf24" />
        <Stat label="Collected" value={`₹${s.paid.toLocaleString()}`} color="#22d3ee" sub={`₹${(s.fees - s.paid).toLocaleString()} pending`} />
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18 }}>
        <h2 style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Recent Enrollments</h2>
        {s.recent.map(x => (
          <div key={x.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{x.Name}</div>
            <div style={{ color: "#475569", fontSize: 12 }}>{fmtDate(x.created_at)}</div>
          </div>
        ))}
        {s.recent.length === 0 && <p style={{ color: "#475569", fontSize: 13 }}>No students yet.</p>}
      </div>
    </div>
  );
}

function Courses() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [fees, setFees] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ Name: "", Amount: "" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => { const [c, f] = await Promise.all([db("Course").getAll(), db("Fees").getAll()]); setCourses(c || []); setFees(f || []); };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!form.Name.trim()) return toast("Course name required", "err");
    setLoading(true);
    if (editId) {
      await db("Course").update("id", editId, { Name: form.Name });
      if (form.Amount) await db("Fees").update("Course_id", editId, { Amount: parseInt(form.Amount) });
      toast("Updated!");
    } else {
      const res = await db("Course").insert({ Name: form.Name });
      const newId = Array.isArray(res) ? res[0]?.id : res?.id;
      if (newId && form.Amount) await db("Fees").insert({ Course_id: newId, Amount: parseInt(form.Amount) });
      toast("Course added!");
    }
    setLoading(false); setShow(false); setForm({ Name: "", Amount: "" }); setEditId(null); load();
  };
  const del = async (id) => {
    if (!confirm("Delete course?")) return;
    await db("Fees").remove("Course_id", id);
    await db("Course").remove("id", id);
    toast("Deleted"); load();
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div><h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Courses</h1><p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>{courses.length} total</p></div>
        <button onClick={() => { setShow(true); setEditId(null); setForm({ Name: "", Amount: "" }); }} style={{ ...PB, width: "auto", padding: "10px 16px", fontSize: 14 }}>+ Add</button>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {courses.map(c => {
          const fee = fees.find(f => f.Course_id === c.id);
          return (
            <div key={c.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{c.Name}</div><div style={{ color: "#818cf8", fontSize: 13, marginTop: 2 }}>{fee ? `₹${fee.Amount.toLocaleString()}` : "No fee"}</div></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditId(c.id); setForm({ Name: c.Name, Amount: fees.find(f => f.Course_id === c.id)?.Amount || "" }); setShow(true); }} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: "#818cf8", fontSize: 13 }}>Edit</button>
                <button onClick={() => del(c.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: "#f87171", fontSize: 13 }}>Del</button>
              </div>
            </div>
          );
        })}
        {courses.length === 0 && <p style={{ color: "#475569", textAlign: "center", padding: 40 }}>No courses yet.</p>}
      </div>
      {show && <Modal title={editId ? "Edit Course" : "Add Course"} onClose={() => setShow(false)}>
        <F label="Course Name *"><input style={inp} value={form.Name} onChange={e => setForm({ ...form, Name: e.target.value })} placeholder="e.g. Mathematics" /></F>
        <F label="Fee (₹)"><input style={inp} type="number" value={form.Amount} onChange={e => setForm({ ...form, Amount: e.target.value })} placeholder="e.g. 5000" /></F>
        <button onClick={save} disabled={loading} style={{ ...PB, marginTop: 8 }}>{loading ? "Saving…" : editId ? "Update" : "Add Course"}</button>
      </Modal>}
    </div>
  );
}

function Students() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [filterC, setFilterC] = useState("");
  const [show, setShow] = useState(false);
  const [view, setView] = useState(null);
  const [pays, setPays] = useState([]);
  const [form, setForm] = useState({ Name: "", Mail: "", Mobile: "", Parent_name: "", Couse_id: "" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = async () => { const [s, c] = await Promise.all([db("Student").getAll(), db("Course").getAll("*", "Name.asc")]); setStudents(s || []); setCourses(c || []); };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!form.Name.trim() || !form.Mobile.trim()) return toast("Name & mobile required", "err");
    setLoading(true);
    const payload = { Name: form.Name, Mail: form.Mail, Mobile: form.Mobile, Parent_name: form.Parent_name, Course_id: form.Couse_id ? parseInt(form.Couse_id) : null };
    if (editId) { await db("Student").update("id", editId, payload); toast("Updated!"); }
    else { await db("Student").insert(payload); toast("Enrolled!"); }
    setLoading(false); setShow(false); setEditId(null); setForm({ Name: "", Mail: "", Mobile: "", Parent_name: "", Couse_id: "" }); load();
  };
  const del = async (id) => {
    if (!confirm("Remove student?")) return;
    await db("Payment").remove("Student_id", id);
    await db("Student").remove("id", id);
    toast("Removed"); load();
  };
  const openView = async (s) => { setView(s); const p = await db("Payment").getWhere("Student_id", s.id); setPays(p || []); };
  const filtered = students.filter(s => (!search || s.Name?.toLowerCase().includes(search.toLowerCase()) || s.Mobile?.includes(search)) && (!filterC || String(s.Couse_id) === filterC));
  const cName = (id) => courses.find(c => c.id === id)?.Name || "No course";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div><h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Students</h1><p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>{students.length} enrolled</p></div>
        <button onClick={() => { setShow(true); setEditId(null); setForm({ Name: "", Mail: "", Mobile: "", Parent_name: "", Couse_id: "" }); }} style={{ ...PB, width: "auto", padding: "10px 16px", fontSize: 14 }}>+ Enroll</button>
      </div>
      <input style={{ ...inp, marginBottom: 10 }} placeholder="Search name or mobile…" value={search} onChange={e => setSearch(e.target.value)} />
      <select style={{ ...inp, marginBottom: 14 }} value={filterC} onChange={e => setFilterC(e.target.value)}>
        <option value="">All Courses</option>
        {courses.map(c => <option key={c.id} value={c.id}>{c.Name}</option>)}
      </select>
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(s => (
          <div key={s.id} onClick={() => openView(s)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>{s.Name?.[0]?.toUpperCase()}</div>
              <div><div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{s.Name}</div><div style={{ color: "#64748b", fontSize: 12 }}>{s.Mobile} · {cName(s.Couse_id)}</div></div>
            </div>
            <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => { setEditId(s.id); setForm({ Name: s.Name || "", Mail: s.Mail || "", Mobile: s.Mobile || "", Parent_name: s.Parent_name || "", Couse_id: s.Couse_id || "" }); setShow(true); }} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#818cf8", fontSize: 12 }}>Edit</button>
              <button onClick={() => del(s.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#f87171", fontSize: 12 }}>Del</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: "#475569", textAlign: "center", padding: 40 }}>No students found.</p>}
      </div>
      {show && <Modal title={editId ? "Edit Student" : "Enroll Student"} onClose={() => { setShow(false); setEditId(null); }}>
        <F label="Full Name *"><input style={inp} value={form.Name} onChange={e => setForm({ ...form, Name: e.target.value })} placeholder="Student name" /></F>
        <F label="Mobile *"><input style={inp} type="tel" value={form.Mobile} onChange={e => setForm({ ...form, Mobile: e.target.value })} placeholder="10-digit number" /></F>
        <F label="Email"><input style={inp} type="email" value={form.Mail} onChange={e => setForm({ ...form, Mail: e.target.value })} placeholder="email@example.com" /></F>
        <F label="Parent Name"><input style={inp} value={form.Parent_name} onChange={e => setForm({ ...form, Parent_name: e.target.value })} placeholder="Parent name" /></F>
        <F label="Course"><select style={inp} value={form.Couse_id} onChange={e => setForm({ ...form, Couse_id: e.target.value })}><option value="">Select course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.Name}</option>)}</select></F>
        <button onClick={save} disabled={loading} style={{ ...PB, marginTop: 8 }}>{loading ? "Saving…" : editId ? "Update" : "Enroll"}</button>
      </Modal>}
      {view && <Modal title="Student Profile" onClose={() => setView(null)}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 20 }}>{view.Name?.[0]?.toUpperCase()}</div>
          <div><div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>{view.Name}</div><div style={{ color: "#64748b", fontSize: 13 }}>{cName(view.Couse_id)}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[["📱 Mobile", view.Mobile], ["📧 Email", view.Mail || "—"], ["👨‍👩‍👧 Parent", view.Parent_name || "—"], ["📅 Enrolled", fmtDate(view.created_at)]].map(([l, v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>{l}</div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{v}</div>
            </div>
          ))}
        </div>
        <h3 style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Payments</h3>
        {pays.length === 0 ? <p style={{ color: "#475569", fontSize: 13 }}>No payments yet.</p> : pays.map(p => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div><div style={{ color: "#fff", fontWeight: 600 }}>₹{p.Amount?.toLocaleString()}</div><div style={{ color: "#64748b", fontSize: 12 }}>{p.Type} · {fmtDate(p.created_at)}</div></div>
            <span style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>Paid</span>
          </div>
        ))}
      </Modal>}
    </div>
  );
}

function Payments() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ Student_id: "", Amount: "", Type: "Cash" });
  const [loading, setLoading] = useState(false);
  const load = async () => { const [p, s] = await Promise.all([db("Payment").getAll(), db("Student").getAll("id,Name", "Name.asc")]); setPayments(p || []); setStudents(s || []); };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!form.Student_id || !form.Amount) return toast("Select student & enter amount", "err");
    setLoading(true);
    await db("Payment").insert({ Student_id: parseInt(form.Student_id), Amount: parseInt(form.Amount), Type: form.Type });
    toast("Recorded!"); setLoading(false); setShow(false); setForm({ Student_id: "", Amount: "", Type: "Cash" }); load();
  };
  const del = async (id) => { if (!confirm("Delete?")) return; await db("Payment").remove("id", id); toast("Deleted"); load(); };
  const total = payments.reduce((s, p) => s + (p.Amount || 0), 0);
  const sName = (id) => students.find(s => s.id === id)?.Name || "Unknown";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div><h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Payments</h1><p style={{ color: "#4ade80", margin: 0, fontSize: 13, fontWeight: 700 }}>₹{total.toLocaleString()} collected</p></div>
        <button onClick={() => setShow(true)} style={{ ...PB, width: "auto", padding: "10px 16px", fontSize: 14 }}>+ Record</button>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {payments.map(p => (
          <div key={p.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ color: "#fff", fontWeight: 700 }}>₹{p.Amount?.toLocaleString()}</div><div style={{ color: "#64748b", fontSize: 12 }}>{sName(p.Student_id)} · {p.Type} · {fmtDate(p.created_at)}</div></div>
            <button onClick={() => del(p.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#f87171", fontSize: 12 }}>Del</button>
          </div>
        ))}
        {payments.length === 0 && <p style={{ color: "#475569", textAlign: "center", padding: 40 }}>No payments yet.</p>}
      </div>
      {show && <Modal title="Record Payment" onClose={() => setShow(false)}>
        <F label="Student *"><select style={inp} value={form.Student_id} onChange={e => setForm({ ...form, Student_id: e.target.value })}><option value="">Select student</option>{students.map(s => <option key={s.id} value={s.id}>{s.Name}</option>)}</select></F>
        <F label="Amount (₹) *"><input style={inp} type="number" value={form.Amount} onChange={e => setForm({ ...form, Amount: e.target.value })} placeholder="e.g. 2000" /></F>
        <F label="Type"><select style={inp} value={form.Type} onChange={e => setForm({ ...form, Type: e.target.value })}>{["Cash","UPI","Bank Transfer","Cheque","Card"].map(t => <option key={t}>{t}</option>)}</select></F>
        <button onClick={save} disabled={loading} style={{ ...PB, marginTop: 8 }}>{loading ? "Saving…" : "Record Payment"}</button>
      </Modal>}
    </div>
  );
}

function Staff() {
  const toast = useToast();
  const { profile } = useAuth();
  const [staff, setStaff] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ Name: "", Email: "", Role: "staff" });
  const [loading, setLoading] = useState(false);
  const load = async () => { const d = await db("Profiles").getAll(); setStaff(d || []); };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!form.Name || !form.Email) return toast("Name & email required", "err");
    setLoading(true);
    await db("Profiles").insert({ Name: form.Name, Email: form.Email, Role: form.Role });
    toast("Staff added!"); setLoading(false); setShow(false); setForm({ Name: "", Email: "", Role: "staff" }); load();
  };
  const del = async (id) => { if (!confirm("Remove?")) return; await db("Profiles").remove("id", id); toast("Removed"); load(); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div><h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Staff</h1><p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>{staff.length} members</p></div>
        {profile?.Role === "admin" && <button onClick={() => setShow(true)} style={{ ...PB, width: "auto", padding: "10px 16px", fontSize: 14 }}>+ Add</button>}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {staff.map(s => (
          <div key={s.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.Role === "admin" ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "linear-gradient(135deg,#06b6d4,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>{s.Name?.[0]?.toUpperCase()}</div>
              <div><div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{s.Name}</div><div style={{ color: "#64748b", fontSize: 12 }}>{s.Email}</div></div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ background: s.Role === "admin" ? "rgba(245,158,11,0.15)" : "rgba(99,102,241,0.15)", color: s.Role === "admin" ? "#fbbf24" : "#818cf8", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{s.Role}</span>
              {profile?.Role === "admin" && <button onClick={() => del(s.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#f87171", fontSize: 12 }}>Del</button>}
            </div>
          </div>
        ))}
        {staff.length === 0 && <p style={{ color: "#475569", textAlign: "center", padding: 40 }}>No staff yet.</p>}
      </div>
      {show && <Modal title="Add Staff" onClose={() => setShow(false)}>
        <F label="Full Name *"><input style={inp} value={form.Name} onChange={e => setForm({ ...form, Name: e.target.value })} placeholder="Staff name" /></F>
        <F label="Email *"><input style={inp} type="email" value={form.Email} onChange={e => setForm({ ...form, Email: e.target.value })} placeholder="staff@email.com" /></F>
        <F label="Role"><select style={inp} value={form.Role} onChange={e => setForm({ ...form, Role: e.target.value })}><option value="staff">Staff</option><option value="admin">Admin</option></select></F>
        <button onClick={save} disabled={loading} style={{ ...PB, marginTop: 8 }}>{loading ? "Adding…" : "Add Staff"}</button>
      </Modal>}
    </div>
  );
}

const NAV = [
  { key: "dashboard", label: "Home", icon: "🏠" },
  { key: "students", label: "Students", icon: "👥" },
  { key: "courses", label: "Courses", icon: "📚" },
  { key: "payments", label: "Payments", icon: "💰" },
  { key: "staff", label: "Staff", icon: "👤" },
];

export default function App() {
  const [email, setEmail] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const e = auth.restore();
    if (e) { setEmail(e); loadProfile(e); }
    else setReady(true);
  }, []);

  const loadProfile = async (e) => {
    const data = await db("Profiles").getWhere("Email", e);
    setProfile(Array.isArray(data) && data.length > 0 ? data[0] : { Name: e, Role: "staff" });
    setReady(true);
  };

  const onLogin = (e) => { setEmail(e); loadProfile(e); };
  const onLogout = () => { auth.logout(); setEmail(null); setProfile(null); };

  if (!ready) return <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 40 }}>🎓</div><div style={{ color: "#64748b", marginTop: 12, fontFamily: "system-ui" }}>Loading…</div></div></div>;

  if (!email) return <Toasts><Login onLogin={onLogin} /></Toasts>;

  const PAGES = { dashboard: <Dashboard />, students: <Students />, courses: <Courses />, payments: <Payments />, staff: <Staff /> };

  return (
    <AC.Provider value={{ profile }}>
      <Toasts>
        <div style={{ minHeight: "100vh", background: "#0d1117", fontFamily: "system-ui,sans-serif", paddingBottom: 70 }}>
          <div style={{ background: "#111827", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>🎓</span><span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>Course Manager</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#64748b", fontSize: 13 }}>{profile?.Name}</span>
              <button onClick={onLogout} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "6px 12px", color: "#f87171", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Sign Out</button>
            </div>
          </div>
          <div style={{ padding: "20px 16px", maxWidth: 600, margin: "0 auto" }}>
            {PAGES[page]}
          </div>
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#111827", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", padding: "8px 0 10px", zIndex: 200 }}>
            {NAV.map(n => (
              <button key={n.key} onClick={() => setPage(n.key)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: page === n.key ? "#818cf8" : "#475569", fontFamily: "inherit" }}>
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600 }}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Toasts>
    </AC.Provider>
  );
}