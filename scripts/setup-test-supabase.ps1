param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern("^[a-z0-9]{20}$")]
  [string]$ProjectRef
)

$ErrorActionPreference = "Stop"
$testEnvPath = Join-Path $PSScriptRoot "..\.env.test"
if (-not (Test-Path $testEnvPath)) {
  throw "Create .env.test from .env.test.example and set the test Supabase URL and keys first."
}

$testEnv = Get-Content $testEnvPath
foreach ($requiredName in @("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "TEST_PROJECT_REF", "PRODUCTION_PROJECT_REF")) {
  if (-not ($testEnv | Where-Object { $_ -match "^$requiredName=.+$" -and $_ -notmatch "^$requiredName=replace-" })) {
    throw "$requiredName is missing from .env.test."
  }
}
$urlLine = $testEnv | Where-Object { $_ -match "^SUPABASE_URL=" } | Select-Object -First 1
$testUrl = $urlLine.Substring("SUPABASE_URL=".Length).Trim().Trim('"')
$testRefLine = $testEnv | Where-Object { $_ -match "^TEST_PROJECT_REF=" } | Select-Object -First 1
$configuredTestRef = $testRefLine.Substring("TEST_PROJECT_REF=".Length).Trim().Trim('"')
$productionRefLine = $testEnv | Where-Object { $_ -match "^PRODUCTION_PROJECT_REF=" } | Select-Object -First 1
$productionRef = $productionRefLine.Substring("PRODUCTION_PROJECT_REF=".Length).Trim().Trim('"')
$expectedHost = "$ProjectRef.supabase.co"
if ($configuredTestRef -ne $ProjectRef -or ([Uri]$testUrl).Host -ne $expectedHost) {
  throw "ProjectRef must match both TEST_PROJECT_REF and SUPABASE_URL in .env.test."
}
if ($ProjectRef -eq $productionRef) {
  throw "Refusing to apply migrations: TEST_PROJECT_REF matches PRODUCTION_PROJECT_REF."
}

npx supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx supabase db push --linked --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output "Test project migrations applied. Load supabase/seed.sql in that project's SQL Editor before running quote tests."
