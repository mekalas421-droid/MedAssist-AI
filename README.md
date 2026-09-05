# MedAssist AI
### Medical Symptom Analysis & Disease Prediction System — Full Project

An AI-powered medical symptom checker platform: patients report symptoms, the
system predicts likely conditions, assesses health risk, generates treatment
recommendations, and produces a downloadable health report. Doctors/clinics/
admins get an analytics dashboard over aggregated platform data.

> 📖 **Full System Documentation**: See [DOCUMENTATION.md](DOCUMENTATION.md) for 29 detailed architecture, testing, ML validation, and API topics.
> ☁️ **Cloud Deployment**: See [CLOUD_DEPLOYMENT.md](CLOUD_DEPLOYMENT.md) for step-by-step AWS and Azure production deployment guides.

---

## 1. Tech Stack

| Layer            | Technology                                         |
|-------------------|-----------------------------------------------------|
| Backend           | Python 3.11, FastAPI, SQLAlchemy (async), Motor      |
| Frontend          | Next.js 14 (React), Tailwind CSS, Zustand, Axios, Recharts |
| Relational DB     | MySQL 8.0 (users, profiles, history, symptoms, predictions, risk, recommendations, reports) |
| Document DB       | MongoDB 7 (raw symptom/AI submission logs)           |
| Auth              | JWT (access + refresh tokens), bcrypt hashing         |
| AI / ML           | Weighted-overlap prediction engine (built-in) + optional trainable scikit-learn/XGBoost classifier |
| Containerization  | Docker, Docker Compose                                |

## 2. Running Automated Tests

Run the complete backend test suite (auth, diagnostics, analytics, AI validation, performance benchmarks):
```bash
cd backend
pytest tests/ -s
```

Run frontend production build verification:
```bash
cd frontend
npm run build
```

## 3. Getting Started (Docker — recommended)

```bash
docker-compose up --build
```

- Backend API: http://localhost:8000  (Swagger docs at `/api/docs`)
- Frontend:    http://localhost:3000
- MySQL:      localhost:3306 (schema auto-applied from database/schema.sql)
- MongoDB:     localhost:27017

## 4. Getting Started (Manual / local dev)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python -m app.db.init_db          # creates tables (or apply database/schema.sql directly)
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## 5. How the AI Pipeline Works

1. **Symptom Collection** — patient selects symptoms in the Symptom Checker; submission is validated and logged (`symptom_submissions` + Mongo `symptom_logs`).
2. **Disease Prediction** — `prediction_engine.predict_diseases()` scores candidate diseases using a weighted-overlap similarity or trained RandomForest classifier against patient symptoms, returning Top-5 candidates with probability + confidence.
3. **Risk Assessment** — `assess_risk()` evaluates condition severity, symptom burden, confidence, and emergency flags into a 0–100 risk score and category (Low/Medium/High/Critical).
4. **Recommendations** — `generate_recommendations()` produces treatment, preventive, lifestyle, and follow-up guidance tailored to the risk level.
5. **Clinician Review & PDF Report** — Doctors/providers review, annotate, and approve reports, after which patients can view and download branded PDF health reports.

## 6. Authentication & RBAC

| Role     | Description                                             |
|----------|-----------------------------------------------------------|
| patient  | Registers, manages profile, submits symptoms, views own approved reports |
| doctor   | Reviews reports, approves/rejects, attaches notes, views analytics |
| clinic   | Manages facility patients, clinical triage, views analytics |
| admin    | Full platform access, user management, audit logs        |
