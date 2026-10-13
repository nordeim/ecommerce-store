#!/bin/bash
# Round-57 mutation-style efficacy proofs (the r52-r56 discipline): for each
# mutation — md5 the original, apply ONE mutation (count-verified — some
# targets appear 2 or 5 times in the file, the replace handles all and the
# revert restores all), VERIFY THE DIFF, rebuild, run the FULL
# orderdetail-states spec, record which pins fire, byte-exact revert
# (md5-verified). All eight target the detail page component — the round
# has ZERO production fixes, so the mutations are the spec's only teeth.
#
# Usage: bash scripts/mutation-runner-r57.sh <set>   # set = 1 (M1-M4) | 2 (M5-M8)
set -u
cd /home/z/my-project/ecommerce-store || exit 1

TSX="src/app/(storefront)/account/orders/[id]/page.tsx"
SPEC=tests/e2e/orderdetail-states.spec.ts
LOG=/tmp/r57-mutations.log
: > "$LOG"

md5() { md5sum "$1" | cut -d' ' -f1; }

run_spec() {
  pkill -f "standalone/server.js" 2>/dev/null; sleep 1
  E2E_PORT=3100 timeout 300 bunx playwright test "$SPEC" 2>&1 | grep -E "^ +[0-9]+ (passed|failed)|\[chromium\].*› P[0-9]+" | grep -vE "✓" | tail -12
}

# mutate <file> <name> <from> <to> <expect-count> <expected-pins>
mutate() {
  local file="$1" name="$2" from="$3" to="$4" want="$5" expect="$6"
  echo "" | tee -a "$LOG"
  echo "=== $name (expect: $expect) ===" | tee -a "$LOG"
  local before=$(md5 "$file")
  python3 - "$file" "$from" "$to" "$want" <<'EOF'
import sys
path, frm, to, want = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
s = open(path).read()
n = s.count(frm)
assert n == want, f"pattern count {n} != expected {want}: {frm[:60]!r}"
open(path, "w").write(s.replace(frm, to))
EOF
  if [ $? -ne 0 ]; then echo "APPLY FAILED" | tee -a "$LOG"; return 1; fi
  echo "  diff-verify: $(grep -cF "$to" "$file") occurrence(s) of the mutated token" | tee -a "$LOG"
  bun run build > /tmp/r57-build.log 2>&1 || { echo "BUILD FAILED" | tee -a "$LOG"; return 1; }
  echo "  spec result (failing pins):" | tee -a "$LOG"
  run_spec | tee -a "$LOG"
  python3 - "$file" "$to" "$from" "$want" <<'EOF'
import sys
path, to, frm, want = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
s = open(path).read()
n = s.count(to)
assert n == want, f"revert pattern count {n} != expected {want}: {to[:60]!r}"
open(path, "w").write(s.replace(to, frm))
EOF
  local after=$(md5 "$file")
  if [ "$after" != "$before" ]; then echo "  REVERT MISMATCH: $after != $before" | tee -a "$LOG"; return 1; fi
  echo "  reverted byte-exact (md5 $after)" | tee -a "$LOG"
}

SET="${1:-1}"

if [ "$SET" = "1" ]; then
  F_TSX=$(md5 "$TSX")
  echo "pristine: page.tsx=$F_TSX" | tee -a "$LOG"

  # M1: the pill's rounded-full -> rounded-lg (the base string, once in page.tsx — the history rows' pill lives in account-tabs.tsx)
  mutate "$TSX" "M1 pill rounded-full->rounded-lg" \
    "focus:ring-offset-2 rounded-full" "focus:ring-offset-2 rounded-lg" 1 "P4"
  # M2: the cards' rounded-2xl -> rounded-xl (ALL five occurrences — the 2x p-6 cards, the items card, the timeline card, the not-found block)
  mutate "$TSX" "M2 cards rounded-2xl->rounded-xl (x5)" \
    "bg-card rounded-2xl" "bg-card rounded-xl" 5 "P7"
  # M3: the item row's border dropped
  mutate "$TSX" "M3 item-row border dropped" \
    "flex items-center gap-4 p-4 rounded-xl border border-border/50" "flex items-center gap-4 p-4 rounded-xl" 1 "P8"
  # M4: the grid md:grid-cols-2 -> md:grid-cols-3
  mutate "$TSX" "M4 grid md:grid-cols-2->3" \
    "grid md:grid-cols-2 gap-4 mb-4" "grid md:grid-cols-3 gap-4 mb-4" 1 "P6"

  F2=$(md5 "$TSX")
  if [ "$F2" != "$F_TSX" ]; then echo "SET1 FINAL STATE != PRISTINE" | tee -a "$LOG"; exit 1; fi
  echo "SET 1 complete — final state pristine ($F2)" | tee -a "$LOG"
fi

if [ "$SET" = "2" ]; then
  F_TSX=$(md5 "$TSX")
  echo "pristine: page.tsx=$F_TSX" | tee -a "$LOG"

  # M5: the tracking link's hover:underline dropped
  mutate "$TSX" "M5 tracking hover:underline dropped" \
    "text-primary underline-offset-4 hover:underline" "text-primary underline-offset-4" 1 "P11"
  # M6: the header total's ml-auto dropped (the honest pair: P2's right-edge anchor + P5's locator)
  mutate "$TSX" "M6 total ml-auto dropped" \
    "text-2xl font-bold ml-auto" "text-2xl font-bold" 1 "P2+P5"
  # M7: the timeline circle h-8 w-8 -> h-6 w-6
  mutate "$TSX" "M7 timeline circle 32->24px" \
    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary" \
    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary" 1 "P10"
  # M8: the back button's rounded-xl dropped (BOTH occurrences — the header's + the not-found block's)
  mutate "$TSX" "M8 back-button rounded-xl dropped (x2)" \
    'size="sm" className="rounded-xl"' 'size="sm" className=""' 2 "P3"

  F2=$(md5 "$TSX")
  if [ "$F2" != "$F_TSX" ]; then echo "SET 2 FINAL STATE != PRISTINE" | tee -a "$LOG"; exit 1; fi
  echo "SET 2 complete — final state pristine ($F2)" | tee -a "$LOG"
fi
