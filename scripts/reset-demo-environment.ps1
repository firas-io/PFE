# Reset complet : volumes Docker (Mongo + LDAP) puis re-seed LDAP + MongoDB
# Usage (depuis la racine du projet) :
#   powershell -ExecutionPolicy Bypass -File .\scripts\reset-demo-environment.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host ""
Write-Host "=== HabitFlow - Reset environnement demo ===" -ForegroundColor Cyan
Write-Host ""

Write-Host '[1/4] Arret des conteneurs et suppression des volumes Mongo + LDAP...' -ForegroundColor Yellow
docker compose down -v
if ($LASTEXITCODE -ne 0) { throw "docker compose down a echoue" }

Write-Host "[2/4] Demarrage des services..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) { throw "docker compose up a echoue" }

Write-Host "[3/4] Attente MongoDB + LDAP healthchecks..." -ForegroundColor Yellow
$maxWait = 90
$elapsed = 0
while ($elapsed -lt $maxWait) {
  $mongo = docker inspect -f "{{.State.Health.Status}}" habitflow-mongo 2>$null
  $ldap  = docker inspect -f "{{.State.Health.Status}}" habitflow-ldap 2>$null
  if ($mongo -eq "healthy" -and $ldap -eq "healthy") { break }
  Start-Sleep -Seconds 3
  $elapsed += 3
}
if ($elapsed -ge $maxWait) {
  Write-Host "   Attention : services pas encore healthy, on continue quand meme..." -ForegroundColor DarkYellow
}

Write-Host '[4/4] Seed MongoDB - 6 mois de donnees...' -ForegroundColor Yellow
$env:MONGO_URI = "mongodb://127.0.0.1:27018/habitflow"
Set-Location "$Root\backend"
node --import ./src/loader.js src/fixtures/seed-demo-data.js
if ($LASTEXITCODE -ne 0) { throw "seed-demo-data a echoue" }

Set-Location $Root
Write-Host ""
Write-Host "=== Termine ===" -ForegroundColor Green
Write-Host "Frontend : http://localhost:3000/login"
Write-Host "LDAP UI  : http://localhost:8080"
Write-Host ""
Write-Host "Comptes :" -ForegroundColor White
Write-Host '  admin@habitflow.local / Admin123!'
Write-Host '  sophie.martin@habitflow.local / Manager123!'
Write-Host '  karim.amine@habitflow.local / Manager123!'
Write-Host '  claire.dubois@habitflow.local / Manager123!'
Write-Host '  utilisateurs : email@habitflow.local / User123!'
Write-Host ""
