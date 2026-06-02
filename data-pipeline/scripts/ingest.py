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

def _get_supa():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)

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


def fetch_evaluation_fonciere(code_postal: str, code_geo: str | None = None) -> pd.DataFrame:
    """
    Source : MAMH — Rôles d'évaluation foncière du Québec.
    https://www.donneesquebec.ca/recherche/dataset/roles-d-evaluation-fonciere-du-quebec

    Colonnes confirmées de l'index (indexRole.csv) :
      - "lien"             : URL du fichier de données de la municipalité
      - "code géographique": code géographique municipal (ex: 66023 pour Montréal)

    Paramètre code_geo : passer le code géographique MAMH de la municipalité cible.
      Exemple : python ingest.py --zone "H2S 1X3" --code-geo 66023

    TODO après intégration complète :
      - Vérifier le format exact des fichiers municipaux (ZIP/XML ou CSV) en ouvrant
        un "lien" de l'index dans un navigateur
      - Adapter rename_map aux vrais noms de colonnes du fichier municipal
    """
    import httpx, io

    if code_geo is None:
        print("[fetch_evaluation_fonciere] --code-geo non fourni — utilisation des données mock")
        return pd.DataFrame()

    index_url = "https://mamh.gouv.qc.ca/role/indexRole.csv"
    try:
        with httpx.Client(timeout=60, follow_redirects=True) as client:
            # Étape 1 : télécharger l'index (1 Mo, trimestriel)
            resp = client.get(index_url)
            resp.raise_for_status()
            index_df = pd.read_csv(io.StringIO(resp.text))

            # Colonnes confirmées : "lien" et "code géographique"
            row = index_df[index_df["code géographique"].astype(str) == str(code_geo)]
            if row.empty:
                print(f"[fetch_evaluation_fonciere] code géographique {code_geo} introuvable dans l'index")
                return pd.DataFrame()

            fichier_url = row.iloc[0]["lien"]
            print(f"[fetch_evaluation_fonciere] Fichier municipal: {fichier_url}")

            # Étape 2 : télécharger le fichier de la municipalité
            resp2 = client.get(fichier_url, timeout=120)
            resp2.raise_for_status()

            # TODO : adapter si le format est ZIP/XML (utiliser zipfile + xml.etree)
            df = pd.read_csv(io.StringIO(resp2.text), low_memory=False)

            # TODO : vérifier les vrais noms de colonnes en ouvrant un fichier municipal
            rename_map = {
                "CODE_POSTAL": "code_postal",
                "ADRESSE": "adresse",
                "ANNEE_CONSTRUCTION": "annee_construction",
                "CATEGORIE_UTILISATION": "type_immeuble",
                "NOMBRE_LOGEMENTS": "nb_logements",
                "VALEUR_EVALUATION": "evaluation_municipale",
            }
            df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})

            if "code_postal" in df.columns:
                df = df[df["code_postal"].astype(str).str.strip() == str(code_postal).strip()]

            if "_geopoint" in df.columns:
                coords = df["_geopoint"].astype(str).str.split(",", expand=True)
                df["latitude"] = pd.to_numeric(coords[0], errors="coerce")
                df["longitude"] = pd.to_numeric(coords[1], errors="coerce")

            print(f"[fetch_evaluation_fonciere] {len(df)} propriétés pour {code_postal}")
            return df

    except httpx.HTTPError as e:
        print(f"[fetch_evaluation_fonciere] Erreur réseau: {e} — utilisation des données mock")
        return pd.DataFrame()


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
    if mamh.empty:
        return mamh
    df = mamh.copy()
    cad = cad.copy()
    trans = trans.copy()
    req = req.copy()

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


def join_all(code_postal: str, code_geo: str | None = None) -> pd.DataFrame:
    mamh = fetch_evaluation_fonciere(code_postal, code_geo)
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
    result = _get_supa().table("agences").select("id").limit(1).execute()
    if not result.data:
        raise RuntimeError("Aucune agence trouvée dans la base. Crée-en une d'abord.")
    return result.data[0]["id"]


def ingest(code_postal: str, code_geo: str | None = None):
    supa = _get_supa()
    agence_id = get_agence_id()
    df = join_all(code_postal, code_geo)
    df["agence_id"] = agence_id
    df["score"] = df.apply(score_row, axis=1).fillna(0)

    df = flag_duplicate_addresses(df)
    df = exclude_non_residential(df)
    df = PROSPECT_SCHEMA.validate(df)

    df["score"] = df["score"].fillna(0).astype(int)

    cols = [c for c in PROSPECTS_COLS if c in df.columns]
    records = json.loads(df[cols].to_json(orient="records"))

    supa.table("prospects").delete().eq("agence_id", agence_id).eq("code_postal", code_postal).execute()
    supa.table("prospects").insert(records).execute()
    print(f"Inserted {len(records)} prospects for zone {code_postal}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--zone", required=True, help="code postal québécois (ex: H2S 1X3)")
    parser.add_argument("--code-geo", default=None, dest="code_geo",
                        help="code géographique MAMH de la municipalité (ex: 66023 pour Montréal). "
                             "Trouver dans https://mamh.gouv.qc.ca/role/indexRole.csv")
    args = parser.parse_args()
    ingest(args.zone, args.code_geo)
