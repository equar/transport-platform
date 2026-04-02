$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pidDirectory = Join-Path $repoRoot "infra\.local"

New-Item -ItemType Directory -Force -Path $pidDirectory | Out-Null

$backendProcess = Start-Process -FilePath "pwsh" -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$repoRoot\backend'; `$env:SPRING_PROFILES_ACTIVE = 'local'; mvn spring-boot:run"
) -PassThru

$frontendProcess = Start-Process -FilePath "pwsh" -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$repoRoot\frontend'; npm run dev"
) -PassThru

Set-Content -Path (Join-Path $pidDirectory "backend.pid") -Value $backendProcess.Id
Set-Content -Path (Join-Path $pidDirectory "frontend.pid") -Value $frontendProcess.Id

Write-Host "Started backend (PID $($backendProcess.Id)) and frontend (PID $($frontendProcess.Id))."
Write-Host "Backend: http://localhost:8080/api"
Write-Host "Frontend: http://localhost:5173"
Write-Host "MySQL must already be running locally before starting the backend."
