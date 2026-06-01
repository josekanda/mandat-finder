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
        "code_postal":            Column(str, nullable=False),
        "adresse":                Column(str, nullable=False),
        "annee_construction":     Column(float, nullable=True),
        "annees_detention":       Column(float, nullable=True),
        "evaluation_municipale":  Column(float, nullable=True),
        "type_immeuble":          Column(str, nullable=True),
        "nb_logements":           Column(float, nullable=True),
        "ratio_evaluation_marche": Column(float, nullable=True),
        "is_societe":             Column(object, nullable=True),
        "score":                  Column(float, nullable=True),
    },
    coerce=True,
    strict=False,
)

PROSPECTS_COLS = [
    "agence_id", "code_postal", "adresse",
    "annee_construction", "evaluation_municipale", "type_immeuble", "nb_logements",
    "latitude", "longitude",
    "annees_detention", "ratio_evaluation_marche", "is_societe", "score",
]


def fetch_evaluation_fonciere(code_postal: str) -> pd.DataFrame:
    """
    Source : Données Québec — Rôle d'évaluation foncière municipale (MAMH).
    URL CKAN à vérifier sur https://www.donneesquebec.ca avant mise en prod.
    Le resource_id ci-dessous est un exemple — remplace-le par l'ID réel du jeu de données.
    """
    import httpx
    # TODO: vérifier resource_id sur donneesquebec.ca au moment du déploiement
    url = "https://www.donneesquebec.ca/api/3/action/datastore_search"
    resource_id = "REMPLACER_PAR_RESOURCE_ID_MAMH"
    rows = []
    offset = 0
    limit = 1000
    max_records = 10000
    with httpx.Client(timeout=30) as client:
        while len(rows) < max_records:
            resp = client.get(url, params={
                "resource_id": resource_id,
                "limit": limit,
                "offset": offset,
                "filters": json.dumps({"CODE_POSTAL": code_postal}),
            })
            resp.raise_for_status()
            body = resp.json()
            batch = body.get("result", {}).get("records", [])
            if not batch:
                break
            rows.extend(batch)
            offset += limit
            if offset >= min(body.get("result", {}).get("total", 0), max_records):
                break
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    rename_map = {
        "CODE_POSTAL": "code_postal",
        "ADRESSE": "adresse",
        "ANNEE_CONSTRUCTION": "annee_construction",
        "CATEGORIE_UTILISATION": "type_immeuble",
        "NOMBRE_LOGEMENTS": "nb_logements",
        "VALEUR_EVALUATION": "evaluation_municipale",
    }
    df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})
    if "_geopoint" in df.columns:
        coords = df["_geopoint"].astype(str).str.split(",", expand=True)
        df["latitude"] = pd.to_numeric(coords[0], errors="coerce")
        df["longitude"] = pd.to_numeric(coords[1], errors="coerce")
    return df


def fetch_cadastre(code_postal: str) -> pd.DataFrame:
    df = pd.read_csv(FIXTURES_DIR / "cadastre_mock.csv")
    return df[df["code_postal"].astype(str) == str(code_postal)]


def fetch_transactions(code_postal: str) -> pd.DataFrame:
    df = pd.read_csv(FIXTURES_DIR / "transactions_mock.csv")
    return df[df["code_postal"].astype(str) == str(code_postal)]


def fetch_req(code_postal: str) -> pd.DataFrame:
    # Source : REQ — Registre des entreprises du Québec
    # API publique : https://api.registreentreprises.gouv.qc.ca/ (à intégrer en prod)
    df = pd.read_csv(FIXTURES_DIR / "req_mock.csv")
    return df[df["code_postal"].astype(str) == str(code_postal)]


def normalize_text(s: pd.Series) -> pd.Series:
    return (
        s.astype(str)
        .str.upper()
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )


def normalize_and_join(mamh: pd.DataFrame, cad: pd.DataFrame, trans: pd.DataFrame, req: pd.DataFrame) -> pd.DataFrame:
    df = mamh.copy()

    if "adresse" not in df.columns:
        df["adresse"] = None
    if "code_postal" not in df.columns:
        df["code_postal"] = None

    for frame in [df, cad, trans, req]:
        frame["adresse"] = normalize_text(frame["adresse"])
        frame["code_postal"] = frame["code_postal"].astype(str)

    df = df.merge(cad, on=["code_postal", "adresse"], how="left", suffixes=("", "_cad"))
    df = df.merge(trans, on=["code_postal", "adresse"], how="left", suffixes=("", "_trans"))
    df = df.merge(req, on=["code_postal", "adresse"], how="left", suffixes=("", "_req"))

    # Calcul du ratio évaluation / prix de transaction
    if "evaluation_municipale" in df.columns and "prix_transaction" in df.columns:
        df["ratio_evaluation_marche"] = (
            df["evaluation_municipale"] / df["prix_transaction"].replace(0, float("nan"))
        ).fillna(0.0)
    else:
        df["ratio_evaluation_marche"] = 0.0

    return df


def join_all(code_postal: str) -> pd.DataFrame:
    mamh = fetch_evaluation_fonciere(code_postal)
    cad = fetch_cadastre(code_postal)
    trans = fetch_transactions(code_postal)
    req = fetch_req(code_postal)
    return normalize_and_join(mamh, cad, trans, req)


def score_row(row) -> int:
    s = 0
    annee = row.get("annee_construction")
    if annee is not None and annee <= 1960:
        s += 40
    if (row.get("annees_detention") or 0) > 15:
        s += 25
    if (row.get("ratio_evaluation_marche") or 0) > 1.2:
        s += 15
    if row.get("is_societe"):
        s += 10
    nb = row.get("nb_logements") or 0
    if 2 <= nb <= 6:
        s += 10
    return min(s, 100)


def flag_duplicate_addresses(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["adresse_norm"] = normalize_text(df["adresse"])
    df["is_duplicate_address"] = df.duplicated(
        subset=["code_postal", "adresse_norm"], keep=False
    )
    return df


def exclude_non_residential(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    if "type_immeuble" in df.columns:
        residential = ["MAISON UNIFAMILIALE", "DUPLEX", "TRIPLEX", "QUADRUPLEX",
                       "QUINTUPLEX", "CONDO", "APPARTEMENT", "LOGEMENT"]
        df["type_immeuble"] = df["type_immeuble"].astype(str).str.upper().str.strip()
        df = df[df["type_immeuble"].isin(residential)]
    return df


def get_agence_id() -> str:
    result = SUPA.table("agences").select("id").limit(1).execute()
    if not result.data:
        raise RuntimeError("Aucune agence trouvée dans la base. Crée-en une d'abord.")
    return result.data[0]["id"]


def ingest(code_postal: str):
    agence_id = get_agence_id()
    df = join_all(code_postal)
    df["agence_id"] = agence_id
    df["score"] = df.apply(score_row, axis=1).fillna(0)

    df = flag_duplicate_addresses(df)
    df = exclude_non_residential(df)
    df = PROSPECT_SCHEMA.validate(df)

    df["score"] = df["score"].fillna(0).astype(int)

    cols = [c for c in PROSPECTS_COLS if c in df.columns]
    records = json.loads(df[cols].to_json(orient="records"))

    SUPA.table("prospects").delete().eq("agence_id", agence_id).eq("code_postal", code_postal).execute()
    SUPA.table("prospects").insert(records).execute()
    print(f"Inserted {len(records)} prospects for zone {code_postal}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--zone", required=True, help="code postal québécois (ex: H2S 1X3)")
    args = parser.parse_args()
    ingest(args.zone)
