#!/bin/bash
# Round-60 mutation battery — one mutation per invocation:
#   bash scripts/mutation-run-r60.sh <M1..M8>
# Each mutation: patch the source (python inline) → rebuild → run ONLY the
# pdptabs spec → verify the predicted pins FAIL → revert byte-exact
# (md5-verified) → report. The r58/r59 discipline.
set -u
cd /home/z/my-project/ecommerce-store || exit 1
M="${1:?mutation id required}"
SPEC=tests/e2e/pdptabs-states.spec.ts
SRC1=src/components/ui/tabs.tsx
SRC2=src/components/account/account-tabs.tsx
B1=/tmp/r60-tabs-pristine.tsx
B2=/tmp/r60-accounttabs-pristine.tsx
cp "$SRC1" "$B1"
cp "$SRC2" "$B2"
MD5_1=$(md5sum "$SRC1" | cut -d" " -f1)
MD5_2=$(md5sum "$SRC2" | cut -d" " -f1)

patch_src() { python3 - "$@" <<'PY'
import sys, pathlib
mid = sys.argv[1]
t1 = pathlib.Path("src/components/ui/tabs.tsx")
t2 = pathlib.Path("src/components/account/account-tabs.tsx")
tabs = t1.read_text()
acct = t2.read_text()

def apply(text, pairs):
    for old, new in pairs:
        if old not in text:
            print("PATCH ANCHOR NOT FOUND:", old[:70]); sys.exit(3)
        text = text.replace(old, new, 1)
    return text

if mid == "M1":
    # the capture-phase guard dropped (the Radix script focus returns)
    tabs = apply(tabs, [("""    onMouseDownCapture={(event) => {
      if (event.button === 0 && !event.ctrlKey && !event.defaultPrevented) {
        event.stopPropagation();
      }
    }}
""", "")])
elif mid == "M2":
    # the base list reverts to the account variant (overflow-x-auto returns)
    tabs = apply(tabs, [('"inline-flex h-9 items-center text-muted-foreground bg-secondary/50 rounded-xl p-1 w-full justify-start",',
                        '"inline-flex h-9 items-center text-muted-foreground bg-secondary/50 rounded-xl p-1 w-full justify-start overflow-x-auto",')])
elif mid == "M3":
    # the base trigger reverts to the account variant (gap-2 returns)
    tabs = apply(tabs, [('data-[state=active]:shadow rounded-lg",', 'data-[state=active]:shadow rounded-lg gap-2",')])
elif mid == "M4":
    # the account's overflow-x-auto override dropped (the variant drifts)
    acct = apply(acct, [('<TabsList className="overflow-x-auto">', '<TabsList>')])
elif mid == "M5":
    # the account's gap-2 overrides dropped (the icons lose their gap)
    acct = apply(acct, [(' className="gap-2"', "")])
elif mid == "M6":
    # the selected trigger's shadow dropped
    tabs = apply(tabs, [(' data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow rounded-lg",',
                        ' data-[state=active]:bg-background data-[state=active]:text-foreground rounded-lg",')])
elif mid == "M7":
    # the selected trigger's bg dropped
    tabs = apply(tabs, [(' data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow rounded-lg",',
                        ' data-[state=active]:text-foreground data-[state=active]:shadow rounded-lg",')])
elif mid == "M8":
    # the panel's mt-6 dropped (the 24px gap collapses)
    tabs = apply(tabs, [('focus-visible:ring-ring focus-visible:ring-offset-2 mt-6",',
                        'focus-visible:ring-ring focus-visible:ring-offset-2",')])
else:
    print("unknown mutation", mid); sys.exit(2)

t1.write_text(tabs)
t2.write_text(acct)
print("patched", mid)
PY
}

restore() {
  cp "$B1" "$SRC1"
  cp "$B2" "$SRC2"
}

verify_pristine() {
  N1=$(md5sum "$SRC1" | cut -d" " -f1)
  N2=$(md5sum "$SRC2" | cut -d" " -f1)
  if [ "$N1" = "$MD5_1" ] && [ "$N2" = "$MD5_2" ]; then
    echo "RESTORE OK (md5 byte-exact both files)"
  else
    echo "RESTORE FAILED — $N1 vs $MD5_1 / $N2 vs $MD5_2"
    exit 4
  fi
}

echo "=== $M: patching ==="
patch_src "$M" || exit 3

echo "=== $M: rebuilding ==="
bun run build > /tmp/r60-mutation-build.log 2>&1
if [ $? -ne 0 ]; then echo "BUILD FAILED under $M"; restore; exit 5; fi

echo "=== $M: running the spec ==="
bunx playwright test "$SPEC" 2>&1 | tail -6
EXIT=$?

echo "=== $M: restoring ==="
restore
verify_pristine
exit $EXIT
