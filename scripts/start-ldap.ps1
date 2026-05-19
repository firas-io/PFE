# Starts Docker Desktop (if needed), OpenLDAP, and seeds test users.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Test-DockerReady {
  docker info 2>&1 | Out-Null
  return $LASTEXITCODE -eq 0
}

if (-not (Test-DockerReady)) {
  $dockerDesktop = @(
    "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
    "${env:LocalAppData}\Docker\Docker Desktop.exe"
  ) | Where-Object { Test-Path $_ } | Select-Object -First 1

  if (-not $dockerDesktop) {
    Write-Error "Docker Desktop not found. Install it from https://www.docker.com/products/docker-desktop/"
  }

  Write-Host "Starting Docker Desktop..."
  Start-Process $dockerDesktop
  for ($i = 1; $i -le 36; $i++) {
    if (Test-DockerReady) { break }
    Write-Host "  Waiting for Docker ($i/36)..."
    Start-Sleep -Seconds 10
  }
  if (-not (Test-DockerReady)) {
    Write-Error "Docker did not become ready in time."
  }
}

Write-Host "Starting OpenLDAP..."
docker compose up -d openldap
Start-Sleep -Seconds 5

Write-Host "Seeding LDAP users..."
docker compose up ldap-seed

$ok = (Test-NetConnection -ComputerName localhost -Port 389 -WarningAction SilentlyContinue).TcpTestSucceeded
if ($ok) {
  Write-Host ""
  Write-Host "LDAP is ready on ldap://localhost:389"
  Write-Host "Test logins:"
  Write-Host "  ali.ben@habitflow.local      / Test123!"
  Write-Host "  sophie.martin@habitflow.local / Manager123!"
  Write-Host "  admin@habitflow.local        / Admin123!"
  Write-Host "  admin@habitflow.com          / Admin123!  (Mongo fallback)"
} else {
  Write-Warning "Port 389 is not open yet — wait a few seconds and retry login."
}
