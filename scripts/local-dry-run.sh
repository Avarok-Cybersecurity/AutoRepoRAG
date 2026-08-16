#!/usr/bin/env bash
# local-dry-run.sh — full local verification sequence for AutoRepoRAG (plan §5).
#
# Stages: [1] download + sha256-verify the pinned lattice-server release
#         [2] mock pipeline run (end-to-end src/main.mjs, real server)
#         [3] schema-check on the produced corpus
#         [4] byte-determinism: second mock run on another port, cmp
#         [5] REST self-retrieval round-trip probe via curl
#             (score is a cosine DISTANCE: top-1 must be self at score <= 1e-3)
#         [6] MODE=live only: live embedding run (OPENROUTER_API_KEY from env,
#             never echoed) + schema-check
#         [7] incremental rerun via previous-corpus-url=file://... asserting
#             embedded=0 and byte-identical corpus
#         [8] teardown (also on any exit, via trap)
#
# Parameters (env, all optional):
#   MODE=mock|live        default mock
#   ARCH=auto|x64|arm64   default auto (from uname -m)
#   PORT=<int>            base port, default 6455 (uses PORT..PORT+3)
#   PATHS=<globs>         newline-separated include globs, default fixture globs
#   TARGET_DIR=<dir>      repo root to chunk, default test/fixtures
#   LATTICE_VERSION=<tag> default v0.3.3
#   EMBED_MODEL / EMBED_ENDPOINT   live-mode model + API base
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

MODE="${MODE:-mock}"
ARCH="${ARCH:-auto}"
PORT="${PORT:-6455}"
PATHS="${PATHS:-$(printf 'src/**/*.rs\nkernels/**')}"
TARGET_DIR="${TARGET_DIR:-$REPO_ROOT/test/fixtures}"
LATTICE_VERSION="${LATTICE_VERSION:-v0.3.3}"
EMBED_MODEL="${EMBED_MODEL:-nvidia/llama-nemotron-embed-vl-1b-v2:free}"
EMBED_ENDPOINT="${EMBED_ENDPOINT:-https://openrouter.ai/api/v1}"
RELEASE_BASE="https://github.com/Avarok-Cybersecurity/lattice-db/releases/download"

banner() { printf '\n============================== %s ==============================\n' "$*"; }
die() { printf 'local-dry-run: FAIL: %s\n' "$*" >&2; exit 1; }

case "$MODE" in mock|live) ;; *) die "MODE must be mock or live, got '$MODE'";; esac

if [ "$ARCH" = "auto" ]; then
  case "$(uname -m)" in
    aarch64|arm64) ARCH=arm64 ;;
    x86_64|amd64)  ARCH=x64 ;;
    *) die "unsupported machine '$(uname -m)'; set ARCH=x64|arm64 explicitly" ;;
  esac
fi

if [ "$MODE" = "live" ] && [ -z "${OPENROUTER_API_KEY:-}" ]; then
  die 'MODE=live requires OPENROUTER_API_KEY in the environment. Export it from
  your key file without printing it, e.g.:  export OPENROUTER_API_KEY="$(cat /path/to/your/key/file)"'
fi

WORK="$(mktemp -d "${TMPDIR:-/tmp}/autoreporag-dryrun-XXXXXX")"
PROBE_PID=""
cleanup() {
  banner "STAGE 8: TEARDOWN"
  if [ -n "$PROBE_PID" ] && kill -0 "$PROBE_PID" 2>/dev/null; then
    kill -TERM "$PROBE_PID" 2>/dev/null || true
    for _ in $(seq 1 30); do kill -0 "$PROBE_PID" 2>/dev/null || break; sleep 0.1; done
    kill -KILL "$PROBE_PID" 2>/dev/null || true
    echo "probe lattice-server (pid $PROBE_PID) stopped"
  fi
  if pgrep -f "lattice-server 127.0.0.1:$PORT" >/dev/null 2>&1; then
    echo "WARNING: a lattice-server on port $PORT survived; not killing (may not be ours)"
  fi
  rm -rf "$WORK"
  echo "scratch $WORK removed"
}
trap cleanup EXIT

# Stable identity for byte-determinism (fixtures are not their own git repo).
# --verify --quiet: a commit-less repo must yield EMPTY output (plain
# `rev-parse HEAD` prints the literal string "HEAD" even as it fails).
if [ -z "${GITHUB_SHA:-}" ]; then
  GITHUB_SHA="$(git -C "$TARGET_DIR" rev-parse --verify --quiet HEAD 2>/dev/null || true)"
  [ -n "$GITHUB_SHA" ] || GITHUB_SHA="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
fi
export GITHUB_SHA
export GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-Avarok-Cybersecurity/AutoRepoRAG-dryrun}"

# run_pipeline <out-dir> <port> <mock|live> <previous-corpus-url>
run_pipeline() {
  local out_dir="$1" port="$2" emode="$3" prev_url="$4"
  mkdir -p "$out_dir" "$out_dir/temp"
  local mock_flag=true model='' endpoint='' key=''
  if [ "$emode" = "live" ]; then
    mock_flag=false; model="$EMBED_MODEL"; endpoint="$EMBED_ENDPOINT"; key="$OPENROUTER_API_KEY"
  fi
  env \
    INPUT_PATHS="$PATHS" \
    INPUT_EXCLUDE="" \
    INPUT_COLLECTION="coderag" \
    INPUT_OUTPUT_DIR="$out_dir" \
    INPUT_OUTPUT_NAME="coderag" \
    INPUT_GZIP="true" \
    INPUT_EMBEDDING_ENDPOINT="$endpoint" \
    INPUT_EMBEDDING_MODEL="$model" \
    INPUT_EMBEDDING_API_KEY="$key" \
    INPUT_MOCK_EMBEDDINGS="$mock_flag" \
    INPUT_MOCK_DIM="32" \
    INPUT_CHUNK_LINES="40" \
    INPUT_CHUNK_OVERLAP="8" \
    INPUT_MAX_CHUNK_BYTES="16384" \
    INPUT_BATCH_SIZE="32" \
    INPUT_REQUEST_INTERVAL_MS="2500" \
    INPUT_MAX_RETRIES="3" \
    INPUT_MAX_CHUNKS="0" \
    INPUT_VECTOR_PRECISION="6" \
    INPUT_PREVIOUS_CORPUS_URL="$prev_url" \
    INPUT_LATTICE_VERSION="$LATTICE_VERSION" \
    INPUT_LATTICE_PORT="$port" \
    GITHUB_WORKSPACE="$TARGET_DIR" \
    RUNNER_TEMP="$out_dir/temp" \
    GITHUB_OUTPUT="$out_dir/github-output.txt" \
    node "$REPO_ROOT/src/main.mjs"
}

# get_output <key> <out-dir> — reads the heredoc `key<<DELIM` form main.mjs emits.
get_output() {
  awk -v key="$1" '
    started && $0 == delim { exit }
    started { print; next }
    index($0, key "<<") == 1 { delim = substr($0, length(key) + 3); started = 1 }
  ' "$2/github-output.txt"
}

banner "STAGE 1: DOWNLOAD + VERIFY lattice-server $LATTICE_VERSION ($ARCH)"
ASSET="lattice-db-linux-$ARCH.tar.gz"
SUMS="lattice-db-linux-$ARCH.sha256"
curl -fsSL --retry 3 -o "$WORK/$ASSET" "$RELEASE_BASE/$LATTICE_VERSION/$ASSET"
curl -fsSL --retry 3 -o "$WORK/$SUMS" "$RELEASE_BASE/$LATTICE_VERSION/$SUMS"
(cd "$WORK" && grep -F -- "$ASSET" "$SUMS" | sha256sum -c -)
tar -xzf "$WORK/$ASSET" -C "$WORK"
[ -x "$WORK/lattice-server" ] || die "archive did not contain an executable lattice-server"
echo "verified + extracted: $WORK/lattice-server"

banner "STAGE 2: MOCK PIPELINE RUN (port $PORT)"
OUT1="$WORK/out-mock-1"
run_pipeline "$OUT1" "$PORT" mock ""
CORPUS1="$(get_output corpus-file "$OUT1")"
[ -s "$CORPUS1" ] || die "mock run produced no corpus at '$CORPUS1'"
echo "corpus: $CORPUS1 (points=$(get_output points "$OUT1"), dim=$(get_output dim "$OUT1"))"

banner "STAGE 3: SCHEMA CHECK"
node "$REPO_ROOT/test/schema-check.mjs" "$CORPUS1"

banner "STAGE 4: BYTE-DETERMINISM (second run, port $((PORT + 1)), cmp)"
OUT2="$WORK/out-mock-2"
run_pipeline "$OUT2" "$((PORT + 1))" mock ""
CORPUS2="$(get_output corpus-file "$OUT2")"
cmp "$CORPUS1" "$CORPUS2" || die "mock corpora differ between runs"
cmp "$CORPUS1.gz" "$CORPUS2.gz" || die "gz twins differ between runs"
echo "byte-identical: $(sha256sum "$CORPUS1" | cut -d' ' -f1)"

banner "STAGE 5: REST SELF-RETRIEVAL PROBE (curl, port $((PORT + 2)))"
PROBE_PORT=$((PORT + 2))
PROBE_DATA="$WORK/probe-data"
mkdir -p "$PROBE_DATA"
LATTICE_DATA_DIR="$PROBE_DATA" "$WORK/lattice-server" "127.0.0.1:$PROBE_PORT" \
  >"$WORK/probe-server.log" 2>&1 &
PROBE_PID=$!
for i in $(seq 1 50); do
  curl -fsS "http://127.0.0.1:$PROBE_PORT/collections" >/dev/null 2>&1 && break
  [ "$i" = 50 ] && die "probe lattice-server not ready on port $PROBE_PORT"
  sleep 0.2
done
# Derive create/upsert/search bodies from the corpus itself (first point).
node --input-type=module - "$CORPUS1" "$WORK" <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs';
const [corpusPath, work] = process.argv.slice(2);
const lines = readFileSync(corpusPath, 'utf8').trim().split('\n');
const header = JSON.parse(lines[0]);
const point = JSON.parse(lines[1]);
writeFileSync(`${work}/probe-create.json`, JSON.stringify({ vectors: { size: header.dim, distance: 'Cosine' } }));
writeFileSync(`${work}/probe-upsert.json`, JSON.stringify({ points: [{ id: point.id, vector: point.vector, payload: point.payload }] }));
writeFileSync(`${work}/probe-search.json`, JSON.stringify({ vector: point.vector, limit: 1, with_payload: false }));
writeFileSync(`${work}/probe-expected-id.txt`, String(point.id));
NODE
curl -fsS -X PUT "http://127.0.0.1:$PROBE_PORT/collections/probe" \
  -H 'Content-Type: application/json' --data-binary "@$WORK/probe-create.json" >/dev/null
curl -fsS -X PUT "http://127.0.0.1:$PROBE_PORT/collections/probe/points" \
  -H 'Content-Type: application/json' --data-binary "@$WORK/probe-upsert.json" >/dev/null
curl -fsS -X POST "http://127.0.0.1:$PROBE_PORT/collections/probe/points/search" \
  -H 'Content-Type: application/json' --data-binary "@$WORK/probe-search.json" \
  >"$WORK/probe-result.json"
node --input-type=module - "$WORK/probe-result.json" "$WORK/probe-expected-id.txt" <<'NODE'
import { readFileSync } from 'node:fs';
const [resultPath, expectedPath] = process.argv.slice(2);
const envelope = JSON.parse(readFileSync(resultPath, 'utf8'));
const expectedId = Number(readFileSync(expectedPath, 'utf8').trim());
if (envelope.status !== 'ok') throw new Error(`search envelope status ${JSON.stringify(envelope.status)}`);
const hits = envelope.result;
if (!Array.isArray(hits) || hits.length === 0) throw new Error('search returned no hits');
const top = hits[0];
// score is a cosine DISTANCE: 0 = identical. Never assert similarity ~1.
if (top.id !== expectedId) throw new Error(`top-1 id ${top.id} != self ${expectedId}`);
if (!(top.score <= 1e-3)) throw new Error(`self-retrieval distance ${top.score} > 1e-3`);
console.log(`self-retrieval OK: id ${top.id}, cosine distance ${top.score}`);
NODE

INCR_BASE_OUT="$OUT1"
if [ "$MODE" = "live" ]; then
  banner "STAGE 6: LIVE EMBEDDING RUN (port $((PORT + 3)), model $EMBED_MODEL)"
  OUT_LIVE="$WORK/out-live"
  run_pipeline "$OUT_LIVE" "$((PORT + 3))" live ""
  LIVE_CORPUS="$(get_output corpus-file "$OUT_LIVE")"
  node "$REPO_ROOT/test/schema-check.mjs" "$LIVE_CORPUS"
  echo "live corpus: dim=$(get_output dim "$OUT_LIVE"), embedded=$(get_output embedded "$OUT_LIVE")"
  INCR_BASE_OUT="$OUT_LIVE"
else
  banner "STAGE 6: LIVE RUN SKIPPED (MODE=mock)"
fi

banner "STAGE 7: INCREMENTAL RERUN (previous-corpus-url=file://..., expect embedded=0)"
BASE_GZ="$(get_output corpus-gz-file "$INCR_BASE_OUT")"
OUT_INCR="$WORK/out-incremental"
run_pipeline "$OUT_INCR" "$PORT" "$MODE" "file://$BASE_GZ"
EMBEDDED="$(get_output embedded "$OUT_INCR")"
REUSED="$(get_output reused "$OUT_INCR")"
POINTS="$(get_output points "$OUT_INCR")"
[ "$EMBEDDED" = "0" ] || die "incremental rerun embedded=$EMBEDDED, expected 0"
[ "$REUSED" = "$POINTS" ] || die "incremental rerun reused=$REUSED != points=$POINTS"
cmp "$(get_output corpus-file "$INCR_BASE_OUT")" "$(get_output corpus-file "$OUT_INCR")" \
  || die "incremental corpus differs from its previous corpus"
echo "incremental OK: embedded=0, reused=$REUSED/$POINTS, corpus byte-identical"

banner "SUCCESS: all stages passed (MODE=$MODE, ARCH=$ARCH, $LATTICE_VERSION)"
