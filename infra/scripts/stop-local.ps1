$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$pidDirectory = Join-Path $repoRoot "infra\.local"

foreach ($name in @("backend", "frontend")) {
    $pidFile = Join-Path $pidDirectory "$name.pid"
    if (-not (Test-Path $pidFile)) {
        continue
    }

    $processId = Get-Content $pidFile | Select-Object -First 1
    if ($processId) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($null -ne $process) {
            Stop-Process -Id $processId -Force
            Write-Host "Stopped $name process (PID $processId)."
        }
    }

    Remove-Item $pidFile -ErrorAction SilentlyContinue
}
