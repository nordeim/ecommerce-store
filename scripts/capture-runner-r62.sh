#!/bin/bash
# Round-62 capture runner: boots the production standalone on :3001, runs
# the pdpfeatures captures (321-325), kills the server — one invocation.
set -u
cd /home/z/my-project/ecommerce-store
kill_port() {
  local pids
  pids=$(ss -ltnp 2>/dev/null | grep ":${1} " | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)
  [ -n "$pids" ] && kill -9 $pids 2>/dev/null
  pkill -9 -f "standalone/server.js" 2>/dev/null || true
  sleep 1
}
kill_port 3001
env PORT=3001 NODE_ENV=production DATABASE_URL="file:../db/custom.db" AUTH_SECRET="captures-r62" \
  bun .next/standalone/server.js > /tmp/r62-captures-server.log 2>&1 &
SRV=$!
for _ in $(seq 1 30); do
  curl -s -m 2 http://localhost:3001/api/health 2>/dev/null | grep -q '"ok":true' && break
  sleep 1
done
node scripts/pdpfeatures-captures-r62.mjs
EXIT=$?
kill $SRV 2>/dev/null; kill_port 3001
exit $EXIT
