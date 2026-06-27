"""
Géocode les prospects sans coordonnées GPS directement depuis Supabase.
Peut être stoppé et repris — le cache JSON et la liste des IDs tentés persistent.

Usage :
  python scripts/geocode_prospects.py               # traite tous sans coords
  python scripts/geocode_prospects.py --batch 200   # par lots de 200
  python scripts/geocode_prospects.py --dry-run     # affiche sans écrire
  python scripts/geocode_prospects.py --reset-skip  # recommence même les adresses déjà tentées
"""
import os
import json
import time
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
GEOCODE_CACHE_FILE  = BASE_DIR / "geocode_cache.json"
GEOCODE_SKIP_FILE   = BASE_DIR / "geocode_skip_ids.json"   # IDs déjà tentés → ne plus refetcher

from dotenv import load_dotenv
load_dotenv(BASE_DIR.parents[0] / ".env")

# ─── Cache géocodage ──────────────────────────────────────────────────────────

def _load_cache() -> dict:
    if GEOCODE_CACHE_FILE.exists():
        try:
            return json.loads(GEOCODE_CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}

def _save_cache(cache: dict) -> None:
    GEOCODE_CACHE_FILE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8"
    )

# ─── Liste des IDs déjà tentés (évite la boucle infinie sur les échecs) ───────

def _load_skip() -> set:
    if GEOCODE_SKIP_FILE.exists():
        try:
            return set(json.loads(GEOCODE_SKIP_FILE.read_text(encoding="utf-8")))
        except Exception:
            return set()
    return set()

def _save_skip(skip_ids: set) -> None:
    GEOCODE_SKIP_FILE.write_text(
        json.dumps(sorted(skip_ids), ensure_ascii=False), encoding="utf-8"
    )

# ─── Normalisation des adresses MAMH ──────────────────────────────────────────

_ABBREV = {
    "RU": "Rue", "AV": "Avenue", "BD": "Boulevard", "CH": "Chemin",
    "PL": "Place", "CR": "Croissant", "MT": "Montée", "RG": "Rang",
    "RTE": "Route", "TER": "Terrasse", "AM": "Allée", "IMP": "Impasse",
    "BO": "Boulevard", "DR": "Drive", "TL": "Trail", "QU": "Quai",
}

# Suffixes directionnels en fin d'adresse
_DIR_SUFFIX = {"E": "Est", "O": "Ouest", "N": "Nord", "S": "Sud", "SO": "Sud-Ouest", "NO": "Nord-Ouest"}

def _expand(adresse: str) -> str:
    parts = adresse.split()
    if not parts:
        return adresse
    # Expansion du type de voie (2e mot en général)
    expanded = [_ABBREV.get(p.upper(), p) for p in parts]
    # Expansion du suffixe directionnel (dernier mot)
    last = expanded[-1].upper()
    if last in _DIR_SUFFIX:
        expanded[-1] = _DIR_SUFFIX[last]
    return " ".join(expanded)

_QC_LAT = (44.9, 62.6)
_QC_LON = (-79.8, -57.1)

def _in_quebec(lat: float, lon: float) -> bool:
    return _QC_LAT[0] <= lat <= _QC_LAT[1] and _QC_LON[0] <= lon <= _QC_LON[1]

# ─── Géocodage Nominatim (requests = HTTP/1.1 pur, pas de HTTP/2) ─────────────

def geocode_one(adresse: str, ville: str, cache: dict) -> tuple:
    import requests

    key = f"{adresse}|{ville}"
    if key in cache:
        c = cache[key]
        return (c[0], c[1], c[2])

    expanded = _expand(adresse)
    # Essayer deux formulations : avec numéro complet, puis sans numéro de plage
    queries = [f"{expanded}, {ville}, Québec, Canada"]
    # Si numéro de plage (ex: 423-427), tenter aussi avec le premier numéro seul
    first_token = expanded.split()[0] if expanded else ""
    if "-" in first_token:
        single_num = first_token.split("-")[0]
        queries.append(f"{expanded.replace(first_token, single_num, 1)}, {ville}, Québec, Canada")

    result = (None, None, None)

    for query in queries:
        for attempt in range(3):
            try:
                r = requests.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": query, "format": "json", "addressdetails": 1, "limit": 1},
                    headers={"User-Agent": "MandatFinderQuebec/1.0 contact@mandat-finder.ca"},
                    timeout=15,
                )
                r.raise_for_status()
                hits = r.json()
                if hits:
                    h = hits[0]
                    lat, lon = float(h["lat"]), float(h["lon"])
                    if _in_quebec(lat, lon):
                        result = (lat, lon, h.get("address", {}).get("postcode"))
                break
            except (requests.ConnectionError, requests.Timeout):
                wait = 10 * (attempt + 1)
                print(f"\n  ↺ Réseau (tentative {attempt+1}/3), retry dans {wait}s…", flush=True)
                time.sleep(wait)
            except Exception as e:
                print(f"\n  ✗ {adresse[:35]} — {e}", flush=True)
                break
        if result != (None, None, None):
            break  # succès avec cette formulation

    cache[key] = list(result)
    time.sleep(1.1)
    return result

# ─── Supabase : client frais à chaque lot (évite saturation HTTP/2) ───────────

def _make_supa():
    from supabase import create_client
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def process_batch(
    batch_size: int,
    dry_run: bool,
    cache: dict,
    skip_ids: set,
    session_total: int,
    session_geocoded: int,
) -> tuple[int, int, bool]:
    """Crée un client Supabase frais, traite un lot. Retourne (traités, géocodés, terminé)."""
    supa = _make_supa()

    # Récupère un plus grand pool pour filtrer les IDs déjà tentés localement
    fetch_limit = max(batch_size * 3, 600)
    result = supa.table("prospects") \
        .select("id, adresse, municipalite, code_postal") \
        .is_("latitude", "null") \
        .order("id", desc=True) \
        .limit(fetch_limit) \
        .execute()

    all_prospects = result.data or []
    # Exclure les IDs déjà tentés
    prospects = [p for p in all_prospects if p["id"] not in skip_ids][:batch_size]

    if not prospects:
        return 0, 0, True  # Plus rien à traiter

    # Récupérer agence_id une seule fois — requis pour que le upsert ne viole pas NOT NULL
    agence_result = supa.table("agences").select("id").limit(1).single().execute()
    agence_id = agence_result.data["id"]

    geocoded = 0
    skipped  = 0
    pending_upsert: list[dict] = []  # accumulés, envoyés en un seul appel Supabase

    for i, p in enumerate(prospects, 1):
        adresse = p.get("adresse") or ""
        ville   = p.get("municipalite") or "Montréal"

        print(f"[{session_total + i:>6}] {adresse[:60]:<60}", end="\r", flush=True)

        if not adresse:
            skip_ids.add(p["id"])
            skipped += 1
            continue

        lat, lon, postal = geocode_one(adresse, ville, cache)

        if lat is not None:
            # code_postal : priorité au code Nominatim, sinon garder la valeur existante
            cp = postal or p.get("code_postal") or ""
            row: dict = {"id": p["id"], "agence_id": agence_id,
                         "latitude": lat, "longitude": lon, "code_postal": cp}
            pending_upsert.append(row)
            geocoded += 1

        skip_ids.add(p["id"])

        if (session_total + i) % 50 == 0:
            _save_cache(cache)
            _save_skip(skip_ids)
            total_done = session_geocoded + geocoded
            pct = round(total_done / (session_total + i) * 100) if (session_total + i) > 0 else 0
            print(f"\n  → {total_done} géocodés ({pct}% de succès) | {len(skip_ids)} IDs tentés")

    # Un seul appel Supabase pour tout le lot — élimine les déconnexions en cours de batch
    if pending_upsert and not dry_run:
        supa = _make_supa()
        supa.table("prospects").upsert(pending_upsert, on_conflict="id").execute()

    _save_cache(cache)
    _save_skip(skip_ids)
    return len(prospects), geocoded, False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch",      type=int,  default=200, help="Taille de chaque lot")
    parser.add_argument("--dry-run",    action="store_true",    help="Simuler sans écrire dans Supabase")
    parser.add_argument("--reset-skip", action="store_true",    help="Recommencer même les adresses déjà tentées")
    args = parser.parse_args()

    if args.reset_skip and GEOCODE_SKIP_FILE.exists():
        GEOCODE_SKIP_FILE.unlink()
        print("⚠  Liste des IDs tentés effacée — recommence depuis le début.")

    supa_init = _make_supa()
    count_result = supa_init.table("prospects").select("id", count="exact").is_("latitude", "null").execute()
    total_sans_coords = count_result.count or 0

    if total_sans_coords == 0:
        print("✓ Tous les prospects sont déjà géocodés.")
        return

    skip_ids = _load_skip()
    eta_h = round(total_sans_coords * 1.1 / 3600, 1)
    print(f"Prospects sans coordonnées : {total_sans_coords}")
    print(f"IDs déjà tentés (skip)     : {len(skip_ids)}")
    print(f"Durée estimée totale       : ~{eta_h}h")
    print(f"Mode                       : {'dry-run' if args.dry_run else 'production'}")
    print(f"\nDémarrage — Ctrl+C pour arrêter proprement\n{'─' * 60}")

    cache = _load_cache()
    session_processed = 0
    session_geocoded  = 0
    lot = 1

    try:
        while True:
            print(f"\n[Lot {lot}]", flush=True)
            processed, geocoded, done = process_batch(
                args.batch, args.dry_run, cache, skip_ids,
                session_processed, session_geocoded,
            )

            session_processed += processed
            session_geocoded  += geocoded
            lot += 1

            if done:
                print("\n\n✓ Géocodage terminé — tous les prospects ont été traités.")
                break

            supa_check = _make_supa()
            remaining_result = supa_check.table("prospects").select("id", count="exact").is_("latitude", "null").execute()
            remaining = remaining_result.count or 0
            untried  = max(0, remaining - len(skip_ids))
            eta_min  = round(untried * 1.1 / 60)
            print(f"\n  Sans coords : {remaining} | Non encore tentés : {untried} (~{eta_min} min)", flush=True)

            if untried == 0:
                print(f"\n✓ Toutes les adresses ont été tentées. {session_geocoded} géocodées au total.")
                break

    except KeyboardInterrupt:
        _save_cache(cache)
        _save_skip(skip_ids)
        supa_check = _make_supa()
        remaining_result = supa_check.table("prospects").select("id", count="exact").is_("latitude", "null").execute()
        remaining = remaining_result.count or 0
        print(f"\n\n⏸  Arrêté proprement.")
        print(f"   Session : {session_geocoded}/{session_processed} géocodés")
        print(f"   Restants sans coords : {remaining}")

    print(f"\nCache : {len(cache)} entrées | Skip list : {len(skip_ids)} IDs")

if __name__ == "__main__":
    main()
