"""
Database Seeding & ML Model Training Bootstrapper.
- Wires up 200+ symptoms in 13 categories.
- Wires up 102 diseases with mapped symptoms.
- Generates 5,000 synthetic patient records with realistic noise.
- Trains a RandomForestClassifier and saves it to app/services/disease_classifier.joblib.
- Seeds mock accounts for patient, doctor, clinic, and admin.
- Adds mock appointments, medical history, health scores, and notifications.
"""
import asyncio
import random
from datetime import date, datetime, timedelta
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import hash_password
from app.models.doctor import (
    ActivityLog,
    AdminProfile,
    Appointment,
    DoctorProfile,
    HealthcareProviderProfile,
    HealthScore,
    Notification,
    Role,
)
from app.models.medical_history import MedicalHistory, RecordStatus
from app.models.patient import GenderType, PatientProfile
from app.models.symptom import (
    DiseaseMaster,
    DiseaseSymptomMap,
    SeverityLevel,
    SymptomMaster,
)
from app.models.user import User, UserRole

# ----------------- 200+ SYMPTOMS BY CATEGORIES -----------------
SYMPTOMS_DATA = {
    "General": [
        "Fever", "Chills", "Fatigue", "Weakness", "Lethargy", "Body Aches", "Generalized Pain", "Shivering",
        "Night Sweats", "Loss of Appetite", "Weight Loss", "Weight Gain", "Dehydration", "Malaise", "Hot Flashes",
        "Dizziness", "Fainting", "Cold Sweat", "Excessive Sweat", "Mild Fever", "High Fever", "Hypothermia"
    ],
    "Heart": [
        "Chest Pain", "Palpitations", "Rapid Heart Rate", "Slow Heart Rate", "Irregular Heartbeat", "Swollen Legs",
        "Shortness of Breath Lying Down", "Blue Lips", "Chest Tightness", "Chest Pressure", "Heart Murmur",
        "High Blood Pressure", "Low Blood Pressure", "Angina", "Cardiac Arrhythmia"
    ],
    "Brain": [
        "Headache", "Migraine", "Vertigo", "Confusion", "Memory Loss", "Trouble Speaking", "Difficulty Concentrating",
        "Brain Fog", "Seizure", "Lightheadedness", "Loss of Balance", "Coordination Problems", "Tremor",
        "Numbness in Face", "Drowsiness", "Insomnia", "Aphasia", "Visual Aura"
    ],
    "Chest": [
        "Chest Discomfort", "Pleuritic Chest Pain", "Chest Congestion", "Shortness of Breath", "Wheezing",
        "Dry Cough", "Wet Cough", "Shallow Breathing", "Rapid Breathing", "Stridor", "Intercostal Retractions", "Coughing Blood"
    ],
    "Skin": [
        "Skin Rash", "Itching", "Redness", "Hives", "Dry Skin", "Skin Peeling", "Blisters", "Skin Swelling",
        "Bruising", "Skin Ulcers", "Yellow Skin", "Pale Skin", "Dark Spots", "Bumps on Skin", "Acne", "Eczema Patches",
        "Psoriasis Plaques", "Skin Flaking", "Sunburn Sensation", "Cold Sores"
    ],
    "Eye": [
        "Blurry Vision", "Double Vision", "Eye Pain", "Redness in Eye", "Watery Eyes", "Dry Eyes", "Itchy Eyes",
        "Sensitivity to Light", "Vision Loss", "Yellow Eyes", "Eye Floaters", "Swelling of Eyelid", "Bloodshot Eyes",
        "Diminished Night Vision"
    ],
    "ENT": [
        "Sore Throat", "Runny Nose", "Nasal Congestion", "Sneezing", "Earache", "Ringing in Ears", "Loss of Smell",
        "Loss of Taste", "Hoarseness", "Sinus Pain", "Nosebleed", "Ear Discharge", "Difficulty Swallowing",
        "Stuffy Ear", "Swollen Tonsils"
    ],
    "Bone": [
        "Joint Pain", "Joint Stiffness", "Joint Swelling", "Bone Pain", "Back Pain", "Neck Pain", "Muscle Weakness",
        "Muscle Cramps", "Limited Range of Motion", "Difficulty Walking", "Bone Fractures", "Spine Stiffness", "Muscle Spasms"
    ],
    "Respiratory": [
        "Phlegm", "Throat Irritation", "Sinus Congestion", "Shortness of Breath", "Wheezing", "Coughing Blood",
        "Nasal Congestion", "Sneezing", "Runny Nose", "Heavy Breathing", "Chest Tightness", "Loss of Breath", "Hyperventilating"
    ],
    "Digestive": [
        "Nausea", "Vomiting", "Diarrhea", "Constipation", "Abdominal Pain", "Stomach Cramps", "Bloating", "Excessive Gas",
        "Heartburn", "Acid Reflux", "Indigestion", "Blood in Stool", "Loss of Appetite", "Jaundice", "Stomach Rumbling",
        "Flatulence", "Nausea after Eating"
    ],
    "Kidney": [
        "Frequent Urination", "Painful Urination", "Blood in Urine", "Cloudy Urine", "Difficulty Urinating",
        "Dark Urine", "Flank Pain", "Swollen Feet", "Uremic Frost", "Protein in Urine", "Reduced Urine Output", "Urinary Urgency"
    ],
    "Neurology": [
        "Numbness", "Tingling", "Burning Sensation", "Muscle Weakness", "Paralysis", "Loss of Balance",
        "Coordination Loss", "Speech Slurring", "Tremors", "Seizures", "Nerve Pain", "Sciatica", "Bells Palsy",
        "Loss of Sensation", "Hyperreflexia"
    ],
    "Mental Health": [
        "Anxiety", "Depression", "Mood Swings", "Irritability", "Insomnia", "Sleepiness", "Panic Attacks",
        "Hallucinations", "Delusions", "Lack of Motivation", "Social Withdrawal", "Suicidal Thoughts", "Brain Fog",
        "Nervousness", "Restlessness", "Emotional Numbness"
    ]
}

# ----------------- 100+ DISEASES DATA WITH MAPS -----------------
DISEASES_DATA = [
    ("Hypertension", SeverityLevel.MODERATE, ["High Blood Pressure", "Headache", "Dizziness", "Palpitations", "Blurry Vision"]),
    ("Diabetes Type 1", SeverityLevel.SEVERE, ["Frequent Urination", "Weight Loss", "Fatigue", "Weakness", "Dehydration", "Tingling"]),
    ("Diabetes Type 2", SeverityLevel.MODERATE, ["Frequent Urination", "Weight Gain", "Fatigue", "Blurry Vision", "Numbness", "Indigestion"]),
    ("Influenza", SeverityLevel.MODERATE, ["Fever", "Chills", "Fatigue", "Body Aches", "Headache", "Dry Cough", "Sore Throat", "Runny Nose"]),
    ("COVID-19", SeverityLevel.SEVERE, ["Fever", "Dry Cough", "Shortness of Breath", "Loss of Smell", "Loss of Taste", "Fatigue", "Body Aches"]),
    ("Common Cold", SeverityLevel.MILD, ["Runny Nose", "Nasal Congestion", "Sneezing", "Sore Throat", "Dry Cough", "Mild Fever"]),
    ("Asthma", SeverityLevel.MODERATE, ["Wheezing", "Shortness of Breath", "Chest Tightness", "Dry Cough", "Throat Irritation"]),
    ("COPD", SeverityLevel.SEVERE, ["Shortness of Breath", "Wheezing", "Chest Congestion", "Wet Cough", "Fatigue", "Phlegm"]),
    ("Pneumonia", SeverityLevel.SEVERE, ["High Fever", "Chills", "Wet Cough", "Shortness of Breath", "Pleuritic Chest Pain", "Fatigue", "Phlegm"]),
    ("Bronchitis", SeverityLevel.MODERATE, ["Wet Cough", "Phlegm", "Chest Discomfort", "Fatigue", "Mild Fever", "Wheezing"]),
    ("Migraine", SeverityLevel.MODERATE, ["Migraine", "Headache", "Nausea", "Sensitivity to Light", "Visual Aura", "Dizziness"]),
    ("Epilepsy", SeverityLevel.SEVERE, ["Seizure", "Seizures", "Confusion", "Loss of Balance", "Fainting"]),
    ("Stroke", SeverityLevel.CRITICAL, ["Trouble Speaking", "Paralysis", "Numbness in Face", "Loss of Balance", "Speech Slurring", "Confusion", "Dizziness"]),
    ("Transient Ischemic Attack", SeverityLevel.SEVERE, ["Trouble Speaking", "Numbness in Face", "Speech Slurring", "Loss of Balance", "Dizziness"]),
    ("Multiple Sclerosis", SeverityLevel.SEVERE, ["Muscle Weakness", "Numbness", "Tingling", "Loss of Balance", "Blurry Vision", "Coordination Problems"]),
    ("Parkinsons Disease", SeverityLevel.SEVERE, ["Tremor", "Tremors", "Joint Stiffness", "Difficulty Walking", "Limited Range of Motion", "Muscle Spasms"]),
    ("Alzheimers Disease", SeverityLevel.SEVERE, ["Memory Loss", "Confusion", "Difficulty Concentrating", "Social Withdrawal"]),
    ("Depression", SeverityLevel.MODERATE, ["Depression", "Lack of Motivation", "Social Withdrawal", "Insomnia", "Sleepiness", "Loss of Appetite"]),
    ("Anxiety Disorder", SeverityLevel.MILD, ["Anxiety", "Restlessness", "Nervousness", "Palpitations", "Insomnia", "Panic Attacks"]),
    ("Bipolar Disorder", SeverityLevel.MODERATE, ["Mood Swings", "Irritability", "Insomnia", "Lethargy", "Lack of Motivation"]),
    ("Schizophrenia", SeverityLevel.SEVERE, ["Hallucinations", "Delusions", "Social Withdrawal", "Confusion", "Emotional Numbness"]),
    ("GERD", SeverityLevel.MILD, ["Heartburn", "Acid Reflux", "Indigestion", "Nausea", "Chest Discomfort"]),
    ("Peptic Ulcer", SeverityLevel.MODERATE, ["Abdominal Pain", "Indigestion", "Nausea", "Vomiting", "Blood in Stool", "Heartburn"]),
    ("Crohns Disease", SeverityLevel.SEVERE, ["Abdominal Pain", "Diarrhea", "Weight Loss", "Fatigue", "Fever", "Blood in Stool"]),
    ("Ulcerative Colitis", SeverityLevel.SEVERE, ["Diarrhea", "Blood in Stool", "Abdominal Pain", "Fatigue", "Weight Loss", "Fever"]),
    ("Irritable Bowel Syndrome", SeverityLevel.MILD, ["Bloating", "Abdominal Pain", "Diarrhea", "Constipation", "Excessive Gas", "Flatulence"]),
    ("Hepatitis A", SeverityLevel.MODERATE, ["Jaundice", "Yellow Skin", "Yellow Eyes", "Nausea", "Fatigue", "Loss of Appetite", "Dark Urine"]),
    ("Hepatitis B", SeverityLevel.MODERATE, ["Jaundice", "Yellow Skin", "Yellow Eyes", "Fatigue", "Nausea", "Abdominal Pain", "Dark Urine"]),
    ("Hepatitis C", SeverityLevel.MODERATE, ["Jaundice", "Yellow Skin", "Yellow Eyes", "Fatigue", "Nausea", "Dark Urine", "Joint Pain"]),
    ("Liver Cirrhosis", SeverityLevel.SEVERE, ["Jaundice", "Yellow Skin", "Yellow Eyes", "Abdominal Pain", "Weight Loss", "Swollen Legs", "Fatigue"]),
    ("Cholecystitis", SeverityLevel.SEVERE, ["Abdominal Pain", "Nausea", "Vomiting", "Fever", "Jaundice"]),
    ("Appendicitis", SeverityLevel.CRITICAL, ["Abdominal Pain", "Nausea", "Vomiting", "Fever", "Loss of Appetite"]),
    ("Urinary Tract Infection", SeverityLevel.MILD, ["Frequent Urination", "Painful Urination", "Urinary Urgency", "Cloudy Urine", "Mild Fever", "Flank Pain"]),
    ("Chronic Kidney Disease", SeverityLevel.SEVERE, ["Frequent Urination", "Swollen Feet", "Fatigue", "Cloudy Urine", "Dark Urine", "Reduced Urine Output"]),
    ("Kidney Stones", SeverityLevel.SEVERE, ["Flank Pain", "Painful Urination", "Blood in Urine", "Urinary Urgency", "Nausea", "Vomiting"]),
    ("Acute Renal Failure", SeverityLevel.CRITICAL, ["Reduced Urine Output", "Swollen Feet", "Shortness of Breath", "Confusion", "Nausea", "Fatigue"]),
    ("Osteoarthritis", SeverityLevel.MILD, ["Joint Pain", "Joint Stiffness", "Joint Swelling", "Limited Range of Motion"]),
    ("Rheumatoid Arthritis", SeverityLevel.MODERATE, ["Joint Pain", "Joint Stiffness", "Joint Swelling", "Fatigue", "Fever", "Spine Stiffness"]),
    ("Osteoporosis", SeverityLevel.MILD, ["Bone Pain", "Back Pain", "Bone Fractures"]),
    ("Gout", SeverityLevel.MILD, ["Joint Pain", "Joint Swelling", "Redness", "Mild Fever"]),
    ("Fibromyalgia", SeverityLevel.MODERATE, ["Generalized Pain", "Body Aches", "Fatigue", "Insomnia", "Brain Fog", "Headache"]),
    ("Eczema", SeverityLevel.MILD, ["Skin Rash", "Itching", "Redness", "Dry Skin", "Eczema Patches", "Skin Flaking"]),
    ("Psoriasis", SeverityLevel.MILD, ["Skin Rash", "Psoriasis Plaques", "Skin Flaking", "Itching", "Redness", "Joint Pain"]),
    ("Acne Vulgaris", SeverityLevel.MILD, ["Acne", "Skin Redness", "Bumps on Skin"]),
    ("Dermatitis", SeverityLevel.MILD, ["Skin Rash", "Itching", "Redness", "Skin Swelling", "Skin Peeling"]),
    ("Coronary Artery Disease", SeverityLevel.SEVERE, ["Chest Pain", "Shortness of Breath", "Fatigue", "Palpitations", "Angina"]),
    ("Heart Failure", SeverityLevel.CRITICAL, ["Shortness of Breath", "Fatigue", "Swollen Legs", "Shortness of Breath Lying Down", "Palpitations", "Wheezing"]),
    ("Arrhythmia", SeverityLevel.MODERATE, ["Palpitations", "Irregular Heartbeat", "Rapid Heart Rate", "Slow Heart Rate", "Dizziness", "Fainting"]),
    ("Myocardial Infarction", SeverityLevel.CRITICAL, ["Chest Pain", "Chest Pressure", "Chest Tightness", "Shortness of Breath", "Cold Sweat", "Nausea", "Dizziness", "Palpitations"]),
    ("Deep Vein Thrombosis", SeverityLevel.MODERATE, ["Swollen Legs", "Joint Pain", "Skin Swelling", "Redness"]),
    ("Pulmonary Embolism", SeverityLevel.CRITICAL, ["Shortness of Breath", "Chest Pain", "Pleuritic Chest Pain", "Rapid Breathing", "Coughing Blood", "Fainting"]),
    ("Anemia", SeverityLevel.MILD, ["Fatigue", "Weakness", "Pale Skin", "Dizziness", "Headache", "Shortness of Breath"]),
    ("Leukemia", SeverityLevel.SEVERE, ["Fatigue", "Fever", "Weight Loss", "Night Sweats", "Bone Pain", "Bruising"]),
    ("Lymphoma", SeverityLevel.SEVERE, ["Swollen Legs", "Fever", "Weight Loss", "Night Sweats", "Fatigue", "Chills"]),
    ("Hyperthyroidism", SeverityLevel.MODERATE, ["Weight Loss", "Palpitations", "Irritability", "Excessive Sweat", "Fatigue", "Insomnia"]),
    ("Hypothyroidism", SeverityLevel.MODERATE, ["Weight Gain", "Fatigue", "Weakness", "Dry Skin", "Constipation", "Lethargy"]),
    ("Cushings Syndrome", SeverityLevel.SEVERE, ["Weight Gain", "High Blood Pressure", "Fatigue", "Muscle Weakness", "Bruising"]),
    ("Addisons Disease", SeverityLevel.SEVERE, ["Fatigue", "Weakness", "Weight Loss", "Low Blood Pressure", "Nausea", "Abdominal Pain"]),
    ("Glandular Fever", SeverityLevel.MODERATE, ["Fever", "Sore Throat", "Fatigue", "Swollen Tonsils", "Body Aches", "Headache"]),
    ("Tuberculosis", SeverityLevel.SEVERE, ["Coughing Blood", "Fever", "Weight Loss", "Night Sweats", "Chills", "Fatigue", "Pleuritic Chest Pain"]),
    ("Malaria", SeverityLevel.SEVERE, ["High Fever", "Chills", "Shivering", "Body Aches", "Headache", "Nausea", "Vomiting", "Excessive Sweat"]),
    ("Dengue Fever", SeverityLevel.SEVERE, ["High Fever", "Bone Pain", "Headache", "Eye Pain", "Skin Rash", "Fatigue", "Nausea", "Vomiting"]),
    ("Typhoid Fever", SeverityLevel.SEVERE, ["High Fever", "Headache", "Abdominal Pain", "Weakness", "Constipation", "Diarrhea", "Skin Rash"]),
    ("Cholera", SeverityLevel.CRITICAL, ["Diarrhea", "Vomiting", "Dehydration", "Muscle Cramps", "Weakness"]),
    ("Food Poisoning", SeverityLevel.MILD, ["Nausea", "Vomiting", "Diarrhea", "Abdominal Pain", "Fever", "Stomach Cramps"]),
    ("Meningitis", SeverityLevel.CRITICAL, ["High Fever", "Headache", "Confusion", "Sensitivity to Light", "Drowsiness", "Seizures"]),
    ("Encephalitis", SeverityLevel.CRITICAL, ["High Fever", "Headache", "Confusion", "Seizures", "Muscle Weakness", "Speech Slurring"]),
    ("Otitis Media", SeverityLevel.MILD, ["Earache", "Mild Fever", "Ear Discharge", "Ringing in Ears"]),
    ("Sinusitis", SeverityLevel.MILD, ["Sinus Pain", "Nasal Congestion", "Sneezing", "Runny Nose", "Headache", "Mild Fever"]),
    ("Tonsillitis", SeverityLevel.MILD, ["Sore Throat", "Swollen Tonsils", "Difficulty Swallowing", "Mild Fever", "Voice Hoarseness"]),
    ("Laryngitis", SeverityLevel.MILD, ["Hoarseness", "Sore Throat", "Dry Cough", "Throat Irritation"]),
    ("Pharyngitis", SeverityLevel.MILD, ["Sore Throat", "Difficulty Swallowing", "Mild Fever", "Headache"]),
    ("Conjunctivitis", SeverityLevel.MILD, ["Redness in Eye", "Watery Eyes", "Itchy Eyes", "Sensitivity to Light", "Eye Pain"]),
    ("Glaucoma", SeverityLevel.SEVERE, ["Vision Loss", "Eye Pain", "Blurry Vision", "Headache", "Sensitivity to Light"]),
    ("Cataract", SeverityLevel.MILD, ["Blurry Vision", "Diminished Night Vision", "Double Vision"]),
    ("Macular Degeneration", SeverityLevel.MODERATE, ["Blurry Vision", "Vision Loss"]),
    ("Sleep Apnea", SeverityLevel.MODERATE, ["Drowsiness", "Brain Fog", "Headache", "Palpitations", "Insomnia"]),
    ("Insomnia", SeverityLevel.MILD, ["Insomnia", "Fatigue", "Brain Fog", "Irritability"]),
    ("Narcolepsy", SeverityLevel.MODERATE, ["Sleepiness", "Drowsiness", "Weakness", "Confusion"]),
    ("Panic Disorder", SeverityLevel.MODERATE, ["Panic Attacks", "Palpitations", "Chest Tightness", "Anxiety", "Dizziness"]),
    ("OCD", SeverityLevel.MILD, ["Anxiety", "Difficulty Concentrating", "Restlessness"]),
    ("PTSD", SeverityLevel.MODERATE, ["Mood Swings", "Depression", "Anxiety", "Insomnia", "Social Withdrawal"]),
    ("ADHD", SeverityLevel.MILD, ["Difficulty Concentrating", "Restlessness", "Mood Swings"]),
    ("Autism Spectrum Disorder", SeverityLevel.MILD, ["Social Withdrawal", "Trouble Speaking", "Difficulty Concentrating"]),
    ("Chronic Fatigue Syndrome", SeverityLevel.MODERATE, ["Fatigue", "Lethargy", "Body Aches", "Brain Fog", "Insomnia"]),
    ("Fibroids", SeverityLevel.MILD, ["Abdominal Pain", "Frequent Urination", "Back Pain"]),
    ("Endometriosis", SeverityLevel.MODERATE, ["Abdominal Pain", "Generalized Pain", "Back Pain", "Indigestion"]),
    ("PCOS", SeverityLevel.MILD, ["Weight Gain", "Acne", "Anxiety", "Depression"]),
    ("Benign Prostatic Hyperplasia", SeverityLevel.MILD, ["Frequent Urination", "Difficulty Urinating", "Cloudy Urine", "Urinary Urgency"]),
    ("Prostate Cancer", SeverityLevel.SEVERE, ["Frequent Urination", "Painful Urination", "Blood in Urine", "Bone Pain"]),
    ("Breast Cancer", SeverityLevel.SEVERE, ["Bone Pain", "Fatigue", "Weight Loss"]),
    ("Lung Cancer", SeverityLevel.CRITICAL, ["Dry Cough", "Shortness of Breath", "Coughing Blood", "Weight Loss", "Fatigue", "Chest Discomfort"]),
    ("Colorectal Cancer", SeverityLevel.SEVERE, ["Blood in Stool", "Abdominal Pain", "Constipation", "Diarrhea", "Weight Loss", "Fatigue"]),
    ("Melanoma", SeverityLevel.SEVERE, ["Dark Spots", "Skin Rash", "Skin Peeling"]),
    ("Osteomyelitis", SeverityLevel.SEVERE, ["Bone Pain", "Fever", "Chills", "Redness", "Skin Swelling"]),
    ("Paget's Disease", SeverityLevel.MODERATE, ["Bone Pain", "Joint Stiffness", "Headache"]),
    ("Vertigo", SeverityLevel.MILD, ["Vertigo", "Dizziness", "Loss of Balance", "Nausea"]),
    ("Meniere's Disease", SeverityLevel.MODERATE, ["Vertigo", "Ringing in Ears", "Dizziness", "Nausea", "Vision Loss"]),
    ("Rheumatoid Heart Disease", SeverityLevel.SEVERE, ["Palpitations", "Shortness of Breath", "Swollen Legs", "Chest Pain", "Joint Pain"]),
    ("Mitral Valve Prolapse", SeverityLevel.MILD, ["Palpitations", "Chest Discomfort", "Dizziness", "Anxiety", "Irregular Heartbeat"])
]

# Helper to normalize symptom codes
def normalize_code(raw: str) -> str:
    cleaned = "".join([c for c in str(raw) if c.isalnum() or c.isspace()]).strip().lower()
    return "_".join(cleaned.split())


async def seed_data():
    print("Database seeding started...")
    
    # Drop and recreate all tables for a clean seed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Tables dropped and synchronized.")

    async with AsyncSessionLocal() as db:


        # --- Seed Roles ---
        roles = ["patient", "doctor", "clinic", "admin"]
        for r_name in roles:
            db.add(Role(name=r_name))
        await db.flush()

        # --- Seed Symptoms ---
        symptom_ids = {}
        symptom_codes_list = []
        for cat, symptoms in SYMPTOMS_DATA.items():
            for s_name in symptoms:
                code = normalize_code(s_name)
                if code not in symptom_ids:
                    symptom = SymptomMaster(
                        symptom_code=code,
                        display_name=s_name,
                        category=cat,
                        synonyms=[s_name.lower()]
                    )
                    db.add(symptom)
                    await db.flush()
                    symptom_ids[code] = symptom.id
                    symptom_codes_list.append(code)
        print(f"Seeded {len(symptom_ids)} symptoms.")

        # --- Seed Diseases & Mappings ---
        disease_ids = {}
        disease_to_symptoms = {} # disease_code -> list of symptom_codes
        for d_name, severity, symptoms in DISEASES_DATA:
            d_code = normalize_code(d_name)
            disease = DiseaseMaster(
                disease_code=d_code,
                display_name=d_name,
                description=f"A pathological condition defined as {d_name}.",
                default_severity=severity
            )
            db.add(disease)
            await db.flush()
            disease_ids[d_code] = disease.id
            disease_to_symptoms[d_code] = []

            for s_name in symptoms:
                s_code = normalize_code(s_name)
                if s_code in symptom_ids:
                    disease_to_symptoms[d_code].append(s_code)
                    db.add(DiseaseSymptomMap(
                        disease_id=disease.id,
                        symptom_id=symptom_ids[s_code],
                        weight=round(random.uniform(0.85, 1.0), 3)
                    ))
            await db.flush()
        print(f"Seeded {len(disease_ids)} diseases with mappings.")

        # --- Seed Mock Users ---
        users_seed = [
            ("patient@medassist.com", "Patient User", UserRole.PATIENT, "+91-9988776655"),
            ("doctor@medassist.com", "Dr. Anand Verma", UserRole.DOCTOR, "+91-9876543210"),
            ("provider@medassist.com", "Apollo Clinics", UserRole.CLINIC, "+91-9000800070"),
            ("admin@medassist.com", "System Admin", UserRole.ADMIN, "+91-8888899999"),
        ]
        
        seeded_users = {}
        for email, name, role, phone in users_seed:
            user = User(
                email=email,
                hashed_password=hash_password("Password123"),
                full_name=name,
                role=role,
                phone_number=phone,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            await db.flush()
            seeded_users[role] = user

        # Profiles
        patient_profile = PatientProfile(
            user_id=seeded_users[UserRole.PATIENT].id,
            date_of_birth=date(1995, 4, 15),
            gender=GenderType.MALE,
            blood_group="O+",
            height_cm=175.5,
            weight_kg=72.0,
            address="45, Health Avenue, Sector 4, Bangalore",
            emergency_contact_name="Riya Verma",
            emergency_contact_phone="+91-9111222333",
            known_allergies=["Dust", "Sulfa Drugs"],
            chronic_conditions=["Mild Asthma"],
            current_medications=["Inhaler PRN"],
            assigned_doctor_id=seeded_users[UserRole.DOCTOR].id,
            clinic_id=seeded_users[UserRole.CLINIC].id
        )
        db.add(patient_profile)
        await db.flush()

        doctor_profile = DoctorProfile(
            user_id=seeded_users[UserRole.DOCTOR].id,
            specialty="Cardiology / Internal Medicine",
            clinic_address="Room 204, MedAssist Hub, Delhi"
        )
        db.add(doctor_profile)

        provider_profile = HealthcareProviderProfile(
            user_id=seeded_users[UserRole.CLINIC].id,
            facility_name="Apollo Triage Center",
            address="Bannerghatta Road, Bangalore"
        )
        db.add(provider_profile)

        admin_profile = AdminProfile(
            user_id=seeded_users[UserRole.ADMIN].id
        )
        db.add(admin_profile)
        await db.flush()

        # Seed Health History
        db.add(MedicalHistory(
            patient_id=patient_profile.id,
            condition_name="Allergic Rhinitis",
            diagnosis_date=date(2021, 5, 20),
            notes="Periodic flare ups in pollen season.",
            recorded_by=seeded_users[UserRole.DOCTOR].id,
            status=RecordStatus.ACTIVE
        ))
        db.add(MedicalHistory(
            patient_id=patient_profile.id,
            condition_name="Acute Appendectomy",
            diagnosis_date=date(2018, 10, 5),
            resolved_date=date(2018, 10, 20),
            notes="Appendicitis surgery resolved cleanly.",
            recorded_by=seeded_users[UserRole.DOCTOR].id,
            status=RecordStatus.ARCHIVED
        ))

        # Seed Appointments
        db.add(Appointment(
            patient_id=patient_profile.id,
            doctor_id=seeded_users[UserRole.DOCTOR].id,
            appointment_date=datetime.now() + timedelta(days=2, hours=3),
            status="scheduled",
            notes="Routine follow up regarding asthma medication effectiveness."
        ))

        # Seed Notifications
        db.add(Notification(
            user_id=seeded_users[UserRole.PATIENT].id,
            message="Your appointment with Dr. Anand Verma has been scheduled for day after tomorrow.",
            is_read=False
        ))
        db.add(Notification(
            user_id=seeded_users[UserRole.DOCTOR].id,
            message="New patient queue updated. Patient User (M, 31) has been assigned to you.",
            is_read=False
        ))

        # Seed Health Scores
        db.add(HealthScore(
            patient_id=patient_profile.id,
            score=88.5
        ))
        db.add(HealthScore(
            patient_id=patient_profile.id,
            score=91.0
        ))

        # Seed Activity Logs
        db.add(ActivityLog(
            user_id=seeded_users[UserRole.PATIENT].id,
            action="Profile Setup",
            details="Patient completed onboarding medical history setup."
        ))

        await db.commit()
        print("Mock profiles and relational assets seeded.")

        # --- Generate Synthetic Dataset & Train Classifier ---
        print("Generating synthetic patient cases (50 cases per disease)...")
        dataset_rows = []
        
        symptom_cols = sorted(symptom_codes_list)
        
        for d_code, key_symptoms in disease_to_symptoms.items():
            for _ in range(50):
                row = {s_code: 0 for s_code in symptom_cols}
                row["disease_label"] = d_code
                
                # Assign key symptoms with high probability
                for ks in key_symptoms:
                    if random.random() < 0.85:
                        row[ks] = 1
                
                # Assign minor background noise (other symptoms)
                for s_code in symptom_cols:
                    if s_code not in key_symptoms:
                        if random.random() < 0.015: # 1.5% chance
                            row[s_code] = 1
                            
                dataset_rows.append(row)
        
        df = pd.DataFrame(dataset_rows)
        print(f"DataFrame generated. Shape: {df.shape}")

        # Train ML Model
        X = df[symptom_cols]
        y_raw = df["disease_label"]

        encoder = LabelEncoder()
        y = encoder.fit_transform(y_raw)

        print("Training Random Forest Classifier...")
        model = RandomForestClassifier(
            n_estimators=120,
            random_state=42,
            class_weight="balanced",
            n_jobs=-1
        )
        model.fit(X, y)
        
        # Test training accuracy
        train_acc = model.score(X, y)
        print(f"Classifier fit completed. Training Accuracy: {train_acc * 100:.2f}%")

        # Save to joblib file
        out_dir = Path(__file__).parent.parent / "services"
        out_path = out_dir / "disease_classifier.joblib"
        out_dir.mkdir(parents=True, exist_ok=True)
        
        joblib.dump({
            "model": model,
            "feature_cols": symptom_cols,
            "label_encoder": encoder
        }, out_path)
        print(f"Scikit-Learn classifier written to: {out_path}")

        print("Seeding and Model Training completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_data())
