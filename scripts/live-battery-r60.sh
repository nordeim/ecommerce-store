#!/bin/bash
# Round-60 pre-change live battery — the standing parity layer in ONE
# invocation (the sandbox reaps background processes between tool calls):
#   1. boots the production standalone server on :3000 (final build)
#   2. pixel sweep (8 routes, A/B paired; L38-hardened ref login)
#   3. mobile-nav token parity (79th run — the standing protocol)
#   4. standing watches (typeahead + carousel cadence + SEO layer)
#   5. full-route console census (24 routes + 11 admin surfaces)
#   6. kills the server BY PORT (the L25 lesson — never by pid pattern)
set -u
cd /home/z/my-project/ecommerce-store

echo "=== booting production server on :3000 ==="
env PORT=3000 NODE_ENV=production DATABASE_URL="file:../db/custom.db" \
  bun .next/standalone/server.js > server.log 2>&1 &
SERVER_BG=$!

for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 1
done
echo "health: $code (after ${i}s)"

echo ""
echo "=== [1/4] pixel sweep (8 routes) ==="
node scripts/sweep-session42.mjs 2>&1 | tail -12

echo ""
echo "=== [2/4] mobile-nav token parity (79th run) ==="
node scripts/mobile-nav-verify-session42.mjs 2>&1 | tail -20

echo ""
echo "=== [3/4] standing watches (typeahead + carousel + SEO) ==="
node scripts/watches-session42.mjs 2>&1 | tail -10

echo ""
echo "=== [4/4] console census (24 routes + 11 admin) ==="
node scripts/census-session42.mjs 2>&1 | tail -10

echo ""
echo "=== teardown ==="
kill $(ss -ltnp 2>/dev/null | grep ":3000" | grep -oP "pid=\K[0-9]+" | head -1) 2>/dev/null; kill $SERVER_BG 2>/dev/null
sleep 1
(ss -ltn 2>/dev/null | grep ':3000' && echo "WARN: 3000 still up") || echo "3000 down — battery complete"
