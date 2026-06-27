"""
Ingestion en lot de plusieurs municipalites MAMH.
Usage :
  python scripts/ingest_batch.py --region laurentides
  python scripts/ingest_batch.py --region laurentides --no-geocode
"""
import subprocess
import sys
import argparse
from pathlib import Path

REGIONS = {
    "laurentides": [
        # MRC Therese-De Blainville
        ("73005", "Boisbriand"),
        ("73010", "Sainte-Therese"),
        ("73015", "Blainville"),
        ("73020", "Rosemere"),
        ("73025", "Lorraine"),
        ("73030", "Bois-des-Filion"),
        ("73035", "Sainte-Anne-des-Plaines"),
        # MRC Mirabel
        ("74005", "Mirabel"),
        # MRC La Riviere-du-Nord
        ("75005", "Saint-Colomban"),
        ("75017", "Saint-Jerome"),
        ("75028", "Sainte-Sophie"),
        ("75040", "Prevost"),
        ("75045", "Saint-Hippolyte"),
        # MRC Argenteuil
        ("76008", "Saint-Andre-d-Argenteuil"),
        ("76020", "Lachute"),
        ("76025", "Gore"),
        ("76030", "Mille-Isles"),
        ("76035", "Wentworth"),
        ("76043", "Brownsburg-Chatham"),
        ("76052", "Grenville-sur-la-Rouge"),
        ("76055", "Grenville"),
        ("76065", "Harrington"),
        # MRC Les Laurentides
        ("78005", "Val-Morin"),
        ("78010", "Val-David"),
        ("78015", "Lantier"),
        ("78020", "Sainte-Lucie-des-Laurentides"),
        ("78032", "Sainte-Agathe-des-Monts"),
        ("78042", "Ivry-sur-le-Lac"),
        ("78047", "Mont-Blanc"),
        ("78050", "Barkmere"),
        ("78055", "Montcalm"),
        ("78060", "Arundel"),
        ("78065", "Huberdeau"),
        ("78070", "Amherst"),
        ("78075", "Brebeuf"),
        ("78095", "Lac-Superieur"),
        ("78100", "Val-des-Lacs"),
        ("78102", "Mont-Tremblant"),
        ("78115", "La Conception"),
        ("78120", "Labelle"),
        ("78127", "Lac-Tremblant-Nord"),
        ("78130", "La Minerve"),
    ],
    "monteregie": [
        ("57227", "Longueuil"),
    ],
    "laval": [
        ("65005", "Laval"),
    ],
    "capitale": [
        ("23027", "Quebec"),
    ],
    "outaouais": [
        ("83044", "Gatineau"),
    ],
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--region", required=True, choices=list(REGIONS.keys()),
                        help="Region a ingerer")
    parser.add_argument("--no-geocode", action="store_true",
                        help="Desactive le geocodage (rapide)")
    parser.add_argument("--start-from", default=None,
                        help="Code geo pour reprendre apres une interruption")
    args = parser.parse_args()

    municipalities = REGIONS[args.region]
    total = len(municipalities)

    print(f"\n=== Ingestion {args.region} ({total} municipalites) ===")
    print(f"Mode: {'--no-geocode' if args.no_geocode else 'avec geocodage'}\n")

    ok = 0
    fail = 0
    skipped = args.start_from is not None

    ingest_script = Path(__file__).parent / "ingest.py"

    for i, (code, nom) in enumerate(municipalities, 1):
        if skipped:
            if code == args.start_from:
                skipped = False
            else:
                print(f"[{i:>2}/{total}] {nom:<35} SKIP (avant {args.start_from})")
                continue

        print(f"\n[{i:>2}/{total}] {nom} ({code})")
        print("-" * 50)

        cmd = [sys.executable, str(ingest_script),
               "--zone", args.region,
               "--code-geo", code]
        if args.no_geocode:
            cmd.append("--no-geocode")

        result = subprocess.run(cmd, text=True, encoding="utf-8")

        if result.returncode == 0:
            ok += 1
            print(f"  -> OK")
        else:
            fail += 1
            print(f"  -> ERREUR (exit {result.returncode})")

    print(f"\n=== Termine: {ok} OK, {fail} erreurs sur {ok + fail} traites ===")
    if args.no_geocode and ok > 0:
        print("\nLance ensuite le geocodage:")
        print("  python scripts/geocode_prospects.py")


if __name__ == "__main__":
    main()
