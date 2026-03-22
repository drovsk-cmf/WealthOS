# ============================================================
# Oniefy - Preflight Check
# Executa ANTES de abrir o browser. Detecta problemas cedo.
#
# Uso:
#   cd C:\Users\claud\Documents\PC_WealthOS
#   .\scripts\preflight.ps1
#
# Flags opcionais:
#   -SkipTests     Pula Jest (economiza ~30s)
#   -SkipBuild     Pula "next build" (economiza ~60s)
#   -StartDev      Inicia npm run dev ao final se tudo passar
# ============================================================

param(
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$StartDev
)

$ErrorActionPreference = "Stop"
$script:passed = 0
$script:failed = 0
$script:warnings = 0

function Write-Check {
    param([string]$Name, [string]$Status, [string]$Detail = "")
    $icon = switch ($Status) {
        "PASS" { "[OK]"; $script:passed++ }
        "FAIL" { "[FALHA]"; $script:failed++ }
        "WARN" { "[AVISO]"; $script:warnings++ }
        "SKIP" { "[PULOU]" }
        "INFO" { "[INFO]" }
    }
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        "SKIP" { "DarkGray" }
        "INFO" { "Cyan" }
    }
    $msg = "$icon $Name"
    if ($Detail) { $msg += " - $Detail" }
    Write-Host $msg -ForegroundColor $color
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Oniefy - Preflight Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Node.js ──────────────────────────────────────────────
Write-Host "--- Ambiente ---" -ForegroundColor White
try {
    $nodeVersion = (node -v).TrimStart("v")
    $nodeMajor = [int]($nodeVersion.Split(".")[0])
    if ($nodeMajor -ge 20) {
        Write-Check "Node.js" "PASS" "v$nodeVersion"
    } else {
        Write-Check "Node.js" "FAIL" "v$nodeVersion (requer 20+)"
    }
} catch {
    Write-Check "Node.js" "FAIL" "nao encontrado no PATH"
}

# ── 2. npm ──────────────────────────────────────────────────
try {
    $npmVersion = (npm -v)
    $npmMajor = [int]($npmVersion.Split(".")[0])
    if ($npmMajor -ge 10) {
        Write-Check "npm" "PASS" "v$npmVersion"
    } else {
        Write-Check "npm" "WARN" "v$npmVersion (recomendado 10+)"
    }
} catch {
    Write-Check "npm" "FAIL" "nao encontrado"
}

# ── 3. Diretorio correto ────────────────────────────────────
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    if ($pkg.name -match "wealthos|oniefy") {
        Write-Check "Diretorio" "PASS" (Get-Location)
    } else {
        Write-Check "Diretorio" "WARN" "package.json encontrado mas name='$($pkg.name)'"
    }
} else {
    Write-Check "Diretorio" "FAIL" "package.json nao encontrado. Execute do diretorio raiz do projeto."
}

# ── 4. .env.local ───────────────────────────────────────────
Write-Host ""
Write-Host "--- Variaveis de Ambiente ---" -ForegroundColor White

if (Test-Path ".env.local") {
    Write-Check ".env.local" "PASS" "arquivo existe"

    $envContent = Get-Content ".env.local" -Raw

    # Obrigatorias
    $required = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    foreach ($key in $required) {
        if ($envContent -match "(?m)^$key=.+") {
            Write-Check "  $key" "PASS"
        } else {
            Write-Check "  $key" "FAIL" "obrigatoria, nao encontrada ou vazia"
        }
    }

    # Projeto correto (nao o legado)
    if ($envContent -match "mngjbrbxapazdddzgoje") {
        Write-Check "  Supabase project" "PASS" "oniefy-prod"
    } elseif ($envContent -match "hmwdfcsxtmbzlslxgqus") {
        Write-Check "  Supabase project" "FAIL" "aponta para projeto LEGADO (pausado!)"
    } else {
        Write-Check "  Supabase project" "WARN" "project ID nao reconhecido"
    }

    # Opcionais com degradacao
    $optional = @{
        "GEMINI_API_KEY" = "IA auto-categorizacao"
        "NEXT_PUBLIC_VAPID_PUBLIC_KEY" = "Web Push"
        "RESEND_API_KEY" = "Email weekly digest"
        "CRON_SECRET" = "Protecao endpoints cron"
    }
    foreach ($kv in $optional.GetEnumerator()) {
        if ($envContent -match "(?m)^$($kv.Key)=.+") {
            Write-Check "  $($kv.Key)" "PASS" $kv.Value
        } else {
            Write-Check "  $($kv.Key)" "WARN" "ausente - $($kv.Value) desativado"
        }
    }
} else {
    Write-Check ".env.local" "FAIL" "arquivo nao encontrado. Execute: Copy-Item .env.example .env.local"
}

# ── 5. node_modules ─────────────────────────────────────────
Write-Host ""
Write-Host "--- Dependencias ---" -ForegroundColor White

if (Test-Path "node_modules") {
    $lockAge = $null
    if (Test-Path "package-lock.json") {
        $lockAge = ((Get-Date) - (Get-Item "package-lock.json").LastWriteTime).TotalHours
    }
    # Verifica se node_modules esta atualizado vs package-lock
    $nmTime = (Get-Item "node_modules").LastWriteTime
    $lockTime = if (Test-Path "package-lock.json") { (Get-Item "package-lock.json").LastWriteTime } else { $nmTime }
    if ($nmTime -ge $lockTime) {
        Write-Check "node_modules" "PASS" "instalado e atualizado"
    } else {
        Write-Check "node_modules" "WARN" "pode estar desatualizado. Execute: npm install"
    }
} else {
    Write-Check "node_modules" "FAIL" "nao encontrado. Execute: npm install"
}

# ── 6. Porta 3000 ───────────────────────────────────────────
Write-Host ""
Write-Host "--- Rede ---" -ForegroundColor White

$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portInUse) {
    $proc = Get-Process -Id $portInUse[0].OwningProcess -ErrorAction SilentlyContinue
    Write-Check "Porta 3000" "WARN" "ocupada por $($proc.ProcessName) (PID $($proc.Id)). Encerre ou use outra porta."
} else {
    Write-Check "Porta 3000" "PASS" "livre"
}

# ── 7. Conectividade Supabase ────────────────────────────────
if (Test-Path ".env.local") {
    $envLines = Get-Content ".env.local"
    $supaUrl = ($envLines | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_URL=" }) -replace "^NEXT_PUBLIC_SUPABASE_URL=", ""
    if ($supaUrl) {
        try {
            $healthUrl = "$supaUrl/rest/v1/"
            $anonKey = ($envLines | Where-Object { $_ -match "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" }) -replace "^NEXT_PUBLIC_SUPABASE_ANON_KEY=", ""
            $response = Invoke-WebRequest -Uri $healthUrl -Headers @{
                "apikey" = $anonKey
                "Authorization" = "Bearer $anonKey"
            } -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Check "Supabase API" "PASS" "conectou em $supaUrl"
            } else {
                Write-Check "Supabase API" "FAIL" "status $($response.StatusCode)"
            }
        } catch {
            Write-Check "Supabase API" "FAIL" "nao conseguiu conectar: $($_.Exception.Message)"
        }
    }
}

# ── 8. TypeScript ────────────────────────────────────────────
Write-Host ""
Write-Host "--- Codigo ---" -ForegroundColor White

try {
    $tscOutput = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Check "TypeScript" "PASS" "zero erros"
    } else {
        $errorCount = ($tscOutput | Select-String "error TS").Count
        Write-Check "TypeScript" "FAIL" "$errorCount erro(s). Execute: npx tsc --noEmit"
    }
} catch {
    Write-Check "TypeScript" "FAIL" "falha ao executar tsc"
}

# ── 9. ESLint ────────────────────────────────────────────────
try {
    $lintOutput = npx next lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Check "ESLint" "PASS"
    } else {
        Write-Check "ESLint" "WARN" "problemas encontrados. Execute: npm run lint"
    }
} catch {
    Write-Check "ESLint" "WARN" "falha ao executar lint"
}

# ── 10. Jest ─────────────────────────────────────────────────
if ($SkipTests) {
    Write-Check "Jest" "SKIP" "-SkipTests"
} else {
    Write-Host ""
    Write-Host "--- Testes (pode levar ~30s) ---" -ForegroundColor White
    try {
        $jestOutput = npx jest --silent 2>&1
        if ($LASTEXITCODE -eq 0) {
            $summary = ($jestOutput | Select-String "Tests:.*passed").Line
            Write-Check "Jest" "PASS" $summary
        } else {
            $failLine = ($jestOutput | Select-String "Tests:.*failed").Line
            Write-Check "Jest" "FAIL" $failLine
        }
    } catch {
        Write-Check "Jest" "FAIL" "falha ao executar"
    }
}

# ── 11. Build ────────────────────────────────────────────────
if ($SkipBuild) {
    Write-Check "Build" "SKIP" "-SkipBuild"
} else {
    Write-Host ""
    Write-Host "--- Build (pode levar ~60s) ---" -ForegroundColor White
    try {
        $buildOutput = npm run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Check "Build" "PASS" "next build concluido"
        } else {
            $errorLines = ($buildOutput | Select-String "Error|error" | Select-Object -First 3) -join "; "
            Write-Check "Build" "FAIL" $errorLines
        }
    } catch {
        Write-Check "Build" "FAIL" "falha ao executar"
    }
}

# ── Resumo ───────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Passou:  $($script:passed)" -ForegroundColor Green
Write-Host "  Falhou:  $($script:failed)" -ForegroundColor $(if ($script:failed -gt 0) { "Red" } else { "Green" })
Write-Host "  Avisos:  $($script:warnings)" -ForegroundColor $(if ($script:warnings -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($script:failed -gt 0) {
    Write-Host "  Corrija os itens [FALHA] antes de abrir o browser." -ForegroundColor Red
    Write-Host ""
    exit 1
}

if ($StartDev) {
    Write-Host "  Tudo OK! Iniciando dev server..." -ForegroundColor Green
    Write-Host ""
    npm run dev
} else {
    Write-Host "  Tudo OK! Execute: npm run dev" -ForegroundColor Green
    Write-Host "  Ou re-execute com: .\scripts\preflight.ps1 -StartDev" -ForegroundColor Gray
    Write-Host ""
}
