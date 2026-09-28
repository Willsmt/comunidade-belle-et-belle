#!/usr/bin/env bash
# Orquestrador ponta a ponta do teste de carga: valida setup, sobe banco de
# teste, roda migrations, semeia usuários, builda/sobe o app, roda o k6,
# gera relatório e derruba a stack.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Raiz do projeto = primeiro ancestral com package.json subindo a partir daqui.
PROJECT_ROOT="$SCRIPT_DIR"
while [ ! -f "$PROJECT_ROOT/package.json" ] && [ "$PROJECT_ROOT" != "/" ]; do
  PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
done
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  echo "Não encontrei package.json em nenhum ancestral de $SCRIPT_DIR" >&2
  exit 2
fi

SCENARIO="baseline"
VUS=""
RUN_TIME=""
HOST=""
TAGS=""
USE_DEV=0
NO_SERVER=0
KEEP_UP=0
UPDATE_BASELINE=0
WITH_REDIS=0
ALLOW_EXPENSIVE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --scenario) SCENARIO="$2"; shift 2 ;;
    --vus) VUS="$2"; shift 2 ;;
    --run-time) RUN_TIME="$2"; shift 2 ;;
    --host) HOST="$2"; shift 2 ;;
    --tags) TAGS="$2"; shift 2 ;;
    --dev) USE_DEV=1; shift ;;
    --no-server) NO_SERVER=1; shift ;;
    --keep-up) KEEP_UP=1; shift ;;
    --update-baseline) UPDATE_BASELINE=1; shift ;;
    --with-redis) WITH_REDIS=1; shift ;;
    --allow-expensive) ALLOW_EXPENSIVE=1; shift ;;
    *) echo "Flag desconhecida: $1" >&2; exit 2 ;;
  esac
done

case "$SCENARIO" in
  smoke)    DEFAULT_VUS=10;  DEFAULT_TIME=1m ;;
  baseline) DEFAULT_VUS=50;  DEFAULT_TIME=5m ;;
  stress)   DEFAULT_VUS=300; DEFAULT_TIME=10m ;;
  spike)    DEFAULT_VUS=200; DEFAULT_TIME=3m ;;
  soak)     DEFAULT_VUS=30;  DEFAULT_TIME=30m ;;
  *) echo "Cenário desconhecido: $SCENARIO (use smoke|baseline|stress|spike|soak)" >&2; exit 2 ;;
esac
VUS="${VUS:-$DEFAULT_VUS}"
RUN_TIME="${RUN_TIME:-$DEFAULT_TIME}"

echo "== Fase 0: check-setup =="
if ! node "$SCRIPT_DIR/check-setup.mjs"; then
  echo "" >&2
  echo "Setup pendente (ver acima). Rodar carga sobre isso não mede nada real." >&2
  exit 3
fi

# shellcheck disable=SC1090
set -a
source "$SCRIPT_DIR/loadtest.env"
set +a
if [ "${LOADTEST_ENV_CONFIGURED:-0}" != "1" ]; then
  echo "loadtest.env não configurado (LOADTEST_ENV_CONFIGURED != 1)." >&2
  exit 3
fi

APP_PORT="${LOADTEST_APP_PORT:-3100}"
HOST="${HOST:-http://localhost:$APP_PORT}"
COMPOSE_PROFILE=()
[ "$WITH_REDIS" = "1" ] && COMPOSE_PROFILE=(--profile redis)

cleanup() {
  local exit_code=$?
  if [ -n "${APP_PID:-}" ] && kill -0 "$APP_PID" 2>/dev/null; then
    echo "== Derrubando o app (PID $APP_PID) =="
    kill "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
  fi
  # `next start`/`next dev` via npx pode deixar um processo `next-server`
  # filho vivo mesmo depois do PID acima morrer (não é filho direto em todo
  # setup) — garanta a porta livre em vez de confiar só no PID capturado.
  if [ -n "${APP_PORT:-}" ] && command -v fuser >/dev/null 2>&1; then
    fuser -k "${APP_PORT}/tcp" 2>/dev/null || true
  fi
  if [ "$KEEP_UP" != "1" ] && [ "$NO_SERVER" != "1" ]; then
    echo "== Parando containers de teste =="
    (cd "$SCRIPT_DIR" && docker compose -f docker-compose.loadtest.yml "${COMPOSE_PROFILE[@]}" stop) || true
  fi
  exit $exit_code
}
trap cleanup EXIT

if [ "$NO_SERVER" != "1" ]; then
  echo "== Fase: subindo banco de teste =="
  (cd "$SCRIPT_DIR" && docker compose -f docker-compose.loadtest.yml "${COMPOSE_PROFILE[@]}" up -d)

  echo "== Aguardando banco ficar healthy =="
  for i in $(seq 1 30); do
    status="$(cd "$SCRIPT_DIR" && docker compose -f docker-compose.loadtest.yml ps db --format json | node -e '
      let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d.trim().split("\n")[0]).Health||"")}catch{console.log("")}})
    ')"
    [ "$status" = "healthy" ] && break
    sleep 1
  done

  if [ -n "${LOADTEST_MIGRATE_COMMAND:-}" ]; then
    echo "== Fase: rodando migrations ($LOADTEST_MIGRATE_COMMAND) =="
    (cd "$PROJECT_ROOT" && eval "$LOADTEST_MIGRATE_COMMAND")
  fi

  echo "== Fase: semeando usuários de teste =="
  (cd "$PROJECT_ROOT" && npx tsx "$SCRIPT_DIR/seed-load-test-users.ts" > "$SCRIPT_DIR/.seed-output.json")
  echo "Usuário semeado: $(cat "$SCRIPT_DIR/.seed-output.json")"

  if [ "$USE_DEV" = "1" ]; then
    echo "== Fase: subindo \`next dev\` (PISO, não capacidade real) =="
    ( cd "$PROJECT_ROOT" && exec npx next dev -p "$APP_PORT" ) > "$SCRIPT_DIR/.app.log" 2>&1 &
  else
    echo "== Fase: build de produção =="
    (cd "$PROJECT_ROOT" && npm run build)
    echo "== Fase: subindo \`next start\` =="
    ( cd "$PROJECT_ROOT" && exec npx next start -p "$APP_PORT" ) > "$SCRIPT_DIR/.app.log" 2>&1 &
  fi
  # $! logo após o "&" do grupo (não dentro dele) — senão captura o PID de um
  # subshell que já terminou, e o cleanup depois mata o processo errado.
  APP_PID=$!

  echo "== Aguardando app responder em $HOST =="
  ok=0
  for i in $(seq 1 60); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$HOST" || true)"
    if [ -n "$code" ] && [ "$code" != "000" ]; then ok=1; break; fi
    sleep 1
  done
  if [ "$ok" != "1" ]; then
    echo "App não respondeu em $HOST depois de 60s. Log:" >&2
    tail -n 60 "$SCRIPT_DIR/.app.log" >&2 || true
    exit 2
  fi
fi

echo "== Fase: rodando k6 ($SCENARIO — $VUS VUs, $RUN_TIME) =="
RUN_ID="$(date +%Y%m%d-%H%M%S)-$SCENARIO"
REPORT_DIR="$SCRIPT_DIR/../reports/$RUN_ID"
mkdir -p "$REPORT_DIR"

K6_ARGS=(run --vus "$VUS" --duration "$RUN_TIME" --summary-export "$REPORT_DIR/summary.json")
[ -n "$TAGS" ] && K6_ARGS+=(--tag "feature=$TAGS")
K6_ARGS+=(--env "BASE_URL=$HOST" --env "SEED_FILE=$SCRIPT_DIR/.seed-output.json")
[ "$ALLOW_EXPENSIVE" = "1" ] && K6_ARGS+=(--env "ALLOW_EXPENSIVE=1")
K6_ARGS+=("$SCRIPT_DIR/loadtest.js")

# Quem decide aprovado/reprovado é o gate do analyze-results.mjs, não o
# exit code do k6 (que falharia sozinho em qualquer threshold do script).
k6 "${K6_ARGS[@]}" | tee "$REPORT_DIR/k6-stdout.txt" || true

echo "== Fase: analisando resultado =="
BASELINE_FILE="$SCRIPT_DIR/../baselines/$SCENARIO.json"
ANALYZE_ARGS=("$REPORT_DIR/summary.json" --baseline "$BASELINE_FILE" --out "$REPORT_DIR/RELATORIO.md")
[ "$UPDATE_BASELINE" = "1" ] && ANALYZE_ARGS+=(--update-baseline)

GATE_EXIT=0
node "$SCRIPT_DIR/analyze-results.mjs" "${ANALYZE_ARGS[@]}" || GATE_EXIT=$?

echo ""
echo "Relatório: $REPORT_DIR/RELATORIO.md"
exit $GATE_EXIT
