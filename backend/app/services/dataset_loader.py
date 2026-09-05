"""
Dataset Loading & Preprocessing Engine (Milestone 1).

Loads:
  1. "Disease Symptoms and Patient Profile Dataset" (Kaggle)
  2. "Disease Prediction Using Symptoms Dataset" (Kaggle)

Responsibilities:
  - Read raw CSVs
  - Normalize/standardize symptom & disease names into snake_case codes
  - Deduplicate and build a canonical symptom/disease catalogue
  - Populate `symptoms_master`, `diseases_master`, and `disease_symptom_map`

Run standalone:
    python -m app.services.dataset_loader --disease-symptoms-csv data/disease_symptoms.csv \
                                            --symptom-prediction-csv data/symptom_prediction.csv
"""
from __future__ import annotations

import argparse
import asyncio
import re
from pathlib import Path

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.symptom import DiseaseMaster, DiseaseSymptomMap, SymptomMaster

SYMPTOM_COLUMN_PATTERNS = re.compile(r"^(symptom|symptom_\d+)$", re.IGNORECASE)


def normalize_code(raw: str) -> str:
    """'Chest Pain ' -> 'chest_pain' ; strips punctuation, lowercases, snake_cases."""
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", str(raw)).strip().lower()
    return re.sub(r"\s+", "_", cleaned)


def to_display_name(code: str) -> str:
    return code.replace("_", " ").title()


class DatasetPreprocessor:
    """Encapsulates the parse -> clean -> normalize -> load pipeline."""

    def __init__(self):
        self.symptom_catalogue: dict[str, str] = {}   # code -> display_name
        self.disease_catalogue: dict[str, str] = {}   # code -> display_name
        self.disease_symptom_pairs: set[tuple[str, str]] = set()  # (disease_code, symptom_code)

    # ---------------- Dataset 1: Disease Symptoms & Patient Profile ----------------
    def parse_disease_symptoms_csv(self, path: str | Path) -> None:
        df = pd.read_csv(path)
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        disease_col = next((c for c in df.columns if "disease" in c), None)
        if not disease_col:
            raise ValueError("Could not locate a disease column in the dataset.")

        symptom_cols = [c for c in df.columns if SYMPTOM_COLUMN_PATTERNS.match(c) or "symptom" in c]
        symptom_cols = [c for c in symptom_cols if c != disease_col]

        df = df.dropna(subset=[disease_col])

        for _, row in df.iterrows():
            disease_code = normalize_code(row[disease_col])
            if not disease_code:
                continue
            self.disease_catalogue.setdefault(disease_code, to_display_name(disease_code))

            for col in symptom_cols:
                value = row.get(col)
                if pd.isna(value) or str(value).strip() == "":
                    continue
                symptom_code = normalize_code(value)
                if not symptom_code:
                    continue
                self.symptom_catalogue.setdefault(symptom_code, to_display_name(symptom_code))
                self.disease_symptom_pairs.add((disease_code, symptom_code))

    # ---------------- Dataset 2: Disease Prediction Using Symptoms ----------------
    def parse_symptom_prediction_csv(self, path: str | Path) -> None:
        """
        This dataset is typically wide/one-hot: one 'prognosis' (disease) column +
        many binary symptom columns (1 = present, 0 = absent).
        """
        df = pd.read_csv(path)
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        disease_col = next((c for c in df.columns if c in ("prognosis", "disease")), df.columns[-1])
        symptom_cols = [c for c in df.columns if c != disease_col]

        df = df.dropna(subset=[disease_col])

        for _, row in df.iterrows():
            disease_code = normalize_code(row[disease_col])
            if not disease_code:
                continue
            self.disease_catalogue.setdefault(disease_code, to_display_name(disease_code))

            for col in symptom_cols:
                try:
                    present = int(row[col]) == 1
                except (ValueError, TypeError):
                    continue
                if not present:
                    continue
                symptom_code = normalize_code(col)
                self.symptom_catalogue.setdefault(symptom_code, to_display_name(symptom_code))
                self.disease_symptom_pairs.add((disease_code, symptom_code))

    # ---------------- Persistence ----------------
    async def persist(self, db: AsyncSession) -> None:
        # Upsert symptoms
        symptom_id_by_code: dict[str, str] = {}
        for code, name in self.symptom_catalogue.items():
            result = await db.execute(select(SymptomMaster).where(SymptomMaster.symptom_code == code))
            existing = result.scalar_one_or_none()
            if existing:
                symptom_id_by_code[code] = existing.id
                continue
            new_symptom = SymptomMaster(symptom_code=code, display_name=name)
            db.add(new_symptom)
            await db.flush()
            symptom_id_by_code[code] = new_symptom.id

        # Upsert diseases
        disease_id_by_code: dict[str, str] = {}
        for code, name in self.disease_catalogue.items():
            result = await db.execute(select(DiseaseMaster).where(DiseaseMaster.disease_code == code))
            existing = result.scalar_one_or_none()
            if existing:
                disease_id_by_code[code] = existing.id
                continue
            new_disease = DiseaseMaster(disease_code=code, display_name=name)
            db.add(new_disease)
            await db.flush()
            disease_id_by_code[code] = new_disease.id

        # Upsert disease<->symptom mappings
        for disease_code, symptom_code in self.disease_symptom_pairs:
            disease_id = disease_id_by_code[disease_code]
            symptom_id = symptom_id_by_code[symptom_code]
            result = await db.execute(
                select(DiseaseSymptomMap).where(
                    DiseaseSymptomMap.disease_id == disease_id,
                    DiseaseSymptomMap.symptom_id == symptom_id,
                )
            )
            if not result.scalar_one_or_none():
                db.add(DiseaseSymptomMap(disease_id=disease_id, symptom_id=symptom_id, weight=1.0))

        await db.commit()

    def summary(self) -> dict:
        return {
            "unique_symptoms": len(self.symptom_catalogue),
            "unique_diseases": len(self.disease_catalogue),
            "disease_symptom_links": len(self.disease_symptom_pairs),
        }


async def run(disease_symptoms_csv: str | None, symptom_prediction_csv: str | None) -> None:
    processor = DatasetPreprocessor()

    if disease_symptoms_csv:
        processor.parse_disease_symptoms_csv(disease_symptoms_csv)
    if symptom_prediction_csv:
        processor.parse_symptom_prediction_csv(symptom_prediction_csv)

    print("Preprocessing summary:", processor.summary())

    async with AsyncSessionLocal() as session:
        await processor.persist(session)

    print("Dataset successfully loaded into MySQL.")


def main():
    parser = argparse.ArgumentParser(description="MedAssist AI dataset loader")
    parser.add_argument("--disease-symptoms-csv", type=str, default=None)
    parser.add_argument("--symptom-prediction-csv", type=str, default=None)
    args = parser.parse_args()

    if not args.disease_symptoms_csv and not args.symptom_prediction_csv:
        parser.error("Provide at least one of --disease-symptoms-csv / --symptom-prediction-csv")

    asyncio.run(run(args.disease_symptoms_csv, args.symptom_prediction_csv))


if __name__ == "__main__":
    main()
