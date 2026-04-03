#!/usr/bin/env bash
# ============================================================================
# Oniefy - Auditoria de Coerência Documental
# scripts/audit-coherence.sh
#
# Verifica consistência entre HANDOVER, PENDENCIAS, código e banco de dados.
# Projetado para rodar via Claude Code com --dangerously-skip-permissions.
#
# Uso:
#   chmod +x scripts/audit-coherence.sh
#   bash scripts/audit-coherence.sh
#
# Ou via Claude Code:
#   claude --dangerously-skip-permissions
#   > Execute bash scripts/audit-coherence.sh e corrija todas as discrepâncias.
# ============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

REPORT_FILE="docs/audit/COHERENCE-REPORT-$(date +%Y%m%d).md"
ERRORS=0
WARNINGS=0
OK=0

log_ok()    { echo -e "${GREEN}✅ $1${NC}"; ((OK++)); echo "- ✅ $1" >> "$REPORT_FILE"; }
log_warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; ((WARNINGS++)); echo "- ⚠️ $1" >> "$REPORT_FILE"; }
log_fail()  { echo -e "${RED}❌ $1${NC}"; ((ERRORS++)); echo "- ❌ $1" >> "$REPORT_FILE"; }
log_section() { echo -e "\n${BOLD}━━━ $1 ━━━${NC}"; echo -e "\n## $1\n" >> "$REPORT_FILE"; }

# ── Inicialização ──────────────────────────────────────────────
mkdir -p docs/audit
cat > "$REPORT_FILE" << EOF
# Relatório de Auditoria de Coerência
**Data:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Commit:** $(git rev-parse --short HEAD)
**Branch:** $(git branch --show-current)

EOF

echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  AUDITORIA DE COERÊNCIA DOCUMENTAL — Oniefy${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════${NC}"

# ============================================================================
# 1. CONTAGENS DO FILESYSTEM vs HANDOVER
# ============================================================================
log_section "1. Filesystem vs HANDOVER"

# TS/TSX files
ACTUAL_TSX=$(find src -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l | tr -d ' ')
HANDOVER_TSX=$(grep -oP 'Arquivos TS/TSX \| \*\*(\d+)' HANDOVER-WealthOS.md | grep -oP '\d+' | tail -1)
if [ "$ACTUAL_TSX" = "$HANDOVER_TSX" ]; then
  log_ok "TS/TSX: $ACTUAL_TSX (HANDOVER=$HANDOVER_TSX)"
else
  log_fail "TS/TSX: filesystem=$ACTUAL_TSX vs HANDOVER=$HANDOVER_TSX"
fi

# Hooks
ACTUAL_HOOKS=$(find src -name "use-*.ts" -o -name "use-*.tsx" | grep -v node_modules | wc -l | tr -d ' ')
HANDOVER_HOOKS=$(grep -oP 'Hooks \| \*\*(\d+)' HANDOVER-WealthOS.md | grep -oP '\d+' | tail -1)
if [ "$ACTUAL_HOOKS" = "$HANDOVER_HOOKS" ]; then
  log_ok "Hooks: $ACTUAL_HOOKS (HANDOVER=$HANDOVER_HOOKS)"
else
  log_fail "Hooks: filesystem=$ACTUAL_HOOKS vs HANDOVER=$HANDOVER_HOOKS"
fi

# Pages
ACTUAL_PAGES=$(find src/app/\(app\) -name "page.tsx" | wc -l | tr -d ' ')
HANDOVER_PAGES=$(grep -oP 'Páginas autenticadas \| \*\*(\d+)' HANDOVER-WealthOS.md | grep -oP '\d+' | tail -1)
if [ "$ACTUAL_PAGES" = "$HANDOVER_PAGES" ]; then
  log_ok "Páginas: $ACTUAL_PAGES (HANDOVER=$HANDOVER_PAGES)"
else
  log_fail "Páginas: filesystem=$ACTUAL_PAGES vs HANDOVER=$HANDOVER_PAGES"
fi

# Migrations
ACTUAL_MIG=$(ls supabase/migrations/*.sql | wc -l | tr -d ' ')
HANDOVER_MIG=$(grep -oP 'Migration files \(repo\) \| \*\*(\d+)' HANDOVER-WealthOS.md | grep -oP '\d+' | tail -1)
if [ "$ACTUAL_MIG" = "$HANDOVER_MIG" ]; then
  log_ok "Migrations: $ACTUAL_MIG (HANDOVER=$HANDOVER_MIG)"
else
  log_fail "Migrations: filesystem=$ACTUAL_MIG vs HANDOVER=$HANDOVER_MIG"
fi

# Test suites
ACTUAL_TESTS=$(find src -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules | wc -l | tr -d ' ')
# Jest reports more suites due to describe blocks; we compare file count
echo "  (Nota: $ACTUAL_TESTS arquivos de teste. Jest pode reportar mais suítes.)" >> "$REPORT_FILE"
log_ok "Arquivos de teste: $ACTUAL_TESTS"

# eslint-disable
ACTUAL_ESLINT=$(grep -rn "eslint-disable" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__ | wc -l | tr -d ' ')
HANDOVER_ESLINT=$(grep -oP 'eslint-disable \(produção\) \| \*\*(\d+)' HANDOVER-WealthOS.md | grep -oP '\d+' | tail -1)
if [ "$ACTUAL_ESLINT" = "$HANDOVER_ESLINT" ]; then
  log_ok "eslint-disable: $ACTUAL_ESLINT (HANDOVER=$HANDOVER_ESLINT)"
else
  log_fail "eslint-disable: filesystem=$ACTUAL_ESLINT vs HANDOVER=$HANDOVER_ESLINT"
fi

# Calculators
ACTUAL_CALCS=$(ls -d src/app/\(app\)/calculators/*/page.tsx 2>/dev/null | wc -l | tr -d ' ')
log_ok "Calculadoras: $ACTUAL_CALCS"

# Zod schemas
ACTUAL_ZOD=$(grep -rn "^export const.*= z\.\|^const.*Schema = z\.\|^const.*schema = z\." src/ --include="*.ts" | grep -v node_modules | grep -v __tests__ | wc -l | tr -d ' ')
HANDOVER_ZOD=$(grep -oP 'Schemas Zod \| \*\*(\d+)' HANDOVER-WealthOS.md | grep -oP '\d+' | tail -1)
if [ "$ACTUAL_ZOD" = "$HANDOVER_ZOD" ]; then
  log_ok "Zod schemas: $ACTUAL_ZOD (HANDOVER=$HANDOVER_ZOD)"
else
  log_fail "Zod schemas: filesystem=$ACTUAL_ZOD vs HANDOVER=$HANDOVER_ZOD"
fi

# ============================================================================
# 2. REFERÊNCIAS A DOCUMENTOS QUE NÃO EXISTEM
# ============================================================================
log_section "2. Referências quebradas"

# Extrair todas as referências docs/*.md do código e docs
ALL_REFS=$(grep -roP 'docs/[A-Z][A-Z0-9_-]+\.md' src/ HANDOVER-WealthOS.md PENDENCIAS-FUTURAS.md docs/ 2>/dev/null | grep -oP 'docs/[A-Z][A-Z0-9_-]+\.md' | sort -u)

for ref in $ALL_REFS; do
  if [ -f "$ref" ]; then
    log_ok "Referência: $ref existe"
  else
    log_fail "Referência quebrada: $ref NÃO EXISTE no filesystem"
  fi
done

# ============================================================================
# 3. PENDENCIAS: ITENS ✅ vs CÓDIGO EXISTENTE
# ============================================================================
log_section "3. PENDENCIAS ✅ vs código"

# Extract E-numbers marked as ✅
DONE_ITEMS=$(grep "✅" PENDENCIAS-FUTURAS.md | grep -oP 'E\d+' | sort -u)

for item in $DONE_ITEMS; do
  # Check if there's a corresponding file in src/
  found=$(grep -rl "$item" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -1)
  if [ -n "$found" ]; then
    log_ok "$item marcado ✅, referenciado em código"
  else
    # Some items are in services, check broader
    found2=$(grep -rl "$item" src/ docs/ --include="*.ts" --include="*.tsx" --include="*.md" 2>/dev/null | head -1)
    if [ -n "$found2" ]; then
      log_ok "$item marcado ✅, referenciado em docs/código"
    else
      log_warn "$item marcado ✅ no PENDENCIAS, mas sem referência no código/docs"
    fi
  fi
done

# ============================================================================
# 4. PENDENCIAS: ITENS ⬜ QUE JÁ EXISTEM NO CÓDIGO
# ============================================================================
log_section "4. PENDENCIAS ⬜ possivelmente já implementados"

PENDING_ITEMS=$(grep "⬜" PENDENCIAS-FUTURAS.md | grep -oP 'E\d+' | sort -u)

for item in $PENDING_ITEMS; do
  found=$(grep -rl "$item" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -1)
  if [ -n "$found" ]; then
    log_warn "$item marcado ⬜ (pendente), MAS referenciado em $found — verificar se já foi implementado"
  fi
done

# ============================================================================
# 5. ENGINE FILES vs HANDOVER ENGINE TABLE
# ============================================================================
log_section "5. Engines declarados vs existentes"

ENGINE_FILES=$(ls src/lib/services/*.ts src/lib/tax/*.ts src/lib/parsers/bank-detection.ts 2>/dev/null)
HANDOVER_ENGINES=$(grep -oP '`src/lib/[a-z/]+\.ts`' HANDOVER-WealthOS.md | tr -d '`' | sort -u)

for eng in $ENGINE_FILES; do
  if echo "$HANDOVER_ENGINES" | grep -q "$(echo $eng | sed 's|^\./||')"; then
    log_ok "Engine $eng documentado no HANDOVER"
  else
    log_warn "Engine $eng existe mas NÃO está na tabela de engines do HANDOVER"
  fi
done

# ============================================================================
# 6. TESTES SEM ENGINE / ENGINES SEM TESTE
# ============================================================================
log_section "6. Cobertura de testes dos engines"

for eng in src/lib/services/*.ts; do
  basename=$(basename "$eng" .ts)
  testfile=$(find src/__tests__ -name "*${basename}*" 2>/dev/null | head -1)
  if [ -n "$testfile" ]; then
    log_ok "Engine $basename tem teste: $testfile"
  else
    log_warn "Engine $basename SEM arquivo de teste correspondente"
  fi
done

# Tax calculator
if [ -f "src/__tests__/tax-calculator.test.ts" ]; then
  log_ok "Engine tax/calculator tem teste"
else
  log_warn "Engine tax/calculator SEM arquivo de teste"
fi

# Bank detection
if [ -f "src/__tests__/bank-detection.test.ts" ]; then
  log_ok "Engine parsers/bank-detection tem teste"
else
  log_warn "Engine parsers/bank-detection SEM arquivo de teste"
fi

# ============================================================================
# 7. SESSÕES NO HANDOVER (SEQUÊNCIA CONTÍNUA)
# ============================================================================
log_section "7. Sequência de sessões no HANDOVER"

SESSIONS=$(grep -oP '^## (\d+)\.' HANDOVER-WealthOS.md | grep -oP '\d+' | sort -n)
PREV=0
for s in $SESSIONS; do
  if [ "$PREV" -gt 0 ] && [ "$s" -ne $((PREV + 1)) ]; then
    log_fail "Gap entre sessão $PREV e $s no HANDOVER (falta sessão $((PREV + 1)))"
  fi
  PREV=$s
done
log_ok "Sessões documentadas: $(echo $SESSIONS | tr ' ' ',')"

# ============================================================================
# 8. DUPLICAÇÃO ENTRE PENDENCIAS-FUTURAS E PENDENCIAS-DECISAO
# ============================================================================
log_section "8. Duplicação entre documentos de pendências"

if [ -f "docs/audit/PENDENCIAS-DECISAO.md" ]; then
  PEND_IDS=$(grep -oP '[AE]\d+|TEC-\d+|CFG-\d+|FIN-\d+' PENDENCIAS-FUTURAS.md | sort -u)
  DECISAO_IDS=$(grep -oP '[AE]\d+|TEC-\d+|CFG-\d+|FIN-\d+' docs/audit/PENDENCIAS-DECISAO.md | sort -u)

  OVERLAP=$(comm -12 <(echo "$PEND_IDS") <(echo "$DECISAO_IDS"))
  if [ -n "$OVERLAP" ]; then
    COUNT=$(echo "$OVERLAP" | wc -l | tr -d ' ')
    log_warn "$COUNT itens aparecem em AMBOS PENDENCIAS-FUTURAS e PENDENCIAS-DECISAO: $(echo $OVERLAP | tr '\n' ' ')"
  else
    log_ok "Sem duplicação entre PENDENCIAS-FUTURAS e PENDENCIAS-DECISAO"
  fi
else
  log_ok "PENDENCIAS-DECISAO.md não encontrado (sem risco de duplicação)"
fi

# ============================================================================
# 9. STALE NUMBERS NO HANDOVER (seções antigas com valores desatualizados)
# ============================================================================
log_section "9. Valores potencialmente stale no HANDOVER"

# Check for old counts that don't match current
check_stale() {
  local pattern="$1"
  local current="$2"
  local label="$3"
  matches=$(grep -n "$pattern" HANDOVER-WealthOS.md | grep -v "^.*§38\|Ground truth" | head -5)
  if [ -n "$matches" ]; then
    while IFS= read -r line; do
      value=$(echo "$line" | grep -oP '\d+' | tail -1)
      if [ -n "$value" ] && [ "$value" != "$current" ]; then
        lineno=$(echo "$line" | cut -d: -f1)
        log_warn "HANDOVER linha $lineno: $label=$value (atual=$current) — possivelmente stale"
      fi
    done <<< "$matches"
  fi
}

# These checks look for old values in non-ground-truth sections
check_stale "suítes de teste" "$ACTUAL_TESTS" "test files"
check_stale "assertions" "1079" "assertions"

# ============================================================================
# 10. CI STATUS
# ============================================================================
log_section "10. Estado do CI"

CI_STATUS=$(git status --porcelain)
if [ -z "$CI_STATUS" ]; then
  log_ok "Working tree limpo (sem alterações não commitadas)"
else
  log_warn "Working tree sujo: $(echo "$CI_STATUS" | wc -l | tr -d ' ') arquivos modificados"
fi

# Check if local is up to date with remote
git fetch origin main --quiet 2>/dev/null || true
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "unknown")
if [ "$LOCAL" = "$REMOTE" ]; then
  log_ok "Local sincronizado com origin/main"
elif [ "$REMOTE" = "unknown" ]; then
  log_warn "Não foi possível verificar sincronização com remote"
else
  log_warn "Local ($LOCAL) diverge de origin/main ($REMOTE)"
fi

# ============================================================================
# 11. COMPILAÇÃO E TESTES
# ============================================================================
log_section "11. Compilação e testes"

echo "Executando tsc --noEmit..."
if npx tsc --noEmit 2>&1 | head -5 | grep -q "error"; then
  log_fail "TypeScript: erros de compilação encontrados"
else
  log_ok "TypeScript: compila sem erros"
fi

echo "Executando ESLint..."
LINT_RESULT=$(npx next lint 2>&1 | tail -3)
if echo "$LINT_RESULT" | grep -q "No ESLint warnings or errors"; then
  log_ok "ESLint: 0 warnings, 0 errors"
else
  log_fail "ESLint: problemas encontrados"
fi

echo "Executando Jest..."
TEST_RESULT=$(npx jest --passWithNoTests 2>&1 | tail -5)
SUITES=$(echo "$TEST_RESULT" | grep "Test Suites:" | grep -oP '\d+ passed' | grep -oP '\d+')
TESTS=$(echo "$TEST_RESULT" | grep "Tests:" | grep -oP '\d+ passed' | grep -oP '\d+')
FAILED=$(echo "$TEST_RESULT" | grep "Tests:" | grep -oP '\d+ failed' | grep -oP '\d+' || echo "0")

if [ "${FAILED:-0}" = "0" ]; then
  log_ok "Jest: $SUITES suítes, $TESTS assertions, 0 falhas"
else
  log_fail "Jest: $FAILED testes falharam"
fi

# ============================================================================
# RESUMO
# ============================================================================
log_section "RESUMO"

TOTAL=$((OK + WARNINGS + ERRORS))
echo -e "\n${BOLD}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ OK:       $OK${NC}"
echo -e "${YELLOW}  ⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}  ❌ Errors:   $ERRORS${NC}"
echo -e "${BOLD}  Total:       $TOTAL verificações${NC}"
echo -e "${BOLD}════════════════════════════════════════════════════${NC}"

cat >> "$REPORT_FILE" << EOF

---

**Resumo:** $OK OK, $WARNINGS warnings, $ERRORS errors ($TOTAL verificações)
**Ação necessária:** $([ $ERRORS -gt 0 ] && echo "SIM — corrigir $ERRORS erros antes de prosseguir" || echo "Não — apenas warnings para avaliar")
EOF

echo ""
echo "Relatório salvo em: $REPORT_FILE"

# Exit code: 1 se houver erros
[ $ERRORS -eq 0 ] && exit 0 || exit 1
