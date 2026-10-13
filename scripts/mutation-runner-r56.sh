#!/bin/bash
# Round-56 mutation-style efficacy proofs (the r52-r55 discipline): for each
# mutation — md5 the original, apply ONE mutation, VERIFY THE DIFF (the
# stale-write trap), rebuild, run the FULL toast-anim-states spec, record
# which pins fire, byte-exact revert (md5-verified).
#
# Usage: bash scripts/mutation-runner-r56.sh <set>   # set = 1 (M1-M4) | 2 (M5-M8)
set -u
cd /home/z/my-project/ecommerce-store || exit 1

CSS=src/app/globals.css
TSX=src/components/store/toast-viewport.tsx
PROV=src/components/store/store-provider.tsx
SPEC=tests/e2e/toast-anim-states.spec.ts
LOG=/tmp/r56-mutations.log
: > "$LOG"

md5() { md5sum "$1" | cut -d' ' -f1; }

run_spec() {
  pkill -f "standalone/server.js" 2>/dev/null; sleep 1
  E2E_PORT=3100 timeout 300 bunx playwright test "$SPEC" 2>&1 | grep -E "^ +[0-9]+ (passed|failed)|\[chromium\].*› P[0-9]+" | grep -vE "✓" | tail -12
}

mutate() {
  local file="$1" name="$2" from="$3" to="$4" expect="$5"
  echo "" | tee -a "$LOG"
  echo "=== $name (expect: $expect) ===" | tee -a "$LOG"
  local before=$(md5 "$file")
  python3 - "$file" "$from" "$to" <<'EOF'
import sys
path, frm, to = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
assert s.count(frm) == 1, f"pattern count != 1: {frm[:60]!r} -> {s.count(frm)}"
open(path, "w").write(s.replace(frm, to))
EOF
  if [ $? -ne 0 ]; then echo "APPLY FAILED" | tee -a "$LOG"; return 1; fi
  # diff-verify with grep -cF (the r51 M1 lesson: regex-special chars blind grep)
  echo "  diff-verify: $(grep -cF "$to" "$file") occurrence(s) of the mutated token" | tee -a "$LOG"
  bun run build > /tmp/r56-build.log 2>&1 || { echo "BUILD FAILED" | tee -a "$LOG"; return 1; }
  echo "  spec result (failing pins):" | tee -a "$LOG"
  run_spec | tee -a "$LOG"
  python3 - "$file" "$to" "$from" <<'EOF'
import sys
path, to, frm = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
assert s.count(to) == 1, f"revert pattern count != 1: {to[:60]!r}"
open(path, "w").write(s.replace(to, frm))
EOF
  local after=$(md5 "$file")
  if [ "$after" != "$before" ]; then echo "  REVERT MISMATCH: $after != $before" | tee -a "$LOG"; return 1; fi
  echo "  reverted byte-exact (md5 $after)" | tee -a "$LOG"
}

SET="${1:-1}"

if [ "$SET" = "1" ]; then
  F_CSS=$(md5 "$CSS")
  echo "pristine: globals.css=$F_CSS" | tee -a "$LOG"

  # M1 — THE FIX #1 REVERTED: the from-pose back to the session-4
  # approximation. P4's CSSOM pin fires (the rule reads 16px/0.96).
  mutate "$CSS" "M1: the from-pose reverted (20px/0.95 -> 16px/0.96)" \
    "transform: translateY(20px) scale(0.95);" \
    "transform: translateY(16px) scale(0.96);" \
    "P4 (P5 stays green — the behavioral band covers both poses)"

  # M2 — THE FIX #2 REVERTED: the exit fade back to the ease-in. P10's
  # declared TF + P11's mid-exit character both fire.
  mutate "$CSS" "M2: the exit fade reverted (easeOutQuad -> ease-in)" \
    "transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);" \
    "transition-timing-function: cubic-bezier(0.4, 0, 1, 1);" \
    "P10 + P11"

  # M3 — THE EXIT TARGET BROKEN: the exit pose thrown to -30px/0.8. P10's
  # CSSOM target assertion fires.
  mutate "$CSS" "M3: the exit target broken (-10px/0.95 -> -30px/0.8)" \
    "transform: translateY(-10px) scale(0.95);" \
    "transform: translateY(-30px) scale(0.8);" \
    "P10"

  # M4 — THE ENTER DURATION BROKEN: the opacity transition 300 -> 100ms.
  # P8's computed duration pin fires (0.1s, 0.3s != 0.3s, 0.3s).
  mutate "$CSS" "M4: the enter duration broken (opacity 300ms -> 100ms)" \
    "opacity 300ms cubic-bezier(0.34, 1.56, 0.64, 1)," \
    "opacity 100ms cubic-bezier(0.34, 1.56, 0.64, 1)," \
    "P8"
else
  F_CSS=$(md5 "$CSS"); F_TSX=$(md5 "$TSX"); F_PROV=$(md5 "$PROV")
  echo "pristine: globals.css=$F_CSS toast-viewport=$F_TSX store-provider=$F_PROV" | tee -a "$LOG"

  # M5 — THE FROM-POSE OPACITY BROKEN: the @starting-style opacity 0 -> 0.6.
  # P5's first-frame read fires (o ~0.6 > 0.05); P4's substring check still
  # passes ("opacity: 0.6" contains "opacity: 0") — the behavioral pin is
  # the discriminator.
  mutate "$CSS" "M5: the from-pose opacity broken (0 -> 0.6)" \
    "opacity: 0;
    transform: translateY(20px) scale(0.95);" \
    "opacity: 0.6;
    transform: translateY(20px) scale(0.95);" \
    "P5"

  # M6 — THE REGION STACK BROKEN: gap-2 -> gap-6. P1's computed gap fires.
  mutate "$TSX" "M6: the region stack broken (gap-2 -> gap-6)" \
    "flex flex-col gap-2 pointer-events-none" \
    "flex flex-col gap-6 pointer-events-none" \
    "P1"

  # M7 — THE RESTING RADIUS BROKEN: rounded-xl -> rounded-lg. P2's class
  # string + radius fire.
  mutate "$TSX" "M7: the resting radius broken (rounded-xl -> rounded-lg)" \
    "rounded-xl shadow-2xl" \
    "rounded-lg shadow-2xl" \
    "P2"

  # M8 — THE TRIGGER BROKEN: the exiting timeout 3000 -> 1000ms. P9's
  # trigger window + P13's dwell both fire (the toast gone before 2900/2800).
  mutate "$PROV" "M8: the trigger broken (3000ms -> 1000ms)" \
    "}, 3000);" \
    "}, 1000);" \
    "P9 + P13"
fi

echo "" | tee -a "$LOG"
echo "SET $SET COMPLETE" | tee -a "$LOG"
