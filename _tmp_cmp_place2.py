import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

base = pathlib.Path(r"D:\Configurator-Clodis-ThreeJS-23 с 10.08")
d45 = next(p for p in base.iterdir() if p.is_dir() and p.name.startswith("1.45"))
d46 = next(p for p in base.iterdir() if p.is_dir() and p.name.startswith("1.46"))
cur = pathlib.Path(r"D:\Configurator-Clodis-ThreeJS-24\Configurator-Clodis-ThreeJS-7")


def pick(root, name, parents):
    hits = [h for h in root.rglob(name) if all(p in h.parts for p in parents)]
    return hits[0] if hits else None


def extract_fn(text, name, max_lines=250):
    m = re.search(rf"function {re.escape(name)}\s*\(", text)
    if not m:
        return None
    lines = text[m.start() :].splitlines()
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


def snippet_around(text, needle, before=8, after=40):
    i = text.find(needle)
    if i < 0:
        return "MISSING " + needle
    start = text.rfind("\n", 0, i)
    # find line number-ish by counting from a later unique occurrence in updateFurniture
    return text[max(0, i - 400) : i + 1800]


files = {
    "45stock": pick(d45, "section-manager.js", ("js", "sections")),
    "46": pick(d46, "section-manager.js", ("js", "sections")),
    "cur": pick(cur, "section-manager.js", ("js", "sections")),
}
fms = {
    "45stock": pick(d45, "furniture-manager.js", ("js", "furniture")),
    "46": pick(d46, "furniture-manager.js", ("js", "furniture")),
    "cur": pick(cur, "furniture-manager.js", ("js", "furniture")),
}
bbs = {
    "45stock": pick(d45, "furniture-bbox.js", ("js", "furniture")),
    "46": pick(d46, "furniture-bbox.js", ("js", "furniture")),
    "cur": pick(cur, "furniture-bbox.js", ("js", "furniture")),
}

print("==== _layoutBBoxForZoneFit / computeFurniture used in fit ====")
for label, p in files.items():
    t = p.read_text(encoding="utf-8", errors="replace")
    fn = extract_fn(t, "_layoutBBoxForZoneFit") or extract_fn(t, "_bboxForZoneFit")
    print(f"\n##### {label} _layoutBBoxForZoneFit #####")
    print(fn or "MISSING")
    for n in [
        "computeFurnitureWorldBBoxNoAo",
        "computeFurnitureLayoutWorldBBoxNoAo",
        "computeFurnitureZoneFitWorldBBox",
        "computeFurnitureCorpusLayoutWorldBBoxNoAo",
    ]:
        print(" ", n, t.count(n))

print("\n==== _fitFurnitureBBoxToZoneBounds (first 120 lines) ====")
for label, p in files.items():
    t = p.read_text(encoding="utf-8", errors="replace")
    fn = extract_fn(t, "_fitFurnitureBBoxToZoneBounds", 160)
    print(f"\n##### {label} #####")
    print("\n".join((fn or "MISSING").splitlines()[:90]))

print("\n==== relayout: door-pair / zonePos / place order =====")
for label, p in files.items():
    t = p.read_text(encoding="utf-8", errors="replace")
    # find inside updateFurnitureInSection
    m = re.search(r"function updateFurnitureInSection\s*\(", t)
    body = t[m.start() : m.start() + 25000] if m else t
    keys = [
        "tryApplyDoorPairCatalogSwap",
        "grp.position.copy(zonePos)",
        "_placeFurnitureInZone",
        "_fitFurnitureBBoxToZoneBounds",
        "alignFurnitureBBoxToSectionInnerBounds",
        "_snapAllNicheFurnitureInSectionToZones",
        "_snapNicheWorldBBoxToZone",
    ]
    print(f"\n##### {label} #####")
    for k in keys:
        i = body.find(k)
        print(f"  {k:45s} {i}")

print("\n==== place tail furniture-manager (updateFurniture / rebuild / fit) ====")
for label, p in fms.items():
    t = p.read_text(encoding="utf-8", errors="replace")
    # find distinctive comment or last rebuildAllTransitions before pricing
    idx = t.find("updateFurnitureInSection before transitions")
    if idx < 0:
        idx = t.find("__clodisUpdateFurnitureInSection")
    print(f"\n##### {label} idx={idx} #####")
    if idx >= 0:
        print(t[idx - 400 : idx + 900])
    print(" PLACE-ADOPT", t.count("PLACE-ADOPT"), "state._placeAdoptedClodis", t.count("_placeAdoptedClodis"))
    print(" REBUILD-SKIP", t.count("REBUILD-SKIP"))
    print(" fitFurnitureToSectionZone after update", "fitFurnitureToSectionZone" in t[idx : idx + 1500] if idx >= 0 else "?")

print("\n==== bbox helpers in furniture-bbox ====")
for label, p in bbs.items():
    t = p.read_text(encoding="utf-8", errors="replace") if p else ""
    print(
        label,
        "zoneFit",
        t.count("computeFurnitureZoneFitWorldBBox"),
        "shouldExcludeMeshFromZoneFitBBox",
        t.count("shouldExcludeMeshFromZoneFitBBox"),
        "expandWorldBoxByMeshSelf",
        t.count("expandWorldBoxByMeshSelf"),
        "setFromObject",
        t.count("setFromObject"),
    )
