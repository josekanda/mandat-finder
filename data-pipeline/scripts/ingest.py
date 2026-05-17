# data-pipeline/scripts/ingest.py
import os
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parents[1]
FIXTURES_DIR = BASE_DIR / "fixtures"
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(BASE_DIR.parents[0] / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

SUPA = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


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
    return df.rename(columns={"code_postal_ban": "code_postal", "adresse_brut": "adresse_brute"})


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
        if "adresse_brute" in df.columns:
            df["adresse"] = df["adresse_brute"]
        elif "adresse_brut" in df.columns:
            df["adresse"] = df["adresse_brut"]
        else:
            df["adresse"] = None

    if "code_postal" not in df.columns:
        if "postcode" in df.columns:
            df["code_postal"] = df["postcode"]
        else:
            df["code_postal"] = None

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
    if row.get("dpe") in ("F", "G"):
        s += 40
    if (row.get("annees_detention") or 0) > 15:
        s += 25
    if (row.get("plus_value_pct") or 0) > 0.20:
        s += 15
    if row.get("is_sci_familiale"):
        s += 10
    return min(s, 100)


PROSPECTS_COLS = ["code_postal", "adresse", "dpe", "annees_detention", "plus_value_pct", "is_sci_familiale", "score"]


def ingest(code_postal: str):
    df = join_all(code_postal)
    if "etiquette_dpe" in df.columns:
        df = df.rename(columns={"etiquette_dpe": "dpe"})
    df["score"] = df.apply(score_row, axis=1)
    import json
    cols = [c for c in PROSPECTS_COLS if c in df.columns]
    records = json.loads(df[cols].to_json(orient="records"))
    SUPA.table("prospects_raw").insert(records).execute()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--zone", required=True, help="code postal (ex: 69100)")
    args = parser.parse_args()
    ingest(args.zone)