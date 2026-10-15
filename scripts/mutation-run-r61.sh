#!/bin/bash
# Round-61 mutation battery — one mutation per invocation:
#   bash scripts/mutation-run-r61.sh <M1..M8>
# Each mutation: patch the source (python inline) → rebuild → run ONLY the
# srch-activerow spec → verify the predicted pins FAIL → revert byte-exact
# (md5-verified) → report. The r58/r59/r60 discipline.
set -u
cd /home/z/my-project/ecommerce-store || exit 1
M="${1:?mutation id required}"
SPEC=tests/e2e/srch-activerow-states.spec.ts
SRC=src/components/store/search-bar.tsx
B=/tmp/r61-searchbar-pristine.tsx
cp "$SRC" "$B"
MD5=$(md5sum "$SRC" | cut -d" " -f1)

patch_src() { python3 - "$@" <<'PY'
import sys, pathlib
mid = sys.argv[1]
p = pathlib.Path("src/components/store/search-bar.tsx")
src = p.read_text()

def apply(text, pairs):
    for old, new in pairs:
        if old not in text:
            print("PATCH ANCHOR NOT FOUND:", old[:70]); sys.exit(3)
        text = text.replace(old, new, 1)
    return text

if mid == "M1":
    # the container's listbox semantics dropped (role/id)
    src = apply(src, [("""            id="search-suggestions"
            role={suggestions.length > 0 ? "listbox" : undefined}
            aria-label="Search suggestions"
""", "")])
elif mid == "M2":
    # the rows' option semantics dropped (role/aria-selected/id)
    src = apply(src, [("""                role="option"
                id={`srch-opt-${s.slug}`}
                aria-selected={activeSlug === s.slug}
""", "")])
elif mid == "M3":
    # the arrow-key handler dropped (the keyboard model regresses to Tab-only)
    src = apply(src, [("  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {",
                       "  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {\n    if (e.key) return; // M3: the arrows never fire")])
elif mid == "M4":
    # the active row's accent paint dropped (aria survives, the visual dies)
    src = apply(src, [("""                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors",
                  activeSlug === s.slug && "bg-accent",
                )}""",
"""                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors",
                )}""")])
elif mid == "M5":
    # the Enter intercept broken (always submit the query — the commit dies)
    src = apply(src, [("    if (activeSlug) {", "    if (false && activeSlug) {")])
elif mid == "M6":
    # the query-change reset dropped (the stale highlight survives)
    src = apply(src, [("              setActiveSlug(null);", "              // M6: reset dropped")])
elif mid == "M7":
    # the price math broken (the formatCents guard catches it)
    src = apply(src, [("{formatCents(s.price)}", "{formatCents(s.price / 10)}")])
elif mid == "M8":
    # the input's combobox census dropped (role/expanded/controls/autocomplete)
    src = apply(src, [("""            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
""", "")])
else:
    print("unknown mutation", mid); sys.exit(2)

p.write_text(src)
print("patched", mid)
PY
}

restore() { cp "$B" "$SRC"; }

verify_pristine() {
  N=$(md5sum "$SRC" | cut -d" " -f1)
  if [ "$N" = "$MD5" ]; then
    echo "RESTORE OK (md5 byte-exact)"
  else
    echo "RESTORE FAILED — $N vs $MD5"
    exit 4
  fi
}

echo "=== $M: patching ==="
patch_src "$M" || exit 3

echo "=== $M: rebuilding ==="
bun run build > /tmp/r61-mutation-build.log 2>&1
if [ $? -ne 0 ]; then echo "BUILD FAILED under $M"; restore; exit 5; fi

echo "=== $M: running the spec ==="
bunx playwright test "$SPEC" 2>&1 | grep -E "✘|failed|passed" | tail -12
EXIT=$?

echo "=== $M: restoring ==="
restore
verify_pristine
exit $EXIT
