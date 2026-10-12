#!/bin/bash
# Round-53 mutation-style efficacy proofs (the r52 discipline): for each
# mutation — md5 the original, apply ONE mutation, VERIFY THE DIFF (the
# stale-write trap), rebuild, run the FULL heronav spec, record which pins
# fire, byte-exact revert (md5-verified). The fixless round's ENTIRE
# red-green rigor lives here — every pin must catch its mutation.
#
# Usage: bash scripts/mutation-runner-r53.sh <set>   # set = 1 (M1-M4) | 2 (M5-M8)
set -u
cd /home/z/my-project/ecommerce-store || exit 1

HC=src/components/store/hero-carousel.tsx
SPEC=tests/e2e/heronav-states.spec.ts
LOG=/tmp/r53-mutations.log
: > "$LOG"

md5() { md5sum "$1" | cut -d' ' -f1; }

run_spec() {
  pkill -f "standalone/server.js" 2>/dev/null; sleep 1
  E2E_PORT=3100 timeout 300 bunx playwright test "$SPEC" 2>&1 | grep -E "^ +[0-9]+ (passed|failed)|\[chromium\].*› P[0-9]+" | grep -vE "✓" | tail -10
}

H0=$(md5 "$HC")
echo "pristine: hero-carousel=$H0" | tee -a "$LOG"

mutate() {
  local name="$1" from="$2" to="$3" expect="$4"
  echo "" | tee -a "$LOG"
  echo "=== $name (expect: $expect) ===" | tee -a "$LOG"
  local before=$(md5 "$HC")
  python3 - "$HC" "$from" "$to" <<'EOF'
import sys
path, frm, to = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
assert s.count(frm) == 1, f"pattern count != 1: {frm[:60]!r} -> {s.count(frm)}"
open(path, "w").write(s.replace(frm, to))
EOF
  if [ $? -ne 0 ]; then echo "APPLY FAILED" | tee -a "$LOG"; return 1; fi
  # diff-verify with grep -cF (the r51 M1 lesson: regex-special chars blind grep)
  echo "  diff-verify: $(grep -cF "$to" "$HC") occurrence(s) of the mutated token" | tee -a "$LOG"
  bun run build > /tmp/r53-build.log 2>&1 || { echo "BUILD FAILED" | tee -a "$LOG"; return 1; }
  echo "  spec result (failing pins):" | tee -a "$LOG"
  run_spec | tee -a "$LOG"
  python3 - "$HC" "$to" "$from" <<'EOF'
import sys
path, to, frm = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
assert s.count(to) == 1, f"revert pattern count != 1: {to[:60]!r}"
open(path, "w").write(s.replace(to, frm))
EOF
  local after=$(md5 "$HC")
  if [ "$after" != "$before" ]; then echo "  REVERT MISMATCH: $after != $before" | tee -a "$LOG"; return 1; fi
  echo "  reverted byte-exact (md5 $after)" | tee -a "$LOG"
}

SET="${1:-1}"

# The prev/next arrows share their class string except left-4/right-4 — the
# left-4 anchor makes every arrow pattern unique (the count==1 assert).

if [ "$SET" = "1" ]; then
  mutate "M1-arrow-resting-bg-broken" \
    'left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md' \
    'left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/30 backdrop-blur-md' \
    "P2 (+ P3's before-read — the honest pair)"

  mutate "M2-arrow-hover-broken" \
    'absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors' \
    'absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors' \
    "P3"

  mutate "M3-arrow-blur-dropped" \
    'left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md' \
    'left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20' \
    "P2"

  mutate "M4-arrow-geometry-broken" \
    'left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full' \
    'left-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full' \
    "P1"
else
  mutate "M5-active-dot-width-broken" \
    'i === index ? "w-8 bg-white" : "w-2 bg-white/50"' \
    'i === index ? "w-6 bg-white" : "w-2 bg-white/50"' \
    "P6 + P9 (the honest two-pin catch)"

  mutate "M6-dot-transition-broken" \
    '"h-2 rounded-full transition-all duration-300"' \
    '"h-2 rounded-full transition-all duration-150"' \
    "P6 + P7 (the honest two-pin catch)"

  mutate "M7-crossfade-broken" \
    '"absolute inset-0 transition-opacity duration-700"' \
    '"absolute inset-0 transition-opacity duration-500"' \
    "P11"

  mutate "M8-pause-handler-dropped (the BEHAVIORAL mutation)" \
    'onMouseEnter={stopAuto}' \
    'onMouseEnter={undefined}' \
    "P13"
fi

FINAL=$(md5 "$HC")
if [ "$FINAL" == "$H0" ]; then
  echo "" | tee -a "$LOG"
  echo "PRISTINE STATE RESTORED (hero-carousel md5 $FINAL)" | tee -a "$LOG"
else
  echo "WARNING: final md5 $FINAL != pristine $H0" | tee -a "$LOG"
fi
