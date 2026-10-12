#!/bin/bash
# Round-51 mutation-style efficacy proofs (r50's discipline mechanized):
# for each mutation — md5 the originals, apply ONE mutation, VERIFY THE
# DIFF (the stale-write trap), rebuild, run the FULL cardhover spec,
# record which pins fire, byte-exact revert (md5-verified), rebuild.
set -u
cd /home/z/my-project/ecommerce-store || exit 1

GC=src/app/globals.css
PC=src/components/store/product-card.tsx
SPEC=tests/e2e/cardhover-states.spec.ts
LOG=/tmp/r51-mutations.log
: > "$LOG"

md5() { md5sum "$1" | cut -d' ' -f1; }

run_spec() {
  pkill -f "standalone/server.js" 2>/dev/null; sleep 1
  E2E_PORT=3100 timeout 300 bunx playwright test "$SPEC" 2>&1 | grep -E "^ +[0-9]+ (passed|failed)|failed|passed \(" | tail -4
}

# ---- snapshot the pristine originals ----
GC0=$(md5 "$GC"); PC0=$(md5 "$PC")
echo "pristine: globals=$GC0 card=$PC0" | tee -a "$LOG"

mutate() {
  local name="$1" file="$2" from="$3" to="$4" expect_pins="$5"
  echo "" | tee -a "$LOG"
  echo "=== $name: $file: $from -> $to (expect: $expect_pins) ===" | tee -a "$LOG"
  local before=$(md5 "$file")
  # apply via python (exact string replace, single write — the stale-write trap)
  python3 - "$file" "$from" "$to" <<'EOF'
import sys
path, frm, to = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path).read()
assert s.count(frm) == 1, f"pattern count != 1: {frm[:60]!r} -> {s.count(frm)}"
open(path, "w").write(s.replace(frm, to))
EOF
  if [ $? -ne 0 ]; then echo "APPLY FAILED" | tee -a "$LOG"; return 1; fi
  echo "  diff-verify: $(grep -c "$to" "$file") occurrence(s) of the mutated token" | tee -a "$LOG"
  grep -n "$to" "$file" | head -2 | tee -a "$LOG"
  bun run build > /tmp/r51-build.log 2>&1 || { echo "BUILD FAILED" | tee -a "$LOG"; cp "/tmp/r51-orig-$name" "$file" 2>/dev/null; return 1; }
  echo "  spec result:" | tee -a "$LOG"
  run_spec | tee -a "$LOG"
  # byte-exact revert
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
  bun run build > /tmp/r51-build.log 2>&1 || return 1
}

mutate "M1-blur-pin-reverted" "$GC" \
  "  --blur-sm: 4px;" \
  "  /* M1 */ --blur-sm: 8px;" \
  "P1"

mutate "M2-lift-broken" "$PC" \
  "shadow-sm hover:shadow-xl transition-all duration-300" \
  "shadow-sm hover:shadow-lg transition-all duration-300" \
  "P2"

mutate "M3-zoom-broken" "$PC" \
  "group-hover:scale-105" \
  "group-hover:scale-110" \
  "P4"

mutate "M4-hidden-broken" "$PC" \
  "p-3 translate-y-full group-hover:translate-y-0" \
  "p-3 translate-y-0 group-hover:translate-y-0" \
  "P6 (+P12 honestly)"

mutate "M5-btnhover-broken" "$PC" \
  "bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 text-xs w-full rounded-xl shadow-lg" \
  "bg-primary text-primary-foreground h-8 px-3 text-xs w-full rounded-xl shadow-lg" \
  "P7"

mutate "M6-titlehover-broken" "$PC" \
  "line-clamp-2 group-hover:text-primary transition-colors" \
  "line-clamp-2 transition-colors" \
  "P5"

echo "" | tee -a "$LOG"
echo "FINAL VERIFY (post all reverts): globals=$(md5 "$GC") [pristine $GC0] · card=$(md5 "$PC") [pristine $PC0]" | tee -a "$LOG"
