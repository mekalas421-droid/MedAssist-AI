"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  HeartPulse,
  ShieldCheck,
  Activity,
  Stethoscope,
  FileText,
  BarChart3,
  CalendarCheck,
  Users,
  BrainCircuit,
  Bell,
  History,
  Building,
  UserCog,
  Lock,
} from "lucide-react";
import EcgLine from "@/components/ui/EcgLine";

const FEATURES = [
  { icon: Stethoscope, title: "Symptom Checker", desc: "AI-driven symptom analysis with real-time feedback." },
  { icon: BrainCircuit, title: "Disease Prediction", desc: "Advanced ML models to predict likely conditions." },
  { icon: Activity, title: "Risk Assessment", desc: "Immediate triage into Low, Medium, High, or Critical." },
  { icon: FileText, title: "Medical Reports", desc: "Comprehensive, doctor-ready health insights." },
  { icon: BarChart3, title: "AI Analytics", desc: "Population health trends and clinical dashboards." },
  { icon: CalendarCheck, title: "Appointments", desc: "Seamless scheduling with top healthcare professionals." },
  { icon: Users, title: "Doctors", desc: "Direct access to verified medical specialists." },
  { icon: HeartPulse, title: "Emergency", desc: "Instant emergency contact and critical alerts." },
  { icon: Bell, title: "Notifications", desc: "Real-time updates on your health status." },
  { icon: ShieldCheck, title: "Recommendations", desc: "Personalized lifestyle and medical advice." },
  { icon: History, title: "Health History", desc: "Secure, persistent medical records vault." },
];

const ROLES = [
  {
    icon: Users,
    title: "Patient",
    desc: "Check symptoms, view reports, and manage appointments.",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Stethoscope,
    title: "Doctor",
    desc: "Manage patient queues, view AI insights, and write prescriptions.",
    color: "from-emerald-500 to-teal-400",
  },
  {
    icon: Building,
    title: "Hospital / Provider",
    desc: "Overview of hospital analytics, revenue, and department stats.",
    color: "from-indigo-500 to-purple-400",
  },
  {
    icon: UserCog,
    title: "Admin",
    desc: "System analytics, user management, and server health monitoring.",
    color: "from-orange-500 to-red-400",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0F172A] overflow-x-hidden text-white font-sans selection:bg-brand-500 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/10 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-brand-600 p-2 rounded-xl text-white shadow-lg shadow-brand-500/30">
              <HeartPulse size={24} strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              MedAssist AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden md:block px-5 py-2.5 text-gray-300 font-semibold text-sm hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-semibold text-sm shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Dark Premium Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1E3A8A]/40 via-[#0F172A] to-[#111827]" />
          
          {/* Animated Aurora */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-600/30 blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/30 blur-[100px]" 
          />
          
          {/* Particles Grid */}
          <div className="absolute inset-0 opacity-[0.05] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=')] [background-size:30px_30px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Side Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <span className="text-cyan-400 text-sm font-semibold tracking-wide uppercase">MedAssist AI 2.0 Live</span>
            </div>

            <h1 className="font-display text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              AI Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-300">
                Healthcare Platform
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 leading-relaxed mb-8 max-w-xl font-medium">
              Understand your health before it becomes serious. Advanced symptom checking, instant disease prediction, and secure medical records.
            </p>

            <ul className="grid grid-cols-2 gap-4 mb-10 text-gray-400 font-medium">
              <li className="flex items-center gap-2"><ShieldCheck size={18} className="text-brand-400"/> Symptom Checker</li>
              <li className="flex items-center gap-2"><BrainCircuit size={18} className="text-brand-400"/> Disease Prediction</li>
              <li className="flex items-center gap-2"><Activity size={18} className="text-brand-400"/> AI Risk Assessment</li>
              <li className="flex items-center gap-2"><FileText size={18} className="text-brand-400"/> Health Reports</li>
              <li className="flex items-center gap-2"><BarChart3 size={18} className="text-brand-400"/> Medical Analytics</li>
              <li className="flex items-center gap-2"><Lock size={18} className="text-brand-400"/> Secure Medical Records</li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-full font-bold text-lg shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-1"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-bold text-lg backdrop-blur-md transition-all hover:-translate-y-1"
              >
                Sign In
              </Link>
            </div>
          </motion.div>

          {/* Right Side Image / Composition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[600px] flex items-center justify-center"
          >
            {/* Main Illustration Container (SVG Placeholder for Doctor) */}
            <div className="relative z-10 w-full max-w-md bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
               <Stethoscope size={120} strokeWidth={1} className="text-brand-400 mb-6 opacity-80" />
               <h3 className="text-2xl font-bold text-white mb-2">Dr. Sarah Jenkins</h3>
               <p className="text-cyan-400 font-medium">Chief AI Medical Officer</p>
               
               <div className="mt-8 w-full">
                  <EcgLine tone="dark" className="w-full h-16 opacity-70" />
               </div>
            </div>

            {/* Floating Card 1 */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 -left-10 z-20 bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <div className="bg-brand-500/20 p-3 rounded-full text-brand-400">
                <HeartPulse size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Health Score</p>
                <p className="text-2xl font-bold text-white">95/100</p>
              </div>
            </motion.div>

            {/* Floating Card 2 */}
            <motion.div 
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 -right-10 z-20 bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <div className="bg-cyan-500/20 p-3 rounded-full text-cyan-400">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Risk Level</p>
                <p className="text-xl font-bold text-success">Low</p>
              </div>
            </motion.div>

            {/* Floating Card 3 */}
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute top-1/2 -left-16 z-20 bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-3"
            >
              <FileText size={20} className="text-brand-400" />
              <p className="text-sm font-semibold text-white">Report Generated</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative py-32 bg-[#0a0f1e] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Complete Healthcare Intelligence
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to predict, analyze, and act on your health data in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.5 }}
                className="group bg-white/5 border border-white/10 hover:border-brand-500/50 backdrop-blur-sm rounded-3xl p-6 transition-all hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)] cursor-default"
              >
                <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-6 text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Use Section */}
      <section className="relative py-32 bg-[#0F172A] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Built for Everyone
            </h2>
            <p className="text-xl text-gray-400">
              A unified platform serving patients, doctors, and hospital administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES.map(({ icon: Icon, title, desc, color }, idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="relative overflow-hidden bg-[#1E293B] border border-white/10 rounded-3xl p-8 flex flex-col h-full"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 blur-3xl rounded-full`} />
                <Icon size={40} className="text-white mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
                <p className="text-gray-400 mb-8 flex-grow">{desc}</p>
                <div className="flex flex-col gap-3">
                  <Link href="/login" className="w-full py-3 bg-white/5 hover:bg-white/10 text-center rounded-xl font-semibold transition-colors border border-white/10">
                    Sign In
                  </Link>
                  <Link href="/register" className="w-full py-3 bg-white text-[#0F172A] hover:bg-gray-200 text-center rounded-xl font-bold transition-colors">
                    Register
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-brand-500" size={24} />
            <span className="font-display text-lg font-bold">MedAssist AI</span>
          </div>
          <p className="text-xs text-gray-500 max-w-lg text-center md:text-right">
            MedAssist AI is a premium clinical intelligence tool. It is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. In case of emergency, contact local authorities immediately.
          </p>
        </div>
      </footer>
    </main>
  );
}
