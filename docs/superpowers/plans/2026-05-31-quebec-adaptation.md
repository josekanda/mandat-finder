# Adaptation Québec — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer toutes les références France (ADEME/DPE, DVF, RNE, RGPD/CNIL) par leurs équivalents québécois (MAMH/évaluation foncière, REQ, Loi 25/CAI) dans le pipeline de données, la base de données et l'interface.

**Architecture:** Pipeline Python refactorisé avec 4 sources (MAMH, cadastre mock, transactions mock, REQ mock), migration Supabase pour renommer les colonnes DPE-France en colonnes Québec, et mise à jour en cascade des composants Next.js qui lisent ces colonnes.

**Tech Stack:** Python 3.11 + pandas + pandera + httpx + supabase-py · Next.js (App Router) · Supabase PostgreSQL · Tailwind CSS

---

## Fichiers modifiés

| Fichier | Action |
|---|---|
| `data-pipeline/fixtures/cadastre_mock.csv` | Modifier — données Quebec |
| `data-pipeline/fixtures/dvf_mock.csv` | Renommer → `transactions_mock.csv` |
| `data-pipeline/fixtures/rne_mock.csv` | Renommer → `req_mock.csv` |
| `data-pipeline/scripts/ingest.py` | Réécriture complète |
| `supabase/migrations/0003_quebec_schema.sql` | Créer |
| `src/app/(app)/dashboard/page.tsx` | Modifier |
| `src/app/(app)/prospects/page.tsx` | Modifier |
| `src/app/(app)/prospects/[id]/page.tsx` | Modifier |
| `src/app/(app)/layout.tsx` | Modifier |
| `src/components/prospects-table.tsx` | Modifier |
| `src/components/dashboard-charts.tsx` | Modifier |
| `src/components/motion/step-rail.tsx` | Modifier |
| `src/app/page.tsx` | Modifier |
| `src/app/mentions-legales/page.tsx` | Modifier |
| `src/app/legal/loi25/page.tsx` | Créer |
| `src/app/legal/rgpd/page.tsx` | Remplacer par redirection |
| `data-pipeline/tests/test_score.py` | Créer |

---

## Task 1 : Fixtures québécoises

**Files:**
- Modify: `data-pipeline/fixtures/cadastre_mock.csv`
- Create: `data-pipeline/fixtures/transactions_mock.csv`
- Create: `data-pipeline/fixtures/req_mock.csv`

- [ ] **Step 1.1 — Réécrire cadastre_mock.csv**

Remplace le contenu entier par des données style Québec. Les champs `annee_construction`, `type_immeuble`, `nb_logements`, `evaluation_municipale` viennent du cadastre local (l'API MAMH fournit l'adresse et les coords, le cadastre mock enrichit avec l'évaluation et le type).

```csv
code_postal,adresse,annees_detention,annee_construction,type_immeuble,nb_logements,evaluation_municipale
H2S 1X3,1425 RUE BÉLANGER,18,1955,Duplex,2,285000
H2S 2P4,6782 AV DE CHATEAUBRIAND,7,1948,Triplex,3,340000
H2G 1N6,3589 RUE MASSON,22,1962,Maison unifamiliale,1,420000
H2J 3A2,4201 RUE SAINT-DENIS,31,1938,Quadruplex,4,520000
H2T 1W8,5544 BD SAINT-LAURENT,5,1971,Condo,1,310000
H3H 1S4,2209 RUE SAINTE-CATHERINE O,14,1945,Quintuplex,5,610000
H2H 2A3,4875 RUE ADAM,9,1983,Maison unifamiliale,1,380000
H1V 1J1,5120 RUE SHERBROOKE E,26,1953,Triplex,3,295000
```

- [ ] **Step 1.2 — Créer transactions_mock.csv**

```csv
code_postal,adresse,prix_transaction,annee_transaction
H2S 1X3,1425 RUE BÉLANGER,320000,2023
H2S 2P4,6782 AV DE CHATEAUBRIAND,395000,2022
H2G 1N6,3589 RUE MASSON,450000,2024
H2J 3A2,4201 RUE SAINT-DENIS,580000,2021
H2T 1W8,5544 BD SAINT-LAURENT,340000,2023
H3H 1S4,2209 RUE SAINTE-CATHERINE O,720000,2022
H2H 2A3,4875 RUE ADAM,415000,2024
H1V 1J1,5120 RUE SHERBROOKE E,310000,2023
```

- [ ] **Step 1.3 — Créer req_mock.csv**

```csv
code_postal,adresse,is_societe,nom_societe
H2S 1X3,1425 RUE BÉLANGER,False,
H2S 2P4,6782 AV DE CHATEAUBRIAND,True,GESTIONS LES TERRASSES INC.
H2G 1N6,3589 RUE MASSON,False,
H2J 3A2,4201 RUE SAINT-DENIS,True,PLACEMENTS MASSON LTÉE
H2T 1W8,5544 BD SAINT-LAURENT,False,
H3H 1S4,2209 RUE SAINTE-CATHERINE O,True,IMMEUBLES STE-CATHERINE INC.
H2H 2A3,4875 RUE ADAM,False,
H1V 1J1,5120 RUE SHERBROOKE E,False,
```

- [ ] **Step 1.4 — Supprimer les anciens fichiers mock France**

```bash
git rm data-pipeline/fixtures/dvf_mock.csv
git rm data-pipeline/fixtures/rne_mock.csv
```

- [ ] **Step 1.5 — Commit**

```bash
git add data-pipeline/fixtures/
git commit -m "feat(fixtures): remplace mocks France par données Québec"
```

---

## Task 2 : Migration Supabase 0003

**Files:**
- Create: `supabase/migrations/0003_quebec_schema.sql`

- [ ] **Step 2.1 — Créer la migration**

```sql
-- Migration 0003: adaptation schéma Québec

-- Renommer les colonnes France en colonnes Québec
alter table prospects rename column etiquette_dpe to annee_construction;
alter table prospects alter column annee_construction type integer using annee_construction::integer;

alter table prospects rename column is_sci_familiale to is_societe;

alter table prospects rename column plus_value_pct to ratio_evaluation_marche;

-- Ajouter les nouvelles colonnes Québec
alter table prospects
  add column if not exists evaluation_municipale numeric,
  add column if not exists type_immeuble         text,
  add column if not exists nb_logements          integer;
```

- [ ] **Step 2.2 — Appliquer la migration en local ou via Supabase MCP**

Si CLI Supabase disponible :
```bash
supabase db push
```

Si via le MCP Supabase, exécuter le contenu de la migration via `apply_migration`.

- [ ] **Step 2.3 — Vérifier les colonnes**

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'prospects'
order by ordinal_position;
```

Colonnes attendues : `annee_construction` (integer), `is_societe` (boolean ou text), `ratio_evaluation_marche` (numeric), `evaluation_municipale` (numeric), `type_immeuble` (text), `nb_logements` (integer).

- [ ] **Step 2.4 — Commit**

```bash
git add supabase/migrations/0003_quebec_schema.sql
git commit -m "feat(db): migration schema Quebec (annee_construction, is_societe, ratio_evaluation_marche)"
```

---

## Task 3 : Pipeline — réécriture de ingest.py

**Files:**
- Modify: `data-pipeline/scripts/ingest.py`
- Create: `data-pipeline/tests/test_score.py`

- [ ] **Step 3.1 — Écrire le test pour score_row avant d'implémenter**

Créer `data-pipeline/tests/test_score.py` :

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from ingest import score_row

def test_batiment_pre_1960():
    row = {"annee_construction": 1955, "annees_detention": 5, "ratio_evaluation_marche": 1.0, "is_societe": False, "nb_logements": 1}
    assert score_row(row) == 40

def test_detention_longue():
    row = {"annee_construction": 1990, "annees_detention": 20, "ratio_evaluation_marche": 1.0, "is_societe": False, "nb_logements": 1}
    assert score_row(row) == 25

def test_ratio_eleve():
    row = {"annee_construction": 1990, "annees_detention": 5, "ratio_evaluation_marche": 1.5, "is_societe": False, "nb_logements": 1}
    assert score_row(row) == 15

def test_societe():
    row = {"annee_construction": 1990, "annees_detention": 5, "ratio_evaluation_marche": 1.0, "is_societe": True, "nb_logements": 1}
    assert score_row(row) == 10

def test_plex():
    row = {"annee_construction": 1990, "annees_detention": 5, "ratio_evaluation_marche": 1.0, "is_societe": False, "nb_logements": 3}
    assert score_row(row) == 10

def test_score_plafonne_a_100():
    row = {"annee_construction": 1950, "annees_detention": 20, "ratio_evaluation_marche": 1.5, "is_societe": True, "nb_logements": 4}
    assert score_row(row) == 100

def test_aucun_signal():
    row = {"annee_construction": 2010, "annees_detention": 3, "ratio_evaluation_marche": 0.9, "is_societe": False, "nb_logements": 1}
    assert score_row(row) == 0
```

- [ ] **Step 3.2 — Vérifier que les tests échouent (score_row n'est pas encore reécrit)**

```bash
cd data-pipeline
python -m pytest tests/test_score.py -v
```

Résultat attendu : FAILED (AssertionError — l'ancienne logique DPE retourne des valeurs incorrectes).

- [ ] **Step 3.3 — Réécrire ingest.py complet**

Remplacer le contenu entier de `data-pipeline/scripts/ingest.py` :

```python
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
    eval_col = df.get("evaluation_municipale") if "evaluation_municipale" in df.columns else None
    prix_col = df.get("prix_transaction") if "prix_transaction" in df.columns else None
    if eval_col is not None and prix_col is not None:
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
```

- [ ] **Step 3.4 — Lancer les tests**

```bash
cd data-pipeline
python -m pytest tests/test_score.py -v
```

Résultat attendu :
```
PASSED test_batiment_pre_1960
PASSED test_detention_longue
PASSED test_ratio_eleve
PASSED test_societe
PASSED test_plex
PASSED test_score_plafonne_a_100
PASSED test_aucun_signal
7 passed
```

- [ ] **Step 3.5 — Commit**

```bash
git add data-pipeline/scripts/ingest.py data-pipeline/tests/test_score.py
git commit -m "feat(pipeline): refactorise ingest.py pour sources Quebec (MAMH, REQ, scoring sans DPE)"
```

---

## Task 4 : Dashboard — KPIs et requête

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 4.1 — Mettre à jour le type ProspectRow**

Dans `dashboard/page.tsx`, remplacer :

```ts
type ProspectRow = {
  id: string;
  adresse: string | null;
  code_postal: string | null;
  score: number | null;
  etiquette_dpe: string | null;
  statut: string | null;
};
```

par :

```ts
type ProspectRow = {
  id: string;
  adresse: string | null;
  code_postal: string | null;
  score: number | null;
  annee_construction: number | null;
  statut: string | null;
};
```

- [ ] **Step 4.2 — Mettre à jour la locale fr-FR → fr-CA**

Remplacer en haut du fichier :
```ts
function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}
```
par :
```ts
function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-CA").format(value);
}
```

- [ ] **Step 4.2b — Mettre à jour la requête Supabase principale**

Remplacer :
```ts
.select("id, adresse, code_postal, score, etiquette_dpe, statut")
```
par :
```ts
.select("id, adresse, code_postal, score, annee_construction, statut")
```

- [ ] **Step 4.3b — Mettre à jour la requête chartData**

Remplacer :
```ts
.select("etiquette_dpe, statut, score")
```
par :
```ts
.select("annee_construction, statut, score")
```

- [ ] **Step 4.4 — Mettre à jour le calcul du KPI dpeFG**

Remplacer :
```ts
const dpeFG = rows.filter((row) => ["F", "G"].includes((row.etiquette_dpe ?? "").toUpperCase())).length;
```
par :
```ts
const pre1960 = rows.filter((row) => (row.annee_construction ?? Infinity) <= 1960).length;
```

- [ ] **Step 4.5 — Mettre à jour les labels KPI dans le JSX**

Remplacer le bloc KPI "DPE F / G" :
```tsx
<div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
  <p className="text-sm text-neutral-500">Bâtiments pré-1960</p>
  <p className="mt-3 text-3xl font-semibold text-neutral-950">
    {formatNumber(pre1960)}
  </p>
  <p className="mt-2 text-xs text-neutral-500">
    Opportunités de rénovation à prioriser
  </p>
</div>
```

Et remplacer "Prospects visibles" par "Propriétés visibles" :
```tsx
<p className="text-sm text-neutral-500">Propriétés visibles</p>
```

- [ ] **Step 4.6 — Mettre à jour la colonne DPE dans le tableau top prospects**

Remplacer l'en-tête et la cellule DPE :
```tsx
<th className="px-5 py-3 font-medium">Construit en</th>
```
```tsx
<td className="px-5 py-4 text-neutral-600">
  {prospect.annee_construction ?? "—"}
</td>
```

- [ ] **Step 4.7 — Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(dashboard): remplace KPI DPE par batiments pre-1960, adapte requetes Quebec"
```

---

## Task 5 : Type ProspectListItem + requête prospects

**Files:**
- Modify: `src/app/(app)/prospects/page.tsx`

- [ ] **Step 5.1 — Mettre à jour le type ProspectListItem**

Remplacer :
```ts
export type ProspectListItem = {
  id: string;
  adresse: string | null;
  code_postal: string | null;
  score: number | null;
  etiquette_dpe: string | null;
  statut: string | null;
  latitude: number | null;
  longitude: number | null;
};
```
par :
```ts
export type ProspectListItem = {
  id: string;
  adresse: string | null;
  code_postal: string | null;
  score: number | null;
  annee_construction: number | null;
  statut: string | null;
  latitude: number | null;
  longitude: number | null;
};
```

- [ ] **Step 5.2 — Mettre à jour la requête Supabase**

Remplacer :
```ts
.select("id, adresse, code_postal, score, etiquette_dpe, statut, latitude, longitude")
```
par :
```ts
.select("id, adresse, code_postal, score, annee_construction, statut, latitude, longitude")
```

- [ ] **Step 5.3 — Commit**

```bash
git add src/app/\(app\)/prospects/page.tsx
git commit -m "feat(prospects): mise a jour type ProspectListItem et requete pour colonnes Quebec"
```

---

## Task 6 : ProspectsTable — colonnes et export CSV

**Files:**
- Modify: `src/components/prospects-table.tsx`

- [ ] **Step 6.1 — Mettre à jour SortKey et les headers triables**

Remplacer :
```ts
type SortKey = "adresse" | "code_postal" | "score" | "etiquette_dpe" | "statut";
```
par :
```ts
type SortKey = "adresse" | "code_postal" | "score" | "annee_construction" | "statut";
```

Remplacer le tableau `sortableHeaders` :
```ts
const sortableHeaders: Array<{ key: SortKey; label: string }> = [
  { key: "adresse", label: "Adresse" },
  { key: "code_postal", label: "CP" },
  { key: "score", label: "Score" },
  { key: "annee_construction", label: "Construit en" },
  { key: "statut", label: "Pipeline" },
];
```

- [ ] **Step 6.2 — Mettre à jour exportCsv**

Remplacer :
```ts
const headers = ["id", "adresse", "code_postal", "score", "etiquette_dpe", "statut"];
const rows = prospects.map((p) =>
  [p.id, p.adresse ?? "", p.code_postal ?? "", p.score ?? "", p.etiquette_dpe ?? "", p.statut ?? ""]
```
par :
```ts
const headers = ["id", "adresse", "code_postal", "score", "annee_construction", "statut"];
const rows = prospects.map((p) =>
  [p.id, p.adresse ?? "", p.code_postal ?? "", p.score ?? "", p.annee_construction ?? "", p.statut ?? ""]
```

- [ ] **Step 6.3 — Mettre à jour la cellule DPE dans le tbody**

Remplacer :
```tsx
<td className="px-5 py-4 text-neutral-600">{prospect.etiquette_dpe ?? "—"}</td>
```
par :
```tsx
<td className="px-5 py-4 text-neutral-600">{prospect.annee_construction ?? "—"}</td>
```

- [ ] **Step 6.4 — Commit**

```bash
git add src/components/prospects-table.tsx
git commit -m "feat(table): remplace colonne DPE par annee_construction"
```

---

## Task 7 : Fiche prospect — ProspectDetailPage

**Files:**
- Modify: `src/app/(app)/prospects/[id]/page.tsx`

- [ ] **Step 7.1 — Mettre à jour le type ProspectDetail**

Remplacer :
```ts
type ProspectDetail = {
  id: string;
  adresse: string | null;
  code_postal: string | null;
  score: number | null;
  etiquette_dpe: string | null;
  statut: string | null;
  notes: string | null;
  source: string | null;
  type_bien: string | null;
  latitude: number | null;
  longitude: number | null;
};
```
par :
```ts
type ProspectDetail = {
  id: string;
  adresse: string | null;
  code_postal: string | null;
  score: number | null;
  annee_construction: number | null;
  evaluation_municipale: number | null;
  type_immeuble: string | null;
  nb_logements: number | null;
  statut: string | null;
  notes: string | null;
  source: string | null;
  type_bien: string | null;
  latitude: number | null;
  longitude: number | null;
};
```

- [ ] **Step 7.2 — Mettre à jour la requête select**

Remplacer la liste des colonnes dans `.select(...)` :
```ts
.select(`
  id,
  adresse,
  code_postal,
  score,
  annee_construction,
  evaluation_municipale,
  type_immeuble,
  nb_logements,
  statut,
  notes,
  source,
  type_bien,
  latitude,
  longitude
`)
```

- [ ] **Step 7.3 — Remplacer le badge DPE dans le header de la fiche**

Remplacer :
```tsx
<span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
  DPE {prospect.etiquette_dpe ?? "—"}
</span>
```
par :
```tsx
<span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
  Construit en {prospect.annee_construction ?? "—"}
</span>
```

- [ ] **Step 7.4 — Mettre à jour la section Signaux**

Remplacer le bloc de la grille des signaux (`<div className="mt-4 grid gap-4 sm:grid-cols-2">`) par :
```tsx
<div className="mt-4 grid gap-4 sm:grid-cols-2">
  <div className="rounded-xl bg-neutral-50 p-4">
    <p className="text-sm text-neutral-500">Score</p>
    <p className="mt-2 text-2xl font-semibold text-neutral-950">
      {prospect.score ?? "—"}
    </p>
  </div>

  <div className="rounded-xl bg-neutral-50 p-4">
    <p className="text-sm text-neutral-500">Année de construction</p>
    <p className="mt-2 text-2xl font-semibold text-neutral-950">
      {prospect.annee_construction ?? "—"}
    </p>
  </div>

  <div className="rounded-xl bg-neutral-50 p-4">
    <p className="text-sm text-neutral-500">Évaluation municipale</p>
    <p className="mt-2 text-xl font-semibold text-neutral-950">
      {prospect.evaluation_municipale
        ? new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(prospect.evaluation_municipale)
        : "—"}
    </p>
  </div>

  <div className="rounded-xl bg-neutral-50 p-4">
    <p className="text-sm text-neutral-500">Type d'immeuble</p>
    <p className="mt-2 text-xl font-semibold text-neutral-950">
      {prospect.type_immeuble ?? "—"}
      {prospect.nb_logements ? ` · ${prospect.nb_logements} log.` : ""}
    </p>
  </div>

  <div className="rounded-xl bg-neutral-50 p-4">
    <p className="text-sm text-neutral-500">Coordonnées</p>
    <p className="mt-2 text-sm font-medium text-neutral-900">
      {prospect.latitude ?? "—"}, {prospect.longitude ?? "—"}
    </p>
  </div>
</div>
```

- [ ] **Step 7.5 — Commit**

```bash
git add "src/app/(app)/prospects/[id]/page.tsx"
git commit -m "feat(prospect-detail): remplace signaux DPE par annee_construction et evaluation municipale"
```

---

## Task 8 : DashboardCharts — graphique par décennie de construction

**Files:**
- Modify: `src/components/dashboard-charts.tsx`

- [ ] **Step 8.1 — Réécrire dashboard-charts.tsx**

Remplacer le contenu entier du fichier :

```tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Props = {
  prospects: Array<{
    annee_construction: number | null;
    statut: string | null;
    score: number | null;
  }>;
};

const DECADE_BUCKETS = [
  { label: "Pré-1960", color: "#ef4444", test: (y: number) => y <= 1960 },
  { label: "1960–1979", color: "#f97316", test: (y: number) => y >= 1961 && y <= 1979 },
  { label: "1980–1999", color: "#eab308", test: (y: number) => y >= 1980 && y <= 1999 },
  { label: "2000+", color: "#10b981", test: (y: number) => y >= 2000 },
];

const STATUT_ORDER = ["découvert", "contacté", "rdv", "mandat signé"];
const STATUT_LABELS: Record<string, string> = {
  "découvert": "Découvert",
  "contacté": "Contacté",
  "rdv": "RDV",
  "mandat signé": "Signé",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-neutral-900">{label}</p>
      <p className="text-neutral-600">{payload[0].value} propriété{payload[0].value > 1 ? "s" : ""}</p>
    </div>
  );
}

export default function DashboardCharts({ prospects }: Props) {
  const decadeData = DECADE_BUCKETS.map(({ label, color, test }) => ({
    label,
    color,
    count: prospects.filter((p) => p.annee_construction != null && test(p.annee_construction)).length,
  })).filter((d) => d.count > 0);

  const statutData = STATUT_ORDER.map((s) => ({
    label: STATUT_LABELS[s],
    count: prospects.filter((p) => (p.statut ?? "découvert") === s).length,
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950">Année de construction</h2>
        <p className="mt-1 text-sm text-neutral-500">Propriétés par période de construction</p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={decadeData} barCategoryGap="30%">
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {decadeData.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950">État du pipeline</h2>
        <p className="mt-1 text-sm text-neutral-500">Propriétés par étape commerciale</p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statutData} barCategoryGap="30%">
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#171717" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2 — Commit**

```bash
git add src/components/dashboard-charts.tsx
git commit -m "feat(charts): remplace graphique DPE par distribution par decennie de construction"
```

---

## Task 9 : Homepage — signaux, exemple, trust items, FAQ

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 9.1 — Mettre à jour trustItems, signals et faqs**

En haut du fichier, remplacer les constantes :

```tsx
const trustItems = ["Courtiers locaux", "Prospection ciblée", "Supabase sécurisé", "Pipeline exploitable"];

const signals = [
  "Année de construction",
  "Années de détention",
  "Adresse et zone ciblée",
  "Score de priorité",
];

const faqs = [
  {
    q: "À qui s'adresse Mandat Finder ?",
    a: "Aux agences de courtage qui veulent détecter plus vite les propriétés à potentiel et structurer leur prospection sans se perdre dans des fichiers bruts.",
  },
  {
    q: "Est-ce un CRM complet ?",
    a: "Non, l'objectif premier est d'identifier, comprendre et qualifier les opportunités avant ou au début du suivi commercial.",
  },
  {
    q: "Comment les propriétés sont-elles priorisées ?",
    a: "La plateforme combine plusieurs signaux : l'année de construction, la zone, l'ancienneté de détention et un score de priorité lisible.",
  },
  {
    q: "Peut-on commencer petit ?",
    a: "Oui, tu peux démarrer sur un seul code postal québécois, puis élargir le périmètre au fur et à mesure.",
  },
];
```

- [ ] **Step 9.2 — Mettre à jour la carte exemple hero**

Localiser le bloc "Vue synthèse" (autour de la ligne 121 dans l'original) et remplacer :
```tsx
<p className="mt-1 text-2xl font-semibold text-neutral-950">Villeurbanne · 69100</p>
```
par :
```tsx
<p className="mt-1 text-2xl font-semibold text-neutral-950">Rosemont · H2S 1X3</p>
```

Remplacer le bloc de la grille des 4 signaux dans la carte :
```tsx
<div className="rounded-xl bg-white p-4">
  <p className="text-xs text-neutral-500">Construit en</p>
  <p className="mt-2 text-xl font-semibold text-neutral-950">1958</p>
</div>
<div className="rounded-xl bg-white p-4">
  <p className="text-xs text-neutral-500">Statut</p>
  <p className="mt-2 text-xl font-semibold text-neutral-950">Contact à lancer</p>
</div>
<div className="rounded-xl bg-white p-4">
  <p className="text-xs text-neutral-500">Zone</p>
  <p className="mt-2 text-xl font-semibold text-neutral-950">Active</p>
</div>
<div className="rounded-xl bg-white p-4">
  <p className="text-xs text-neutral-500">Détention</p>
  <p className="mt-2 text-xl font-semibold text-neutral-950">14 ans</p>
</div>
```

- [ ] **Step 9.3 — Mettre à jour l'exemple Villeurbanne**

Localiser le bloc `id="exemple"` et remplacer :
```tsx
<p className="text-sm font-medium text-neutral-500">Exemple Rosemont</p>
<h2 className="mt-2 text-2xl font-semibold text-neutral-950">
  Un test local, concret et rapide à comprendre.
</h2>
<p className="mt-4 text-sm leading-6 text-neutral-600">
  L'agence de courtage active H2S, affiche les propriétés scorées, visualise les adresses
  sur la carte, puis traite les biens chauds en priorité. Le but n'est pas de tout prédire,
  mais d'aider l'équipe à mieux décider où appeler en premier.
</p>
```

- [ ] **Step 9.4 — Mettre à jour les témoignages**

Remplacer le tableau des témoignages :
```tsx
{[
  {
    name: "Agence de courtage pilote",
    quote:
      "On comprend enfin pourquoi une adresse remonte et quoi faire ensuite. L'outil aide à prioriser sans compliquer le travail.",
  },
  {
    name: "Courtier responsable de la prospection",
    quote:
      "La carte et le statut pipeline rendent la base beaucoup plus actionnable qu'un simple export brut.",
  },
  {
    name: "Direction commerciale",
    quote:
      "Le gain, c'est la clarté: moins de dispersion, plus de focus sur les opportunités crédibles.",
  },
].map(...)}
```

- [ ] **Step 9.5 — Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(homepage): adapte signaux, exemples et FAQ pour marche quebecois"
```

---

## Task 10 : Layout — terminologie de courtage

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 10.1 — Mettre à jour les labels sidebar**

Remplacer :
```tsx
<p className="mt-1 text-sm text-neutral-500">
  Espace agence
</p>
```
par :
```tsx
<p className="mt-1 text-sm text-neutral-500">
  Espace de courtage
</p>
```

Dans le header mobile, remplacer :
```tsx
<p className="text-sm font-medium text-neutral-900">
  Espace agence
</p>
<p className="text-xs text-neutral-500">
  Prospection immobilière ciblée
</p>
```
par :
```tsx
<p className="text-sm font-medium text-neutral-900">
  Espace de courtage
</p>
<p className="text-xs text-neutral-500">
  Prospection immobilière ciblée
</p>
```

- [ ] **Step 10.2 — Commit**

```bash
git add "src/app/(app)/layout.tsx"
git commit -m "feat(layout): espace agence devient espace de courtage"
```

---

## Task 11 : StepRail — étiquettes

**Files:**
- Modify: `src/components/motion/step-rail.tsx`

- [ ] **Step 11.1 — Mettre à jour les étapes**

Remplacer la constante `STEPS` :

```tsx
const STEPS = [
  { num: "01", label: "Définir les zones à suivre." },
  { num: "02", label: "Injecter les données foncières." },
  { num: "03", label: "Scorer et prioriser les propriétés." },
  { num: "04", label: "Faire avancer le pipeline." },
];
```

- [ ] **Step 11.2 — Commit**

```bash
git add src/components/motion/step-rail.tsx
git commit -m "feat(step-rail): adapte etiquettes etapes pour vocabulaire Quebec"
```

---

## Task 12 : Mentions légales — contenu Québec

**Files:**
- Modify: `src/app/mentions-legales/page.tsx`

- [ ] **Step 12.1 — Réécrire mentions-legales/page.tsx**

Remplacer le contenu entier :

```tsx
export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Mentions légales
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Dernière mise à jour : mai 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-neutral-700">
        <section>
          <h2 className="text-base font-semibold text-neutral-950">Éditeur du site</h2>
          <p className="mt-2">
            Mandat Finder est un outil de prospection immobilière édité à titre professionnel
            à l'intention des agences de courtage membres de l'OACIQ.
            Pour toute question, contactez-nous à :{" "}
            <a href="mailto:contact@mandat-finder.ca" className="underline">
              contact@mandat-finder.ca
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Hébergement</h2>
          <p className="mt-2">
            Le site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street, Suite 701,
            San Francisco, CA 94104, États-Unis.
          </p>
          <p className="mt-1">
            La base de données est hébergée par <strong>Supabase</strong> sur infrastructure
            AWS (région Canada ou États-Unis selon disponibilité).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Propriété intellectuelle</h2>
          <p className="mt-2">
            L'ensemble du contenu de ce site (textes, interfaces, code) est la propriété exclusive
            de l'éditeur. Toute reproduction, même partielle, est interdite sans autorisation écrite
            préalable.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Données personnelles</h2>
          <p className="mt-2">
            Le traitement des renseignements personnels est décrit dans notre{" "}
            <a href="/legal/loi25" className="underline">
              politique de confidentialité (Loi 25)
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Témoins (cookies)</h2>
          <p className="mt-2">
            Ce site utilise uniquement des témoins techniques nécessaires à l'authentification.
            Aucun témoin publicitaire ou de traçage tiers n'est déposé.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Sources des données immobilières</h2>
          <p className="mt-2">
            Les données affichées proviennent de registres publics (rôle d'évaluation foncière
            municipale — MAMH, Registre des entreprises du Québec — REQ) et sont fournies à titre
            indicatif pour les courtiers membres de l'OACIQ. L'éditeur ne garantit pas leur
            exhaustivité ni leur exactitude absolue.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">Limitation de responsabilité</h2>
          <p className="mt-2">
            L'utilisation des informations présentées relève de la responsabilité exclusive du
            courtier. Mandat Finder est un outil d'aide à la décision, non un service de conseil
            juridique ou financier.
          </p>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 12.2 — Commit**

```bash
git add src/app/mentions-legales/page.tsx
git commit -m "feat(legal): mentions legales adaptees pour Quebec (OACIQ, MAMH, REQ)"
```

---

## Task 13 : Politique de confidentialité — Loi 25

**Files:**
- Create: `src/app/legal/loi25/page.tsx`
- Modify: `src/app/legal/rgpd/page.tsx` (remplacer par redirection)

- [ ] **Step 13.1 — Créer src/app/legal/loi25/page.tsx**

```tsx
export default function Loi25Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Politique de confidentialité — Loi 25
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Dernière mise à jour : mai 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-neutral-700">
        <section>
          <h2 className="text-base font-semibold text-neutral-950">1. Responsable du traitement</h2>
          <p className="mt-2">
            Mandat Finder est édité à titre professionnel par son propriétaire, conformément à la
            Loi modernisant des dispositions législatives en matière de protection des renseignements
            personnels (Loi 25). Pour toute question relative à vos renseignements personnels,
            contactez-nous à{" "}
            <a href="mailto:contact@mandat-finder.ca" className="underline">
              contact@mandat-finder.ca
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">2. Renseignements collectés</h2>
          <p className="mt-2">
            Nous collectons uniquement les renseignements nécessaires au fonctionnement du service :
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Adresse courriel et informations de connexion (authentification)</li>
            <li>Données d'usage de l'application (pages visitées, actions effectuées)</li>
            <li>
              Données immobilières issues de registres publics (rôle d'évaluation foncière
              municipale — MAMH, Registre des entreprises du Québec — REQ) utilisées à des fins
              de prospection professionnelle
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">3. Fondement juridique</h2>
          <p className="mt-2">
            Le traitement repose sur l'intérêt légitime de l'éditeur (prospection immobilière
            professionnelle à partir de registres publics) et sur l'exécution du contrat de service
            pour les données de compte, conformément à la Loi 25.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">4. Conservation des renseignements</h2>
          <p className="mt-2">
            Les données de compte sont conservées pendant la durée d'activité du compte, puis
            supprimées dans un délai de 30 jours suivant la résiliation. Les données de prospection
            issues des registres publics sont mises à jour régulièrement et ne constituent pas des
            renseignements personnels au sens de la Loi 25.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">5. Vos droits</h2>
          <p className="mt-2">
            Conformément à la Loi 25, vous disposez d'un droit d'accès, de rectification et de
            suppression de vos renseignements personnels. Pour exercer ces droits, contactez-nous
            par courriel. Vous pouvez également adresser une plainte à la Commission d'accès à
            l'information du Québec (CAI) :{" "}
            <a href="https://www.cai.gouv.qc.ca" className="underline">
              www.cai.gouv.qc.ca
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-neutral-950">6. Sous-traitants</h2>
          <p className="mt-2">
            Nous utilisons Supabase pour le stockage des données et Vercel pour l'hébergement de
            l'application. Ces prestataires sont assujettis à des ententes de confidentialité
            compatibles avec nos obligations sous la Loi 25.
          </p>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 13.2 — Remplacer rgpd/page.tsx par une redirection 301**

```tsx
import { redirect } from "next/navigation";

export default function RgpdRedirectPage() {
  redirect("/legal/loi25");
}
```

- [ ] **Step 13.3 — Commit**

```bash
git add src/app/legal/loi25/page.tsx src/app/legal/rgpd/page.tsx
git commit -m "feat(legal): politique de confidentialite Loi 25 (CAI), redirection depuis /legal/rgpd"
```

---

## Vérification finale

- [ ] Lancer `npm run build` et vérifier zéro erreur TypeScript
- [ ] Lancer `npm run dev` et vérifier :
  - Homepage : "Rosemont · H2S 1X3", signaux Québec, trust items "Courtiers locaux"
  - Dashboard : KPI "Bâtiments pré-1960", colonne "Construit en" dans le tableau top prospects
  - Liste prospects : colonne "Construit en" triable
  - Fiche prospect : champs "Année de construction" et "Évaluation municipale"
  - Graphique dashboard : buckets par décennie, plus de lettres DPE
  - `/legal/loi25` : page Loi 25 visible
  - `/legal/rgpd` : redirige vers `/legal/loi25`
  - `/mentions-legales` : mentions OACIQ, MAMH, REQ, contact .ca
- [ ] Commit final si ajustements mineurs

```bash
git add -A
git commit -m "chore: verification finale adaptation Quebec"
```
