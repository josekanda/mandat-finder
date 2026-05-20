# data-pipeline/scripts/ingest.py
import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
FIXTURES_DIR = BASE_DIR / "fixtures"

import pandas as pd
import pandera.pandas as pa
from pandera.pandas import Column, DataFrameSchema
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(BASE_DIR.parents[0] / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

SUPA = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

PROSPECT_SCHEMA = DataFrameSchema(
    {
        "code_postal": Column(str, nullable=False),
        "adresse": Column(str, nullable=False),
        "etiquette_dpe": Column(str, nullable=True),
        "annees_detention": Column(float, nullable=True),
        "plus_value_pct": Column(float, nullable=True),
        "is_sci_familiale": Column(object, nullable=True),
        "score": Column(float, nullable=True),
    },
    coerce=True,
    strict=False,
)

PROSPECTS_COLS = [
    "code_postal", "adresse", "etiquette_dpe",
    "annees_detention", "plus_value_pct", "is_sci_familiale", "score",
]


def fetch_dpe(code_postal: str) -> pd.DataFrame:
    import httpx
    url = "https://data.ademe.fr/data-fair/api/v1/datasets/meg-83tjwtg8dyz4vv7h1dqe/lines"
    page_size = 1000
    max_records = 10000
    rows = []
    skip = 0
    with httpx.Client(timeout=30) as client:
        while len(rows) < max_records:
            resp = client.get(url, params={"size": page_size, "skip": skip, "qs": f"code_postal_ban:{code_postal}"})
            resp.raise_for_status()
            body = resp.json()
            batch = body.get("results", [])
            if not batch:
                break
            rows.extend(batch)
            skip += page_size
            if skip >= min(body.get("total", 0), max_records):
                break
    df = pd.DataFrame(rows)
    return df.rename(columns={"code_postal_ban": "code_postal", "adresse_brut": "adresse"})


def fetch_cadastre(code_postal: str) -> pd.DataFrame:
    df = pd.read_csv(FIXTURES_DIR / "cadastre_mock.csv")
    return df[df["code_postal"].astype(str) == str(code_postal)]


def fetch_dvf(code_postal: str) -> pd.DataFrame:
    df = pd.read_csv(FIXTURES_DIR / "dvf_mock.csv")
    return df[df["code_postal"].astype(str) == str(code_postal)]


def fetch_rne(code_postal: str) -> pd.DataFrame:
    df = pd.read_csv(FIXTURES_DIR / "rne_mock.csv")
    return df[df["code_postal"].astype(str) == str(code_postal)]


def normalize_and_join(dpe, cad, dvf, sci) -> pd.DataFrame:
    df = dpe.copy()

    if "adresse" not in df.columns:
        df["adresse"] = None

    if "code_postal" not in df.columns:
        df["code_postal"] = df.get("postcode", None)

    df["adresse"] = df["adresse"].astype(str).str.upper().str.strip()
    cad["adresse"] = cad["adresse"].astype(str).str.upper().str.strip()
    dvf["adresse"] = dvf["adresse"].astype(str).str.upper().str.strip()
    sci["adresse"] = sci["adresse"].astype(str).str.upper().str.strip()

    df["code_postal"] = df["code_postal"].astype(str)
    cad["code_postal"] = cad["code_postal"].astype(str)
    dvf["code_postal"] = dvf["code_postal"].astype(str)
    sci["code_postal"] = sci["code_postal"].astype(str)

    df = df.merge(cad, on=["code_postal", "adresse"], how="left")
    df = df.merge(dvf, on=["code_postal", "adresse"], how="left")
    df = df.merge(sci, on=["code_postal", "adresse"], how="left")

    return df


def join_all(code_postal: str) -> pd.DataFrame:
    dpe = fetch_dpe(code_postal)
    cad = fetch_cadastre(code_postal)
    dvf = fetch_dvf(code_postal)
    sci = fetch_rne(code_postal)
    return normalize_and_join(dpe, cad, dvf, sci)


def score_row(row) -> int:
    s = 0
    if row.get("etiquette_dpe") in ("F", "G"):
        s += 40
    if (row.get("annees_detention") or 0) > 15:
        s += 25
    if (row.get("plus_value_pct") or 0) > 0.20:
        s += 15
    if row.get("is_sci_familiale"):
        s += 10
    return min(s, 100)


def normalize_text(s):
    return (
        s.astype(str)
        .str.upper()
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )


def flag_duplicate_addresses(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["adresse_norm"] = normalize_text(df["adresse"])
    df["is_duplicate_address"] = df.duplicated(
        subset=["code_postal", "adresse_norm"], keep=False
    )
    return df


def check_dpe_construction_consistency(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["dpe_year_inconsistent"] = False

    if "etiquette_dpe" in df.columns and "annee_construction" in df.columns:
        recent_building = df["annee_construction"].fillna(0) >= 2015
        bad_dpe_for_recent = df["etiquette_dpe"].astype(str).isin(["F", "G"])
        df.loc[recent_building & bad_dpe_for_recent, "dpe_year_inconsistent"] = True

    return df


def exclude_commercial_parcels(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    if "usage_local" in df.columns:
        residential_values = ["RESIDENTIEL", "HABITATION", "APPARTEMENT", "MAISON"]
        df["usage_local"] = df["usage_local"].astype(str).str.upper().str.strip()
        df = df[df["usage_local"].isin(residential_values)]

    return df


def ingest(code_postal: str):
    df = join_all(code_postal)
    df["score"] = df.apply(score_row, axis=1)

    df = flag_duplicate_addresses(df)
    df = check_dpe_construction_consistency(df)
    df = exclude_commercial_parcels(df)
    df = PROSPECT_SCHEMA.validate(df)

    cols = [c for c in PROSPECTS_COLS if c in df.columns]
    records = json.loads(df[cols].to_json(orient="records"))
    SUPA.table("prospects").insert(records).execute()
    print(f"Inserted {len(records)} prospects for zone {code_postal}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--zone", required=True, help="code postal (ex: 69100)")
    args = parser.parse_args()
    ingest(args.zone)
