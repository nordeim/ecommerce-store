#!/bin/bash
# Round-58 mutation battery — one mutation per invocation:
#   bash scripts/mutation-run-r58.sh <M1..M8>
# Each mutation: patch the source (python inline) → rebuild → run ONLY the
# searchpanel spec → verify the predicted pins FAIL → revert byte-exact
# (md5-verified) → report. The r56/r57 discipline.
set -u
cd /home/z/my-project/ecommerce-store || exit 1
M="${1:?mutation id required}"
SPEC=tests/e2e/searchpanel-states.spec.ts
SRC=src/components/store/search-bar.tsx
BACKUP=/tmp/r58-searchbar-pristine.tsx
cp "$SRC" "$BACKUP"
PRISTINE_MD5=$(md5sum "$SRC" | cut -d" " -f1)

patch_src() { python3 - "$@" <<'PY'
import sys, pathlib
src = pathlib.Path("src/components/store/search-bar.tsx")
text = src.read_text()
mid = sys.argv[1]
repls = {
  # M1: the Search button's size="sm" dropped (the default size returns)
  "M1": [('<Button type="submit" size="sm">', '<Button type="submit">')],
  # M2: the X Button element removed (the form's third child vanishes)
  "M2": [("""          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
""", "")],
  # M3: the X's icon h-4 → h-6 (the svg size token drift)
  "M3": [('<X className="h-4 w-4" />', '<X className="h-6 w-6" />')],
  # M4: the enter fade reverted to the old slide (the nonzero matrix returns)
  "M4": [('"animate-in fade-in duration-300"', '"animate-in slide-in-from-top-2 duration-300"')],
  # M5: the enter duration 300 → 100ms (the fade completes before the mid window)
  "M5": [('"animate-in fade-in duration-300"', '"animate-in fade-in duration-100"')],
  # M6: the exit driver's body dropped (no lock, no collapse, no fade — only the timeout)
  "M6": [("""    const h = el.offsetHeight;
    el.style.height = `${h}px`;
    el.style.overflow = "hidden"; // the exit-only clipper (REGISTER: the reference carries it at rest too; the clone's superset popover needs it OFF while open — the session-46 fix)
    void el.offsetHeight; // force the reflow so the transition runs from the locked height
    el.style.transition = "height 0.3s ease, opacity 0.3s ease";
    el.style.height = "0px";
    el.style.opacity = "0";
""", "")],
  # M7: the exit timeout 330 → 5000ms (the strip never unmounts in the window)
  "M7": [("setTimeout(() => setClosing(false), 330)", "setTimeout(() => setClosing(false), 5000)")],
  # M8: the X's onClick dropped (the affordance renders but does nothing)
  "M8": [("            onClick={() => setSearchOpen(false)}\n", "")],
}
if mid not in repls:
    print("unknown mutation", mid); sys.exit(2)
for old, new in repls[mid]:
    if old not in text:
        print("PATCH ANCHOR NOT FOUND:", mid, old[:60]); sys.exit(3)
    text = text.replace(old, new, 1)
src.write_text(text)
print("patched", mid)
PY
}

echo "=== $M: pristine md5 $PRISTINE_MD5 ==="
patch_src "$M" || exit 3
PATCHED_MD5=$(md5sum "$SRC" | cut -d" " -f1)
echo "=== $M: rebuilding ==="
bun run build > /tmp/mut-build.log 2>&1 || { echo "BUILD FAILED"; cp "$BACKUP" "$SRC"; exit 4; }

echo "=== $M: running the spec ==="
bunx playwright test "$SPEC" 2>&1 | grep -E "^  [0-9]+ (failed|passed)|›.*P[0-9]+" | grep -vE "✓" > /tmp/mut-fail.txt
FAILED=$(grep -c "failed" /tmp/mut-fail.txt || true)
echo "--- failed tests:"
grep -E "›" /tmp/mut-fail.txt | sed 's/.*› //; s/ .*//' || echo "(none)"

echo "=== $M: reverting ==="
cp "$BACKUP" "$SRC"
REVERT_MD5=$(md5sum "$SRC" | cut -d" " -f1)
if [ "$REVERT_MD5" = "$PRISTINE_MD5" ]; then
  echo "=== $M: REVERT BYTE-EXACT (md5 verified) ==="
else
  echo "!!! $M: REVERT MISMATCH $REVERT_MD5 vs $PRISTINE_MD5"
  exit 5
fi
