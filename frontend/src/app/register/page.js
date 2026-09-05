"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, HeartPulse,
  Stethoscope, User, Calendar, Phone, Building, UserCheck,
  AlertCircle, ChevronLeft
} from "lucide-react";
import { authApi } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

// ─── Floating Blob Component (Fluent/Stripe Mesh Gradient) ───
const FloatingBlob = ({ color, className, delay = 0, size = 300 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: 0.6,
      scale: [1, 1.1, 1],
      x: [0, 40, -30, 0],
      y: [0, -50, 30, 0],
    }}
    transition={{
      duration: 20,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
      delay,
    }}
    style={{ width: size, height: size, background: color }}
    className={cn("absolute rounded-full blur-[120px] pointer-events-none mix-blend-multiply", className)}
  />
);

const STEPS = ["Account", "Profile", "Review"];

// Safe string coercion for error values
function safeErrorString(err) {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    return err.msg || err.message || err.detail || JSON.stringify(err);
  }
  return String(err);
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    role: "patient",
    password: "",
    confirm_password: "",
    // Patient
    date_of_birth: "",
    gender: "female",
    blood_group: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    // Doctor
    specialty: "",
    clinic_address: "",
    // Provider
    facility_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleNext() {
    setError("");
    if (step === 0) {
      if (!form.full_name || !form.email || !form.password || !form.confirm_password) {
        setError("All account fields are required.");
        return;
      }
      if (form.password !== form.confirm_password) {
        setError("Passwords do not match.");
        return;
      }
      if (form.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }
    setStep((s) => s + 1);
  }

  async function handleFinish() {
    setError("");
    setSuccess("");
    setLoading(true);

    // Build payload — only send fields relevant to the selected role
    const payload = {
      email: form.email,
      password: form.password,
      full_name: form.full_name,
      role: form.role,
      phone_number: form.phone_number || null,
      date_of_birth: form.role === "patient" ? (form.date_of_birth || null) : null,
      gender: form.role === "patient" ? (form.gender || null) : null,
      blood_group: form.role === "patient" ? (form.blood_group || null) : null,
      address: (form.role === "patient" || form.role === "clinic") ? (form.address || null) : null,
      emergency_contact_name: form.role === "patient" ? (form.emergency_contact_name || null) : null,
      emergency_contact_phone: form.role === "patient" ? (form.emergency_contact_phone || null) : null,
      specialty: form.role === "doctor" ? (form.specialty || null) : null,
      clinic_address: form.role === "doctor" ? (form.clinic_address || null) : null,
      facility_name: form.role === "clinic" ? (form.facility_name || null) : null,
    };

    console.log("[Register] POST /api/v1/auth/register", { ...payload, password: "***" });

    try {
      const res = await authApi.register(payload);
      console.log("[Register] Response:", res.status, res.data);

      if (res.data?.is_dev_update) {
        setSuccess("Development account updated successfully.");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error("[Register] Error:", err);
      if (err.status === 409) {
        setStep(3); // Show "Account Exists" page
      } else {
        // err is the normalized error from apiClient interceptor
        const msg = safeErrorString(err.message || err) || "Registration failed. Please check your details and try again.";
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // Determine current step label safely
  const stepLabel = step < STEPS.length ? STEPS[step] : "Complete";
  const isAccountExists = step === 3;

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden font-sans selection:bg-blue-200">

      {/* ─── STRIPE / APPLE BACKGROUND MESH ─── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <FloatingBlob color="#dbeafe" className="top-[-10%] left-[-10%]" size={800} delay={0} />
        <FloatingBlob color="#cffafe" className="bottom-[-20%] right-[10%]" size={700} delay={2} />
        <FloatingBlob color="#f3e8ff" className="top-[20%] left-[50%]" size={600} delay={4} />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(148,163,184,0.2) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ─── LEFT PANEL (HERO) ─── */}
      <div className="hidden lg:flex flex-col justify-center w-[45%] relative z-10 px-20">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-10">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg border border-white/50"
            >
              <HeartPulse size={28} className="text-white" />
            </motion.div>
            <div>
              <span className="text-slate-900 font-extrabold text-2xl tracking-tight block">MedAssist AI</span>
              <span className="text-blue-600 text-[10px] font-bold uppercase tracking-[0.25em]">Enterprise</span>
            </div>
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-8">
            Join the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              future of care.
            </span>
          </h1>

          <p className="text-slate-600 text-lg max-w-lg leading-relaxed mb-14 font-medium">
            Register as a Patient, Doctor, Healthcare Provider, or Admin. Your role determines your dashboard controls and AI capabilities.
          </p>

          <div className="space-y-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-4">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors ${
                    i <= step
                      ? "bg-blue-600 text-white"
                      : "bg-white/50 border border-slate-200 text-slate-400"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-base font-semibold ${i <= step ? "text-slate-900" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── RIGHT PANEL (REGISTER CARD) ─── */}
      <div className="w-full lg:w-[55%] flex items-center justify-center relative z-10 px-6 lg:pr-20 py-10 max-h-screen overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-[500px]"
        >
          {/* Glassmorphism Card */}
          <div className="relative rounded-[2rem] bg-white/70 backdrop-blur-[40px] border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-8 sm:p-10">

            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl">
                <HeartPulse size={28} className="text-white" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Create Account</h2>
              {!isAccountExists && (
                <p className="text-slate-500 font-medium text-sm">
                  Step {step + 1} of {STEPS.length} — {stepLabel}
                </p>
              )}
            </div>

            {/* Error / Success Banners */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                    <ShieldCheck size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium leading-relaxed">{safeErrorString(error)}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                    <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700 font-medium leading-relaxed">{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── STEP CONTENT ── */}
            <div className="space-y-6">

              {/* STEP 0: ACCOUNT */}
              {step === 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        value={form.full_name}
                        onChange={(e) => update("full_name", e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        value={form.phone_number}
                        onChange={(e) => update("phone_number", e.target.value)}
                        className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { role: "patient", label: "Patient" },
                        { role: "doctor", label: "Doctor" },
                        { role: "clinic", label: "Provider" },
                        { role: "admin", label: "Admin" },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.role}
                          onClick={() => update("role", item.role)}
                          className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize transition-all ${
                            form.role === item.role
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-500/20"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50 bg-white/50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => update("password", e.target.value)}
                          className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-10 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                          placeholder="Min 8 chars"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirm_password}
                          onChange={(e) => update("confirm_password", e.target.value)}
                          className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-10 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                          placeholder="Confirm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: PROFILE */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {form.role === "patient" && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date of Birth</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Calendar size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                              type="date"
                              value={form.date_of_birth}
                              onChange={(e) => update("date_of_birth", e.target.value)}
                              className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Blood Group</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <HeartPulse size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                              value={form.blood_group}
                              onChange={(e) => update("blood_group", e.target.value)}
                              className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                              placeholder="O+, A-"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                        <div className="grid grid-cols-3 gap-2">
                          {["female", "male", "other"].map((g) => (
                            <button
                              type="button"
                              key={g}
                              onClick={() => update("gender", g)}
                              className={`rounded-xl border px-3 py-2.5 text-sm font-bold capitalize transition-all ${
                                form.gender === g
                                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-500/20"
                                  : "border-slate-200 text-slate-500 hover:bg-slate-50 bg-white/50"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Address</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            value={form.address}
                            onChange={(e) => update("address", e.target.value)}
                            className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                            placeholder="Full address"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Emerg. Contact</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                              value={form.emergency_contact_name}
                              onChange={(e) => update("emergency_contact_name", e.target.value)}
                              className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                              placeholder="Name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Emerg. Phone</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                              value={form.emergency_contact_phone}
                              onChange={(e) => update("emergency_contact_phone", e.target.value)}
                              className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                              placeholder="Phone"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {form.role === "doctor" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Specialty</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Stethoscope size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            value={form.specialty}
                            onChange={(e) => update("specialty", e.target.value)}
                            className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                            placeholder="e.g. Cardiology"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Clinic Address</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            value={form.clinic_address}
                            onChange={(e) => update("clinic_address", e.target.value)}
                            className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                            placeholder="Hospital Address"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.role === "clinic" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Facility Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            value={form.facility_name}
                            onChange={(e) => update("facility_name", e.target.value)}
                            className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                            placeholder="e.g. Apollo Diagnostics"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Facility Address</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            value={form.address}
                            onChange={(e) => update("address", e.target.value)}
                            className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 pl-9 pr-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-sm"
                            placeholder="Full Address"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {form.role === "admin" && (
                    <div className="text-center py-10">
                      <UserCheck className="mx-auto text-blue-500 mb-4" size={48} />
                      <p className="font-bold text-slate-900 text-lg">Administrator Setup</p>
                      <p className="text-sm text-slate-500 mt-2">No additional profile fields required. Proceed to review.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 2: REVIEW */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white/50 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    <ReviewRow label="Full name" value={form.full_name || "—"} />
                    <ReviewRow label="Email" value={form.email || "—"} />
                    <ReviewRow label="Phone" value={form.phone_number || "—"} />
                    <ReviewRow label="Account Type" value={form.role.toUpperCase()} />
                    {form.role === "patient" && (
                      <>
                        <ReviewRow label="Date of birth" value={form.date_of_birth || "—"} />
                        <ReviewRow label="Gender" value={form.gender} />
                        <ReviewRow label="Blood Group" value={form.blood_group || "—"} />
                        <ReviewRow label="Address" value={form.address || "—"} />
                        <ReviewRow label="Emergency Name" value={form.emergency_contact_name || "—"} />
                        <ReviewRow label="Emergency Phone" value={form.emergency_contact_phone || "—"} />
                      </>
                    )}
                    {form.role === "doctor" && (
                      <>
                        <ReviewRow label="Specialty" value={form.specialty || "—"} />
                        <ReviewRow label="Clinic Address" value={form.clinic_address || "—"} />
                      </>
                    )}
                    {form.role === "clinic" && (
                      <>
                        <ReviewRow label="Facility Name" value={form.facility_name || "—"} />
                        <ReviewRow label="Facility Address" value={form.address || "—"} />
                      </>
                    )}
                  </div>
                  <div className="flex items-start gap-2 px-1 text-xs text-slate-500 font-medium">
                    <ShieldCheck size={16} className="shrink-0 text-emerald-500" />
                    Your data is securely encrypted in transit and compliant with healthcare sandbox standards.
                  </div>
                </motion.div>
              )}

              {/* STEP 3: ACCOUNT EXISTS */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <AlertCircle className="mx-auto text-amber-500 mb-4" size={56} />
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-3">Account Exists</h3>
                  <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                    An account with this email already exists.<br /><br />
                    Please login using your existing account or reset your password if you forgot it.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link
                      href="/login"
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg"
                    >
                      Go to Login
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setStep(0); setError(""); }}
                      className="border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── NAVIGATION BUTTONS ── */}
            {!isAccountExists && (
              <div className="mt-10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep((s) => Math.max(0, s - 1)); setError(""); }}
                  disabled={step === 0}
                  className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3 text-sm font-bold transition-all shadow-lg shadow-slate-900/20"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 text-sm font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-70 flex items-center gap-2"
                  >
                    {loading && (
                      <div className="w-4 h-4 border-2 border-blue-200 border-t-white rounded-full animate-spin" />
                    )}
                    Complete Registration
                  </button>
                )}
              </div>
            )}

            {/* Sign In Link */}
            <div className="mt-8 text-center border-t border-slate-200 pt-6">
              <p className="text-sm text-slate-500 font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  const safeValue = typeof value === "object" ? JSON.stringify(value) : String(value ?? "—");
  return (
    <div className="flex items-center justify-between px-5 py-3.5 text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-bold text-slate-900 capitalize text-right">{safeValue}</span>
     </div>
  );
}
