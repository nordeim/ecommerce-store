#!/bin/bash
# Round-55 mutation-style efficacy proofs (the r52/r53/r54 discipline): for
# each mutation — md5 the original, apply ONE mutation, VERIFY THE DIFF (the
# stale-write trap), rebuild, run the FULL headericons-states spec, record
# which pins fire, byte-exact revert (md5-verified).
#
# Usage: bash scripts/mutation-runner-r55.sh <set>   # set = 1 (M1-M4) | 2 (M5-M8)
set -u
cd /home/z/my-project/ecommerce-store || exit 1

HD=src/components/store/header.tsx
SPEC=tests/e2e/headericons-states.spec.ts
LOG=/tmp/r55-mutations.log
: > "$LOG"

md5() { md5sum "$1" | cut -d' ' -f1; }

run_spec() {
  pkill -f "standalone/server.js" 2>/dev/null; sleep 1
  E2E_PORT=3100 timeout 300 bunx playwright test "$SPEC" 2>&1 | grep -E "^ +[0-9]+ (passed|failed)|\[chromium\].*› P[0-9]+" | grep -vE "✓" | tail -10
}

F0=$(md5 "$HD")
echo "pristine: header=$F0" | tee -a "$LOG"

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
  bun run build > /tmp/r55-build.log 2>&1 || { echo "BUILD FAILED" | tee -a "$LOG"; return 1; }
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
  # M1 — THE FIX REVERTED: the pluralization ternary -> the constant plural.
  # P11's singular read breaks (the fix's own regression pin).
  mutate "$HD" "M1-fix-reverted (pluralization -> constant items)" \
    'Cart, ${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}' \
    'Cart, ${cart.itemCount} items' \
    "P11 (the fix's own regression)"

  # M2 — the badge's bg broken: bg-primary -> bg-secondary. P10's computed
  # bg catch.
  mutate "$HD" "M2-badge-bg (bg-primary -> bg-secondary)" \
    'h-4 min-w-4 px-1 bg-primary text-primary-foreground' \
    'h-4 min-w-4 px-1 bg-secondary text-primary-foreground' \
    "P10"

  # M3 — the badge's position broken: -top-1 -right-2 -> top-0 right-0.
  # P10's class + geometry catches.
  mutate "$HD" "M3-badge-position (-top-1 -right-2 -> top-0 right-0)" \
    'absolute -top-1 -right-2 h-4 min-w-4' \
    'absolute top-0 right-0 h-4 min-w-4' \
    "P10"

  # M4 — the bag's positioning anchor dropped: className="relative" removed.
  # The badge escapes to the nearest positioned ancestor — P10's geometry
  # catch (the structural half of the badge contract).
  mutate "$HD" "M4-bag-anchor (relative dropped)" \
    'size="icon"
          className="relative"' \
    'size="icon"
          className=""' \
    "P10 (the badge escapes)"
else
  # M5 — an aria-label dropped: the Wishlist button's label removed. P9's
  # superset-aria catch.
  mutate "$HD" "M5-aria-dropped (Wishlist label)" \
    '<Button variant="ghost" size="icon" aria-label="Wishlist">' \
    '<Button variant="ghost" size="icon">' \
    "P9"

  # M6 — the search's aria-expanded dropped (the session-46 toggle state).
  # P9's expanded-state catch.
  mutate "$HD" "M6-aria-expanded-dropped (search toggle state)" \
    'aria-expanded={searchOpen}' \
    'data-mutated="true"' \
    "P9"

  # M7 — the search svg's class broken: h-5 w-5 -> h-6 w-6. The COMPUTED
  # stays 16px (the [&_svg]:size-4 descendant utility still wins) — P3's
  # class-string pin catches what the computed cannot (the pin's
  # independent value proven).
  mutate "$HD" "M7-svg-class (h-5 w-5 -> h-6 w-6, computed stays 16)" \
    '<Search className="h-5 w-5" />' \
    '<Search className="h-6 w-6" />' \
    "P3 (the class-string catch, NOT the computed)"

  # M8 — the cluster's gap broken: gap-1 -> gap-2. The geometry arithmetic
  # shifts every button past the first — P1 + P2 (the honest pair).
  mutate "$HD" "M8-cluster-gap (gap-1 -> gap-2)" \
    '<div className="flex items-center gap-1">' \
    '<div className="flex items-center gap-2">' \
    "P1 + P2 (the honest pair)"
fi

echo "" | tee -a "$LOG"
echo "final md5: $(md5 "$HD") (pristine $F0)" | tee -a "$LOG"
