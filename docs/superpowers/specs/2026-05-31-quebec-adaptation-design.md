# Adaptation Québec — Design Spec

**Date :** 2026-05-31  
**Projet :** Mandat Finder  
**Portée :** Adaptation complète du projet pour le marché québécois. La version France était un prototype ; seule la version Québec sera exploitée en production.

---

## Contexte

Mandat Finder est une plateforme de prospection immobilière SaaS pour les agences de courtage. La version initiale ciblait la France (ADEME/DPE, DVF, RNE, codes postaux français, RGPD/CNIL). L'adaptation Québec remplace l'ensemble des sources de données, de la terminologie et du cadre légal directement dans le projet existant — pas de stratégie multi-marché.

---

## 1. Pipeline de données

### Sources remplacées

| Source France | Source Québec | Statut |
|---|---|---|
| ADEME API (DPE) | Open data Ville de Montréal — rôle d'évaluation foncière | Vraie API |
| Cadastre mock | Cadastre mock (données style Québec) | Mock → remplaçable |
| DVF mock (transactions) | Transactions mock (style Québec) | Mock → remplaçable |
| RNE mock → `fetch_rne()` | REQ — Registre des entreprises du Québec | Vraie API |

### Rôle d'évaluation foncière de Montréal

- **URL :** `https://donnees.montreal.ca/api/3/action/datastore_search` (CKAN open data)
- **Champs utilisés :** `ANNEE_CONSTRUCTION`, `CATEGORIE_UTILISATION`, `NOMBRE_LOGEMENTS`, `VALEUR_EVALUATION`, `ADRESSE`, `CODE_POSTAL`
- Paramètre d'entrée : `CODE_POSTAL` (format canadien `A1A 1A1`)
- Remplace `fetch_dpe()` — renommé `fetch_evaluation_fonciere()`

### REQ — Registre des entreprises du Québec

- **URL :** `https://api.registreentreprises.gouv.qc.ca/` (API REST publique — URL à vérifier au moment de l'implémentation via données.gouv.qc.ca)
- Filtre sur adresse pour détecter les sociétés propriétaires
- Remplace `fetch_rne()` — renommé `fetch_req()`

### Fixtures mock mises à jour

- `data-pipeline/fixtures/cadastre_mock.csv` → données style Québec (adresses, codes postaux canadiens)
- `data-pipeline/fixtures/dvf_mock.csv` → renommé `transactions_mock.csv`, données style Québec
- `data-pipeline/fixtures/rne_mock.csv` → renommé `req_mock.csv`, données style Québec

### Nouveau scoring (remplace DPE F/G)

| Signal | Points | Logique |
|---|---|---|
| `annee_construction` ≤ 1960 | 40 | Équivalent fonctionnel du DPE F/G — bâtiments énergivores probables |
| `annees_detention` > 15 | 25 | Identique version France |
| `ratio_evaluation_marche` élevé (> 1.2) | 15 | Potentiel de négociation : évaluation municipale / prix transaction mock |
| Propriété détenue par société (REQ) | 10 | Identique à `is_sci_familiale` → `is_societe` |
| `type_immeuble` = plex (2–6 logements) | 10 | Signal fort de prospection au Québec |

Score plafonné à 100. Fonction `score_row()` mise à jour en conséquence.

---

## 2. Schéma Supabase

### Colonnes modifiées dans `prospects`

| Colonne France | Colonne Québec | Type |
|---|---|---|
| `etiquette_dpe` (text) | `annee_construction` (integer) | Renommée |
| — | `evaluation_municipale` (numeric) | Ajoutée |
| — | `type_immeuble` (text) | Ajoutée |
| — | `nb_logements` (integer) | Ajoutée |
| `is_sci_familiale` | `is_societe` | Renommée |
| `plus_value_pct` | renommée `ratio_evaluation_marche` (numeric) | Ratio entre `evaluation_municipale` et le prix de transaction mock |

Format `code_postal` : validé pour le format canadien (`A1A 1A1`).

### Migration requise

Une nouvelle migration `0003_quebec_schema.sql` :
- `ALTER TABLE prospects RENAME COLUMN etiquette_dpe TO annee_construction`
- `ALTER COLUMN annee_construction TYPE integer`
- `ALTER TABLE prospects RENAME COLUMN is_sci_familiale TO is_societe`
- `ADD COLUMN evaluation_municipale numeric`
- `ADD COLUMN type_immeuble text`
- `ADD COLUMN nb_logements integer`

### Schéma Pandera mis à jour

```python
PROSPECT_SCHEMA = DataFrameSchema({
    "code_postal":          Column(str, nullable=False),
    "adresse":              Column(str, nullable=False),
    "annee_construction":   Column(float, nullable=True),
    "annees_detention":     Column(float, nullable=True),
    "evaluation_municipale": Column(float, nullable=True),
    "type_immeuble":        Column(str, nullable=True),
    "nb_logements":         Column(float, nullable=True),
    "is_societe":           Column(object, nullable=True),
    "score":                Column(float, nullable=True),
})
```

---

## 3. Interface & terminologie

### Remplacement terminologique complet

| Terme France | Terme Québec |
|---|---|
| Agence immobilière | Agence de courtage |
| Agent immobilier | Courtier / Courtière |
| Mandat | Mandat (identique) |
| DPE F / G | Bâtiments pré-1960 |
| contact@mandat-finder.fr | contact@mandat-finder.ca |

### Exemples et géographie

- Exemple principal : **Rosemont · H2S 1X3** (Montréal, arrondissement avec plex pré-1960 typiques)
- Codes postaux : format canadien partout
- Locale : `fr-CA` (formatage nombres et dates)
- Dashboard card "DPE" → "Bâtiments pré-1960" (compte `annee_construction ≤ 1960`)
- Fiche prospect : champ "DPE" remplacé par "Année de construction"

### Homepage

**Signaux affichés (section "Signaux suivis") :**
- DPE F / G → Année de construction
- Années de détention → (identique)
- Adresse et zone ciblée → (identique)
- Score de priorité → (identique)

**Trust items :**
- "Agences locales" → "Courtiers locaux"
- Reste identique

**Carte exemple hero :**
```
Rosemont · H2S 1X3     Score 86
Construit en 1958      Statut: Contact à lancer
Zone: Active           Détention: 14 ans
```

**FAQ :** Langage adapté pour le Québec (courtier, agence de courtage, OACIQ mentionné si pertinent).

### KPIs dashboard

| KPI | Label Québec |
|---|---|
| Prospects visibles | Propriétés visibles |
| Biens chauds | Biens chauds (identique) |
| DPE F / G | Bâtiments pré-1960 |
| Déjà engagés | Déjà engagés (identique) |

### Pipeline statuts

Inchangés : `découvert → contacté → rdv → mandat signé` — valides au Québec.

---

## 4. Pages légales

### Politique de confidentialité — Loi 25

Route : `/legal/loi25` (remplace `/legal/rgpd`, redirection 301 depuis l'ancien chemin)

| Élément France | Élément Québec |
|---|---|
| RGPD | Loi 25 (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels) |
| CNIL | CAI (Commission d'accès à l'information du Québec) |
| www.cnil.fr | www.cai.gouv.qc.ca |
| Sources : ADEME, DVF | Sources : rôle d'évaluation foncière, REQ |
| contact@mandat-finder.fr | contact@mandat-finder.ca |

Base légale maintenue : intérêt légitime (reconnu sous Loi 25 pour la prospection professionnelle à partir de registres publics).

### Mentions légales

- Contact mis à jour : `contact@mandat-finder.ca`
- Hébergement Supabase : région `ca-central-1` si disponible (préférable pour données canadiennes), sinon `us-east-1`
- Ajout : mention de l'encadrement OACIQ — "Les données utilisées proviennent de registres publics (rôle d'évaluation foncière, REQ) et sont fournies à titre indicatif pour les courtiers membres de l'OACIQ."
- Sources de données mises à jour : ADEME/DVF → rôle d'évaluation foncière/REQ

---

## 5. Fichiers impactés — récapitulatif

### Pipeline Python
- `data-pipeline/scripts/ingest.py` — refonte complète (fetch, normalize, score)
- `data-pipeline/fixtures/cadastre_mock.csv` — données Québec
- `data-pipeline/fixtures/dvf_mock.csv` → renommé `transactions_mock.csv` ; `fetch_dvf()` → `fetch_transactions()`
- `data-pipeline/fixtures/rne_mock.csv` → renommé `req_mock.csv` ; `fetch_rne()` → `fetch_req()`

### Supabase
- `supabase/migrations/0003_quebec_schema.sql` — nouveau fichier

### Next.js
- `src/app/page.tsx` — homepage (signaux, exemple, trust items, FAQ)
- `src/app/(app)/dashboard/page.tsx` — KPIs, libellés
- `src/app/(app)/prospects/page.tsx` — colonnes tableau
- `src/app/(app)/prospects/[id]/page.tsx` — fiche prospect
- `src/components/prospects-table.tsx` — colonnes
- `src/components/dashboard-charts.tsx` — libellés graphiques
- `src/app/mentions-legales/page.tsx` — contenu Québec
- `src/app/legal/rgpd/page.tsx` → déplacé vers `src/app/legal/loi25/page.tsx`
- `src/components/motion/step-rail.tsx` — si contenu étapes hardcodé

---

## Hors portée

- Intégration Centris (données de transactions privées) — mock suffisant pour le lancement
- Support multi-ville hors Montréal — architecture prête, à étendre ville par ville
- Traduction anglaise — non requise, Québec francophone
- Changement de domaine effectif — hors portée code, à configurer dans Vercel/DNS
