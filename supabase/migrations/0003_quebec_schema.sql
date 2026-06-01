-- Migration 0003: adaptation schéma Québec

-- Renommer les colonnes France en colonnes Québec
alter table prospects rename column etiquette_dpe to annee_construction;

-- Clear invalid data (old DPE ratings A-G) before type conversion
update prospects set annee_construction = null where annee_construction !~ '^\d+$';

-- Convert annee_construction to integer
alter table prospects alter column annee_construction type integer using annee_construction::integer;

alter table prospects rename column is_sci_familiale to is_societe;

alter table prospects rename column plus_value_pct to ratio_evaluation_marche;

-- Ajouter les nouvelles colonnes Québec
alter table prospects
  add column if not exists evaluation_municipale numeric,
  add column if not exists type_immeuble         text,
  add column if not exists nb_logements          integer;
