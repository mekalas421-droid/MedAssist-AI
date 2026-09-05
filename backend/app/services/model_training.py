"""
Optional trainable ML model for disease prediction (Milestone 2).

The rule-based engine in `prediction_engine.py` works directly off the
relational `disease_symptom_map` table and requires no training step, which
keeps Milestone 1/2 runnable out-of-the-box. This module is the upgrade path:
train an actual classifier on the raw Kaggle CSV (one-hot symptom columns +
a disease/prognosis label) and evaluate it with standard classification
metrics (accuracy, precision, recall, F1).

Usage:
    python -m app.services.model_training \
        --csv data/disease_prediction_using_symptoms.csv \
        --model-out models/disease_classifier.joblib

The resulting .joblib file can be loaded by a prediction service to serve
real ML-based inference instead of (or blended with) the weighted-overlap
scorer, without changing the `/api/v1/diagnostics/predict` contract.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


def load_and_split(csv_path: str, test_size: float = 0.2, random_state: int = 42):
    df = pd.read_csv(csv_path)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    label_col = next((c for c in df.columns if c in ("prognosis", "disease")), df.columns[-1])
    feature_cols = [c for c in df.columns if c != label_col]

    X = df[feature_cols].apply(pd.to_numeric, errors="coerce").fillna(0)
    y_raw = df[label_col].astype(str)

    encoder = LabelEncoder()
    y = encoder.fit_transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    return X_train, X_test, y_train, y_test, feature_cols, encoder


def train_model(X_train, y_train, n_estimators: int = 200, random_state: int = 42) -> RandomForestClassifier:
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=None,
        random_state=random_state,
        n_jobs=-1,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)
    return model


def evaluate_model(model, X_test, y_test) -> dict:
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)
    
    try:
        roc_auc = round(roc_auc_score(y_test, y_prob, multi_class='ovr', average="weighted"), 4)
    except ValueError:
        roc_auc = 0.0

    return {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision_weighted": round(precision_score(y_test, y_pred, average="weighted", zero_division=0), 4),
        "recall_weighted": round(recall_score(y_test, y_pred, average="weighted", zero_division=0), 4),
        "f1_weighted": round(f1_score(y_test, y_pred, average="weighted", zero_division=0), 4),
        "roc_auc_weighted": roc_auc,
        "report": classification_report(y_test, y_pred, zero_division=0),
    }


def main():
    parser = argparse.ArgumentParser(description="Train the MedAssist AI disease classifier")
    parser.add_argument("--csv", required=True, help="Path to the symptom-labeled dataset CSV")
    parser.add_argument("--model-out", default="models/disease_classifier.joblib")
    parser.add_argument("--n-estimators", type=int, default=200)
    args = parser.parse_args()

    X_train, X_test, y_train, y_test, feature_cols, encoder = load_and_split(args.csv)
    model = train_model(X_train, y_train, n_estimators=args.n_estimators)
    metrics = evaluate_model(model, X_test, y_test)

    print("=== Evaluation Metrics ===")
    print(f"Accuracy:            {metrics['accuracy']}")
    print(f"Precision (weighted): {metrics['precision_weighted']}")
    print(f"Recall (weighted):    {metrics['recall_weighted']}")
    print(f"F1-score (weighted):  {metrics['f1_weighted']}")
    print()
    print(metrics["report"])

    out_path = Path(args.model_out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "feature_cols": feature_cols, "label_encoder": encoder}, out_path)
    print(f"Model saved to {out_path}")


if __name__ == "__main__":
    main()
