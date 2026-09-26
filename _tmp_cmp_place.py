import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

base = pathlib.Path(r"D:\Configurator-Clodis-ThreeJS-23 с 10.08")
d44 = next(p for p in base.iterdir() if p.is_dir() and p.name.startswith("1.44"))
d45 = next(p for p in base.iterdir() if p.is_dir() and p.name.startswith("1.45"))
d46 = next(p for p in base.iterdir() if p.is_dir() and p.name.startswith("1.46"))
cur = pathlib.Path(r"D:\Configurator-Clodis-ThreeJS-24\Configurator-Clodis-ThreeJS-7")


def pick(root, name, parents):
    hits = [
        h
        for h in root.rglob(name)
        if all(p in h.parts for p in parents)
    ]
    return hits[0] if hits else None


def trio(root):
    return (
        pick(root, "section-manager.js", ("js", "sections")),
        pick(root, "furniture-manager.js", ("js", "furniture")),
        pick(root, "furniture-bbox.js", ("js", "furniture")),
    )


paths = {
    "44": trio(d44),
    "45stock": trio(d45),
    "46": trio(d46),
    "cur": trio(cur),
}
print("roots", d44.name, d45.name, d46.name)
for k, v in paths.items():
    print(k)
    for p in v:
        print(" ", p)


def extract_fn(text, name, max_lines=180):
    m = re.search(rf"function {re.escape(name)}\s*\(", text)
    if not m:
        return None
    start = m.start()
    lines = text[start:].splitlines()
    out = []
    depth = 0
    started = False
    for i, line in enumerate(lines):
        out.append(line)
        depth += line.count("{") - line.count("}")
        if "{" in line:
            started = True
        if started and depth <= 0:
            break
        if i >= max_lines:
            out.append("...TRUNC...")
            break
    return "\n".join(out)


needles = [
    "function _placeFurnitureInZone",
    "function _fitFurnitureBBoxToZoneBounds",
    "function _snapNicheWorldBBoxToZone",
    "function _zoneFitAnchorEdge",
    "tryApplyDoorPairCatalogSwap",
    "REBUILD-SKIP",
    "PLACE-ADOPT",
    "computeFurnitureZoneFitWorldBBox",
    "__cldSnapNicheFurnitureRoot",
    "_snapAllNicheFurnitureInSectionToZones",
    "fitFurnitureToSectionZone",
]


def count(p, s):
    if not p or not p.exists():
        return -1
    return p.read_text(encoding="utf-8", errors="replace").count(s)


print("\n==== counts ====")
for label, (s, f, b) in paths.items():
    print(f"\n-- {label} --")
    for n in needles:
        print(f"  {n:45s} sm={count(s, n):3d} fm={count(f, n):3d} bb={count(b, n):3d}")

print("\n==== _placeFurnitureInZone ====")
for label, (s, f, b) in paths.items():
    t = s.read_text(encoding="utf-8", errors="replace") if s else ""
    fn = extract_fn(t, "_placeFurnitureInZone")
    print(f"\n##### {label} #####")
    print(fn or "MISSING")

print("\n==== _zoneFitAnchorEdge ====")
for label, (s, f, b) in paths.items():
    t = s.read_text(encoding="utf-8", errors="replace") if s else ""
    fn = extract_fn(t, "_zoneFitAnchorEdge")
    print(f"\n##### {label} #####")
    print(fn or "MISSING")

print("\n==== door-pair vs zonePos order ====")
for label, (s, f, b) in paths.items():
    t = s.read_text(encoding="utf-8", errors="replace") if s else ""
    i_swap = t.find("tryApplyDoorPairCatalogSwap")
    i_pos = t.find("getZonePivotWorldPosition")
    i_place = t.find("_placeFurnitureInZone(")
    i_fit = t.find("_fitFurnitureBBoxToZoneBounds(")
    print(
        label,
        "swap",
        i_swap,
        "zonePos",
        i_pos,
        "place",
        i_place,
        "fit",
        i_fit,
        "swap_before_zonePos",
        i_swap >= 0 and i_pos >= 0 and i_swap < i_pos,
    )
