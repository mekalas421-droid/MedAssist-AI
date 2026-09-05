"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, CheckCircle2, AlertCircle, ArrowRight, Brain, Activity, Clock, ShieldAlert, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "@/components/layout/DashboardShell";
import PremiumCard from "@/components/ui/PremiumCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import PageHeader from "@/components/ui/PageHeader";
import { symptomApi, diagnosticsApi } from "@/lib/apiClient";
import { useAuthStore } from "@/lib/authStore";
import RiskBadge2 from "@/components/ui/RiskBadge2";

const STEPS = ["Symptoms", "Details", "Analysis"];

export default function SymptomsWizardPage() {
  const { user } = useAuthStore();
  const [symptoms, setSymptoms] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]); 
  const [step, setStep] = useState(0);

  // Form State
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState("1-3 days");

  // Submission State
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSymptoms() {
      try {
        const { data } = await symptomApi.listSymptoms();
        setSymptoms(data);
      } catch (err) {
        setError("Could not load symptoms database.");
      }
    }
    loadSymptoms();
  }, []);

  const groupedCategories = useMemo(() => {
    const categoriesMap = {};
    symptoms.forEach((s) => {
      const cat = s.category || "General";
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(s);
    });

    const categoriesList = Object.keys(categoriesMap).map((catName) => ({
      category: catName,
      symptoms: categoriesMap[catName],
    }));

    if (!query.trim()) return categoriesList;
    const q = query.toLowerCase();

    return categoriesList
      .map((c) => ({
        ...c,
        symptoms: c.symptoms.filter(
          (s) => s.display_name.toLowerCase().includes(q) || s.symptom_code.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.symptoms.length > 0);
  }, [symptoms, query]);

  function toggle(symptom) {
    setSelected((prev) =>
      prev.some((s) => s.id === symptom.id)
        ? prev.filter((s) => s.id !== symptom.id)
        : [...prev, symptom]
    );
  }

  async function handleAnalyze() {
    if (selected.length === 0) return;
    setError("");
    setStatus("analyzing");
    
    try {
      const symptomDetails = selected.map((s) => ({ symptom_id: s.id }));
      const subResponse = await symptomApi.submitSymptoms({
        symptoms: symptomDetails,
        free_text_notes: `Severity: ${severity}/10. Duration: ${duration}. Notes: ${notes}`,
      });

      const submissionId = subResponse.data.id;
      const predResponse = await diagnosticsApi.runPrediction(submissionId);
      
      setResult(predResponse.data);
      setStatus("done");
      setStep(2); // Move to results step
    } catch (err) {
      let errorMsg = err.message || "An error occurred during diagnosis.";
      if (err.validationErrors && err.validationErrors.length > 0) {
        const details = err.validationErrors.map(ve => {
          const field = ve.loc && ve.loc.length > 1 ? ve.loc[ve.loc.length - 1] : "Field";
          return `${field}: ${ve.msg}`;
        });
        errorMsg = `Validation failed: ${details.join(" | ")}`;
      }
      setError(errorMsg);
      setStatus("idle");
    }
  }

  function reset() {
    setSelected([]);
    setResult(null);
    setNotes("");
    setSeverity(5);
    setStep(0);
    setStatus("idle");
  }

  const NAV = [
    {
      label: "Main",
      items: [
        { href: "/patient/dashboard", label: "Dashboard", icon: Activity },
      ],
    }
  ];

  return (
    <DashboardShell navItems={NAV} role="patient">
      <PageHeader 
        title="AI Symptom Checker" 
        subtitle="Complete the steps below for an accurate AI diagnostic prediction."
      />

      <div className="max-w-5xl mx-auto">
        
        {/* Progress Bar */}
        <div className="mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />
          <div className="relative flex justify-between">
            {STEPS.map((label, idx) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300
                  ${step >= idx ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                >
                  {step > idx ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${step >= idx ? 'text-blue-400' : 'text-slate-500'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-sm font-medium">
            <AlertCircle size={18} /> {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          
          {/* STEP 1: Symptom Selection */}
          {step === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid lg:grid-cols-[1.5fr_1fr] gap-6"
            >
              <PremiumCard className="p-6 h-[600px] flex flex-col">
                <div className="relative mb-6">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search symptoms (e.g., headache, fever)..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-blue-500 focus:outline-none transition-colors shadow-inner"
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                  {groupedCategories.map((cat) => (
                    <div key={cat.category}>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 pl-1">
                        {cat.category}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {cat.symptoms.map((s) => {
                          const active = selected.some((item) => item.id === s.id);
                          return (
                            <button
                              key={s.id}
                              onClick={() => toggle(s)}
                              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-300
                                ${active 
                                  ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                                  : "bg-slate-800/50 border-white/10 text-slate-300 hover:border-blue-500/50 hover:bg-slate-800"
                                }`}
                            >
                              {s.display_name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {groupedCategories.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                      No matching symptoms found.
                    </div>
                  )}
                </div>
              </PremiumCard>

              {/* Selection Summary Side */}
              <div className="space-y-6">
                <PremiumCard className="p-6">
                  <h3 className="font-bold text-white mb-1">Selected Symptoms</h3>
                  <p className="text-xs text-slate-400 mb-4">{selected.length} items added to analysis</p>
                  
                  {selected.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-slate-900/30">
                      <p className="text-sm text-slate-500">Select symptoms from the left</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-6">
                      <AnimatePresence>
                        {selected.map((s) => (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            key={s.id}
                            className="flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-lg pl-3 pr-2 py-1.5 border border-blue-500/30"
                          >
                            {s.display_name}
                            <button onClick={() => toggle(s)} className="hover:text-white transition-colors">
                              <X size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  <AnimatedButton 
                    className="w-full" 
                    disabled={selected.length === 0}
                    onClick={() => setStep(1)}
                  >
                    Continue <ArrowRight size={16} />
                  </AnimatedButton>
                </PremiumCard>

                {/* Medical Body Illustration Placeholder */}
                <PremiumCard className="p-6 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 min-h-[250px]">
                   <Activity size={48} className="text-blue-500/30 mb-4 animate-pulse" />
                   <p className="text-sm text-slate-400 text-center font-medium">Identify specific body regions to refine the symptom search accuracy.</p>
                </PremiumCard>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Details */}
          {step === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <PremiumCard className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">Provide Context</h3>
                <p className="text-sm text-slate-400 mb-8">AI models perform better with additional context regarding your symptoms.</p>

                <div className="space-y-8">
                  {/* Severity Slider */}
                  <div>
                    <label className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Pain / Severity Level</span>
                      <span className="text-lg font-extrabold text-white">{severity}/10</span>
                    </label>
                    <input 
                      type="range" min="1" max="10" 
                      value={severity} onChange={(e) => setSeverity(e.target.value)}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs font-bold text-slate-500 mt-2">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  {/* Duration Selector */}
                  <div>
                    <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Duration</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["< 24 hours", "1-3 days", "1 week", "Weeks+"].map(dur => (
                        <button
                          key={dur}
                          onClick={() => setDuration(dur)}
                          className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                            duration === dur ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800/50 border-white/10 text-slate-400 hover:border-white/30'
                          }`}
                        >
                          {dur}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Additional Notes</label>
                    <textarea 
                      value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="E.g., It gets worse at night, accompanied by sweating..."
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-blue-500 focus:outline-none min-h-[120px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
                  <button onClick={() => setStep(0)} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                    Go Back
                  </button>
                  <AnimatedButton onClick={handleAnalyze} isLoading={status === "analyzing"} icon={Brain}>
                    Analyze Symptoms
                  </AnimatedButton>
                </div>
              </PremiumCard>
            </motion.div>
          )}

          {/* STEP 3: Results */}
          {step === 2 && result && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Primary Prediction */}
                <PremiumCard className="p-8 border-t-4 border-t-blue-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <Brain size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Primary AI Diagnosis</p>
                      <h2 className="text-3xl font-extrabold text-white">{result.predictions?.[0]?.disease_name || "Unknown"}</h2>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/10 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Confidence Match</p>
                      <p className="text-2xl font-extrabold text-white">{Math.round((result.predictions?.[0]?.probability || 0) * 100)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assessed Risk Level</p>
                      <RiskBadge2 level={result.risk_assessment?.risk_category} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldAlert size={16} className="text-amber-400" /> Warning Signs
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {result.risk_assessment?.justification || "No specific warnings generated."}
                    </p>
                  </div>
                </PremiumCard>

                {/* Recommendations */}
                <PremiumCard className="p-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Navigation size={20} className="text-emerald-400" /> Next Steps & Advice
                  </h3>
                  
                  <div className="space-y-4 mb-8">
                    {result.recommendations?.length > 0 ? (
                      result.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-800/30 border border-white/5">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 font-bold text-xs text-white">
                            {i+1}
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            {rec.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">Please consult a medical professional for personalized advice.</p>
                    )}
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-white/10">
                    <AnimatedButton onClick={reset} variant="secondary" className="flex-1">Start Over</AnimatedButton>
                    <AnimatedButton onClick={() => window.location.href='/reports'} className="flex-1">View Full Report</AnimatedButton>
                  </div>
                </PremiumCard>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
