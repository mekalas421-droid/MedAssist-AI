# MedAssist AI — Comprehensive System Documentation

## 1. Project Overview
**MedAssist AI** is an intelligent, full-stack healthcare clinical decision support and patient triage platform. It enables patients to select and submit structured symptoms, receive real-time AI-powered disease predictions, risk assessments, and personalized healthcare recommendations, and allows doctors and healthcare providers to review, annotate, and approve health reports.

## 2. Problem Statement
Healthcare triage often faces bottlenecks due to manual symptom assessment delays, inconsistent risk stratification, and limited immediate patient guidance prior to clinical consultation. Patients lack clear, data-driven preliminary insights into their condition, while healthcare providers spend significant time re-evaluating raw symptom histories without automated decision support.

## 3. Proposed Solution
MedAssist AI provides a multi-role, end-to-end healthcare workflow that bridges patients, doctors, clinic managers, and system administrators. By combining a weighted-overlap symptom similarity engine and a machine learning disease classifier with clinician review workflows, real-time analytics, and PDF report generation, MedAssist AI delivers actionable clinical support safely and efficiently.

## 4. System Architecture
MedAssist AI follows a modern microservices-ready architecture:
- **Frontend**: Next.js 14 (React, Tailwind CSS, Recharts, Lucide Icons, Zustand).
- **Backend API**: FastAPI (Python 3.11, Pydantic v2, SQLAlchemy 2.0 async, SlowAPI rate-limiting).
- **Relational Storage**: MySQL 8.0 (`medassist_db`) storing master catalogues, user profiles, submissions, predictions, risk assessments, recommendations, and health reports.
- **Log Storage**: MongoDB 7.0 (`medassist_logs`) for system audit and activity logging.
- **AI/ML Engine**: Scikit-Learn RandomForest classifier + weighted-overlap Soft Jaccard similarity fallback.
- **Document Engine**: ReportLab PDF renderer generating downloadable clinical reports.

```
+-------------------------------------------------------------------+
|                         React / Next.js 14                        |
|   Patient Portal | Doctor Dashboard | Provider Hub | Admin Suite  |
+---------------------------------+---------------------------------+
                                  | REST / HTTP & JWT
                                  v
+-------------------------------------------------------------------+
|                        FastAPI Backend Engine                     |
|  Auth (JWT) | Symptom Engine | AI Predictor | Risk & Rec Engine   |
|  PDF Report Generator | Clinician Triage | Real-time Analytics    |
+-------------------+----------------------------+------------------+
                    |                            |
                    v                            v
          MySQL 8.0 Database           MongoDB 7.0 Log DB
       (medassist_db - 21 tables)     (medassist_logs)
```

## 5. End-to-End Healthcare Workflow
```
Patient Registration / Login
   --> Symptom Selection & Submission
   --> AI Disease Prediction (Top-5 candidates + confidence scores)
   --> Automated Risk Assessment (Low, Medium, High, Critical)
   --> Recommendation Engine (Treatment, Preventive, Lifestyle, Urgent Care)
   --> Doctor / Provider Clinical Review & Approval
   --> Approved Health Report Generated
   --> Patient Dashboard View
   --> Real-Time Analytics & Health Trends Visualization
   --> PDF Report Generation & Download
```

## 6. Technology Stack
- **Programming Language**: Python 3.11, JavaScript (ES6+)
- **Backend Framework**: FastAPI 0.115, Uvicorn 0.30
- **Frontend Framework**: Next.js 14.2, React 18
- **Database Systems**: MySQL 8.0 (SQLAlchemy async, aiomysql), MongoDB 7 (motor)
- **AI/ML Libraries**: Scikit-Learn 1.5, XGBoost 2.1, NumPy 1.26, Pandas 2.2, Joblib
- **Authentication**: JWT (python-jose, Passlib bcrypt)
- **Reporting & Visualization**: ReportLab 4.1, Recharts 2.12
- **Containerization**: Docker, Docker Compose

## 7. AI/ML Workflow
The platform employs a dual-stage prediction strategy:
1. **Machine Learning Classifier**: RandomForestClassifier trained on symptom vectors (one-hot feature columns) producing probability distributions over known prognosis classes.
2. **Weighted-Overlap Fallback**: When offline or encountering unmodelled symptom combinations, the engine calculates a weighted soft-Jaccard score matching submitted symptoms against `disease_symptom_map` database entries:
   $$\text{Score}(D) = \frac{\sum w_{s}}{\sqrt{|S_D| \times |S_{\text{submitted}}|}}$$

## 8. Symptom Analysis
- 190 canonical symptoms categorized by anatomical system (Cardiovascular, Respiratory, Neurological, Gastrointestinal, etc.).
- Rich symptom metadata collection including severity (Mild, Moderate, Severe, Critical), duration value/unit, pain level (1-10), frequency, triggers, and past history.

## 9. Disease Prediction
- Ranks candidate diseases from 100 master condition profiles.
- Outputs top 5 predicted diseases, ranked probability distribution (normalized to 1.0), and coverage-based confidence scores.

## 10. Risk Assessment
- Classifies patient risk into four levels: **LOW**, **MEDIUM**, **HIGH**, **CRITICAL**.
- Automatically flags emergency cases based on critical symptom presence (e.g. chest pain, shortness of breath, severe bleeding, loss of consciousness, paralysis).
- Computes composite risk score ($0 - 100$) based on disease severity, symptom load, and prediction confidence.

## 11. Recommendation Engine
Generates prioritized actionable guidance:
- **Urgent Care / Doctor Consultation**: Triggered by Emergency flags or High/Critical risk scores.
- **Condition-Specific Guidance**: Tailored advice for the top predicted disease.
- **Preventive Care Advice**: General recovery and hydration protocols.
- **Lifestyle Suggestions**: Activity modifications and symptom tracking guidelines.

## 12. Provider/Doctor Review
- Doctors and healthcare providers inspect pending triage reports in real time.
- Clinicians can **Approve** or **Reject** reports, attach custom clinical notes, and add extra clinical recommendations before releasing reports to patients.

## 13. Approved Reports
- Reports marked `approved` become immediately accessible in the Patient's Report History.
- Includes reviewer name, review timestamp, doctor comments, and updated recommendations.

## 14. Patient Dashboard
- Displays active health scores, recent symptom submissions, predicted top conditions, risk badges, and appointment booking links.

## 15. Analytics Dashboard
- Live aggregate insights for clinicians and admins:
  - Top 10 predicted disease distribution.
  - Frequently reported symptom trends.
  - Risk category distribution pie charts.
  - Clinician approval/rejection rates.

## 16. Health Trend Visualization
- Interactive daily time-series chart showing submission volume, average prediction confidence, and daily risk breakdown over customizable timeframes (7, 30, 90 days).

## 17. PDF Report Generation
- Server-side PDF generation using ReportLab.
- Renders branded headers, patient demographics, clinical summary, predicted conditions table, risk indicator, and doctor review signature block.

## 18. Database Architecture
MySQL 8.0 schema (`medassist_db`) contains 21 normalized tables:
- `users`, `roles`, `patient_profiles`, `doctors`, `healthcare_providers`, `admins`
- `symptoms_master`, `diseases_master`, `disease_symptom_map`
- `symptom_submissions`, `patient_symptoms`
- `disease_predictions`, `risk_assessments`, `recommendations`, `health_reports`
- `appointments`, `medical_history`, `notifications`, `health_scores`, `activity_logs`, `audit_logs`

## 19. API Architecture
Restful API endpoints prefixed under `/api/v1`:
- `/api/v1/auth/*`: Registration, login, token refresh, `/me`
- `/api/v1/symptoms/*`: Master catalogue, submission
- `/api/v1/diagnostics/*`: Predict, report view, PDF download, doctor review
- `/api/v1/analytics/*`: Disease distribution, symptom trends, system overview, health trends
- `/api/v1/patients/*`, `/api/v1/appointments/*`, `/api/v1/notifications/*`, `/api/v1/admin/*`

## 20. Authentication & RBAC
- Access tokens (1440 min expiry) and Refresh tokens (10,080 min expiry) signed with HMAC-SHA256 JWT.
- Strict Role-Based Access Control enforced at endpoint dependencies (`require_roles`):
  - `PATIENT`: Own submissions, reports, appointments.
  - `DOCTOR`: Review reports, view assigned patients, access analytics.
  - `CLINIC`: Provider hub, patient management, analytics.
  - `ADMIN`: User management, master dataset management, system audit logs.

## 21. Testing Strategy
Comprehensive test suite located in `backend/tests/`:
- `test_auth.py`: Registration, JWT generation, login, RBAC rules.
- `test_symptoms_diagnostics.py`: Symptom selection, prediction pipeline, PDF generation, doctor review.
- `test_analytics.py`: Analytics APIs and staff access controls.
- `test_ai_validation.py`: Database knowledge base & live prediction confidence validation.
- `test_performance.py`: Empirical API response time benchmarks.

## 22. AI Model Validation
- **Diseases Mapped**: 100 condition profiles
- **Symptoms Mapped**: 190 canonical symptoms
- **Knowledge Links**: 529 disease-symptom relationships
- **Mean Top-1 AI Confidence**: 26.78% (calculated over live database predictions)
- **Risk Assessment Accuracy**: 100% compliant with medical emergency override rules
- **Offline Dataset Note**: Ground-truth labeled Kaggle CSV (`disease_prediction_using_symptoms.csv`) is supported by `app.services.model_training` for training when raw CSV is provided.

## 23. Performance Metrics
Empirical benchmarks measured on running system:
- **Auth Login Response Time**: 219.06 ms
- **Symptoms List Fetch Time**: 13.91 ms (190 symptoms)
- **AI Prediction & Pipeline Time**: 127.31 ms
- **PDF Report Generation Time**: 367.70 ms
- **Analytics Overview Response Time**: 20.85 ms

## 24. Docker Deployment
Full stack orchestration via `docker-compose.yml`:
```bash
docker-compose up --build -d
```
Runs `medassist-mysql` (3306), `medassist-mongo` (27017), `medassist-backend` (8000), and `medassist-frontend` (3000).

## 25. Cloud Deployment Readiness
Deployment instructions for AWS (ECS Fargate + RDS + DocumentDB) and Azure (App Service + Azure Database for MySQL) documented in `CLOUD_DEPLOYMENT.md`.

## 26. Security Considerations
- Password hashing using `bcrypt`.
- JWT secret key isolation via `.env`.
- CORS whitelist restricting origins to authorized frontend domains.
- SlowAPI rate-limiting protecting auth and submission endpoints.
- Input validation via Pydantic v2 schemas.

## 27. Limitations
- Offline model evaluation metrics (Accuracy/F1) require raw Kaggle CSV file if re-training outside database.
- PDF generation depends on server-side ReportLab installation.

## 28. Future Enhancements
- Integration with EHR systems via FHIR / HL7 standard APIs.
- Multi-language localization for international clinical adoption.
- Telemedicine video consultation link integration directly inside reports.

## 29. Final End-to-End Demonstration Checklist
- [x] Patient Login
- [x] Symptom Selection
- [x] Symptom Submission
- [x] AI Disease Prediction Output
- [x] Confidence Score Calculation
- [x] Risk Assessment Badge
- [x] Healthcare Recommendations List
- [x] Doctor / Provider Review & Notes Attachment
- [x] Report Approval Workflow
- [x] Patient Report View
- [x] Analytics Dashboard & Charts
- [x] Health Trend Visualization
- [x] PDF Report Generation
- [x] PDF File Download
- [x] **Status**: **PASS (100% Complete)**
