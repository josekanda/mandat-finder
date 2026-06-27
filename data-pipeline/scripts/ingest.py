# data-pipeline/scripts/ingest.py
import os
import json
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
FIXTURES_DIR = BASE_DIR / "fixtures"
GEOCODE_CACHE_FILE = BASE_DIR / "geocode_cache.json"

# Couche géographique : code_geo MAMH → (municipalite, region_administrative, mrc)
GEO_LAYERS: dict[str, tuple[str, str, str]] = {
    # ── Grandes villes ───────────────────────────────────────────────────────
    "66023": ("Montréal",          "Montréal",                  "Agglomération de Montréal"),
    "65005": ("Laval",             "Laval",                     "Laval"),
    "23027": ("Québec",            "Capitale-Nationale",        "Communauté métropolitaine de Québec"),
    "57227": ("Longueuil",         "Montérégie",                "Agglomération de Longueuil"),
    "83044": ("Gatineau",          "Outaouais",                 "MRC des Collines-de-l'Outaouais"),
    "74023": ("Sherbrooke",        "Estrie",                    "MRC de Sherbrooke"),
    "43027": ("Trois-Rivières",    "Mauricie",                  "MRC de Trois-Rivières"),
    "25023": ("Saguenay",          "Saguenay–Lac-Saint-Jean",   "MRC du Fjord-du-Saguenay"),
    # ── Laurentides — MRC Thérèse-De Blainville ──────────────────────────────
    "73005": ("Boisbriand",        "Laurentides",               "Thérèse-De Blainville"),
    "73010": ("Sainte-Thérèse",    "Laurentides",               "Thérèse-De Blainville"),
    "73015": ("Blainville",        "Laurentides",               "Thérèse-De Blainville"),
    "73020": ("Rosemère",          "Laurentides",               "Thérèse-De Blainville"),
    "73025": ("Lorraine",          "Laurentides",               "Thérèse-De Blainville"),
    "73030": ("Bois-des-Filion",   "Laurentides",               "Thérèse-De Blainville"),
    "73035": ("Sainte-Anne-des-Plaines", "Laurentides",         "Thérèse-De Blainville"),
    # ── Laurentides — MRC Mirabel ─────────────────────────────────────────────
    "74005": ("Mirabel",           "Laurentides",               "Mirabel"),
    # ── Laurentides — MRC La Rivière-du-Nord ─────────────────────────────────
    "75005": ("Saint-Colomban",    "Laurentides",               "La Rivière-du-Nord"),
    "75017": ("Saint-Jérôme",      "Laurentides",               "La Rivière-du-Nord"),
    "75028": ("Sainte-Sophie",     "Laurentides",               "La Rivière-du-Nord"),
    "75040": ("Prévost",           "Laurentides",               "La Rivière-du-Nord"),
    "75045": ("Saint-Hippolyte",   "Laurentides",               "La Rivière-du-Nord"),
    # ── Laurentides — MRC Argenteuil ─────────────────────────────────────────
    "76008": ("Saint-André-d'Argenteuil", "Laurentides",        "Argenteuil"),
    "76020": ("Lachute",           "Laurentides",               "Argenteuil"),
    "76025": ("Gore",              "Laurentides",               "Argenteuil"),
    "76030": ("Mille-Isles",       "Laurentides",               "Argenteuil"),
    "76035": ("Wentworth",         "Laurentides",               "Argenteuil"),
    "76043": ("Brownsburg-Chatham","Laurentides",               "Argenteuil"),
    "76052": ("Grenville-sur-la-Rouge", "Laurentides",          "Argenteuil"),
    "76055": ("Grenville",         "Laurentides",               "Argenteuil"),
    "76065": ("Harrington",        "Laurentides",               "Argenteuil"),
    # ── Laurentides — MRC Les Laurentides ────────────────────────────────────
    "78005": ("Val-Morin",         "Laurentides",               "Les Laurentides"),
    "78010": ("Val-David",         "Laurentides",               "Les Laurentides"),
    "78015": ("Lantier",           "Laurentides",               "Les Laurentides"),
    "78020": ("Sainte-Lucie-des-Laurentides", "Laurentides",    "Les Laurentides"),
    "78032": ("Sainte-Agathe-des-Monts", "Laurentides",         "Les Laurentides"),
    "78042": ("Ivry-sur-le-Lac",   "Laurentides",               "Les Laurentides"),
    "78047": ("Mont-Blanc",        "Laurentides",               "Les Laurentides"),
    "78050": ("Barkmere",          "Laurentides",               "Les Laurentides"),
    "78055": ("Montcalm",          "Laurentides",               "Les Laurentides"),
    "78060": ("Arundel",           "Laurentides",               "Les Laurentides"),
    "78065": ("Huberdeau",         "Laurentides",               "Les Laurentides"),
    "78070": ("Amherst",           "Laurentides",               "Les Laurentides"),
    "78075": ("Brébeuf",           "Laurentides",               "Les Laurentides"),
    "78095": ("Lac-Supérieur",     "Laurentides",               "Les Laurentides"),
    "78100": ("Val-des-Lacs",      "Laurentides",               "Les Laurentides"),
    "78102": ("Mont-Tremblant",    "Laurentides",               "Les Laurentides"),
    "78115": ("La Conception",     "Laurentides",               "Les Laurentides"),
    "78120": ("Labelle",           "Laurentides",               "Les Laurentides"),
    "78127": ("Lac-Tremblant-Nord","Laurentides",               "Les Laurentides"),
    "78130": ("La Minerve",        "Laurentides",               "Les Laurentides"),
}

# Mapping simplifié code_geo → nom de ville (utilisé pour le géocodage Nominatim)
CODE_GEO_TO_VILLE: dict[str, str] = {k: v[0] for k, v in GEO_LAYERS.items()}

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
    """Convertit le code CUBF MAMH en type d'immeuble lisible.
    Utilise des plages pour couvrir tous les sous-codes (ex: 1310, 1411…).
    """
    try:
        code = int(cubf)
    except (ValueError, TypeError):
        return cubf
    if 1100 <= code <= 1199:
        return "Maison unifamiliale"
    if 1200 <= code <= 1299:
        return "Maison jumelée/rangée"
    if 1300 <= code <= 1399:
        return "Duplex"
    if 1400 <= code <= 1499:
        return "Triplex"
    if 1500 <= code <= 1599:
        return "Quadruplex"
    if 1600 <= code <= 1699:
        return "Quintuplex"
    if 1700 <= code <= 1999:
        return "Immeuble résidentiel"
    if 2000 <= code <= 2999:
        return "Condo/Appartement"
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


def _load_geocode_cache() -> dict:
    if GEOCODE_CACHE_FILE.exists():
        try:
            return json.loads(GEOCODE_CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def _save_geocode_cache(cache: dict) -> None:
    GEOCODE_CACHE_FILE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8"
    )


# Abréviations de type de rue MAMH → forme complète pour Nominatim
_MAMH_RUE_ABBREV: dict[str, str] = {
    "RU": "Rue", "AV": "Avenue", "BD": "Boulevard", "CH": "Chemin",
    "PL": "Place", "CR": "Croissant", "CT": "Court", "DR": "Drive",
    "MT": "Montée", "RG": "Rang", "RTE": "Route", "SQ": "Square",
    "TER": "Terrasse", "TL": "Trail", "AM": "Allée", "IMP": "Impasse",
    "PASS": "Passage", "QU": "Quai", "PROM": "Promenade",
}


def _expand_mamh_address(adresse: str) -> str:
    """Remplace les abréviations MAMH dans une adresse pour améliorer le géocodage."""
    parts = adresse.split(" ")
    expanded = []
    for part in parts:
        expanded.append(_MAMH_RUE_ABBREV.get(part.upper(), part))
    return " ".join(expanded)


# Bounding box du Québec (province)
_QC_LAT_MIN, _QC_LAT_MAX = 44.9, 62.6
_QC_LON_MIN, _QC_LON_MAX = -79.8, -57.1


def _in_quebec(lat: float | None, lon: float | None) -> bool:
    if lat is None or lon is None:
        return False
    return _QC_LAT_MIN <= lat <= _QC_LAT_MAX and _QC_LON_MIN <= lon <= _QC_LON_MAX


def _geocode_address(
    adresse: str, ville: str, cache: dict
) -> tuple[float | None, float | None, str | None]:
    """
    Géocode une adresse via Nominatim (OSM) — gratuit, sans clé API.
    Retourne (latitude, longitude, code_postal_canada_post).
    Rate limit Nominatim : 1 req/s — on attend 1.1s entre chaque appel.
    """
    import httpx

    adresse_expanded = _expand_mamh_address(adresse)
    key = f"{adresse}|{ville}"
    if key in cache:
        cached = cache[key]
        return (cached[0], cached[1], cached[2])

    query = f"{adresse_expanded}, {ville}, Québec, Canada"
    result: tuple[float | None, float | None, str | None] = (None, None, None)

    for attempt in range(3):  # 3 tentatives sur erreur réseau
        try:
            with httpx.Client(timeout=15) as client:
                resp = client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": query, "format": "json", "addressdetails": 1, "limit": 1},
                    headers={"User-Agent": "MandatFinderQuebec/1.0 contact@mandat-finder.ca"},
                )
                resp.raise_for_status()
                hits = resp.json()
                if hits:
                    h = hits[0]
                    lat = float(h["lat"])
                    lon = float(h["lon"])
                    postal = h.get("address", {}).get("postcode")
                    result = (lat, lon, postal)
            break  # succès — sortir de la boucle retry
        except httpx.ConnectError:
            # Erreur DNS/réseau — attendre avant retry
            wait = 5 * (attempt + 1)
            print(f"\n[geocode] Erreur réseau (tentative {attempt+1}/3), attente {wait}s…")
            time.sleep(wait)
        except Exception as e:
            print(f"\n[geocode] Erreur pour '{adresse}': {e}")
            break

    # Rejeter les résultats hors Québec
    if result[0] is not None and not _in_quebec(result[0], result[1]):
        result = (None, None, None)

    cache[key] = list(result)
    time.sleep(1.1)
    return result


def geocode_dataframe(df: pd.DataFrame, ville: str) -> pd.DataFrame:
    """
    Ajoute latitude, longitude, et remplace code_postal par le vrai code postal
    Canada Post obtenu via Nominatim. Utilise un cache JSON local.
    """
    if df.empty:
        return df

    cache = _load_geocode_cache()
    lats: list = []
    lons: list = []
    postals: list = []
    total = len(df)

    for i, (_, row) in enumerate(df.iterrows(), 1):
        adresse = str(row.get("adresse") or "")
        fallback_postal = str(row.get("code_postal") or "")
        if not adresse:
            lats.append(None); lons.append(None); postals.append(fallback_postal)
            continue
        print(f"[geocode] {i}/{total} — {adresse[:60]:<60}", end="\r", flush=True)
        lat, lon, postal = _geocode_address(adresse, ville, cache)
        lats.append(lat)
        lons.append(lon)
        postals.append(postal if postal else fallback_postal)

        # Sauvegarde progressive toutes les 50 adresses
        if i % 50 == 0:
            _save_geocode_cache(cache)

    _save_geocode_cache(cache)
    geocoded = sum(1 for l in lats if l is not None)
    print(f"\n[geocode] Terminé — {geocoded}/{total} géocodés ({round(geocoded/total*100)}%)")

    df = df.copy()
    df["latitude"] = lats
    df["longitude"] = lons
    df["code_postal"] = postals
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
        s += 30
    if (row.get("evaluation_municipale") or 0) >= 500_000:
        s += 10
    if row.get("is_societe"):
        s += 10
    nb = row.get("nb_logements") or 0
    if 2 <= nb <= 6:
        s += 10
    return s


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
        residential = [
            "MAISON UNIFAMILIALE",
            "MAISON JUMELÉE/RANGÉE",
            "DUPLEX", "TRIPLEX", "QUADRUPLEX", "QUINTUPLEX",
            "IMMEUBLE RÉSIDENTIEL",
            "CONDO/APPARTEMENT", "CONDO", "APPARTEMENT", "LOGEMENT",
        ]
        df["type_immeuble"] = df["type_immeuble"].astype(str).str.upper().str.strip()
        df = df[df["type_immeuble"].isin(residential)]
    return df


def get_agence_id() -> str:
    result = _get_supa().table("agences").select("id").limit(1).execute()
    if not result.data:
        raise RuntimeError("Aucune agence trouvée dans la base. Crée-en une d'abord.")
    return result.data[0]["id"]


def ingest(code_postal: str, code_geo: str | None = None, no_geocode: bool = False):
    supa = _get_supa()
    agence_id = get_agence_id()
    df = join_all(code_postal, code_geo)

    # Filtrer AVANT le géocodage — évite de géocoder des milliers de propriétés
    # qui seront de toute façon écartées (commercial, industriel, doublons)
    df = flag_duplicate_addresses(df)
    df = exclude_non_residential(df)
    print(f"[ingest] {len(df)} propriétés résidentielles après filtrage")

    if not df.empty and not no_geocode and code_geo is not None:
        ville = CODE_GEO_TO_VILLE.get(str(code_geo), "Québec")
        print(f"[ingest] Géocodage des adresses ({len(df)} propriétés) via Nominatim — ville: {ville}")
        df = geocode_dataframe(df, ville)

    df["agence_id"] = agence_id
    df["source_code_geo"] = str(code_geo) if code_geo else None

    # Couche géographique
    if code_geo and str(code_geo) in GEO_LAYERS:
        municipalite, region, mrc = GEO_LAYERS[str(code_geo)]
        df["municipalite"] = municipalite
        df["region_administrative"] = region
        df["mrc"] = mrc
    else:
        df["municipalite"] = code_postal

    df["score"] = df.apply(score_row, axis=1).fillna(0)
    df = PROSPECT_SCHEMA.validate(df)

    df["score"] = df["score"].fillna(0).astype(int)

    # Pandera coerce en float — recaster les colonnes integer pour Supabase
    for col in ["annee_construction", "nb_logements", "annees_detention"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").round().astype("Int64")

    cols = [c for c in PROSPECTS_COLS + ["source_code_geo", "municipalite", "region_administrative", "mrc"] if c in df.columns]
    records = json.loads(df[cols].to_json(orient="records"))

    # Supprimer les anciens enregistrements pour cette municipalité (par source_code_geo)
    # Si pas de code_geo, fallback sur le label de zone (code_postal)
    delete_q = supa.table("prospects").delete().eq("agence_id", agence_id)
    if code_geo:
        delete_q = delete_q.eq("source_code_geo", str(code_geo))
    else:
        delete_q = delete_q.eq("code_postal", code_postal)
    delete_q.execute()

    supa.table("prospects").insert(records).execute()
    print(f"Inserted {len(records)} prospects for zone {code_postal} (code_geo={code_geo})")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--zone", required=True, help="label de zone (ex: H2S 1X3 ou Montréal-Nord)")
    parser.add_argument("--code-geo", default=None, dest="code_geo",
                        help="code géographique MAMH (ex: 66023 pour Montréal). "
                             "Trouver dans https://mamh.gouv.qc.ca/role/indexRole.csv")
    parser.add_argument("--no-geocode", action="store_true", dest="no_geocode",
                        help="désactive le géocodage Nominatim (rapide, sans lat/lon ni vrais codes postaux)")
    args = parser.parse_args()
    ingest(args.zone, args.code_geo, args.no_geocode)
