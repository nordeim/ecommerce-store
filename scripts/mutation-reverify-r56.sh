#!/bin/bash
# Round-56 FOCUSED mutation re-verification: the P5/P14 hardening (the
# MO-time insertion-pose read replacing the first-rAF-frame read) changed
# the mechanism of exactly two pins — P5 (M5's catch + M1's pass-through)
# and P14 (a contract pin, no mutation target). Re-prove on the FINAL spec:
#   M1 (the from-pose reverted) -> exactly P4, P5 GREEN (ty 16 in the band)
#   M5 (the from-pose opacity 0.6) -> exactly P5 (the MO-time computed o)
# The other six mutations' target pins (P10/P11/P8/P10/P1/P2/P9/P13) are
# untouched by the hardening — verified on the pre-hardening spec (sets 1+2)
# with P10/P11 already re-verified post THEIR hardening (the set-1 re-run).
set -u
cd /home/z/my-project/ecommerce-store || exit 1

CSS=src/app/globals.css
SPEC=tests/e2e/toast-anim-states.spec.ts
LOG=/tmp/r56-mutations.log
md5() { md5sum "$1" | cut -d' ' -f1; }

run_spec() {
  pkill -f "standalone/server.js" 2>/dev/null; sleep 1
  E2E_PORT=3100 timeout 300 bunx playwright test "$SPEC" 2>&1 | grep -E "^ +[0-9]+ (passed|failed)|✘" | tail -6
}

mutate() {
  local file="$1" name="$2" from="$3" to="$4" expect="$5"
  echo "" | tee -a "$LOG"
  echo "=== $name [RE-VERIFY, final spec] (expect: $expect) ===" | tee -a "$LOG"
  local before=$(md5 "$file")
  python3 - "$file" "$from" "$to" <<'EOF'
import sys
path, frm, to = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
assert s.count(frm) == 1, f"pattern count != 1: {frm[:60]!r}"
open(path, "w").write(s.replace(frm, to))
EOF
  [ $? -ne 0 ] && { echo "APPLY FAILED" | tee -a "$LOG"; return 1; }
  echo "  diff-verify: $(grep -cF "$to" "$file") occurrence(s)" | tee -a "$LOG"
  bun run build > /tmp/r56-build.log 2>&1 || { echo "BUILD FAILED" | tee -a "$LOG"; return 1; }
  run_spec | tee -a "$LOG"
  python3 - "$file" "$to" "$from" <<'EOF'
import sys
path, to, frm = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
assert s.count(to) == 1
open(path, "w").write(s.replace(to, frm))
EOF
  local after=$(md5 "$file")
  [ "$after" != "$before" ] && { echo "  REVERT MISMATCH" | tee -a "$LOG"; return 1; }
  echo "  reverted byte-exact (md5 $after)" | tee -a "$LOG"
}

mutate "$CSS" "M1-recheck: the from-pose reverted (20px/0.95 -> 16px/0.96)" \
  "transform: translateY(20px) scale(0.95);" \
  "transform: translateY(16px) scale(0.96);" \
  "exactly P4 (P5 green: ty 16 in [14,24])"

mutate "$CSS" "M5-recheck: the from-pose opacity broken (0 -> 0.6)" \
  "opacity: 0;
    transform: translateY(20px) scale(0.95);" \
  "opacity: 0.6;
    transform: translateY(20px) scale(0.95);" \
  "exactly P5 (the MO-time computed o = 0.6)"

echo "" | tee -a "$LOG"; echo "RE-VERIFY COMPLETE" | tee -a "$LOG"
