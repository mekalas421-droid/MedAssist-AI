"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, HeartPulse, Activity, Stethoscope } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
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
      delay
    }}
    style={{ width: size, height: size, background: color }}
    className={cn("absolute rounded-full blur-[120px] pointer-events-none mix-blend-multiply", className)}
  />
);

// ─── Apple Health Style Floating Card ───
const FloatingCard = ({ icon: Icon, title, value, className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 + delay, duration: 0.8, ease: "easeOut" }}
    whileHover={{ scale: 1.05, y: -5, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
    className={cn(
      "absolute bg-white/70 backdrop-blur-2xl border border-white p-4 rounded-2xl shadow-xl flex items-center gap-4 cursor-pointer",
      className
    )}
  >
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center border border-blue-200">
      <Icon size={20} className="text-blue-600" />
    </div>
    <div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{title}</p>
      <p className="text-slate-900 text-lg font-extrabold tracking-tight">{value}</p>
    </div>
  </motion.div>
);

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, loadCurrentUser, login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (!isLoading && user) {
      const role = user.role?.toLowerCase() || "";
      if (role === "admin") router.replace("/admin/dashboard");
      else if (role === "doctor") router.replace("/doctor/dashboard");
      else if (role === "clinic" || role === "provider") router.replace("/provider/dashboard");
      else router.replace("/patient/dashboard");
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      // Wait for effect to redirect
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden font-sans selection:bg-blue-200">
      
      {/* ─── STRIPE / APPLE BACKGROUND MESH ─── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <FloatingBlob color="#dbeafe" className="top-[-10%] left-[-10%]" size={800} delay={0} />
        <FloatingBlob color="#cffafe" className="bottom-[-20%] right-[10%]" size={700} delay={2} />
        <FloatingBlob color="#f3e8ff" className="top-[20%] left-[50%]" size={600} delay={4} />
        <div 
          className="absolute inset-0 opacity-[0.4]" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(148,163,184,0.2) 1px, transparent 0)', backgroundSize: '32px 32px' }} 
        />
      </div>

      {/* ─── LEFT PANEL (HERO) ─── */}
      <div className="hidden lg:flex flex-col justify-center w-[55%] relative z-10 px-20">
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
            Precision care, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              powered by AI.
            </span>
          </h1>

          <p className="text-slate-600 text-lg max-w-lg leading-relaxed mb-14 font-medium">
            Experience the future of clinical diagnosis. Advanced symptom analysis, real-time risk assessment, and secure enterprise medical records.
          </p>

          <div className="relative w-full max-w-xl h-72 border border-white rounded-[2rem] bg-white/40 backdrop-blur-3xl overflow-hidden shadow-2xl">
             {/* Subtle internal gradient */}
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 to-transparent"></div>
             
             {/* Animated scan line (Fluent style) */}
             <motion.div 
                className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: [ -100, 100, -100 ], opacity: [0, 0.5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             />

             <FloatingCard 
               icon={Activity} title="AI Accuracy" value="99.4%" 
               className="top-8 left-8" delay={0.2} 
             />
             <FloatingCard 
               icon={Stethoscope} title="Diagnoses" value="12.4k" 
               className="bottom-8 right-12" delay={0.5} 
             />
             
             {/* Decorative abstract elements */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[1px] border-blue-200/50 rounded-full flex items-center justify-center">
                <div className="w-32 h-32 border-[1px] border-cyan-200/50 rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 border-[1px] border-blue-300/30 rounded-full animate-ping-slow"></div>
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* ─── RIGHT PANEL (LOGIN) ─── */}
      <div className="w-full lg:w-[45%] flex items-center justify-center relative z-10 px-6 lg:pr-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-[440px]"
        >
          {/* Fluent/Apple Glassmorphism Card */}
          <div className="relative rounded-[2rem] bg-white/70 backdrop-blur-[40px] border border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] p-10 overflow-hidden">
            
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl">
                <HeartPulse size={28} className="text-white" />
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
              <p className="text-slate-500 font-medium text-sm">Sign in to your secure workspace.</p>
            </div>

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
                    <p className="text-sm text-red-700 font-medium leading-relaxed">{typeof error === 'object' ? error?.msg || error?.message || JSON.stringify(error) : error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl py-4 pl-11 pr-4 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 shadow-sm hover:bg-white"
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl py-4 pl-11 pr-12 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 shadow-sm hover:bg-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01, translateY: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl py-4 flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-70 disabled:hover:transform-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In Securely
                    <ArrowRight size={18} className="text-slate-300" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-10 text-center border-t border-slate-200 pt-6">
              <p className="text-sm text-slate-500 font-medium">
                New to MedAssist AI?{" "}
                <Link href="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                  Create an Account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
