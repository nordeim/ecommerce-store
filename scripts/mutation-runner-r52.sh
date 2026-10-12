#!/bin/bash
# Round-52 mutation-style efficacy proofs (the r51 discipline mechanized):
# for each mutation — md5 the original, apply ONE mutation, VERIFY THE DIFF
# (the stale-write trap), rebuild, run the FULL buypanel spec, record which
# pins fire, byte-exact revert (md5-verified). The fixless round's ENTIRE
# red-green rigor lives here — every pin must catch its mutation.
#
# Usage: bash scripts/mutation-runner-r52.sh <set>   # set = 1 (M1-M4) | 2 (M5-M8)
set -u
cd /home/z/my-project/ecommerce-store || exit 1

BTN=src/components/ui/button.tsx
CC=src/components/store/category-card.tsx
BP=src/components/store/buy-panel.tsx
SPEC=tests/e2e/buypanel-states.spec.ts
LOG=/tmp/r52-mutations.log
: > "$LOG"

md5() { md5sum "$1" | cut -d' ' -f1; }

run_spec() {
  pkill -f "standalone/server.js" 2>/dev/null; sleep 1
  E2E_PORT=3100 timeout 300 bunx playwright test "$SPEC" 2>&1 | grep -E "^ +[0-9]+ (passed|failed)|\[chromium\].*› P[0-9]+" | grep -vE "✓" | tail -8
}

B0=$(md5 "$BTN"); C0=$(md5 "$CC"); P0=$(md5 "$BP")
echo "pristine: button=$B0 card=$CC0 panel=$P0" | tee -a "$LOG"

mutate() {
  local name="$1" file="$2" from="$3" to="$4" expect="$5"
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
  # diff-verify with grep -F (the r51 M1 lesson: regex-special chars blind grep)
  echo "  diff-verify: $(grep -cF "$to" "$file") occurrence(s) of the mutated token" | tee -a "$LOG"
  bun run build > /tmp/r52-build.log 2>&1 || { echo "BUILD FAILED" | tee -a "$LOG"; return 1; }
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
  mutate "M1-atc-shadow-dropped" "$BTN" \
    'default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",' \
    'default: "bg-primary text-primary-foreground hover:bg-primary/90",' \
    "P2"

  mutate "M2-atc-hover-broken" "$BTN" \
    'default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",' \
    'default: "bg-primary text-primary-foreground shadow hover:bg-primary/80",' \
    "P3"

  mutate "M3-heart-hover-broken" "$BTN" \
    'outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",' \
    'outline: "border border-input bg-transparent shadow-sm hover:bg-secondary hover:text-accent-foreground",' \
    "P6"

  mutate "M4-feature-tile-broken" "$CC" \
    'className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center mb-3"' \
    'className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mb-3"' \
    "P11"
else
  mutate "M5-category-icon-broken" "$CC" \
    '<Icon className="h-6 w-6 text-accent-foreground group-hover:text-primary transition-colors" />' \
    '<Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />' \
    "P12"

  mutate "M6-ring-dropped" "$BTN" \
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring' \
    'focus-visible:outline-none focus-visible:ring-ring' \
    "P4 + P13 (the honest two-pin catch)"

  mutate "M7-stepper-hover-broken" "$BP" \
    'className="p-3 hover:bg-secondary transition-colors rounded-l-xl"' \
    'className="p-3 hover:bg-accent transition-colors rounded-l-xl"' \
    "P8"

  mutate "M8-span-broken" "$BP" \
    '<span className="px-5 font-medium min-w-[3rem] text-center">{quantity}</span>' \
    '<span className="px-5 font-normal min-w-[3rem] text-center">{quantity}</span>' \
    "P9"
fi

echo "" | tee -a "$LOG"
echo "FINAL VERIFY (post set $SET reverts): button=$(md5 "$BTN") [pristine $B0] · card=$(md5 "$CC") [pristine $C0] · panel=$(md5 "$BP") [pristine $P0]" | tee -a "$LOG"
# restore the clean artifact for the next set / the full gate
bun run build > /tmp/r52-build.log 2>&1 && echo "clean rebuild OK" | tee -a "$LOG"
