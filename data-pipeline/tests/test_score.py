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
