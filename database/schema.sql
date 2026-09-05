-- =====================================================================
-- MedAssist AI — MySQL Schema (migrated from PostgreSQL)
-- Covers: Users & RBAC, Patient Profiles, Medical History, Symptom Data,
--         Disease Predictions, Risk Assessments, Recommendations, Reports
--
-- Notes on the PostgreSQL -> MySQL migration:
--   * UUID columns  -> CHAR(36), populated via DEFAULT (UUID()) at the DB
--     level (MySQL 8.0.13+) and/or by the application (SQLAlchemy Uuid
--     type), matching the existing app-layer id generation.
--   * CREATE TYPE ... AS ENUM  -> inline MySQL ENUM(...) column defs
--     (MySQL has no standalone enum type).
--   * TEXT[] / JSONB           -> JSON (MySQL's native JSON column type).
--   * TIMESTAMPTZ + plpgsql "set_updated_at" trigger -> DATETIME with
--     native `ON UPDATE CURRENT_TIMESTAMP`, which MySQL supports
--     natively (no trigger function required).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. USERS  (auth + RBAC — shared by patients, doctors, admins, clinics)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email               VARCHAR(255) UNIQUE NOT NULL,
    hashed_password     VARCHAR(255) NOT NULL,
    full_name           VARCHAR(255) NOT NULL,
    role                ENUM('patient','doctor','admin','clinic') NOT NULL DEFAULT 'patient',
    phone_number        VARCHAR(20),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at       DATETIME
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ---------------------------------------------------------------------
-- 2. PATIENT PROFILES (1:1 extension of users where role = patient)
-- ---------------------------------------------------------------------
CREATE TABLE patient_profiles (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id             CHAR(36) NOT NULL UNIQUE,
    date_of_birth       DATE,
    gender              ENUM('male','female','other','prefer_not_to_say'),
    blood_group         VARCHAR(5),
    height_cm           NUMERIC(5,2),
    weight_kg           NUMERIC(5,2),
    address             TEXT,
    emergency_contact_name  VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    known_allergies     JSON,
    chronic_conditions  JSON,
    current_medications JSON,
    assigned_doctor_id  CHAR(36),
    clinic_id           CHAR(36),
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_user     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_patient_doctor   FOREIGN KEY (assigned_doctor_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_patient_clinic   FOREIGN KEY (clinic_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_patient_profiles_user_id ON patient_profiles(user_id);
CREATE INDEX idx_patient_profiles_doctor  ON patient_profiles(assigned_doctor_id);

-- ---------------------------------------------------------------------
-- 3. MEDICAL HISTORY (longitudinal record per patient)
-- ---------------------------------------------------------------------
CREATE TABLE medical_history (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    patient_id          CHAR(36) NOT NULL,
    condition_name      VARCHAR(255) NOT NULL,
    diagnosis_date      DATE,
    resolved_date       DATE,
    notes               TEXT,
    recorded_by         CHAR(36),
    status              ENUM('active','archived','deleted') NOT NULL DEFAULT 'active',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_patient  FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_recorder FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_medical_history_patient ON medical_history(patient_id);
CREATE INDEX idx_medical_history_status  ON medical_history(status);

-- ---------------------------------------------------------------------
-- 4. SYMPTOM MASTER (canonical symptom dictionary — from datasets)
-- ---------------------------------------------------------------------
CREATE TABLE symptoms_master (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    symptom_code        VARCHAR(100) UNIQUE NOT NULL,   -- normalized snake_case key
    display_name        VARCHAR(255) NOT NULL,
    category            VARCHAR(100),                    -- e.g. respiratory, digestive
    synonyms            JSON,                             -- for symptom-matching/NLP
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_symptoms_master_code ON symptoms_master(symptom_code);

-- ---------------------------------------------------------------------
-- 5. DISEASE MASTER (canonical disease dictionary — from datasets)
-- ---------------------------------------------------------------------
CREATE TABLE diseases_master (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    disease_code        VARCHAR(100) UNIQUE NOT NULL,
    display_name        VARCHAR(255) NOT NULL,
    description         TEXT,
    default_severity    ENUM('mild','moderate','severe','critical') DEFAULT 'moderate',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 6. DISEASE <-> SYMPTOM MAPPING (many-to-many, weighted for ML use)
-- ---------------------------------------------------------------------
CREATE TABLE disease_symptom_map (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    disease_id          CHAR(36) NOT NULL,
    symptom_id          CHAR(36) NOT NULL,
    weight              NUMERIC(4,3) DEFAULT 1.000,  -- relative importance, from dataset
    UNIQUE(disease_id, symptom_id),
    CONSTRAINT fk_dsm_disease FOREIGN KEY (disease_id) REFERENCES diseases_master(id) ON DELETE CASCADE,
    CONSTRAINT fk_dsm_symptom FOREIGN KEY (symptom_id) REFERENCES symptoms_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_dsm_disease ON disease_symptom_map(disease_id);
CREATE INDEX idx_dsm_symptom ON disease_symptom_map(symptom_id);

-- ---------------------------------------------------------------------
-- 7. SYMPTOM SUBMISSIONS (a patient's reported-symptom "session")
--    (Detailed free-form symptom + AI response logs live in MongoDB;
--     this table is the relational anchor/reference record.)
-- ---------------------------------------------------------------------
CREATE TABLE symptom_submissions (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    patient_id          CHAR(36) NOT NULL,
    submitted_symptoms  JSON NOT NULL,               -- JSON array of symptoms_master.id
    free_text_notes     TEXT,
    mongo_log_id        VARCHAR(64),                 -- pointer to Mongo doc (raw NLP/AI trace)
    status              VARCHAR(30) NOT NULL DEFAULT 'submitted', -- submitted|processed|failed
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_submission_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_symptom_submissions_patient ON symptom_submissions(patient_id);
CREATE INDEX idx_symptom_submissions_created ON symptom_submissions(created_at);

-- ---------------------------------------------------------------------
-- 8. AUDIT LOG (security/compliance — who touched what, when)
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id             CHAR(36),
    action              VARCHAR(100) NOT NULL,
    resource_type       VARCHAR(100),
    resource_id         CHAR(36),
    metadata            JSON,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ---------------------------------------------------------------------
-- 9. DISEASE PREDICTIONS (output of the AI prediction engine, per submission)
-- ---------------------------------------------------------------------
CREATE TABLE disease_predictions (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id       CHAR(36) NOT NULL,
    patient_id          CHAR(36) NOT NULL,
    disease_id          CHAR(36) NOT NULL,
    probability         NUMERIC(5,4) NOT NULL,   -- 0.0000 - 1.0000
    confidence_score    NUMERIC(5,4) NOT NULL,
    rank                INTEGER NOT NULL,        -- 1 = most likely (Top-N disease ranking)
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_predictions_submission FOREIGN KEY (submission_id) REFERENCES symptom_submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_predictions_patient    FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_predictions_disease    FOREIGN KEY (disease_id) REFERENCES diseases_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_disease_predictions_submission ON disease_predictions(submission_id);
CREATE INDEX idx_disease_predictions_patient    ON disease_predictions(patient_id);
CREATE INDEX idx_disease_predictions_disease    ON disease_predictions(disease_id);

-- ---------------------------------------------------------------------
-- 10. RISK ASSESSMENTS (severity + risk scoring per submission)
-- ---------------------------------------------------------------------
CREATE TABLE risk_assessments (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id       CHAR(36) NOT NULL UNIQUE,
    patient_id          CHAR(36) NOT NULL,
    severity            ENUM('mild','moderate','severe','critical') NOT NULL DEFAULT 'moderate',
    risk_score          NUMERIC(5,2) NOT NULL,     -- 0-100 composite score
    risk_category       ENUM('low','medium','high','critical') NOT NULL,
    is_emergency        BOOLEAN NOT NULL DEFAULT FALSE,
    contributing_factors JSON,
    notes               TEXT,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_risk_submission FOREIGN KEY (submission_id) REFERENCES symptom_submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_risk_patient    FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_risk_assessments_patient  ON risk_assessments(patient_id);
CREATE INDEX idx_risk_assessments_category ON risk_assessments(risk_category);

-- ---------------------------------------------------------------------
-- 11. RECOMMENDATIONS (treatment/preventive/lifestyle/follow-up advice)
-- ---------------------------------------------------------------------
CREATE TABLE recommendations (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id       CHAR(36) NOT NULL,
    patient_id          CHAR(36) NOT NULL,
    disease_id          CHAR(36),
    recommendation_type ENUM('treatment','preventive','lifestyle','follow_up','consult_doctor') NOT NULL,
    content             TEXT NOT NULL,
    priority            INTEGER NOT NULL DEFAULT 0,  -- lower = higher priority
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reco_submission FOREIGN KEY (submission_id) REFERENCES symptom_submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_reco_patient    FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_reco_disease    FOREIGN KEY (disease_id) REFERENCES diseases_master(id) ON DELETE SET NULL
);

CREATE INDEX idx_recommendations_submission ON recommendations(submission_id);
CREATE INDEX idx_recommendations_patient    ON recommendations(patient_id);

-- ---------------------------------------------------------------------
-- 12. HEALTH REPORTS (consolidated, downloadable snapshot per submission)
-- ---------------------------------------------------------------------
CREATE TABLE health_reports (
    id                  CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id       CHAR(36) NOT NULL UNIQUE,
    patient_id          CHAR(36) NOT NULL,
    report_data         JSON NOT NULL,   -- consolidated snapshot: symptoms, predictions, risk, recommendations
    generated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_submission FOREIGN KEY (submission_id) REFERENCES symptom_submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_patient    FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_health_reports_patient ON health_reports(patient_id);

-- =====================================================================
-- ERD (textual layout — see README.md for rendered diagram description)
-- =====================================================================
-- users (1) ────< patient_profiles (1)
-- patient_profiles (1) ────< medical_history (N)
-- patient_profiles (1) ────< symptom_submissions (N)
-- symptoms_master (N) ──── disease_symptom_map ────(N) diseases_master
-- symptom_submissions (1) ────< disease_predictions (N) >──── diseases_master
-- symptom_submissions (1) ────  risk_assessments (1)
-- symptom_submissions (1) ────< recommendations (N)
-- symptom_submissions (1) ────  health_reports (1)
-- users (1) ────< audit_logs (N)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 13. ADDITIONAL TABLES FOR COMPLETE SYSTEM
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS doctors (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL UNIQUE,
    specialty VARCHAR(255),
    clinic_address TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS healthcare_providers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL UNIQUE,
    facility_name VARCHAR(255),
    address TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_provider_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admins (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    patient_id CHAR(36) NOT NULL,
    doctor_id CHAR(36) NOT NULL,
    appointment_date DATETIME NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS health_scores (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    patient_id CHAR(36) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_health_score_patient FOREIGN KEY (patient_id) REFERENCES patient_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS patient_symptoms (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id CHAR(36) NOT NULL,
    symptom_id CHAR(36) NOT NULL,
    CONSTRAINT fk_ps_submission FOREIGN KEY (submission_id) REFERENCES symptom_submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_symptom FOREIGN KEY (symptom_id) REFERENCES symptoms_master(id) ON DELETE CASCADE
);

