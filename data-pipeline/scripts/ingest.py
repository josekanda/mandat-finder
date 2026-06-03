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


def _cubf_to_type(cubf: str) -> str:
    """Convertit le code CUBF MAMH en type d'immeuble lisible."""
    try:
        code = int(cubf)
    except (ValueError, TypeError):
        return cubf
    if code == 1100:
        return "Maison unifamiliale"
    if code == 1200:
        return "Maison jumelée/rangée"
    if code == 1300:
        return "Duplex"
    if code == 1400:
        return "Triplex"
    if code == 1500:
        return "Quadruplex"
    if code == 1600:
        return "Quintuplex"
    if 1700 <= code <= 1799:
        return "Immeuble résidentiel"
    if 2000 <= code <= 2999:
        return "Condo"
    return cubf


def _parse_mamh_xml(xml_bytes: bytes, code_postal: str) -> pd.DataFrame:
    """
    Parse le XML MAMH (schéma RL.xsd v2.9).

    Structure confirmée :
      <RLUEx>                          — une propriété
        <RL0101><RL0101x>
          <RL0101Ax> civic_from        — numéro civique début
          <RL0101Cx> civic_to          — numéro civique fin (optionnel)
          <RL0101Ex> type_rue          — RU, AV, BD, CH…
          <RL0101Gx> nom_rue           — nom de la rue
          <RL0101Hx> direction         — O, E, N, S (optionnel)
        <RL0105A>  cubf               — code d'utilisation (1100=maison, 1300=duplex…)
        <RL0201><RL0201x>
          <RL0201Gx> date_acquisition  — YYYY-MM-DD
          <RL0201Hx> nature_droit      — 1=pers. physique, 2=pers. morale (société)
        <RL0307A>  annee_construction  — ex: 1880
        <RL0311A>  nb_logements        — nombre de logements
        <RL0404A>  evaluation_totale   — valeur totale (terrain + bâtiment)

    Note : le XML MAMH ne contient pas de code postal Canada Post.
    Le paramètre code_postal est utilisé comme label de zone dans Supabase.
    Seules les propriétés résidentielles (CUBF 1100–2999) sont retenues.
    """
    import xml.etree.ElementTree as ET
    from datetime import date

    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        print(f"[_parse_mamh_xml] Erreur XML: {e}")
        return pd.DataFrame()

    records = []
    today = date.today()

    for unite in root.findall("RLUEx"):
        # Filtre résidentiel : CUBF 1100–2999
        cubf = unite.findtext("RL0105A", "0")
        try:
            cubf_int = int(cubf)
        except ValueError:
            continue
        if not (1100 <= cubf_int <= 2999):
            continue

        rec: dict = {"code_postal": code_postal}

        # Adresse
        rl0101 = unite.find("RL0101")
        if rl0101 is not None:
            rl0101x = rl0101.find("RL0101x")
            if rl0101x is not None:
                num_a = rl0101x.findtext("RL0101Ax", "").strip()
                num_c = rl0101x.findtext("RL0101Cx", "").strip()
                type_rue = rl0101x.findtext("RL0101Ex", "").strip()
                nom_rue = rl0101x.findtext("RL0101Gx", "").strip()
                direction = rl0101x.findtext("RL0101Hx", "").strip()
                civic = f"{num_a}-{num_c}" if num_c and num_c != num_a else num_a
                rec["adresse"] = " ".join(p for p in [civic, type_rue, nom_rue, direction] if p)

        # Type d'immeuble
        rec["type_immeuble"] = _cubf_to_type(cubf)

        # Année de construction
        annee = unite.findtext("RL0307A")
        if annee:
            try:
                rec["annee_construction"] = int(annee)
            except ValueError:
                pass

        # Nombre de logements
        nb = unite.findtext("RL0311A")
        if nb:
            try:
                rec["nb_logements"] = int(nb)
            except ValueError:
                pass

        # Évaluation municipale totale
        valeur = unite.findtext("RL0404A")
        if valeur:
            try:
                rec["evaluation_municipale"] = float(valeur)
            except ValueError:
                pass

        # Années de détention (depuis date d'acquisition)
        rl0201 = unite.find("RL0201")
        if rl0201 is not None:
            rl0201x = rl0201.find("RL0201x")
            if rl0201x is not None:
                date_acq = rl0201x.findtext("RL0201Gx", "")
                try:
                    acq = date.fromisoformat(date_acq)
                    rec["annees_detention"] = (today - acq).days / 365.25
                except ValueError:
                    pass
                # Société propriétaire : nature_droit 2 = personne morale
                rec["is_societe"] = rl0201x.findtext("RL0201Hx", "1") == "2"

        records.append(rec)

    df = pd.DataFrame(records)
    print(f"[_parse_mamh_xml] {len(df)} propriétés résidentielles parsées")
    return df


def fetch_evaluation_fonciere(code_postal: str, code_geo: str | None = None) -> pd.DataFrame:
    """
    Source : MAMH — Rôles d'évaluation foncière du Québec.
    Index : https://mamh.gouv.qc.ca/role/indexRole.csv
    Colonnes index confirmées : "lien", "code géographique"
    Format fichier municipal confirmé : XML (RL.xsd v2.9)
    Ex: python ingest.py --zone "H2S 1X3" --code-geo 66023
    """
    import httpx, io

    if code_geo is None:
        print("[fetch_evaluation_fonciere] --code-geo non fourni — utilisation des données mock")
        return pd.DataFrame()

    index_url = "https://mamh.gouv.qc.ca/role/indexRole.csv"
    try:
        with httpx.Client(timeout=60, follow_redirects=True) as client:
            resp = client.get(index_url)
            resp.raise_for_status()
            index_df = pd.read_csv(io.StringIO(resp.text))

            row = index_df[index_df["code géographique"].astype(str) == str(code_geo)]
            if row.empty:
                print(f"[fetch_evaluation_fonciere] code géographique {code_geo} introuvable dans l'index")
                return pd.DataFrame()

            fichier_url = row.iloc[0]["lien"]
            print(f"[fetch_evaluation_fonciere] Fichier municipal: {fichier_url}")

            resp2 = client.get(fichier_url, timeout=300)
            resp2.raise_for_status()

            return _parse_mamh_xml(resp2.content, code_postal)

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
