#!/usr/bin/env bash
# Testes Automatizados — Order Service (Node.js Microsserviços)
# Requer: bru CLI (npm install -g @usebruno/cli)
set -euo pipefail

COLLECTION="/var/www/node-microservices-event-driven/bruno"
BASE_URL="http://localhost:3001"
REPORTS="$COLLECTION/reports"
TOTAL=0
PASSED=0
FAILED=0
PASSED_ASSERTIONS=0
TOTAL_ASSERTIONS=0

mkdir -p "$REPORTS"

cd "$COLLECTION"

echo ""
echo "============================================"
echo "  Order Service — Bruno Test Suite"
echo "  Base URL: $BASE_URL"
echo "============================================"
echo ""

# ── Fase 1: Health Check ──
echo "--- Health Check ---"
bru run health/Health.bru health/Metrics.bru \
  --env-var "base_url=$BASE_URL" \
  --output "$REPORTS/01-health.json" 2>&1

# ── Fase 2: Create Order ──
echo "--- Create Order ---"
bru run orders/Create.bru \
  --env-var "base_url=$BASE_URL" \
  --output "$REPORTS/02-create.json" 2>&1

ORDER_ID=$(jq -r '.[0].results[0].response.data.id // ""' "$REPORTS/02-create.json" 2>/dev/null || echo "")
echo "  -> order_id=$ORDER_ID"
CORRELATION_ID=$(jq -r '.[0].results[0].response.data.correlationId // ""' "$REPORTS/02-create.json" 2>/dev/null || echo "")
echo "  -> correlation_id=$CORRELATION_ID"

# ── Fase 3: Create with Correlation ID ──
echo "--- Create with Correlation ID ---"
bru run orders/CreateWithCorrelation.bru \
  --env-var "base_url=$BASE_URL" \
  --env-var "correlation_id=$CORRELATION_ID" \
  --output "$REPORTS/03-correlation.json" 2>&1

# ── Fase 4: Validation Error ──
echo "--- Validation Error ---"
bru run orders/ValidationError.bru \
  --env-var "base_url=$BASE_URL" \
  --output "$REPORTS/04-validation.json" 2>&1

echo ""

# ── Resultado Final ──
for f in "$REPORTS"/01-health.json "$REPORTS"/02-create.json "$REPORTS"/03-correlation.json "$REPORTS"/04-validation.json; do
  [ -f "$f" ] || continue
  TOTAL=$((TOTAL + 1))
  failed_reqs=$(jq -r '.[0].summary.failedRequests // 0' "$f" 2>/dev/null || echo "1")
  passed_assert=$(jq -r '.[0].summary.passedAssertions // 0' "$f" 2>/dev/null || echo "0")
  total_assert=$(jq -r '.[0].summary.totalAssertions // 0' "$f" 2>/dev/null || echo "0")

  if [ "$failed_reqs" = "0" ]; then
    PASSED=$((PASSED + 1))
  else
    FAILED=$((FAILED + 1))
  fi
  PASSED_ASSERTIONS=$((PASSED_ASSERTIONS + passed_assert))
  TOTAL_ASSERTIONS=$((TOTAL_ASSERTIONS + total_assert))
done

echo "============================================"
echo "  RESULTADO FINAL"
echo "============================================"
echo "  Fases:    $TOTAL total, $PASSED passaram, $FAILED falharam"
echo "  Assertions: $PASSED_ASSERTIONS/$TOTAL_ASSERTIONS passaram"
echo "============================================"

[ "$FAILED" -eq 0 ] || exit 1
