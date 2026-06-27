"""
Recalcule le score pour TOUS les prospects en base selon l'algorithme courant.
Utile après un changement de pondération (ex: ajout critère éval. > 500k$).

Usage :
  python scripts/rescore.py               # rescores toutes les propriétés
  python scripts/rescore.py --dry-run     # affiche sans écrire
  python scripts/rescore.py --region montreal   # une seule région
"""
import os
import argparse
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR.parents[0] / ".env")

BATCH_SIZE = 500


def score_row(row: dict) -> int:
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


def make_supa():
    from supabase import create_client
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Simuler sans écrire")
    parser.add_argument("--region", default=None,
                        help="Filtrer par région (ex: Montréal, Laval, Laurentides)")
    args = parser.parse_args()

    supa = make_supa()

    # Compter le total
    q = supa.table("prospects").select("id", count="exact")
    if args.region:
        q = q.eq("region_administrative", args.region)
    total_count = (q.execute()).count or 0

    if total_count == 0:
        print("Aucune propriété trouvée avec ce filtre.")
        return

    print(f"Propriétés à rescorer : {total_count:,}")
    if args.region:
        print(f"Filtre région         : {args.region}")
    print(f"Mode                  : {'dry-run' if args.dry_run else 'production'}")
    print(f"Taille de lot         : {BATCH_SIZE}")
    print(f"\nDémarrage...\n{'─' * 60}")

    offset = 0
    total_updated = 0
    score_changed = 0
    lot = 1

    while offset < total_count:
        supa = make_supa()

        q = supa.table("prospects").select(
            "id, annee_construction, annees_detention, evaluation_municipale, "
            "is_societe, nb_logements, score, agence_id, code_postal"
        )
        if args.region:
            q = q.eq("region_administrative", args.region)

        result = q.order("id").range(offset, offset + BATCH_SIZE - 1).execute()
        rows = result.data or []

        if not rows:
            break

        updates = []
        for row in rows:
            new_score = score_row(row)
            old_score = row.get("score")
            if new_score != old_score:
                updates.append({
                    "id": row["id"],
                    "score": new_score,
                    "agence_id": row.get("agence_id"),
                    "code_postal": row.get("code_postal") or "",
                })
                score_changed += 1

        if updates and not args.dry_run:
            supa = make_supa()
            supa.table("prospects").upsert(updates, on_conflict="id").execute()

        total_updated += len(rows)
        pct = round(total_updated / total_count * 100)
        print(f"[Lot {lot:>4}] {total_updated:>6}/{total_count:>6} ({pct:>3}%) "
              f"— {score_changed} scores modifiés", flush=True)

        offset += BATCH_SIZE
        lot += 1

    print(f"\n{'─' * 60}")
    print(f"✓ Rescore terminé")
    print(f"  Propriétés traitées  : {total_updated:,}")
    print(f"  Scores modifiés      : {score_changed:,}")
    if args.dry_run:
        print("  (dry-run — aucune écriture)")


if __name__ == "__main__":
    main()
