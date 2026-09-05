import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-redirect to login on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      window.location.href = "/login";
    }

    let message = "An unexpected error occurred.";
    let validationErrors = null;
    const status = error.response?.status;

    if (error.response?.data) {
      const data = error.response.data;
      if (Array.isArray(data.detail)) {
        message = data.detail[0]?.msg || "Validation error";
        validationErrors = data.detail;
      } else if (typeof data.detail === "string") {
        message = data.detail;
      } else if (data.message) {
        message = data.message;
      } else if (data.error) {
        message = data.error;
      } else if (data.errors) {
        message = "Validation errors occurred";
        validationErrors = data.errors;
      }
    } else if (error.message) {
      message = error.message;
    }

    const normalizedError = {
      message,
      status,
      validationErrors,
    };

    // Keep the response for legacy support just in case, but structure matches request
    error.normalized = normalizedError;

    return Promise.reject(normalizedError);
  }
);

// ─────────────────────────────────────────────────────────────────
// AUTH API
// ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (payload) => apiClient.post("/api/v1/auth/register", payload),
  login: (payload) => apiClient.post("/api/v1/auth/login", payload),
  me: () => apiClient.get("/api/v1/auth/me"),
  refresh: (refreshToken) => apiClient.post("/api/v1/auth/refresh", null, { params: { refresh_token: refreshToken } }),
  forgotPassword: (email) => apiClient.post("/api/v1/auth/forgot-password", null, { params: { email } }),
  resetPassword: (token, newPassword) => apiClient.post("/api/v1/auth/reset-password", null, { params: { token, new_password: newPassword } }),
  verifyEmail: (token) => apiClient.post("/api/v1/auth/verify-email", null, { params: { token } }),
};

// ─────────────────────────────────────────────────────────────────
// PATIENT API
// ─────────────────────────────────────────────────────────────────
export const patientApi = {
  getMyProfile: () => apiClient.get("/api/v1/patients/me"),
  updateProfile: (patientId, payload) => apiClient.put(`/api/v1/patients/${patientId}`, payload),
  getHistory: (patientId) => apiClient.get(`/api/v1/patients/${patientId}/history`),
  addHistory: (patientId, payload) => apiClient.post(`/api/v1/patients/${patientId}/history`, payload),
  updateHistory: (historyId, payload) => apiClient.patch(`/api/v1/patients/history/${historyId}`, payload),
};

// ─────────────────────────────────────────────────────────────────
// SYMPTOM API
// ─────────────────────────────────────────────────────────────────
export const symptomApi = {
  listSymptoms: (category) =>
    apiClient.get("/api/v1/symptoms", { params: category ? { category } : {} }),
  submitSymptoms: (payload) => apiClient.post("/api/v1/symptoms/submit", payload),
  mySubmissions: () => apiClient.get("/api/v1/symptoms/submissions/me"),
};

// ─────────────────────────────────────────────────────────────────
// DIAGNOSTICS API
// ─────────────────────────────────────────────────────────────────
export const diagnosticsApi = {
  runPrediction: (submissionId) => apiClient.post(`/api/v1/diagnostics/predict/${submissionId}`),
  getReport: (submissionId) => apiClient.get(`/api/v1/diagnostics/report/${submissionId}`),
  myReports: () => apiClient.get("/api/v1/diagnostics/reports/me"),
  reviewReport: (reportId, payload) => apiClient.post(`/api/v1/diagnostics/reports/${reportId}/review`, payload),
  pendingReports: () => apiClient.get("/api/v1/diagnostics/reports/pending"),
};

// ─────────────────────────────────────────────────────────────────
// APPOINTMENTS API
// ─────────────────────────────────────────────────────────────────
export const appointmentApi = {
  create: (payload) => apiClient.post("/api/v1/appointments", payload),
  myAppointments: () => apiClient.get("/api/v1/appointments/me"),
  cancel: (id) => apiClient.patch(`/api/v1/appointments/${id}/cancel`),
};

// ─────────────────────────────────────────────────────────────────
// NOTIFICATIONS API
// ─────────────────────────────────────────────────────────────────
export const notificationApi = {
  myNotifications: () => apiClient.get("/api/v1/notifications/me"),
  markRead: (id) => apiClient.post(`/api/v1/notifications/read/${id}`),
};

// ─────────────────────────────────────────────────────────────────
// ANALYTICS API (staff/admin dashboards)
// ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  diseaseDistribution: (days = 30) =>
    apiClient.get("/api/v1/analytics/disease-distribution", { params: { days } }),
  symptomTrends: (days = 30) =>
    apiClient.get("/api/v1/analytics/symptom-trends", { params: { days } }),
  riskDistribution: (days = 30) =>
    apiClient.get("/api/v1/analytics/risk-distribution", { params: { days } }),
  systemOverview: () => apiClient.get("/api/v1/analytics/system-overview"),
  healthTrends: (days = 30) =>
    apiClient.get("/api/v1/analytics/health-trends", { params: { days } }),
  approvalStats: (days = 30) =>
    apiClient.get("/api/v1/analytics/approval-stats", { params: { days } }),
  continuousInsights: (days = 30) =>
    apiClient.get("/api/v1/analytics/continuous-insights", { params: { days } }),
};

// ─────────────────────────────────────────────────────────────────
// ADMIN API
// ─────────────────────────────────────────────────────────────────
export const adminApi = {
  listUsers: () => apiClient.get("/api/v1/admin/users"),
  toggleUserActive: (userId) => apiClient.patch(`/api/v1/admin/users/${userId}/toggle-active`),
  activityLogs: () => apiClient.get("/api/v1/admin/activity-logs"),
  auditLogs: () => apiClient.get("/api/v1/admin/audit-logs"),
  addSymptom: (payload) => apiClient.post("/api/v1/admin/symptoms", payload),
  deleteSymptom: (id) => apiClient.delete(`/api/v1/admin/symptoms/${id}`),
  addDisease: (payload) => apiClient.post("/api/v1/admin/diseases", payload),
  deleteDisease: (id) => apiClient.delete(`/api/v1/admin/diseases/${id}`),
  listSymptoms: () => apiClient.get("/api/v1/symptoms"),
  listDiseases: () => apiClient.get("/api/v1/admin/diseases"),
  allAppointments: () => apiClient.get("/api/v1/appointments/me"),
  allReports: () => apiClient.get("/api/v1/admin/reports"),
};

// ─────────────────────────────────────────────────────────────────
// DOCTOR API
// ─────────────────────────────────────────────────────────────────
export const doctorApi = {
  listDoctors: () => apiClient.get("/api/v1/admin/doctors"),
};

// ─────────────────────────────────────────────────────────────────
// HEALTH SCORE API
// ─────────────────────────────────────────────────────────────────
export const healthApi = {
  myScores: () => apiClient.get("/api/v1/health-scores/me"),
};
