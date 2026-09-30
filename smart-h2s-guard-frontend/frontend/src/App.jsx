import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard, Users, ScanLine, ClipboardList, Activity, Cpu, Tag,
  FileText, AlertTriangle, UserCog, Settings as SettingsIcon, HelpCircle,
  Bell, LogOut, Menu, X, Search, Plus, Eye, Edit2, ChevronRight, ChevronDown,
  Droplet, Thermometer, Wind, CheckCircle2, XCircle, Clock, Download, Filter,
  User, ShieldCheck, ShieldAlert, QrCode, Camera, Barcode, RefreshCw, MapPin,
  Phone, Mail, Calendar, ArrowLeft, TrendingUp, Building2, ChevronLeft
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

/* ============================================================================
   SMART-H2S GUARD — MRPL H2S Exposure Monitoring & Safety Management System
   ----------------------------------------------------------------------------
   This artifact is a fully interactive frontend demo. Data lives in React
   state, structured exactly like the MongoDB collections it is meant to
   mirror (users, workers, badges, scans, exposureRecords, alerts,
   departments, settings, calibrationModels). Every mutation flows through a
   small "api" service layer (see the `api` object below) whose function
   signatures map 1:1 to the REST endpoints a real Express/Mongoose backend
   would expose (see the accompanying /backend source files). Swapping the
   body of each `api` function for a real `fetch()` call is the only change
   needed to connect this UI to a live MongoDB-backed server.
============================================================================ */

/* ---------------------------- design tokens ------------------------------ */
const COLORS = {
  navy: "#0B2140",
  navyLight: "#12305A",
  navyBorder: "#1B3C6B",
  bg: "#EEF3F9",
  card: "#FFFFFF",
  accent: "#1D6FE0",
  accentDark: "#164FA3",
  text: "#12213B",
  sub: "#5A6B85",
  border: "#DEE6F0",
};
const STATUS = {
  SAFE: { text: "#0E7A3C", bg: "#E3F7EA", dot: "#1FA24C", ring: "#BCEACB" },
  MODERATE: { text: "#946C00", bg: "#FEF6DA", dot: "#E8B300", ring: "#F6E5A6" },
  WARNING: { text: "#B85400", bg: "#FEEBDA", dot: "#F2811D", ring: "#F7CBA0" },
  "HIGH RISK": { text: "#B4211D", bg: "#FCE3E2", dot: "#E23B36", ring: "#F5B4B1" },
};
const statusRank = { SAFE: 0, MODERATE: 1, WARNING: 2, "HIGH RISK": 3 };

/* ------------------------------- helpers ---------------------------------- */
let __id = 1000;
const genId = (p) => `${p}${__id++}`;
const now = () => Date.now();
const fmtDateTime = (ts) =>
  new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtDate = (ts) => new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (ts) => new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const hoursAgo = (ts) => (now() - ts) / 3.6e6;
const round2 = (n) => Math.round(n * 100) / 100;

function computeStatus(currentPpm, cumulativePpmH, thresholds) {
  const c = thresholds.current, d = thresholds.cumulative;
  const pick = (v, t) => (v >= t.highRisk ? "HIGH RISK" : v >= t.warning ? "WARNING" : v >= t.moderate ? "MODERATE" : "SAFE");
  const s1 = pick(currentPpm, c), s2 = pick(cumulativePpmH, d);
  return statusRank[s1] >= statusRank[s2] ? s1 : s2;
}

/* ------------------------------- seed data --------------------------------- */
const DEPARTMENTS = ["Process Unit - CDU", "Process Unit - FCC", "Tank Farm", "Effluent Treatment", "Maintenance", "Utilities", "Lab & QC"];
const SHIFTS = ["A - Morning (06:00-14:00)", "B - Afternoon (14:00-22:00)", "C - Night (22:00-06:00)"];

function seedDatabase() {
  const workers = [
    { workerId: "ST1024", name: "Arun Kumar", department: "Process Unit - CDU", designation: "Field Operator", shift: SHIFTS[0], gender: "Male", contact: "+91 98450 11234", email: "arun.kumar@mrpl.co.in", address: "Kavoor, Mangalore, Karnataka", joiningDate: "2019-06-12", photo: "", badgeId: "BDG-2201" },
    { workerId: "ST1042", name: "Priya Shetty", department: "Tank Farm", designation: "Safety Technician", shift: SHIFTS[1], gender: "Female", contact: "+91 98452 55678", email: "priya.shetty@mrpl.co.in", address: "Bejai, Mangalore, Karnataka", joiningDate: "2021-01-20", photo: "", badgeId: "BDG-2202" },
    { workerId: "ST1067", name: "Mohammed Rafi", department: "Effluent Treatment", designation: "Process Technician", shift: SHIFTS[2], gender: "Male", contact: "+91 98453 99087", email: "mohammed.rafi@mrpl.co.in", address: "Surathkal, Mangalore, Karnataka", joiningDate: "2018-03-04", photo: "", badgeId: "BDG-2203" },
    { workerId: "ST1088", name: "Deepak Nayak", department: "Process Unit - FCC", designation: "Shift Engineer", shift: SHIFTS[0], gender: "Male", contact: "+91 98454 33210", email: "deepak.nayak@mrpl.co.in", address: "Bantwal, Dakshina Kannada", joiningDate: "2020-09-15", photo: "", badgeId: "BDG-2204" },
    { workerId: "ST1099", name: "Lakshmi Poojary", department: "Utilities", designation: "Field Operator", shift: SHIFTS[1], gender: "Female", contact: "+91 98455 77812", email: "lakshmi.poojary@mrpl.co.in", address: "Mulki, Karnataka", joiningDate: "2022-02-01", photo: "", badgeId: "BDG-2205" },
  ];

  const badges = workers.map((w, i) => ({
    badgeId: w.badgeId,
    barcode: `MRPL-${w.badgeId}-${8800 + i}`,
    workerId: w.workerId,
    issueDate: "2026-06-01",
    expiryDate: i === 2 ? "2026-07-15" : "2027-01-01", // one expired for demo
    status: i === 2 ? "EXPIRED" : i === 4 ? "EXPIRING SOON" : "VALID",
    scanCount: 0,
    lastScan: null,
  }));
  // one spare unassigned badge
  badges.push({ badgeId: "BDG-2299", barcode: "MRPL-BDG-2299-9010", workerId: null, issueDate: "2026-08-01", expiryDate: "2027-02-01", status: "VALID", scanCount: 0, lastScan: null });

  const users = [
    { userId: "USR-0001", name: "Rajesh Hegde", email: "admin@mrpl.co.in", password: "admin123", role: "ADMIN", status: "ACTIVE", lastLogin: null },
    ...workers.map((w, i) => ({ userId: `USR-${1002 + i}`, name: w.name, email: w.email, password: "worker123", role: "WORKER", status: "ACTIVE", lastLogin: null, workerId: w.workerId })),
  ];

  const settings = {
    org: { name: "Mangalore Refinery and Petrochemicals Limited", shortName: "MRPL", site: "Kuthethoor, Mangalore, Karnataka", tagline: "Wear Safe | Work Safe | Know Your Exposure" },
    thresholds: {
      current: { moderate: 5, warning: 10, highRisk: 15 },
      cumulative: { moderate: 20, warning: 50, highRisk: 100 },
    },
    calibration: { version: "CAL-v1.3", factor: 0.062, offset: 0.2, model: "Bi(III)-acetate darkening linear-response", updatedOn: "2026-08-10" },
    notifications: { emailAlerts: true, smsAlerts: false, highRiskOnly: false },
  };

  const devices = [
    { deviceId: "RDR-001", name: "Reader Unit A1", type: "Handheld RGB + Barcode Reader", status: "ONLINE", location: "CDU Control Room", lastSync: now() - 2 * 3.6e6 },
    { deviceId: "RDR-002", name: "Reader Unit A2", type: "Handheld RGB + Barcode Reader", status: "ONLINE", location: "Tank Farm Gatehouse", lastSync: now() - 5 * 3.6e6 },
    { deviceId: "RDR-003", name: "Reader Unit B1", type: "Handheld RGB + Barcode Reader", status: "OFFLINE", location: "Effluent Treatment Plant", lastSync: now() - 30 * 3.6e6 },
  ];

  // Generate historical scans across last 8 days for each worker
  const scans = [];
  const alerts = [];
  workers.forEach((w, wi) => {
    let cumulative = 0;
    const scanCountForWorker = 7 + wi;
    for (let i = scanCountForWorker; i >= 1; i--) {
      const ts = now() - i * (7 + wi) * 3.6e6 - wi * 1e6;
      const r = 90 + Math.round(Math.random() * 100);
      const g = 70 + Math.round(Math.random() * 90);
      const b = 60 + Math.round(Math.random() * 80);
      const colorIndex = round2(255 - (r + g + b) / 3);
      const estimatedH2Sppm = Math.max(0, round2(colorIndex * settings.calibration.factor - settings.calibration.offset + (wi === 2 ? 4 : 0)));
      const exposureDuration = round2(6 + Math.random() * 2);
      cumulative = round2(cumulative + estimatedH2Sppm * exposureDuration * 0.3);
      const safetyStatus = computeStatus(estimatedH2Sppm, cumulative, settings.thresholds);
      const scan = {
        scanId: genId("SCN-"),
        badgeId: badges[wi].badgeId,
        barcode: badges[wi].barcode,
        workerId: w.workerId,
        scanTimestamp: ts,
        rgb: { r, g, b },
        colorIndex,
        temperature: round2(28 + Math.random() * 6),
        humidity: round2(55 + Math.random() * 20),
        estimatedH2Sppm,
        exposureDuration,
        cumulativeDosePpmHours: cumulative,
        safetyIndex: round2(100 - statusRank[safetyStatus] * 22 - Math.random() * 10),
        safetyStatus,
        calibrationModelVersion: settings.calibration.version,
      };
      scans.push(scan);
      badges[wi].scanCount += 1;
      badges[wi].lastScan = ts;
      if (safetyStatus === "WARNING" || safetyStatus === "HIGH RISK") {
        alerts.push({
          alertId: genId("ALT-"),
          workerId: w.workerId,
          scanId: scan.scanId,
          time: ts,
          currentH2S: estimatedH2Sppm,
          cumulativeExposure: cumulative,
          alertType: safetyStatus === "HIGH RISK" ? "HIGH H2S EXPOSURE" : "ELEVATED H2S EXPOSURE",
          status: i <= 2 ? "ACTIVE" : "RESOLVED",
          recommendation: safetyStatus === "HIGH RISK"
            ? "Evacuate area immediately, report to shift supervisor, and undergo medical check before re-entry."
            : "Reduce time in the affected zone, verify local ventilation, and re-scan within the hour.",
        });
      }
    }
  });

  return { workers, badges, users, settings, devices, scans, alerts };
}

/* --------------------------------- api layer --------------------------------
   Mock service layer with the same shape a real REST client would use.
   Each function mutates the in-memory "db" via the provided setter and
   returns a resolved value, mirroring an async API call.
------------------------------------------------------------------------------ */
function makeApi(db, setDb) {
  return {
    addWorker(worker) {
      setDb((d) => ({ ...d, workers: [...d.workers, worker] }));
    },
    updateWorker(workerId, patch) {
      setDb((d) => ({ ...d, workers: d.workers.map((w) => (w.workerId === workerId ? { ...w, ...patch } : w)) }));
    },
    addBadge(badge) {
      setDb((d) => ({ ...d, badges: [...d.badges, badge] }));
    },
    updateBadge(badgeId, patch) {
      setDb((d) => ({ ...d, badges: d.badges.map((b) => (b.badgeId === badgeId ? { ...b, ...patch } : b)) }));
    },
    addScan(scan) {
      setDb((d) => ({ ...d, scans: [scan, ...d.scans] }));
    },
    addAlert(alert) {
      setDb((d) => ({ ...d, alerts: [alert, ...d.alerts] }));
    },
    resolveAlert(alertId) {
      setDb((d) => ({ ...d, alerts: d.alerts.map((a) => (a.alertId === alertId ? { ...a, status: "RESOLVED" } : a)) }));
    },
    updateSettings(patch) {
      setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
    },
    addUser(user) {
      setDb((d) => ({ ...d, users: [...d.users, user] }));
    },
    updateUser(userId, patch) {
      setDb((d) => ({ ...d, users: d.users.map((u) => (u.userId === userId ? { ...u, ...patch } : u)) }));
    },
    addDevice(device) {
      setDb((d) => ({ ...d, devices: [...d.devices, device] }));
    },
  };
}

/* ------------------------------ small UI atoms ------------------------------ */
function StatusPill({ status, size = "md" }) {
  const s = STATUS[status] || STATUS.SAFE;
  const pad = size === "sm" ? "2px 8px" : "4px 11px";
  const fs = size === "sm" ? 11 : 12.5;
  return (
    <span style={{ background: s.bg, color: s.text, padding: pad, borderRadius: 999, fontSize: fs, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: s.dot }} />
      {status}
    </span>
  );
}

function Card({ children, style, className }) {
  return (
    <div className={className} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, boxShadow: "0 1px 2px rgba(18,33,59,0.04)", ...style }}>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <Card style={{ padding: "18px 20px", flex: "1 1 200px", minWidth: 190 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12.5, color: COLORS.sub, fontWeight: 600, marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: COLORS.sub, marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={20} color={accent} />
        </div>
      </div>
    </Card>
  );
}

function Button({ children, onClick, variant = "primary", icon: Icon, style, type = "button", disabled }) {
  const variants = {
    primary: { background: COLORS.accent, color: "#fff", border: "none" },
    outline: { background: "#fff", color: COLORS.accent, border: `1px solid ${COLORS.accent}` },
    ghost: { background: "transparent", color: COLORS.sub, border: `1px solid ${COLORS.border}` },
    danger: { background: "#DC2626", color: "#fff", border: "none" },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{
      ...variants[variant], padding: "9px 15px", borderRadius: 9, fontSize: 13.5, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 7, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1, transition: "opacity .15s", ...style,
    }}>
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: COLORS.sub, fontWeight: 600 }}>
      {label}
      {children}
    </label>
  );
}
const inputStyle = { padding: "9px 11px", borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13.5, color: COLORS.text, background: "#fff", outline: "none", fontFamily: "inherit" };

function TextInput(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function Select({ children, ...props }) { return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{children}</select>; }

function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,33,64,0.45)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 16px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: width, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.text }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: "#F1F5F9", borderRadius: 8, padding: 6, cursor: "pointer" }}><X size={16} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function Table({ columns, rows, empty = "No records found." }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: "left", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.3, color: COLORS.sub, fontWeight: 700, padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap" }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} style={{ padding: "26px 14px", textAlign: "center", color: COLORS.sub, fontSize: 13 }}>{empty}</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: "11px 14px", fontSize: 13, color: COLORS.text, whiteSpace: "nowrap" }}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeader({ title, sub, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: COLORS.sub, marginTop: 3 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* -------------------------------- NAV CONFIG -------------------------------- */
const ADMIN_NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "workers", label: "Workers", icon: Users },
  { key: "scan", label: "Scan & Analysis", icon: ScanLine },
  { key: "exposure", label: "Exposure Records", icon: ClipboardList },
  { key: "realtime", label: "Real-Time Monitoring", icon: Activity },
  { key: "devices", label: "Device Management", icon: Cpu },
  { key: "badges", label: "Badge Management", icon: Tag },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "alerts", label: "Safety Alerts", icon: AlertTriangle },
  { key: "users", label: "User Management", icon: UserCog },
  { key: "settings", label: "Settings", icon: SettingsIcon },
  { key: "help", label: "Help & Support", icon: HelpCircle },
];
const WORKER_NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "profile", label: "My Profile", icon: User },
  { key: "scan", label: "Scan & Analyze", icon: ScanLine },
  { key: "exposure", label: "Exposure History", icon: ClipboardList },
  { key: "alerts", label: "Safety Alerts", icon: AlertTriangle },
  { key: "settings", label: "Settings", icon: SettingsIcon },
  { key: "help", label: "Help & Support", icon: HelpCircle },
];

/* ================================ LOGIN PAGE ================================ */
function LoginPage({ users, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
    if (!u) { setError("Invalid email or password."); return; }
    setError("");
    onLogin(u);
  };
  const onKeyDown = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${COLORS.navy} 0%, #0E2A50 55%, #123667 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 900, background: "#fff", borderRadius: 20, overflow: "hidden", display: "flex", flexWrap: "wrap", boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ flex: "1 1 340px", background: `linear-gradient(160deg, ${COLORS.navy}, ${COLORS.navyLight})`, color: "#fff", padding: "44px 38px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 420 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Droplet size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>SMART-H₂S GUARD</div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>MRPL Safety Systems</div>
              </div>
            </div>
            <div style={{ marginTop: 40 }}>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.3 }}>H₂S Exposure Monitoring &amp; Safety Management</div>
              <div style={{ marginTop: 14, fontSize: 13.5, opacity: 0.85, lineHeight: 1.6 }}>
                Passive Bi(III) sensing badges, a reusable barcode + RGB reader, and real-time cumulative exposure tracking for every worker on site.
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.75, fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16 }}>
            "Wear Safe | Work Safe | Know Your Exposure"
          </div>
        </div>

        <div style={{ flex: "1 1 340px", padding: "44px 38px" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text }}>Sign in</div>
          <div style={{ fontSize: 13, color: COLORS.sub, marginTop: 4, marginBottom: 26 }}>Access your MRPL Smart-H₂S Guard dashboard.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Email / User ID">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKeyDown} placeholder="you@mrpl.co.in" />
            </Field>
            <Field label="Password">
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKeyDown} placeholder="••••••••" />
            </Field>
            {error && <div style={{ color: "#DC2626", fontSize: 12.5, fontWeight: 600 }}>{error}</div>}
            <Button onClick={submit} style={{ justifyContent: "center", padding: "11px 15px", fontSize: 14 }}>Sign in</Button>
          </div>
          <div style={{ marginTop: 22, background: "#F4F7FB", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: COLORS.sub, lineHeight: 1.7 }}>
            <b>Demo credentials</b><br />
            Admin — admin@mrpl.co.in / admin123<br />
            Worker — arun.kumar@mrpl.co.in / worker123
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================== LAYOUT =================================== */
function Sidebar({ nav, active, setActive, role, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} className="sidebar-overlay" />}
      <div style={{
        width: 246, background: COLORS.navy, color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0,
        position: "fixed", top: 0, bottom: 0, left: mobileOpen ? 0 : -260, zIndex: 50, transition: "left .2s ease",
      }} className="app-sidebar">
        <div style={{ padding: "20px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${COLORS.navyBorder}` }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Droplet size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13.5, letterSpacing: 0.2 }}>SMART-H₂S GUARD</div>
            <div style={{ fontSize: 10.5, opacity: 0.65 }}>MRPL · {role}</div>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "none" }} className="sidebar-close"><X size={18} /></button>
        </div>
        <div style={{ padding: "12px 10px", overflowY: "auto", flex: 1 }}>
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button key={item.key} onClick={() => { setActive(item.key); setMobileOpen(false); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 9,
                background: isActive ? COLORS.accent : "transparent", color: isActive ? "#fff" : "rgba(255,255,255,0.75)",
                border: "none", cursor: "pointer", fontSize: 13.3, fontWeight: isActive ? 700 : 500, marginBottom: 2, textAlign: "left",
              }}>
                <Icon size={16.5} />
                {item.label}
              </button>
            );
          })}
        </div>
        <div style={{ padding: 14, borderTop: `1px solid ${COLORS.navyBorder}`, fontSize: 10.5, opacity: 0.55, lineHeight: 1.6 }}>
          Mangalore Refinery and<br />Petrochemicals Limited
        </div>
      </div>
    </>
  );
}

function Topbar({ title, user, onLogout, setMobileOpen, alertCount, onBell }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#fff", borderBottom: `1px solid ${COLORS.border}`, padding: "14px 22px", display: "flex", alignItems: "center", gap: 14 }}>
      <button className="hamburger" onClick={() => setMobileOpen(true)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "none" }}><Menu size={22} color={COLORS.text} /></button>
      <div style={{ fontWeight: 800, fontSize: 17, color: COLORS.text }}>{title}</div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onBell} style={{ position: "relative", background: "#F1F5F9", border: "none", borderRadius: 9, padding: 9, cursor: "pointer" }}>
          <Bell size={17} color={COLORS.text} />
          {alertCount > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: "#DC2626", color: "#fff", fontSize: 9.5, fontWeight: 800, borderRadius: 999, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{alertCount}</span>}
        </button>
        <div style={{ position: "relative" }}>
          <button onClick={() => setMenuOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer" }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: COLORS.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
              {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div style={{ textAlign: "left", display: "none" }} className="user-name-block">
              <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.text }}>{user.name}</div>
              <div style={{ fontSize: 10.5, color: COLORS.sub }}>{user.role}</div>
            </div>
            <ChevronDown size={14} color={COLORS.sub} />
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", right: 0, top: 42, background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.12)", width: 190, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.text }}>{user.name}</div>
                <div style={{ fontSize: 11, color: COLORS.sub }}>{user.email}</div>
              </div>
              <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", color: "#DC2626", fontSize: 13, fontWeight: 600 }}>
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== ADMIN: DASHBOARD ============================== */
function AdminDashboard({ db, setPage, setWorkerDetail }) {
  const { workers, scans, alerts, badges, settings } = db;
  const latestScanByWorker = {};
  scans.forEach((s) => { if (!latestScanByWorker[s.workerId] || s.scanTimestamp > latestScanByWorker[s.workerId].scanTimestamp) latestScanByWorker[s.workerId] = s; });
  const latestList = Object.values(latestScanByWorker);
  const highRisk = latestList.filter((s) => s.safetyStatus === "HIGH RISK").length;
  const activeBadges = badges.filter((b) => b.status === "VALID").length;

  const riskDist = ["SAFE", "MODERATE", "WARNING", "HIGH RISK"].map((s) => ({ name: s, value: latestList.filter((x) => x.safetyStatus === s).length }));
  const deptData = DEPARTMENTS.map((d) => {
    const ws = workers.filter((w) => w.department === d).map((w) => w.workerId);
    const relevant = latestList.filter((s) => ws.includes(s.workerId));
    const avg = relevant.length ? round2(relevant.reduce((a, s) => a + s.cumulativeDosePpmHours, 0) / relevant.length) : 0;
    return { name: d.replace("Process Unit - ", ""), avg };
  });
  const trend = [...scans].sort((a, b) => a.scanTimestamp - b.scanTimestamp).slice(-14).map((s) => ({ time: fmtTime(s.scanTimestamp) + " " + fmtDate(s.scanTimestamp).slice(0, 6), ppm: s.estimatedH2Sppm }));

  const recentScans = [...scans].sort((a, b) => b.scanTimestamp - a.scanTimestamp).slice(0, 6);
  const recentAlerts = [...alerts].sort((a, b) => b.time - a.time).slice(0, 5);
  const badgeStatusCounts = { VALID: badges.filter((b) => b.status === "VALID").length, "EXPIRING SOON": badges.filter((b) => b.status === "EXPIRING SOON").length, EXPIRED: badges.filter((b) => b.status === "EXPIRED").length };
  const workerName = (id) => workers.find((w) => w.workerId === id)?.name || "—";
  const workerDept = (id) => workers.find((w) => w.workerId === id)?.department || "—";

  return (
    <div>
      <SectionHeader title="Dashboard" sub="Live overview of worker exposure and site safety status." />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <StatCard icon={Users} label="Total Workers" value={workers.length} accent={COLORS.accent} />
        <StatCard icon={Tag} label="Active Badges" value={activeBadges} accent="#0E7A3C" />
        <StatCard icon={ShieldAlert} label="High Risk Cases" value={highRisk} accent="#E23B36" />
        <StatCard icon={ScanLine} label="Total Scans" value={scans.length} accent="#946C00" />
        <StatCard icon={ClipboardList} label="Exposure Records" value={scans.length} accent={COLORS.accentDark} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }} className="grid-2col">
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 12 }}>Exposure Trends (recent scans)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F8" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={Math.ceil(trend.length / 6)} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: "ppm", angle: -90, position: "insideLeft", fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="ppm" stroke={COLORS.accent} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 12 }}>Worker Risk Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {riskDist.map((r, i) => <Cell key={i} fill={STATUS[r.name].dot} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }} className="grid-2col">
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 12 }}>Department-wise Average Cumulative Exposure</div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F8" />
              <XAxis dataKey="name" tick={{ fontSize: 9.5 }} interval={0} angle={-12} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} label={{ value: "ppm·h", angle: -90, position: "insideLeft", fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="avg" fill={COLORS.accentDark} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 14 }}>Badge Status</div>
          {Object.entries(badgeStatusCounts).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <StatusPill status={k === "VALID" ? "SAFE" : k === "EXPIRING SOON" ? "WARNING" : "HIGH RISK"} size="sm" />
              <span style={{ fontSize: 12, color: COLORS.sub }}>{k}</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 12 }}>Recent Worker Scans</div>
        <Table
          columns={[
            { key: "scanTimestamp", label: "Scan Time", render: (r) => fmtDateTime(r.scanTimestamp) },
            { key: "workerId", label: "Worker ID" },
            { key: "name", label: "Worker Name", render: (r) => workerName(r.workerId) },
            { key: "dept", label: "Department", render: (r) => workerDept(r.workerId) },
            { key: "estimatedH2Sppm", label: "Current H₂S", render: (r) => `${r.estimatedH2Sppm} ppm` },
            { key: "exposureDuration", label: "Duration", render: (r) => `${r.exposureDuration} h` },
            { key: "cumulativeDosePpmHours", label: "Cumulative Dose", render: (r) => `${r.cumulativeDosePpmHours} ppm·h` },
            { key: "safetyStatus", label: "Status", render: (r) => <StatusPill status={r.safetyStatus} size="sm" /> },
            { key: "badgeId", label: "Badge ID" },
          ]}
          rows={recentScans}
        />
      </Card>

      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 12 }}>Recent Safety Alerts</div>
        <Table
          columns={[
            { key: "time", label: "Time", render: (r) => fmtDateTime(r.time) },
            { key: "workerId", label: "Worker ID" },
            { key: "name", label: "Worker Name", render: (r) => workerName(r.workerId) },
            { key: "currentH2S", label: "Current H₂S", render: (r) => `${r.currentH2S} ppm` },
            { key: "cumulativeExposure", label: "Cumulative Exposure", render: (r) => `${r.cumulativeExposure} ppm·h` },
            { key: "alertType", label: "Alert Type" },
            { key: "status", label: "Status", render: (r) => <StatusPill status={r.status === "ACTIVE" ? "HIGH RISK" : "SAFE"} size="sm" /> },
          ]}
          rows={recentAlerts}
        />
      </Card>

      <Card style={{ padding: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 14 }}>Quick Actions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Button icon={Plus} onClick={() => setPage("workers", { addWorker: true })}>Add Worker</Button>
          <Button icon={ScanLine} variant="outline" onClick={() => setPage("scan")}>Scan &amp; Analyze</Button>
          <Button icon={Users} variant="outline" onClick={() => setPage("workers")}>View Workers</Button>
          <Button icon={AlertTriangle} variant="outline" onClick={() => setPage("alerts")}>View Alerts</Button>
          <Button icon={FileText} variant="outline" onClick={() => setPage("reports")}>Generate Report</Button>
        </div>
      </Card>
    </div>
  );
}

/* ============================== ADMIN: WORKERS ============================== */
function WorkerFormModal({ open, onClose, onSave, badges, initial }) {
  const empty = { workerId: "", name: "", department: DEPARTMENTS[0], designation: "", shift: SHIFTS[0], badgeId: "", badgeStatus: "VALID", address: "", gender: "Male", contact: "", email: "", joiningDate: "", photo: "" };
  const [form, setForm] = useState(initial || empty);
  useEffect(() => { setForm(initial || empty); }, [initial, open]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const availableBadges = badges.filter((b) => !b.workerId || b.workerId === form.workerId);

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Worker" : "Add New Worker"} width={640}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Worker ID"><TextInput value={form.workerId} disabled={!!initial} onChange={set("workerId")} placeholder="ST1024" /></Field>
        <Field label="Full Name"><TextInput value={form.name} onChange={set("name")} placeholder="Full name" /></Field>
        <Field label="Department"><Select value={form.department} onChange={set("department")}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select></Field>
        <Field label="Designation"><TextInput value={form.designation} onChange={set("designation")} placeholder="e.g. Field Operator" /></Field>
        <Field label="Shift"><Select value={form.shift} onChange={set("shift")}>{SHIFTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Badge ID"><Select value={form.badgeId} onChange={set("badgeId")}><option value="">— unassigned —</option>{availableBadges.map((b) => <option key={b.badgeId} value={b.badgeId}>{b.badgeId}</option>)}</Select></Field>
        <Field label="Gender"><Select value={form.gender} onChange={set("gender")}><option>Male</option><option>Female</option><option>Other</option></Select></Field>
        <Field label="Contact Number"><TextInput value={form.contact} onChange={set("contact")} placeholder="+91 ..." /></Field>
        <Field label="Email"><TextInput type="email" value={form.email} onChange={set("email")} placeholder="name@mrpl.co.in" /></Field>
        <Field label="Joining Date"><TextInput type="date" value={form.joiningDate} onChange={set("joiningDate")} /></Field>
        <Field label="Profile Photo URL (optional)"><TextInput value={form.photo} onChange={set("photo")} placeholder="https://..." /></Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Address"><TextInput value={form.address} onChange={set("address")} placeholder="Full address" /></Field>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => { if (!form.workerId || !form.name) return; onSave(form); }}>{initial ? "Save Changes" : "Add Worker"}</Button>
      </div>
    </Modal>
  );
}

function computeLatest(scans, workerId) {
  const list = scans.filter((s) => s.workerId === workerId).sort((a, b) => b.scanTimestamp - a.scanTimestamp);
  return list[0] || null;
}

function AdminWorkers({ db, api, openWorkerDetail, jumpFlag }) {
  const { workers, badges, scans, settings } = db;
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [badgeFilter, setBadgeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(!!jumpFlag);
  const [editWorker, setEditWorker] = useState(null);

  const rows = workers.map((w) => {
    const latest = computeLatest(scans, w.workerId);
    const badge = badges.find((b) => b.badgeId === w.badgeId);
    return { ...w, latest, badgeStatus: badge?.status || "—" };
  }).filter((r) => {
    if (search && !(`${r.workerId} ${r.name}`.toLowerCase().includes(search.toLowerCase()))) return false;
    if (deptFilter && r.department !== deptFilter) return false;
    if (shiftFilter && r.shift !== shiftFilter) return false;
    if (badgeFilter && r.badgeStatus !== badgeFilter) return false;
    if (statusFilter && (r.latest?.safetyStatus || "SAFE") !== statusFilter) return false;
    return true;
  });

  const save = (form) => {
    if (editWorker) { api.updateWorker(form.workerId, form); }
    else {
      if (workers.some((w) => w.workerId === form.workerId)) { alert("Worker ID already exists."); return; }
      api.addWorker(form);
    }
    if (form.badgeId) api.updateBadge(form.badgeId, { workerId: form.workerId, status: form.badgeStatus || "VALID" });
    setModalOpen(false); setEditWorker(null);
  };

  return (
    <div>
      <SectionHeader title="Workers" sub="Manage worker profiles, badge assignment and exposure status." right={
        <Button icon={Plus} onClick={() => { setEditWorker(null); setModalOpen(true); }}>Add Worker</Button>
      } />

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: 10 }} color={COLORS.sub} />
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Worker ID or Name" style={{ paddingLeft: 32, width: "100%" }} />
          </div>
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ minWidth: 160 }}><option value="">All Departments</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select>
          <Select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)} style={{ minWidth: 150 }}><option value="">All Shifts</option>{SHIFTS.map((s) => <option key={s}>{s}</option>)}</Select>
          <Select value={badgeFilter} onChange={(e) => setBadgeFilter(e.target.value)} style={{ minWidth: 140 }}><option value="">All Badge Status</option><option>VALID</option><option>EXPIRING SOON</option><option>EXPIRED</option></Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: 140 }}><option value="">All Safety Status</option><option>SAFE</option><option>MODERATE</option><option>WARNING</option><option>HIGH RISK</option></Select>
        </div>
      </Card>

      <Card style={{ padding: 8 }}>
        <Table
          columns={[
            { key: "workerId", label: "Worker ID" },
            { key: "name", label: "Name" },
            { key: "department", label: "Department" },
            { key: "shift", label: "Shift", render: (r) => r.shift.split(" ")[0] },
            { key: "badgeId", label: "Badge ID" },
            { key: "badgeStatus", label: "Badge Status", render: (r) => <StatusPill size="sm" status={r.badgeStatus === "VALID" ? "SAFE" : r.badgeStatus === "EXPIRING SOON" ? "WARNING" : "HIGH RISK"} /> },
            { key: "curH2S", label: "Latest H₂S", render: (r) => r.latest ? `${r.latest.estimatedH2Sppm} ppm` : "—" },
            { key: "cum", label: "Cumulative Exposure", render: (r) => r.latest ? `${r.latest.cumulativeDosePpmHours} ppm·h` : "—" },
            { key: "status", label: "Safety Status", render: (r) => <StatusPill size="sm" status={r.latest?.safetyStatus || "SAFE"} /> },
            { key: "lastScan", label: "Last Scan", render: (r) => r.latest ? fmtDateTime(r.latest.scanTimestamp) : "No recent scan" },
            { key: "view", label: "", render: (r) => <Button variant="outline" icon={Eye} onClick={() => openWorkerDetail(r.workerId)}>View</Button> },
          ]}
          rows={rows}
        />
      </Card>

      <WorkerFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditWorker(null); }} onSave={save} badges={badges} initial={editWorker} />
    </div>
  );
}

function WorkerDetail({ db, api, workerId, back }) {
  const { workers, badges, scans, alerts } = db;
  const worker = workers.find((w) => w.workerId === workerId);
  const [editOpen, setEditOpen] = useState(false);
  if (!worker) return <div>Worker not found. <Button variant="ghost" onClick={back}>Back</Button></div>;
  const badge = badges.find((b) => b.badgeId === worker.badgeId);
  const history = scans.filter((s) => s.workerId === workerId).sort((a, b) => b.scanTimestamp - a.scanTimestamp);
  const latest = history[0];
  const myAlerts = alerts.filter((a) => a.workerId === workerId).sort((a, b) => b.time - a.time);
  const trend = [...history].sort((a, b) => a.scanTimestamp - b.scanTimestamp).map((s) => ({ time: fmtDate(s.scanTimestamp), ppm: s.estimatedH2Sppm, cum: s.cumulativeDosePpmHours }));

  return (
    <div>
      <button onClick={back} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: COLORS.accent, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 14 }}><ArrowLeft size={15} /> Back to Workers</button>
      <Card style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 62, height: 62, borderRadius: 999, background: COLORS.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22 }}>
              {worker.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: COLORS.text }}>{worker.name}</div>
              <div style={{ fontSize: 13, color: COLORS.sub }}>{worker.workerId} · {worker.designation} · {worker.department}</div>
              {latest && <div style={{ marginTop: 6 }}><StatusPill status={latest.safetyStatus} /></div>}
            </div>
          </div>
          <Button icon={Edit2} variant="outline" onClick={() => setEditOpen(true)}>Edit Worker</Button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 22 }} className="grid-4col">
          {[["Shift", worker.shift.split(" ")[0]], ["Badge ID", worker.badgeId || "—"], ["Badge Status", badge?.status || "—"], ["Contact", worker.contact]].map(([l, v]) => (
            <div key={l}><div style={{ fontSize: 11, color: COLORS.sub, fontWeight: 700, textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>{v}</div></div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
        <StatCard icon={Droplet} label="Current H₂S" value={latest ? `${latest.estimatedH2Sppm} ppm` : "—"} accent={COLORS.accent} />
        <StatCard icon={Clock} label="Exposure Duration" value={latest ? `${latest.exposureDuration} h` : "—"} accent="#946C00" />
        <StatCard icon={TrendingUp} label="Cumulative Dose" value={latest ? `${latest.cumulativeDosePpmHours} ppm·h` : "—"} accent={COLORS.accentDark} />
        <StatCard icon={ShieldCheck} label="Last Updated" value={latest ? fmtTime(latest.scanTimestamp) : "—"} sub={latest ? fmtDate(latest.scanTimestamp) : "No recent scan"} accent="#0E7A3C" />
      </div>

      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 12 }}>Exposure Trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F8" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="ppm" name="Current ppm" stroke={COLORS.accent} strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="cum" name="Cumulative ppm·h" stroke="#E8B300" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 12 }}>Scan / Exposure Records</div>
        <Table columns={[
          { key: "scanTimestamp", label: "Scan Time", render: (r) => fmtDateTime(r.scanTimestamp) },
          { key: "estimatedH2Sppm", label: "Current H₂S", render: (r) => `${r.estimatedH2Sppm} ppm` },
          { key: "exposureDuration", label: "Duration", render: (r) => `${r.exposureDuration} h` },
          { key: "cumulativeDosePpmHours", label: "Cumulative Dose", render: (r) => `${r.cumulativeDosePpmHours} ppm·h` },
          { key: "safetyIndex", label: "Safety Index", render: (r) => r.safetyIndex },
          { key: "safetyStatus", label: "Status", render: (r) => <StatusPill status={r.safetyStatus} size="sm" /> },
        ]} rows={history} />
      </Card>

      <Card style={{ padding: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 12 }}>Alerts</div>
        <Table columns={[
          { key: "time", label: "Time", render: (r) => fmtDateTime(r.time) },
          { key: "alertType", label: "Alert Type" },
          { key: "currentH2S", label: "Current H₂S", render: (r) => `${r.currentH2S} ppm` },
          { key: "cumulativeExposure", label: "Cumulative", render: (r) => `${r.cumulativeExposure} ppm·h` },
          { key: "status", label: "Status", render: (r) => <StatusPill size="sm" status={r.status === "ACTIVE" ? "HIGH RISK" : "SAFE"} /> },
        ]} rows={myAlerts} empty="No alerts for this worker." />
      </Card>

      <WorkerFormModal open={editOpen} onClose={() => setEditOpen(false)} onSave={(form) => { api.updateWorker(worker.workerId, form); setEditOpen(false); }} badges={badges} initial={worker} />
    </div>
  );
}

/* ============================== SCAN & ANALYSIS ============================== */
function ScanAnalysis({ db, api, role, fixedWorkerId }) {
  const { badges, workers, settings } = db;
  const [step, setStep] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [badge, setBadge] = useState(null);
  const [worker, setWorker] = useState(null);
  const [rgb, setRgb] = useState(null);
  const [temp, setTemp] = useState(null);
  const [hum, setHum] = useState(null);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const reset = () => { setStep(1); setBarcodeInput(""); setBadge(null); setWorker(null); setRgb(null); setResult(null); setSaved(false); };

  const scanBarcode = () => {
    let b;
    if (fixedWorkerId) {
      const w = workers.find((x) => x.workerId === fixedWorkerId);
      b = badges.find((x) => x.badgeId === w?.badgeId);
    } else {
      b = badges.find((x) => x.barcode === barcodeInput.trim() || x.badgeId === barcodeInput.trim());
    }
    if (!b) { alert("Badge/barcode not recognised. Try one of the sample badge IDs, e.g. BDG-2201."); return; }
    if (!b.workerId) { alert("This badge is not assigned to any worker."); return; }
    const w = workers.find((x) => x.workerId === b.workerId);
    setBadge(b); setWorker(w); setStep(2);
  };

  const scanRGB = () => {
    const r = 60 + Math.round(Math.random() * 160);
    const g = 50 + Math.round(Math.random() * 140);
    const b = 40 + Math.round(Math.random() * 120);
    const t = round2(27 + Math.random() * 7);
    const h = round2(50 + Math.random() * 25);
    setRgb({ r, g, b }); setTemp(t); setHum(h);
    setStep(3);
  };

  const analyze = () => {
    const colorIndex = round2(255 - (rgb.r + rgb.g + rgb.b) / 3);
    const cal = settings.calibration;
    const estimatedH2Sppm = Math.max(0, round2(colorIndex * cal.factor - cal.offset));
    const priorScans = db.scans.filter((s) => s.workerId === worker.workerId).sort((a, b) => b.scanTimestamp - a.scanTimestamp);
    const last = priorScans[0];
    const exposureDuration = last ? Math.max(0.25, round2(hoursAgo(last.scanTimestamp))) : 1;
    const cappedDuration = Math.min(exposureDuration, 12);
    const priorCumulative = last ? last.cumulativeDosePpmHours : 0;
    const cumulativeDosePpmHours = round2(priorCumulative + estimatedH2Sppm * cappedDuration * 0.3);
    const safetyStatus = computeStatus(estimatedH2Sppm, cumulativeDosePpmHours, settings.thresholds);
    const safetyIndex = round2(Math.max(0, 100 - statusRank[safetyStatus] * 22 - estimatedH2Sppm));
    const r = {
      scanId: genId("SCN-"), badgeId: badge.badgeId, barcode: badge.barcode, workerId: worker.workerId,
      scanTimestamp: now(), rgb, colorIndex, temperature: temp, humidity: hum,
      estimatedH2Sppm, exposureDuration: cappedDuration, cumulativeDosePpmHours, safetyIndex, safetyStatus,
      calibrationModelVersion: cal.version,
    };
    setResult(r); setStep(4);
  };

  const save = () => {
    api.addScan(result);
    api.updateBadge(badge.badgeId, { scanCount: (badge.scanCount || 0) + 1, lastScan: result.scanTimestamp });
    if (result.safetyStatus === "WARNING" || result.safetyStatus === "HIGH RISK") {
      api.addAlert({
        alertId: genId("ALT-"), workerId: worker.workerId, scanId: result.scanId, time: result.scanTimestamp,
        currentH2S: result.estimatedH2Sppm, cumulativeExposure: result.cumulativeDosePpmHours,
        alertType: result.safetyStatus === "HIGH RISK" ? "HIGH H2S EXPOSURE" : "ELEVATED H2S EXPOSURE",
        status: "ACTIVE",
        recommendation: result.safetyStatus === "HIGH RISK"
          ? "Evacuate area immediately, report to shift supervisor, and undergo medical check before re-entry."
          : "Reduce time in the affected zone, verify local ventilation, and re-scan within the hour.",
      });
    }
    setSaved(true);
  };

  const steps = ["Scan Badge Barcode", "Scan Bi(III) Strip (RGB)", "Analyze", "Result"];

  return (
    <div>
      <SectionHeader title="Scan & Analysis" sub="Workflow for the reusable external reader: barcode identification, RGB colour capture, and exposure calculation." />
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {steps.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: step === i + 1 ? COLORS.accent : step > i + 1 ? "#E3F7EA" : "#F1F5F9", color: step === i + 1 ? "#fff" : step > i + 1 ? "#0E7A3C" : COLORS.sub, fontSize: 12.5, fontWeight: 700 }}>
              {step > i + 1 ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>} {s}
            </div>
          ))}
        </div>
      </Card>

      {step === 1 && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: COLORS.accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Barcode size={22} color={COLORS.accent} /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Step 1 — Scan Badge Barcode / QR</div>
              <div style={{ fontSize: 12.5, color: COLORS.sub }}>Identify the worker's passive H₂S badge.</div>
            </div>
          </div>
          {!fixedWorkerId ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <Field label="Badge barcode / Badge ID">
                <TextInput value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} placeholder="e.g. BDG-2201 or MRPL-BDG-2201-8800" style={{ width: 320 }} />
              </Field>
              <Button icon={QrCode} onClick={scanBarcode}>Scan Barcode</Button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: COLORS.sub, marginBottom: 12 }}>Your badge will be identified automatically from your worker profile.</div>
              <Button icon={QrCode} onClick={scanBarcode}>Scan My Badge</Button>
            </div>
          )}
        </Card>
      )}

      {step === 2 && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[["Badge ID", badge.badgeId], ["Worker ID", worker.workerId], ["Worker Name", worker.name], ["Department", worker.department], ["Shift", worker.shift.split(" ")[0]], ["Badge Status", badge.status]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 10.5, color: COLORS.sub, fontWeight: 700, textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: 13.5, fontWeight: 700 }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: COLORS.accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={22} color={COLORS.accent} /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Step 2 — Scan Bi(III) Sensing Strip</div>
              <div style={{ fontSize: 12.5, color: COLORS.sub }}>Capture the RGB colour response using the external reader's illuminated RGB sensor.</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Button icon={Camera} onClick={scanRGB}>Scan Strip with RGB Sensor</Button>
            <div style={{ fontSize: 11.5, color: COLORS.sub, marginTop: 8 }}>Simulated reader input for this demo — a production reader streams live RGB/temperature/humidity to this same endpoint.</div>
          </div>
        </Card>
      )}

      {step === 3 && rgb && (
        <Card style={{ padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Captured Colour &amp; Environmental Data</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ width: 90, height: 90, borderRadius: 14, border: `1px solid ${COLORS.border}`, background: `rgb(${rgb.r},${rgb.g},${rgb.b})` }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
              {[["R", rgb.r], ["G", rgb.g], ["B", rgb.b], ["Temperature", `${temp} °C`], ["Humidity", `${hum} %`]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 10.5, color: COLORS.sub, fontWeight: 700, textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: 16, fontWeight: 800 }}>{v}</div></div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 18 }}><Button icon={Activity} onClick={analyze}>Calculate Exposure</Button></div>
        </Card>
      )}

      {step === 4 && result && (
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Scan Result — {worker.name} ({worker.workerId})</div>
            <StatusPill status={result.safetyStatus} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 18 }} className="grid-4col">
            <StatCard icon={Droplet} label="Current H₂S (est.)" value={`${result.estimatedH2Sppm} ppm`} accent={COLORS.accent} />
            <StatCard icon={Clock} label="Exposure Duration" value={`${result.exposureDuration} h`} accent="#946C00" />
            <StatCard icon={TrendingUp} label="Cumulative Dose" value={`${result.cumulativeDosePpmHours} ppm·h`} accent={COLORS.accentDark} />
            <StatCard icon={ShieldCheck} label="Safety Index" value={result.safetyIndex} accent="#0E7A3C" />
          </div>
          <div style={{ marginTop: 16, fontSize: 11.5, color: COLORS.sub }}>
            Estimated using calibration model <b>{result.calibrationModelVersion}</b> — a color-response calibration, not a direct ppm reading. Scan time: {fmtDateTime(result.scanTimestamp)}.
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
            {!saved ? <Button icon={CheckCircle2} onClick={save}>Save Scan to Records</Button> : <div style={{ color: "#0E7A3C", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={16} /> Saved to Exposure Records</div>}
            <Button variant="outline" icon={RefreshCw} onClick={reset}>New Scan</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============================== EXPOSURE RECORDS ============================== */
function ExposureRecordsPage({ db, role, fixedWorkerId }) {
  const { scans, workers } = db;
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [shift, setShift] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const workerOf = (id) => workers.find((w) => w.workerId === id);
  let rows = scans.filter((s) => (fixedWorkerId ? s.workerId === fixedWorkerId : true));
  rows = rows.map((s) => ({ ...s, w: workerOf(s.workerId) })).filter((r) => r.w);
  if (search) rows = rows.filter((r) => `${r.workerId} ${r.w.name}`.toLowerCase().includes(search.toLowerCase()));
  if (dept) rows = rows.filter((r) => r.w.department === dept);
  if (shift) rows = rows.filter((r) => r.w.shift === shift);
  if (status) rows = rows.filter((r) => r.safetyStatus === status);
  if (dateFrom) rows = rows.filter((r) => r.scanTimestamp >= new Date(dateFrom).getTime());
  if (dateTo) rows = rows.filter((r) => r.scanTimestamp <= new Date(dateTo).getTime() + 86400000);
  rows.sort((a, b) => b.scanTimestamp - a.scanTimestamp);

  const exportCSV = () => {
    const header = "Date,Worker ID,Worker Name,Department,Shift,Current H2S,Exposure Duration,Cumulative Dose,Safety Index,Status,Scan Time\n";
    const body = rows.map((r) => [fmtDate(r.scanTimestamp), r.workerId, r.w.name, r.w.department, r.w.shift.split(" ")[0], r.estimatedH2Sppm, r.exposureDuration, r.cumulativeDosePpmHours, r.safetyIndex, r.safetyStatus, fmtTime(r.scanTimestamp)].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "exposure_records.csv"; a.click();
  };

  return (
    <div>
      <SectionHeader title={fixedWorkerId ? "Exposure History" : "Exposure Records"} sub="Complete scan-by-scan exposure history." right={!fixedWorkerId && <Button icon={Download} variant="outline" onClick={exportCSV}>Export CSV</Button>} />
      {fixedWorkerId && (
        <Card style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 12 }}>Exposure Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[...rows].sort((a, b) => a.scanTimestamp - b.scanTimestamp).map((r) => ({ time: fmtDate(r.scanTimestamp), ppm: r.estimatedH2Sppm, cum: r.cumulativeDosePpmHours }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F8" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="ppm" name="Current ppm" stroke={COLORS.accent} strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="cum" name="Cumulative ppm·h" stroke="#E8B300" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {!fixedWorkerId && (
            <div style={{ position: "relative", flex: "1 1 220px" }}>
              <Search size={15} style={{ position: "absolute", left: 11, top: 10 }} color={COLORS.sub} />
              <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search worker" style={{ paddingLeft: 32, width: "100%" }} />
            </div>
          )}
          {!fixedWorkerId && <Select value={dept} onChange={(e) => setDept(e.target.value)} style={{ minWidth: 160 }}><option value="">All Departments</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select>}
          <Select value={shift} onChange={(e) => setShift(e.target.value)} style={{ minWidth: 150 }}><option value="">All Shifts</option>{SHIFTS.map((s) => <option key={s}>{s}</option>)}</Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ minWidth: 140 }}><option value="">All Status</option><option>SAFE</option><option>MODERATE</option><option>WARNING</option><option>HIGH RISK</option></Select>
          <TextInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <TextInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </Card>
      <Card style={{ padding: 8 }}>
        <Table columns={[
          { key: "date", label: "Date", render: (r) => fmtDate(r.scanTimestamp) },
          ...(fixedWorkerId ? [] : [{ key: "workerId", label: "Worker ID" }, { key: "name", label: "Worker Name", render: (r) => r.w.name }, { key: "department", label: "Department", render: (r) => r.w.department }]),
          { key: "shift", label: "Shift", render: (r) => r.w.shift.split(" ")[0] },
          { key: "estimatedH2Sppm", label: "Current H₂S", render: (r) => `${r.estimatedH2Sppm} ppm` },
          { key: "exposureDuration", label: "Exposure Duration", render: (r) => `${r.exposureDuration} h` },
          { key: "cumulativeDosePpmHours", label: "Cumulative Dose", render: (r) => `${r.cumulativeDosePpmHours} ppm·h` },
          { key: "safetyIndex", label: "Safety Index" },
          { key: "safetyStatus", label: "Status", render: (r) => <StatusPill size="sm" status={r.safetyStatus} /> },
          { key: "scanTimestamp", label: "Scan Time", render: (r) => fmtTime(r.scanTimestamp) },
        ]} rows={rows} />
      </Card>
    </div>
  );
}

/* ============================== REAL-TIME MONITORING ============================== */
function RealTimeMonitoring({ db }) {
  const { workers, scans } = db;
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 15000); return () => clearInterval(t); }, []);
  const rows = workers.map((w) => {
    const list = scans.filter((s) => s.workerId === w.workerId).sort((a, b) => b.scanTimestamp - a.scanTimestamp);
    return { w, latest: list[0] };
  });
  return (
    <div>
      <SectionHeader title="Real-Time Monitoring" sub="Latest available scan status for every active worker on site." right={<div style={{ fontSize: 11.5, color: COLORS.sub, display: "flex", alignItems: "center", gap: 6 }}><RefreshCw size={13} /> Auto-refreshing</div>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {rows.map(({ w, latest }) => {
          const stale = latest && hoursAgo(latest.scanTimestamp) > 12;
          const status = latest ? latest.safetyStatus : null;
          const s = status ? STATUS[status] : null;
          return (
            <Card key={w.workerId} style={{ padding: 18, borderLeft: `4px solid ${s ? s.dot : COLORS.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.sub }}>{w.workerId} · {w.department}</div>
                </div>
                {status && <StatusPill status={status} size="sm" />}
              </div>
              {latest ? (
                <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 10.5, color: COLORS.sub, fontWeight: 700 }}>CURRENT H₂S</div><div style={{ fontSize: 20, fontWeight: 800 }}>{latest.estimatedH2Sppm} <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.sub }}>ppm</span></div></div>
                  <div><div style={{ fontSize: 10.5, color: COLORS.sub, fontWeight: 700 }}>CUMULATIVE</div><div style={{ fontSize: 20, fontWeight: 800 }}>{latest.cumulativeDosePpmHours} <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.sub }}>ppm·h</span></div></div>
                </div>
              ) : (
                <div style={{ marginTop: 16, color: COLORS.sub, fontSize: 12.5, fontStyle: "italic" }}>No recent scan available</div>
              )}
              <div style={{ marginTop: 12, fontSize: 11.5, color: stale ? "#B85400" : COLORS.sub }}>
                {latest ? `Last scan: ${fmtDateTime(latest.scanTimestamp)}${stale ? " — stale" : ""}` : "—"}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== DEVICE MANAGEMENT ============================== */
function DeviceManagement({ db, api }) {
  const { devices } = db;
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ deviceId: "", name: "", type: "Handheld RGB + Barcode Reader", status: "ONLINE", location: "" });
  const save = () => {
    if (!form.deviceId || !form.name) return;
    api.addDevice({ ...form, lastSync: now() });
    setModalOpen(false); setForm({ deviceId: "", name: "", type: "Handheld RGB + Barcode Reader", status: "ONLINE", location: "" });
  };
  return (
    <div>
      <SectionHeader title="Device Management" sub="Reusable barcode + RGB reader units deployed across the site." right={<Button icon={Plus} onClick={() => setModalOpen(true)}>Register Device</Button>} />
      <Card style={{ padding: 8 }}>
        <Table columns={[
          { key: "deviceId", label: "Device ID" },
          { key: "name", label: "Name" },
          { key: "type", label: "Type" },
          { key: "location", label: "Location" },
          { key: "status", label: "Status", render: (r) => <StatusPill size="sm" status={r.status === "ONLINE" ? "SAFE" : "HIGH RISK"} /> },
          { key: "lastSync", label: "Last Sync", render: (r) => fmtDateTime(r.lastSync) },
        ]} rows={devices} />
      </Card>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register Reader Device">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Device ID"><TextInput value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} placeholder="RDR-004" /></Field>
          <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reader Unit B2" /></Field>
          <Field label="Type"><TextInput value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></Field>
          <Field label="Location"><TextInput value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. FCC Unit" /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>ONLINE</option><option>OFFLINE</option></Select></Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={save}>Register</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ============================== BADGE MANAGEMENT ============================== */
function BadgeManagement({ db, api }) {
  const { badges, workers } = db;
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ badgeId: "", barcode: "", workerId: "", issueDate: "", expiryDate: "" });
  const workerName = (id) => workers.find((w) => w.workerId === id)?.name || "Unassigned";

  const create = () => {
    if (!form.badgeId || !form.barcode) return;
    api.addBadge({ ...form, status: "VALID", scanCount: 0, lastScan: null });
    if (form.workerId) api.updateWorker(form.workerId, { badgeId: form.badgeId });
    setModalOpen(false); setForm({ badgeId: "", barcode: "", workerId: "", issueDate: "", expiryDate: "" });
  };
  const markExpired = (b) => api.updateBadge(b.badgeId, { status: "EXPIRED" });
  const replace = (b) => {
    const newId = genId("BDG-");
    api.addBadge({ badgeId: newId, barcode: `MRPL-${newId}-${Math.floor(Math.random() * 9000)}`, workerId: b.workerId, issueDate: fmtDate(now()), expiryDate: "2027-06-01", status: "VALID", scanCount: 0, lastScan: null });
    api.updateBadge(b.badgeId, { status: "EXPIRED" });
    if (b.workerId) api.updateWorker(b.workerId, { badgeId: newId });
  };

  return (
    <div>
      <SectionHeader title="Badge Management" sub="Issue, assign and retire passive H₂S sensing badges." right={<Button icon={Plus} onClick={() => setModalOpen(true)}>Create Badge</Button>} />
      <Card style={{ padding: 8 }}>
        <Table columns={[
          { key: "badgeId", label: "Badge ID" },
          { key: "barcode", label: "Barcode / QR" },
          { key: "workerId", label: "Assigned Worker", render: (r) => r.workerId ? `${r.workerId} — ${workerName(r.workerId)}` : "Unassigned" },
          { key: "issueDate", label: "Issue Date" },
          { key: "expiryDate", label: "Expiry Date" },
          { key: "status", label: "Status", render: (r) => <StatusPill size="sm" status={r.status === "VALID" ? "SAFE" : r.status === "EXPIRING SOON" ? "WARNING" : "HIGH RISK"} /> },
          { key: "lastScan", label: "Last Scan", render: (r) => r.lastScan ? fmtDateTime(r.lastScan) : "—" },
          { key: "scanCount", label: "# Scans" },
          { key: "actions", label: "Actions", render: (r) => (
            <div style={{ display: "flex", gap: 6 }}>
              {r.status !== "EXPIRED" && <Button variant="ghost" style={{ padding: "6px 9px", fontSize: 11.5 }} onClick={() => markExpired(r)}>Mark Expired</Button>}
              {r.workerId && <Button variant="outline" style={{ padding: "6px 9px", fontSize: 11.5 }} onClick={() => replace(r)}>Replace</Button>}
            </div>
          ) },
        ]} rows={badges} />
      </Card>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create New Badge">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Badge ID"><TextInput value={form.badgeId} onChange={(e) => setForm({ ...form, badgeId: e.target.value })} placeholder="BDG-2300" /></Field>
          <Field label="Barcode / QR"><TextInput value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="MRPL-BDG-2300-1234" /></Field>
          <Field label="Assign to Worker"><Select value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })}><option value="">— unassigned —</option>{workers.map((w) => <option key={w.workerId} value={w.workerId}>{w.workerId} — {w.name}</option>)}</Select></Field>
          <div />
          <Field label="Issue Date"><TextInput type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></Field>
          <Field label="Expiry Date"><TextInput type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={create}>Create Badge</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ============================== REPORTS ============================== */
function ReportsPage({ db }) {
  const { workers, scans } = db;
  const [worker, setWorker] = useState("");
  const [dept, setDept] = useState("");
  const [shift, setShift] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generated, setGenerated] = useState(false);

  const workerOf = (id) => workers.find((w) => w.workerId === id);
  const filtered = () => {
    let rows = scans.map((s) => ({ ...s, w: workerOf(s.workerId) })).filter((r) => r.w);
    if (worker) rows = rows.filter((r) => r.workerId === worker);
    if (dept) rows = rows.filter((r) => r.w.department === dept);
    if (shift) rows = rows.filter((r) => r.w.shift === shift);
    if (status) rows = rows.filter((r) => r.safetyStatus === status);
    if (dateFrom) rows = rows.filter((r) => r.scanTimestamp >= new Date(dateFrom).getTime());
    if (dateTo) rows = rows.filter((r) => r.scanTimestamp <= new Date(dateTo).getTime() + 86400000);
    return rows.sort((a, b) => b.scanTimestamp - a.scanTimestamp);
  };
  const rows = generated ? filtered() : [];

  const exportCSV = () => {
    const header = "Date,Worker ID,Worker Name,Department,Shift,Current H2S,Exposure Duration,Cumulative Dose,Status,Badge ID\n";
    const body = rows.map((r) => [fmtDate(r.scanTimestamp), r.workerId, r.w.name, r.w.department, r.w.shift.split(" ")[0], r.estimatedH2Sppm, r.exposureDuration, r.cumulativeDosePpmHours, r.safetyStatus, r.badgeId].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "mrpl_h2s_report.csv"; a.click();
  };

  return (
    <div>
      <SectionHeader title="Reports" sub="Generate exposure and safety reports for workers, departments or date ranges." />
      <Card style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px,1fr))", gap: 12 }}>
          <Field label="Worker"><Select value={worker} onChange={(e) => setWorker(e.target.value)}><option value="">All Workers</option>{workers.map((w) => <option key={w.workerId} value={w.workerId}>{w.name}</option>)}</Select></Field>
          <Field label="Department"><Select value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All Departments</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select></Field>
          <Field label="Shift"><Select value={shift} onChange={(e) => setShift(e.target.value)}><option value="">All Shifts</option>{SHIFTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Safety Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All Status</option><option>SAFE</option><option>MODERATE</option><option>WARNING</option><option>HIGH RISK</option></Select></Field>
          <Field label="From Date"><TextInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></Field>
          <Field label="To Date"><TextInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></Field>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <Button icon={FileText} onClick={() => setGenerated(true)}>Generate Report</Button>
          {generated && <Button variant="outline" icon={Download} onClick={exportCSV}>Export CSV</Button>}
        </div>
      </Card>
      {generated && (
        <Card style={{ padding: 8 }}>
          <div style={{ padding: "12px 14px", fontSize: 13, color: COLORS.sub }}>{rows.length} record(s) found.</div>
          <Table columns={[
            { key: "date", label: "Date", render: (r) => fmtDate(r.scanTimestamp) },
            { key: "workerId", label: "Worker ID" },
            { key: "name", label: "Name", render: (r) => r.w.name },
            { key: "department", label: "Department", render: (r) => r.w.department },
            { key: "shift", label: "Shift", render: (r) => r.w.shift.split(" ")[0] },
            { key: "estimatedH2Sppm", label: "Current H₂S", render: (r) => `${r.estimatedH2Sppm} ppm` },
            { key: "exposureDuration", label: "Duration", render: (r) => `${r.exposureDuration} h` },
            { key: "cumulativeDosePpmHours", label: "Cumulative Dose", render: (r) => `${r.cumulativeDosePpmHours} ppm·h` },
            { key: "safetyStatus", label: "Status", render: (r) => <StatusPill size="sm" status={r.safetyStatus} /> },
            { key: "badgeId", label: "Badge ID" },
          ]} rows={rows} />
        </Card>
      )}
    </div>
  );
}

/* ============================== SAFETY ALERTS ============================== */
function AlertsPage({ db, api, fixedWorkerId }) {
  const { alerts, workers } = db;
  const [tab, setTab] = useState("ACTIVE");
  const workerOf = (id) => workers.find((w) => w.workerId === id);
  let rows = alerts.filter((a) => (fixedWorkerId ? a.workerId === fixedWorkerId : true));
  rows = rows.map((a) => ({ ...a, w: workerOf(a.workerId) })).filter((r) => r.w);
  const tabs = fixedWorkerId ? ["ACTIVE", "RESOLVED", "ALL"] : ["ACTIVE", "RESOLVED", "ALL"];
  const filtered = tab === "ALL" ? rows : rows.filter((r) => r.status === tab);
  filtered.sort((a, b) => b.time - a.time);

  return (
    <div>
      <SectionHeader title="Safety Alerts" sub={fixedWorkerId ? "Alerts generated from your exposure scans." : "High-risk and elevated exposure alerts across all workers."} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 999, border: `1px solid ${tab === t ? COLORS.accent : COLORS.border}`, background: tab === t ? COLORS.accent : "#fff", color: tab === t ? "#fff" : COLORS.sub, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{t === "ALL" ? "Alert History" : t.charAt(0) + t.slice(1).toLowerCase()}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 && <Card style={{ padding: 30, textAlign: "center", color: COLORS.sub, fontSize: 13 }}>No alerts in this category.</Card>}
        {filtered.map((a) => {
          const s = STATUS[a.alertType === "HIGH H2S EXPOSURE" ? "HIGH RISK" : "WARNING"];
          return (
            <Card key={a.alertId} style={{ padding: 18, borderLeft: `4px solid ${s.dot}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={16} color={s.dot} />
                    <span style={{ fontWeight: 800, fontSize: 14.5 }}>{a.alertType}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: COLORS.sub, marginTop: 4 }}>{fmtDateTime(a.time)}</div>
                  {!fixedWorkerId && <div style={{ fontSize: 13, marginTop: 8 }}>Worker ID: <b>{a.workerId}</b> — {a.w.name} ({a.w.department})</div>}
                  <div style={{ fontSize: 13, marginTop: 4 }}>Current H₂S: <b>{a.currentH2S} ppm</b> · Cumulative Exposure: <b>{a.cumulativeExposure} ppm·h</b></div>
                  {a.recommendation && <div style={{ fontSize: 12.5, color: COLORS.sub, marginTop: 8, maxWidth: 520 }}>Recommendation: {a.recommendation}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                  <StatusPill status={a.alertType === "HIGH H2S EXPOSURE" ? "HIGH RISK" : "WARNING"} />
                  {!fixedWorkerId && a.status === "ACTIVE" && <Button variant="outline" style={{ padding: "6px 11px", fontSize: 12 }} onClick={() => api.resolveAlert(a.alertId)}>Mark Resolved</Button>}
                  {a.status === "RESOLVED" && <span style={{ fontSize: 11.5, color: "#0E7A3C", fontWeight: 700 }}>Resolved</span>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== USER MANAGEMENT ============================== */
function UserManagementPage({ db, api }) {
  const { users } = db;
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ userId: "", name: "", email: "", role: "WORKER", password: "" });
  const create = () => {
    if (!form.name || !form.email) return;
    api.addUser({ ...form, userId: genId("USR-"), status: "ACTIVE", lastLogin: null });
    setModalOpen(false); setForm({ userId: "", name: "", email: "", role: "WORKER", password: "" });
  };
  const toggleStatus = (u) => api.updateUser(u.userId, { status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
  return (
    <div>
      <SectionHeader title="User Management" sub="System accounts and role assignment." right={<Button icon={Plus} onClick={() => setModalOpen(true)}>Add User</Button>} />
      <Card style={{ padding: 8 }}>
        <Table columns={[
          { key: "userId", label: "User ID" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status", render: (r) => <StatusPill size="sm" status={r.status === "ACTIVE" ? "SAFE" : "HIGH RISK"} /> },
          { key: "lastLogin", label: "Last Login", render: (r) => r.lastLogin ? fmtDateTime(r.lastLogin) : "Never" },
          { key: "actions", label: "", render: (r) => <Button variant="ghost" style={{ padding: "6px 10px", fontSize: 11.5 }} onClick={() => toggleStatus(r)}>{r.status === "ACTIVE" ? "Suspend" : "Reactivate"}</Button> },
        ]} rows={users} />
      </Card>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add System User">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Role"><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>WORKER</option><option>ADMIN</option></Select></Field>
          <Field label="Temporary Password"><TextInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set initial password" /></Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={create}>Create User</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ============================== SETTINGS ============================== */
function SettingsPage({ db, api, role }) {
  const [form, setForm] = useState(db.settings);
  useEffect(() => setForm(db.settings), [db.settings]);
  const save = () => { api.updateSettings(form); alert("Settings saved."); };
  const setPath = (path, value) => {
    setForm((f) => {
      const copy = JSON.parse(JSON.stringify(f));
      let obj = copy; const parts = path.split(".");
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return copy;
    });
  };
  if (role !== "ADMIN") {
    return (
      <div>
        <SectionHeader title="Settings" sub="Account preferences." />
        <Card style={{ padding: 20, maxWidth: 460 }}>
          <div style={{ fontWeight: 800, marginBottom: 14 }}>Account</div>
          <Field label="Change Password"><TextInput type="password" placeholder="New password" /></Field>
          <div style={{ marginTop: 14 }}><Button>Update Password</Button></div>
        </Card>
      </div>
    );
  }
  return (
    <div>
      <SectionHeader title="Settings" sub="Organization, safety thresholds, calibration and notifications." right={<Button icon={CheckCircle2} onClick={save}>Save All Settings</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="grid-2col">
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, marginBottom: 14 }}>Organization Settings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Organization Name"><TextInput value={form.org.name} onChange={(e) => setPath("org.name", e.target.value)} /></Field>
            <Field label="Site"><TextInput value={form.org.site} onChange={(e) => setPath("org.site", e.target.value)} /></Field>
            <Field label="Tagline"><TextInput value={form.org.tagline} onChange={(e) => setPath("org.tagline", e.target.value)} /></Field>
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, marginBottom: 14 }}>Exposure Calibration Settings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Calibration Model Version"><TextInput value={form.calibration.version} onChange={(e) => setPath("calibration.version", e.target.value)} /></Field>
            <Field label="Model Description"><TextInput value={form.calibration.model} onChange={(e) => setPath("calibration.model", e.target.value)} /></Field>
            <div style={{ display: "flex", gap: 10 }}>
              <Field label="Factor"><TextInput type="number" step="0.001" value={form.calibration.factor} onChange={(e) => setPath("calibration.factor", parseFloat(e.target.value))} /></Field>
              <Field label="Offset"><TextInput type="number" step="0.01" value={form.calibration.offset} onChange={(e) => setPath("calibration.offset", parseFloat(e.target.value))} /></Field>
            </div>
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, marginBottom: 14 }}>Safety Threshold Settings — Current H₂S (ppm)</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Moderate ≥"><TextInput type="number" value={form.thresholds.current.moderate} onChange={(e) => setPath("thresholds.current.moderate", parseFloat(e.target.value))} /></Field>
            <Field label="Warning ≥"><TextInput type="number" value={form.thresholds.current.warning} onChange={(e) => setPath("thresholds.current.warning", parseFloat(e.target.value))} /></Field>
            <Field label="High Risk ≥"><TextInput type="number" value={form.thresholds.current.highRisk} onChange={(e) => setPath("thresholds.current.highRisk", parseFloat(e.target.value))} /></Field>
          </div>
          <div style={{ fontWeight: 800, margin: "18px 0 14px" }}>Safety Threshold Settings — Cumulative Dose (ppm·h)</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Field label="Moderate ≥"><TextInput type="number" value={form.thresholds.cumulative.moderate} onChange={(e) => setPath("thresholds.cumulative.moderate", parseFloat(e.target.value))} /></Field>
            <Field label="Warning ≥"><TextInput type="number" value={form.thresholds.cumulative.warning} onChange={(e) => setPath("thresholds.cumulative.warning", parseFloat(e.target.value))} /></Field>
            <Field label="High Risk ≥"><TextInput type="number" value={form.thresholds.cumulative.highRisk} onChange={(e) => setPath("thresholds.cumulative.highRisk", parseFloat(e.target.value))} /></Field>
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontWeight: 800, marginBottom: 14 }}>Notification Settings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.notifications.emailAlerts} onChange={(e) => setPath("notifications.emailAlerts", e.target.checked)} /> Email alerts to admins</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.notifications.smsAlerts} onChange={(e) => setPath("notifications.smsAlerts", e.target.checked)} /> SMS alerts to shift supervisors</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.notifications.highRiskOnly} onChange={(e) => setPath("notifications.highRiskOnly", e.target.checked)} /> Notify for HIGH RISK only</label>
          </div>
          <div style={{ fontWeight: 800, margin: "18px 0 10px" }}>System Settings</div>
          <div style={{ fontSize: 12.5, color: COLORS.sub, lineHeight: 1.7 }}>Database: MongoDB · Environment: Production<br />Reader integration: REST / Bluetooth gateway ready</div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== HELP & SUPPORT ============================== */
function HelpPage() {
  const faqs = [
    ["How does the passive badge work?", "The Bi(III)-acetate sensing paper darkens on contact with H2S through a hydrophobic, gas-permeable membrane. It contains no electronics — the reader captures the colour change optically."],
    ["Why is H2S shown as an estimate?", "The ppm value is derived from a calibrated colour-response model, not a direct electrochemical reading, so it is always labelled as an estimate."],
    ["What do I do if I get a HIGH RISK alert?", "Leave the affected area immediately, notify your shift supervisor, and follow the recommendation shown on the alert."],
    ["Who do I contact for a damaged badge?", "Report to your area safety officer or raise a badge replacement request through Badge Management (Admin) or your supervisor."],
  ];
  return (
    <div>
      <SectionHeader title="Help & Support" sub="Frequently asked questions and contact information." />
      <Card style={{ padding: 20, marginBottom: 16 }}>
        {faqs.map(([q, a]) => (
          <div key={q} style={{ padding: "14px 0", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{q}</div>
            <div style={{ fontSize: 12.5, color: COLORS.sub, marginTop: 6, lineHeight: 1.6 }}>{a}</div>
          </div>
        ))}
      </Card>
      <Card style={{ padding: 20 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Contact HSE Support</div>
        <div style={{ fontSize: 13, color: COLORS.sub, lineHeight: 1.9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={14} /> HSE Control Room: 1800-XXX-XXXX</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={14} /> hse-support@mrpl.co.in</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={14} /> MRPL, Kuthethoor, Mangalore, Karnataka</div>
        </div>
      </Card>
    </div>
  );
}

/* ============================== WORKER DASHBOARD & PROFILE ============================== */
function WorkerDashboard({ db, worker, setPage }) {
  const { scans, badges, alerts } = db;
  const history = scans.filter((s) => s.workerId === worker.workerId).sort((a, b) => b.scanTimestamp - a.scanTimestamp);
  const latest = history[0];
  const badge = badges.find((b) => b.badgeId === worker.badgeId);
  const activeAlerts = alerts.filter((a) => a.workerId === worker.workerId && a.status === "ACTIVE").length;

  return (
    <div>
      <SectionHeader title={`Welcome, ${worker.name.split(" ")[0]}`} sub="Your current H₂S exposure status and profile summary." />
      <Card style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: COLORS.sub, textTransform: "uppercase", letterSpacing: 0.3 }}>Worker Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }} className="grid-4col">
          {[["Worker ID", worker.workerId], ["Department", worker.department], ["Designation", worker.designation], ["Shift", worker.shift.split(" ")[0]], ["Badge Status", badge?.status || "—"], ["Badge Expiry", badge?.expiryDate || "—"], ["Contact", worker.contact], ["Address", worker.address]].map(([l, v]) => (
            <div key={l}><div style={{ fontSize: 11, color: COLORS.sub, fontWeight: 700, textTransform: "uppercase" }}>{l}</div><div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>{v}</div></div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 24, marginBottom: 16, background: latest ? STATUS[latest.safetyStatus].bg : "#F4F7FB", border: `1px solid ${latest ? STATUS[latest.safetyStatus].ring : COLORS.border}` }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, color: COLORS.sub, textTransform: "uppercase", letterSpacing: 0.3 }}>Current H₂S Status</div>
        {latest ? (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 26 }}>
            <div>
              <div style={{ fontSize: 40, fontWeight: 900, color: COLORS.text }}>{latest.estimatedH2Sppm} <span style={{ fontSize: 16, fontWeight: 700 }}>ppm</span></div>
              <div style={{ marginTop: 6 }}><StatusPill status={latest.safetyStatus} /></div>
            </div>
            <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
              <div><div style={{ fontSize: 10.5, color: COLORS.sub, fontWeight: 700 }}>LAST UPDATED</div><div style={{ fontSize: 14, fontWeight: 700 }}>{fmtTime(latest.scanTimestamp)}</div><div style={{ fontSize: 11.5, color: COLORS.sub }}>{fmtDate(latest.scanTimestamp)}</div></div>
              <div><div style={{ fontSize: 10.5, color: COLORS.sub, fontWeight: 700 }}>EXPOSURE DURATION</div><div style={{ fontSize: 14, fontWeight: 700 }}>{latest.exposureDuration} h</div></div>
              <div><div style={{ fontSize: 10.5, color: COLORS.sub, fontWeight: 700 }}>CUMULATIVE EXPOSURE</div><div style={{ fontSize: 14, fontWeight: 700 }}>{latest.cumulativeDosePpmHours} ppm·h</div></div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: COLORS.sub, fontStyle: "italic" }}>No recent H₂S scan available</div>
        )}
      </Card>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
        <StatCard icon={ScanLine} label="Total Scans" value={history.length} accent={COLORS.accent} />
        <StatCard icon={AlertTriangle} label="Active Alerts" value={activeAlerts} accent="#E23B36" />
        <StatCard icon={Tag} label="Badge ID" value={worker.badgeId || "—"} accent="#946C00" />
      </div>

      <Card style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Ready for your next scan?</div>
            <div style={{ fontSize: 12.5, color: COLORS.sub, marginTop: 4 }}>Use the reusable reader to scan your badge and Bi(III) strip.</div>
          </div>
          <Button icon={ScanLine} onClick={() => setPage("scan")}>Scan &amp; Analyze</Button>
        </div>
      </Card>
    </div>
  );
}

function WorkerProfile({ db, api, worker }) {
  const badge = db.badges.find((b) => b.badgeId === worker.badgeId);
  const [form, setForm] = useState({ address: worker.address, contact: worker.contact, email: worker.email, gender: worker.gender, photo: worker.photo });
  const save = () => { api.updateWorker(worker.workerId, form); alert("Profile updated."); };
  return (
    <div>
      <SectionHeader title="My Profile" sub="Your worker record. Contact admin/HR for changes to role-controlled fields." />
      <Card style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <div style={{ width: 62, height: 62, borderRadius: 999, background: COLORS.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22 }}>
            {worker.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{worker.name}</div>
            <div style={{ fontSize: 12.5, color: COLORS.sub }}>{worker.designation} · {worker.department}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="grid-2col">
          <Field label="Worker ID (read-only)"><TextInput value={worker.workerId} disabled /></Field>
          <Field label="Full Name (read-only)"><TextInput value={worker.name} disabled /></Field>
          <Field label="Department (read-only)"><TextInput value={worker.department} disabled /></Field>
          <Field label="Designation (read-only)"><TextInput value={worker.designation} disabled /></Field>
          <Field label="Shift (read-only)"><TextInput value={worker.shift} disabled /></Field>
          <Field label="Badge Status (read-only)"><TextInput value={badge?.status || "—"} disabled /></Field>
          <Field label="Badge ID (read-only)"><TextInput value={worker.badgeId || "—"} disabled /></Field>
          <Field label="Badge Expiry (read-only)"><TextInput value={badge?.expiryDate || "—"} disabled /></Field>
          <Field label="Gender"><Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></Select></Field>
          <Field label="Contact Number"><TextInput value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
          <Field label="Email"><TextInput value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Profile Photo URL"><TextInput value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} /></Field>
          <div style={{ gridColumn: "1 / -1" }}><Field label="Address"><TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
        </div>
        <div style={{ marginTop: 18 }}><Button icon={CheckCircle2} onClick={save}>Save Changes</Button></div>
      </Card>
    </div>
  );
}

/* ================================== ROOT APP ================================== */
export default function App() {
  const [db, setDb] = useState(() => seedDatabase());
  const api = useMemo(() => makeApi(db, setDb), [db]);
  const [session, setSession] = useState(null); // {userId, role, name, email, workerId?}
  const [page, setPage] = useState("dashboard");
  const [pageArg, setPageArg] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workerDetailId, setWorkerDetailId] = useState(null);

  const doLogin = (u) => {
    api.updateUser(u.userId, { lastLogin: now() });
    setSession({ userId: u.userId, role: u.role, name: u.name, email: u.email, workerId: u.workerId });
    setPage("dashboard");
  };
  const doLogout = () => { setSession(null); setPage("dashboard"); setWorkerDetailId(null); };
  const nav = (key, arg) => { setPage(key); setPageArg(arg || null); setWorkerDetailId(null); };

  if (!session) return <LoginPage users={db.users} onLogin={doLogin} />;

  const isAdmin = session.role === "ADMIN";
  const navItems = isAdmin ? ADMIN_NAV : WORKER_NAV;
  const worker = !isAdmin ? db.workers.find((w) => w.workerId === session.workerId) : null;
  const alertCount = db.alerts.filter((a) => a.status === "ACTIVE" && (isAdmin || a.workerId === session.workerId)).length;
  const titleMap = Object.fromEntries(navItems.map((n) => [n.key, n.label]));

  let content;
  if (isAdmin) {
    if (workerDetailId) content = <WorkerDetail db={db} api={api} workerId={workerDetailId} back={() => setWorkerDetailId(null)} />;
    else if (page === "dashboard") content = <AdminDashboard db={db} setPage={nav} setWorkerDetail={setWorkerDetailId} />;
    else if (page === "workers") content = <AdminWorkers db={db} api={api} openWorkerDetail={setWorkerDetailId} jumpFlag={pageArg?.addWorker} />;
    else if (page === "scan") content = <ScanAnalysis db={db} api={api} role="ADMIN" />;
    else if (page === "exposure") content = <ExposureRecordsPage db={db} role="ADMIN" />;
    else if (page === "realtime") content = <RealTimeMonitoring db={db} />;
    else if (page === "devices") content = <DeviceManagement db={db} api={api} />;
    else if (page === "badges") content = <BadgeManagement db={db} api={api} />;
    else if (page === "reports") content = <ReportsPage db={db} />;
    else if (page === "alerts") content = <AlertsPage db={db} api={api} />;
    else if (page === "users") content = <UserManagementPage db={db} api={api} />;
    else if (page === "settings") content = <SettingsPage db={db} api={api} role="ADMIN" />;
    else if (page === "help") content = <HelpPage />;
  } else {
    if (page === "dashboard") content = <WorkerDashboard db={db} worker={worker} setPage={nav} />;
    else if (page === "profile") content = <WorkerProfile db={db} api={api} worker={worker} />;
    else if (page === "scan") content = <ScanAnalysis db={db} api={api} role="WORKER" fixedWorkerId={worker.workerId} />;
    else if (page === "exposure") content = <ExposureRecordsPage db={db} role="WORKER" fixedWorkerId={worker.workerId} />;
    else if (page === "alerts") content = <AlertsPage db={db} api={api} fixedWorkerId={worker.workerId} />;
    else if (page === "settings") content = <SettingsPage db={db} api={api} role="WORKER" />;
    else if (page === "help") content = <HelpPage />;
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: COLORS.bg, minHeight: "100vh" }}>
      <style>{`
        * { box-sizing: border-box; }
        @media (min-width: 900px) {
          .app-sidebar { left: 0 !important; }
          .hamburger { display: none !important; }
          .sidebar-close { display: none !important; }
          .user-name-block { display: block !important; }
          .app-main { margin-left: 246px; }
        }
        @media (max-width: 899px) {
          .sidebar-close { display: block !important; }
          .hamburger { display: block !important; }
          .grid-2col, .grid-4col { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 900px) and (max-width: 1200px) {
          .grid-4col { grid-template-columns: repeat(2,1fr) !important; }
        }
        table { font-family: inherit; }
      `}</style>
      <Sidebar nav={navItems} active={page} setActive={(k) => nav(k)} role={session.role} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="app-main">
        <Topbar title={workerDetailId ? "Worker Details" : (titleMap[page] || "Dashboard")} user={session} onLogout={doLogout} setMobileOpen={setMobileOpen} alertCount={alertCount} onBell={() => nav("alerts")} />
        <div style={{ padding: "22px" }}>{content}</div>
      </div>
    </div>
  );
}
