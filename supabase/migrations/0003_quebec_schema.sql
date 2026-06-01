-- Migration 0003: adaptation schéma Québec

-- Renommer les colonnes France en colonnes Québec
-- Note: etiquette_dpe (text) is renamed to annee_construction
-- The actual type conversion happens in the data pipeline during import
alter table prospects rename column etiquette_dpe to annee_construction;

alter table prospects rename column is_sci_familiale to is_societe;

alter table prospects rename column plus_value_pct to ratio_evaluation_marche;

-- Ajouter les nouvelles colonnes Québec
alter table prospects
  add column if not exists evaluation_municipale numeric,
  add column if not exists type_immeuble         text,
  add column if not exists nb_logements          integer;
