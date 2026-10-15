#!/bin/bash
# Round-62 mutation battery — one mutation per invocation:
#   bash scripts/mutation-run-r62.sh <M1..M8>
# Each mutation: patch the source (python inline) → rebuild → run ONLY the
# pdpfeatures spec → verify the predicted pins FAIL → revert byte-exact
# (md5-verified) → report. The r58/r59/r60/r61 discipline. This round the
# mutations target the PDP page (a SERVER component — the rebuild carries
# the change into the standalone, the r61 cost curve).
set -u
cd /home/z/my-project/ecommerce-store || exit 1
M="${1:?mutation id required}"
SPEC=tests/e2e/pdpfeatures-states.spec.ts
SRC="src/app/(storefront)/product/[slug]/page.tsx"

# The stale-server trap (this round's discovery): playwright's
# reuseExistingServer keeps a :3100 server alive between invocations,
# and the rebuild swaps the chunks under the running process — the next
# login renders the "This page couldn't load" platform error page and
# the setup dies at its 45s waitForURL. Kill the port BEFORE the build.
PIDS=$(ss -ltnp 2>/dev/null | grep ":3100 " | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u)
[ -n "$PIDS" ] && kill -9 $PIDS 2>/dev/null; sleep 1

B=/tmp/r62-pdppage-pristine.tsx
cp "$SRC" "$B"
MD5=$(md5sum "$SRC" | cut -d" " -f1)

patch_src() { python3 - "$@" <<'PY'
import sys, pathlib
mid = sys.argv[1]
p = pathlib.Path("src/app/(storefront)/product/[slug]/page.tsx")
src = p.read_text()

def apply(text, pairs):
    for old, new in pairs:
        if old not in text:
            print("PATCH ANCHOR NOT FOUND:", old[:70]); sys.exit(3)
        text = text.replace(old, new, 1)
    return text

if mid == "M1":
    # the h3's margin classes dropped (the rhythm dies)
    src = apply(src, [('<h3 className="text-lg font-semibold mt-4 mb-2">Key Features</h3>',
                       '<h3 className="text-lg font-semibold">Key Features</h3>')])
elif mid == "M2":
    # the ul's spacing doubled (the pitch + the height break)
    src = apply(src, [('<ul className="space-y-2">', '<ul className="space-y-4">')])
elif mid == "M3":
    # the li's icon->text gap dropped
    src = apply(src, [('<li key={f} className="flex items-center gap-2 text-muted-foreground">',
                       '<li key={f} className="flex items-center text-muted-foreground">')])
elif mid == "M4":
    # the icon's primary color dropped (inherits the muted row color)
    src = apply(src, [('<Check className="h-4 w-4 text-primary" />',
                       '<Check className="h-4 w-4" />')])
elif mid == "M5":
    # the icon's size bumped (h-4 w-4 -> h-5 w-5)
    src = apply(src, [('<Check className="h-4 w-4 text-primary" />',
                       '<Check className="h-5 w-5 text-primary" />')])
elif mid == "M6":
    # the li's muted color dropped (inherits the foreground)
    src = apply(src, [('<li key={f} className="flex items-center gap-2 text-muted-foreground">',
                       '<li key={f} className="flex items-center gap-2">')])
elif mid == "M7":
    # the h3's heading text changed
    src = apply(src, [('<h3 className="text-lg font-semibold mt-4 mb-2">Key Features</h3>',
                       '<h3 className="text-lg font-semibold mt-4 mb-2">Product Features</h3>')])
elif mid == "M8":
    # the wrapper's dead-prose classes dropped (the DOM parity dies)
    src = apply(src, [('className="prose prose-sm max-w-none"',
                       'className="max-w-none"')])
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
bun run build > /tmp/r62-mutation-build.log 2>&1
if [ $? -ne 0 ]; then echo "BUILD FAILED under $M"; restore; exit 5; fi

echo "=== $M: running the spec ==="
bunx playwright test "$SPEC" 2>&1 | grep -E "✘|✓ [0-9]+ \[chromium\].*P[0-9]+|failed|passed" | tail -20
EXIT=$?

echo "=== $M: restoring ==="
restore
verify_pristine
exit $EXIT
