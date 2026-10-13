#!/bin/bash
# Round-54 mutation-style efficacy proofs (the r52/r53 discipline): for each
# mutation — md5 the original, apply ONE mutation, VERIFY THE DIFF (the
# stale-write trap), rebuild, run the FULL footer-states spec, record which
# pins fire, byte-exact revert (md5-verified).
#
# Usage: bash scripts/mutation-runner-r54.sh <set>   # set = 1 (M1-M4) | 2 (M5-M8)
set -u
cd /home/z/my-project/ecommerce-store || exit 1

FT=src/components/store/footer.tsx
AB=src/components/store/announcement-bar.tsx
SPEC=tests/e2e/footer-states.spec.ts
LOG=/tmp/r54-mutations.log
: > "$LOG"

md5() { md5sum "$1" | cut -d' ' -f1; }

run_spec() {
  pkill -f "standalone/server.js" 2>/dev/null; sleep 1
  E2E_PORT=3100 timeout 300 bunx playwright test "$SPEC" 2>&1 | grep -E "^ +[0-9]+ (passed|failed)|\[chromium\].*› P[0-9]+" | grep -vE "✓" | tail -10
}

F0=$(md5 "$FT"); A0=$(md5 "$AB")
echo "pristine: footer=$F0 announcement-bar=$A0" | tee -a "$LOG"

mutate() {
  local file="$1" name="$2" from="$3" to="$4" expect="$5"
  echo "" | tee -a "$LOG"
  echo "=== $name (file: $file; expect: $expect) ===" | tee -a "$LOG"
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
  bun run build > /tmp/r54-build.log 2>&1 || { echo "BUILD FAILED" | tee -a "$LOG"; return 1; }
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
  # M1 — the fix reverted on the Privacy span: the hover target /60 -> FULL.
  # The class pin (P10) and the behavioral pin (P11) both catch it — the
  # honest pair (the r53 M1 form).
  mutate "$FT" "M1-policy-hover-target-reverted (/60 -> full, Privacy)" \
    'text-xs text-background/40 hover:text-background/60 cursor-pointer transition-colors">Privacy Policy' \
    'text-xs text-background/40 hover:text-background cursor-pointer transition-colors">Privacy Policy' \
    "P10 + P11 (the honest pair — the fix's own regression)"

  # M2 — the fix reverted on the Cookie span: the per-span placement stripped
  # (the parent-inherited form). P10's class + computed assertions fire; P11
  # (Privacy-only) unaffected — the surgical placement catch.
  mutate "$FT" "M2-policy-placement-reverted (tokens stripped, Cookie)" \
    'text-xs text-background/40 hover:text-background/60 cursor-pointer transition-colors">Cookie Policy' \
    'hover:text-background/60 cursor-pointer transition-colors">Cookie Policy' \
    "exactly P10"

  # M3 — the Shop link's hover token removed: the class pin + the hover pin.
  mutate "$FT" "M3-shop-link-hover-removed" \
    'text-sm text-background/60 hover:text-background transition-colors"' \
    'text-sm text-background/60 transition-colors"' \
    "P5 + P6 (the honest pair)"

  # M4 — the Shop link's resting token broken: /60 -> /50.
  mutate "$FT" "M4-shop-link-resting-broken (/60 -> /50)" \
    'text-sm text-background/60 hover:text-background transition-colors"' \
    'text-sm text-background/50 hover:text-background transition-colors"' \
    "P5 + P6 (the honest pair — resting)"
else
  # M5 — the Shop heading's tracking-wider dropped.
  mutate "$FT" "M5-heading-tracking-wider-dropped" \
    'font-semibold text-sm uppercase tracking-wider mb-4">Shop' \
    'font-semibold text-sm uppercase mb-4">Shop' \
    "exactly P4"

  # M6 — the grid's lg:grid-cols-4 broken.
  mutate "$FT" "M6-grid-cols-broken (4 -> 3)" \
    'lg:grid-cols-4' \
    'lg:grid-cols-3' \
    "exactly P3"

  # M7 — the announcement bar's py-1.5 broken: 28px -> 26px.
  mutate "$AB" "M7-announcement-bar-py-broken (py-1.5 -> py-1)" \
    'text-center py-1.5 text-xs' \
    'text-center py-1 text-xs' \
    "P1 + P14 (the honest pair — the mobile height check)"

  # M8 — the cursor affordance dropped from the Privacy span.
  mutate "$FT" "M8-policy-cursor-affordance-dropped" \
    'text-xs text-background/40 hover:text-background/60 cursor-pointer transition-colors">Privacy Policy' \
    'text-xs text-background/40 hover:text-background/60 transition-colors">Privacy Policy' \
    "exactly P10"
fi

FF=$(md5 "$FT"); AF=$(md5 "$AB")
if [ "$FF" == "$F0" ] && [ "$AF" == "$A0" ]; then
  echo "" | tee -a "$LOG"
  echo "PRISTINE STATE RESTORED (footer $FF · announcement-bar $AF)" | tee -a "$LOG"
else
  echo "WARNING: final md5 footer=$FF announcement=$AF != pristine footer=$F0 announcement=$A0" | tee -a "$LOG"
fi
