# Ingestion complète des Laurentides — toutes les municipalités, sans géocodage
# Lance ensuite geocode_prospects.py pour géocoder en une seule session.
#
# Usage : cd data-pipeline ; .\scripts\ingest_laurentides.ps1

$municipalities = @(
    # MRC Thérèse-De Blainville
    @{ code = "73005"; nom = "Boisbriand" },
    @{ code = "73010"; nom = "Sainte-Thérèse" },
    @{ code = "73015"; nom = "Blainville" },
    @{ code = "73020"; nom = "Rosemère" },
    @{ code = "73025"; nom = "Lorraine" },
    @{ code = "73030"; nom = "Bois-des-Filion" },
    @{ code = "73035"; nom = "Sainte-Anne-des-Plaines" },
    # MRC Mirabel
    @{ code = "74005"; nom = "Mirabel" },
    # MRC La Rivière-du-Nord
    @{ code = "75005"; nom = "Saint-Colomban" },
    @{ code = "75017"; nom = "Saint-Jérôme" },
    @{ code = "75028"; nom = "Sainte-Sophie" },
    @{ code = "75040"; nom = "Prévost" },
    @{ code = "75045"; nom = "Saint-Hippolyte" },
    # MRC Argenteuil
    @{ code = "76008"; nom = "Saint-André-d'Argenteuil" },
    @{ code = "76020"; nom = "Lachute" },
    @{ code = "76025"; nom = "Gore" },
    @{ code = "76030"; nom = "Mille-Isles" },
    @{ code = "76035"; nom = "Wentworth" },
    @{ code = "76043"; nom = "Brownsburg-Chatham" },
    @{ code = "76052"; nom = "Grenville-sur-la-Rouge" },
    @{ code = "76055"; nom = "Grenville" },
    @{ code = "76065"; nom = "Harrington" },
    # MRC Les Laurentides
    @{ code = "78005"; nom = "Val-Morin" },
    @{ code = "78010"; nom = "Val-David" },
    @{ code = "78015"; nom = "Lantier" },
    @{ code = "78020"; nom = "Sainte-Lucie-des-Laurentides" },
    @{ code = "78032"; nom = "Sainte-Agathe-des-Monts" },
    @{ code = "78042"; nom = "Ivry-sur-le-Lac" },
    @{ code = "78047"; nom = "Mont-Blanc" },
    @{ code = "78050"; nom = "Barkmere" },
    @{ code = "78055"; nom = "Montcalm" },
    @{ code = "78060"; nom = "Arundel" },
    @{ code = "78065"; nom = "Huberdeau" },
    @{ code = "78070"; nom = "Amherst" },
    @{ code = "78075"; nom = "Brébeuf" },
    @{ code = "78095"; nom = "Lac-Supérieur" },
    @{ code = "78100"; nom = "Val-des-Lacs" },
    @{ code = "78102"; nom = "Mont-Tremblant" },
    @{ code = "78115"; nom = "La Conception" },
    @{ code = "78120"; nom = "Labelle" },
    @{ code = "78127"; nom = "Lac-Tremblant-Nord" },
    @{ code = "78130"; nom = "La Minerve" }
)

$total = $municipalities.Count
$ok    = 0
$fail  = 0

Write-Host ""
Write-Host "=== Ingestion Laurentides ($total municipalités) ===" -ForegroundColor Cyan
Write-Host "Mode : --no-geocode (géocodage séparé après)" -ForegroundColor DarkGray
Write-Host ""

foreach ($m in $municipalities) {
    Write-Host "[$($ok + $fail + 1)/$total] $($m.nom) ($($m.code))..." -NoNewline
    python scripts/ingest.py --zone "Laurentides" --code-geo $m.code --no-geocode
    if ($LASTEXITCODE -eq 0) {
        $ok++
        Write-Host " OK" -ForegroundColor Green
    } else {
        $fail++
        Write-Host " ERREUR (code $LASTEXITCODE)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Ingestion terminée : $ok OK, $fail erreurs ===" -ForegroundColor Cyan
Write-Host ""

if ($ok -gt 0) {
    Write-Host "Lance maintenant le géocodage :" -ForegroundColor Yellow
    Write-Host "  python scripts/geocode_prospects.py" -ForegroundColor White
}
