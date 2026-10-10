#!/bin/bash
# Round-35 battery boot: the production standalone on :3000 (the exact
# shipped artifact that ran the 246/246 E2E gate), kept alive across tool
# calls via nohup (the L26 sandbox-reap workaround).
cd /home/z/my-project/ecommerce-store
nohup env PORT=3000 NODE_ENV=production HOSTNAME=localhost \
  DATABASE_URL="file:../db/custom.db" \
  bun .next/standalone/server.js > /tmp/server-r35.log 2>&1 &
echo "booted pid $!"
sleep 4
for i in $(seq 1 10); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-time 5)
  if [ "$code" = "200" ]; then echo "server up: $code"; exit 0; fi
  sleep 2
done
echo "SERVER FAILED TO BOOT"; tail -20 /tmp/server-r35.log; exit 1
