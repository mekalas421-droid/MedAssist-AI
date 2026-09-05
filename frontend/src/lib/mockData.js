// Mock data used to render the UI standalone, without a live backend.
// Shapes mirror the real endpoints in lib/apiClient.js so swapping to
// live data later is a matter of replacing the import, not the JSX.

export const mockUser = {
  id: "usr_2f9a",
  full_name: "Riya Anand",
  email: "riya.anand@example.com",
  role: "patient",
};

export const mockSymptomCategories = [
  {
    category: "General",
    symptoms: ["Fever", "Fatigue", "Chills", "Night sweats", "Weight loss"],
  },
  {
    category: "Respiratory",
    symptoms: ["Cough", "Shortness of breath", "Sore throat", "Wheezing", "Chest tightness"],
  },
  {
    category: "Digestive",
    symptoms: ["Nausea", "Vomiting", "Abdominal pain", "Diarrhea", "Loss of appetite"],
  },
  {
    category: "Neurological",
    symptoms: ["Headache", "Dizziness", "Blurred vision", "Numbness", "Confusion"],
  },
  {
    category: "Musculoskeletal",
    symptoms: ["Joint pain", "Muscle ache", "Back pain", "Swelling", "Stiffness"],
  },
];

export const mockStats = {
  total_submissions: 12,
  active_conditions_tracked: 3,
  last_risk_level: "medium",
  next_checkin_days: 4,
};

export const mockTrend = [
  { day: "Mon", severity: 2 },
  { day: "Tue", severity: 3 },
  { day: "Wed", severity: 2 },
  { day: "Thu", severity: 4 },
  { day: "Fri", severity: 3 },
  { day: "Sat", severity: 2 },
  { day: "Sun", severity: 1 },
];

export const mockReports = [
  {
    id: "rpt_1042",
    created_at: "2026-07-24T09:15:00Z",
    predicted_disease: "Seasonal Influenza",
    confidence: 0.86,
    risk_level: "medium",
    symptoms: ["Fever", "Cough", "Fatigue", "Sore throat"],
    recommendation: "Rest, fluids, and paracetamol for fever. See a doctor if symptoms persist beyond 5 days.",
  },
  {
    id: "rpt_1038",
    created_at: "2026-07-18T14:02:00Z",
    predicted_disease: "Migraine",
    confidence: 0.74,
    risk_level: "low",
    symptoms: ["Headache", "Blurred vision", "Nausea"],
    recommendation: "Rest in a dark, quiet room. Track triggers. Consult a neurologist if frequency increases.",
  },
  {
    id: "rpt_1029",
    created_at: "2026-07-09T18:41:00Z",
    predicted_disease: "Acute Gastritis",
    confidence: 0.68,
    risk_level: "medium",
    symptoms: ["Abdominal pain", "Nausea", "Loss of appetite"],
    recommendation: "Avoid spicy food and NSAIDs. Consider an antacid. Seek care if pain worsens or blood appears.",
  },
  {
    id: "rpt_1017",
    created_at: "2026-06-29T08:11:00Z",
    predicted_disease: "Hypertensive Episode",
    confidence: 0.91,
    risk_level: "high",
    symptoms: ["Headache", "Dizziness", "Chest tightness"],
    recommendation: "Elevated readings detected. Recheck blood pressure and consult a physician within 24 hours.",
  },
];

export const mockDiseaseDistribution = [
  { name: "Influenza", value: 132 },
  { name: "Migraine", value: 98 },
  { name: "Gastritis", value: 76 },
  { name: "Hypertension", value: 61 },
  { name: "Bronchitis", value: 44 },
  { name: "Other", value: 89 },
];

export const mockRiskDistribution = [
  { name: "Low", value: 412, color: "#16a34a" },
  { name: "Medium", value: 268, color: "#d97706" },
  { name: "High", value: 96, color: "#dc2626" },
  { name: "Critical", value: 14, color: "#7f1d1d" },
];

export const mockSymptomTrend = [
  { week: "W1", fever: 40, cough: 24, headache: 18 },
  { week: "W2", fever: 52, cough: 31, headache: 22 },
  { week: "W3", fever: 38, cough: 40, headache: 28 },
  { week: "W4", fever: 61, cough: 35, headache: 30 },
  { week: "W5", fever: 45, cough: 28, headache: 24 },
  { week: "W6", fever: 58, cough: 33, headache: 26 },
];

export const mockSystemOverview = {
  total_users: 100,
  total_submissions: 100,
  total_predictions: 100,
  avg_confidence: 0.81,
};
