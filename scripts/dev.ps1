$ErrorActionPreference = "Stop"

$Port = if ($env:PORT) { [int]$env:PORT } else { 5001 }
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "Clearing port $Port if in use..."
Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$lock = Join-Path $Root ".next\dev\lock"
if (Test-Path $lock) {
  Remove-Item $lock -Force
  Write-Host "Removed stale dev lock."
}

$env:PORT = "$Port"
$env:COZE_PROJECT_ENV = "DEV"
Write-Host "Starting dev server at http://localhost:$Port ..."
pnpm exec tsx watch src/server.ts
