#!/bin/bash
# Round-42 battery runner: boots a server, waits for health, runs ONE battery
# script, then kills the server — all within a single invocation (the
# environment reaps child processes between tool calls).
#
# Usage: bash scripts/battery-runner.sh <script-name.mjs> [dev|prod]
#   dev  (default) — bun run dev on :3000
#   prod           — the production standalone on :3000 (bun .next/standalone/server.js)
#
# Port kill: fuser is NOT available in every workspace — kill by /proc scan
# (the round-42 environment finding: `fuser -k 3000/tcp` silently no-ops when
# fuser is absent, leaving a STALE dev server to shadow the port — the
# round-39 stale-server lesson, mechanized).
set -u
cd /home/z/my-project/ecommerce-store || exit 1
MODE="${2:-dev}"

kill_port() {
  local port="$1"
  # ss -tlnp parsing (procps/net-tools independent)
  local pids
  pids=$(ss -tlnp 2>/dev/null | grep ":${port} " | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)
  if [ -n "$pids" ]; then
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null
  fi
  # also kill process-tree by command pattern (parent wrappers)
  pkill -9 -f "next dev -p ${port}" 2>/dev/null
  pkill -9 -f "standalone/server.js" 2>/dev/null || true
  sleep 1
}

kill_port 3000

if [ "$MODE" = "prod" ]; then
  PORT=3000 NODE_ENV=production DATABASE_URL="file:../db/custom.db" \
    AUTH_SECRET="battery-prod-secret" \
    bun .next/standalone/server.js > /tmp/prod3000.log 2>&1 &
else
  bun run dev > /dev/null 2>&1 &
fi
DEV_PID=$!

# wait for health (max 30s)
for _ in $(seq 1 30); do
  curl -s -m 2 http://localhost:3000/api/health 2>/dev/null | grep -q '"ok":true' && break
  sleep 1
done

node "scripts/$1"
EXIT=$?

kill "$DEV_PID" 2>/dev/null
kill_port 3000
exit $EXIT
