#!/bin/bash
# Round-26 live re-verification battery — runs the ENTIRE battery in ONE
# invocation (the sandbox reaps background processes between tool calls,
# so the server + scripts must share one process-lifetime):
#   1. boots the production standalone server on :3000 (final build)
#   2. pixel sweep (8 routes, A/B paired) — home back IN the band
#   3. mobile-nav token parity (27th run, post header-unwrap)
#   4. standing watches (typeahead + carousel cadence)
#   5. full-route console census
#   6. kills the server BY PORT (the L25 lesson — never by pid pattern)
set -u
cd /home/z/my-project/ecommerce-store

echo "=== booting production server on :3000 ==="
env PORT=3000 NODE_ENV=production DATABASE_URL="file:../db/custom.db" \
  bun .next/standalone/server.js > server.log 2>&1 &
SERVER_BG=$!

for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 1
done
echo "health: $code (after ${i}s)"

echo ""
echo "=== [1/4] pixel sweep (8 routes) ==="
node scripts/sweep-session26.mjs 2>&1 | tail -12

echo ""
echo "=== [2/4] mobile-nav token parity (post header-unwrap) ==="
node scripts/mobile-nav-verify-session26.mjs 2>&1 | tail -20

echo ""
echo "=== [3/4] standing watches (typeahead + carousel) ==="
node scripts/watches-session26.mjs 2>&1 | tail -8

echo ""
echo "=== [4/4] console census (24 routes) ==="
node scripts/census-session26.mjs 2>&1 | tail -8

echo ""
echo "=== teardown ==="
fuser -k 3000/tcp 2>/dev/null || kill $SERVER_BG 2>/dev/null
sleep 1
(ss -ltn 2>/dev/null | grep ':3000' && echo "WARN: 3000 still up") || echo "3000 down — battery complete"
