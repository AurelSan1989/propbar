# Mise en ligne du site sur son vrai nom de domaine.
#
# Fait en une fois tout ce qui sépare la version de test (GitHub Pages,
# fermée aux moteurs) de la version publique :
#   1. remplace le marqueur TODO-DOMAINE et l'adresse de test GitHub par le
#      vrai domaine (balises canoniques, aperçu de partage, données
#      structurées, sitemap) ;
#   2. ancre la page 404 à la racine du site (<base href="/">) ;
#   3. ouvre robots.txt aux moteurs et y déclare le sitemap ;
#   4. retire les balises noindex des pages publiques (la 404 garde la
#      sienne : elle ne doit jamais apparaître dans Google) ;
#   5. vérifie qu'il ne reste rien de la version de test.
#
# Usage, depuis la racine du projet (PowerShell) :
#   .\outils\mise-en-ligne.ps1 -Domaine limponderable.fr -Simulation   # montre sans rien écrire
#   .\outils\mise-en-ligne.ps1 -Domaine limponderable.fr               # applique
#
# Si Windows refuse d'exécuter le script (« l'exécution de scripts est
# désactivée ») :
#   powershell -ExecutionPolicy Bypass -File .\outils\mise-en-ligne.ps1 -Domaine limponderable.fr
#
# À lancer une seule fois, puis committer le résultat.

param(
    [Parameter(Mandatory = $true)]
    [string]$Domaine,

    [switch]$Simulation
)

$ErrorActionPreference = "Stop"

# Le domaine seul, sans protocole ni barre finale : « limponderable.fr ».
$Domaine = $Domaine.Trim() -replace '^https?://', '' -replace '/+$', ''
if ($Domaine -notmatch '^[a-z0-9.-]+\.[a-z]{2,}$') {
    throw "Domaine invalide : « $Domaine ». Exemple attendu : limponderable.fr"
}

$racine = Split-Path -Parent $PSScriptRoot
Set-Location $racine

# Lecture et écriture en UTF-8 sans BOM : Set-Content -Encoding UTF8 de
# PowerShell 5.1 ajouterait un BOM en tête de chaque fichier.
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Lire($chemin) { [System.IO.File]::ReadAllText((Join-Path $racine $chemin), $utf8) }
function Ecrire($chemin, $texte) {
    if (-not $Simulation) { [System.IO.File]::WriteAllText((Join-Path $racine $chemin), $texte, $utf8) }
}

$pagesPubliques = @("index.html", "tarifs.html", "privatisation.html", "mentions-legales.html")
$fichiersDomaine = $pagesPubliques + @("404.html", "sitemap.xml")

Write-Host ""
Write-Host "Mise en ligne sur https://$Domaine/" -ForegroundColor Cyan
if ($Simulation) { Write-Host "SIMULATION : aucun fichier ne sera modifié." -ForegroundColor Yellow }
Write-Host ""

# 1. Domaine
foreach ($fichier in $fichiersDomaine) {
    $texte = Lire $fichier
    $nombre = ([regex]::Matches($texte, 'TODO-DOMAINE|aurelsan1989\.github\.io/propbar')).Count
    if ($nombre -gt 0) {
        $texte = $texte -replace 'TODO-DOMAINE', $Domaine -replace 'aurelsan1989\.github\.io/propbar', $Domaine
        # Cloudflare Pages sert les pages sans extension et redirige
        # /tarifs.html vers /tarifs (et /index.html vers /). Les adresses de
        # référence (canonical, og:url, sitemap, données structurées) doivent
        # viser l'adresse finale, pas une redirection. Les liens internes
        # relatifs restent en .html : ils marchent partout, au prix d'un
        # simple rebond.
        $d = [regex]::Escape($Domaine)
        $texte = $texte -replace "https://$d/index\.html", "https://$Domaine/"
        $texte = $texte -replace "(https://$d/[a-z0-9-]+)\.html", '$1'
        Ecrire $fichier $texte
        Write-Host ("  {0,-24} {1} adresse(s) remplacée(s)" -f $fichier, $nombre)
    }
}

# 2. Page 404 ancrée à la racine
$texte = Lire "404.html"
if ($texte -match '<base href="/propbar/">') {
    Ecrire "404.html" ($texte -replace '<base href="/propbar/">', '<base href="/">')
    Write-Host "  404.html                 <base href=""/"">"
}

# 3. robots.txt ouvert, avec le sitemap
$robots = @"
User-agent: *
Allow: /

Sitemap: https://$Domaine/sitemap.xml
"@
Ecrire "robots.txt" (($robots -replace "`r`n", "`n") + "`n")
Write-Host "  robots.txt               ouvert aux moteurs, sitemap déclaré"

# 4. noindex retiré des pages publiques
foreach ($fichier in $pagesPubliques) {
    $texte = Lire $fichier
    $nouveau = $texte -replace '[ \t]*<meta name="robots" content="noindex, nofollow">\r?\n', ''
    if ($nouveau -ne $texte) {
        Ecrire $fichier $nouveau
        Write-Host ("  {0,-24} noindex retiré" -f $fichier)
    }
}

# 5. Vérifications
if ($Simulation) {
    Write-Host ""
    Write-Host "Simulation terminée. Relancer sans -Simulation pour appliquer." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
$problemes = @()
foreach ($fichier in $fichiersDomaine + @("robots.txt")) {
    $texte = Lire $fichier
    # « /propbar/ » seul figure aussi dans un commentaire de la 404 : seule la
    # balise <base> compte.
    if ($texte -match 'TODO-DOMAINE|github\.io|<base href="/propbar/">') { $problemes += "$fichier contient encore une adresse de test" }
}
foreach ($fichier in $pagesPubliques) {
    if ((Lire $fichier) -match 'name="robots" content="noindex') { $problemes += "$fichier est encore en noindex" }
}
if ((Lire "404.html") -notmatch 'name="robots" content="noindex') { $problemes += "404.html a perdu son noindex" }

if ($problemes.Count -gt 0) {
    Write-Host "PROBLÈMES :" -ForegroundColor Red
    $problemes | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "Tout est en place." -ForegroundColor Green

# Ce que le script ne peut pas faire : le rappeler à chaque lancement.
if ((Lire "mentions-legales.html") -match 'TODO') {
    Write-Host ""
    Write-Host "À NE PAS OUBLIER : les mentions légales contiennent encore un TODO (médiateur ?)." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Étapes suivantes : committer, pousser, puis vérifier https://$Domaine/robots.txt"
