# -*- coding: utf-8 -*-
"""Restructure catalog_45 id=1: cabinet_root → plinth(+4 legs) → corpus."""
import json
import time
import urllib.request
from copy import deepcopy
from pathlib import Path

PATH = Path(r"D:\Clodis-Kitchen\catalog_items\catalog_45.json")
ITEM_ID = 1


def nid(prefix="n"):
    return f"node_{int(time.time() * 1000)}_{prefix}_{int(time.time() * 1000) % 100000}"


def make_leg(name, x, z, idx):
    return {
        "type": "wall",
        "id": nid(f"leg{idx}"),
        "name": name,
        "active": 1,
        "size": {"x": "40", "y": "v:h_bottom", "z": "40"},
        "pos": {"x": x, "y": "0", "z": z},
        "pivot": {"x": -1, "y": -1, "z": -1},
        "rot": {"x": 0, "y": 0, "z": 0},
        "spec": {"orientation": "v", "direction": "z"},
        "material_group": "g0",
        "material_key": "material_2",
        "cldSupportLeg": True,
        "cldSupportLegIndex": idx,
        "visible": 1,
        "children": [],
        "events": {
            "on_before_params": "",
            "on_before_build": "",
            "on_after_build": "",
            "on_drag_end": "",
        },
    }


def make_plinth_section():
    inset = 50
    leg = 40
    legs = [
        make_leg("Опора ПЛ", str(inset), str(inset), 1),
        make_leg("Опора ПП", f"s:x - {inset + leg}", str(inset), 2),
        make_leg("Опора ЗЛ", str(inset), f"s:z - {inset + leg}", 3),
        make_leg("Опора ЗП", f"s:x - {inset + leg}", f"s:z - {inset + leg}", 4),
    ]
    return {
        "type": "section",
        "id": nid("plinth"),
        "name": "Цокольная зона",
        "active": 1,
        "helpers_visible": 1,
        "size": {"x": "s:x", "y": "v:h_bottom", "z": "s:z"},
        "pos": {"x": 0, "y": 0, "z": 0},
        "pivot": {"x": -1, "y": -1, "z": -1},
        "rot": {"x": 0, "y": 0, "z": 0},
        "spec": {"orientation": "f"},
        "layout_role": "plinth",
        "sectionLayoutRole": "plinth",
        "children": legs,
        "visible": 1,
        "events": {
            "on_before_params": "",
            "on_before_build": "",
            "on_after_build": "",
            "on_drag_end": "",
        },
    }


def make_facades_section():
    return {
        "type": "section",
        "id": nid("facades"),
        "name": "Фасад — корпус",
        "active": 1,
        "helpers_visible": 1,
        "size": {
            "x": "s:x",
            "y": "s:y - v:h_bottom - v:h_top - v:tech_zone_mm",
            "z": "16",
        },
        "pos": {"x": 0, "y": "v:h_bottom", "z": "@section.depth"},
        "pivot": {"x": -1, "y": -1, "z": -1},
        "rot": {"x": 0, "y": 0, "z": 0},
        "spec": {"orientation": "f"},
        "layout_role": "facades_main",
        "sectionLayoutRole": "facades_main",
        "children": [],
        "visible": 1,
        "events": {
            "on_before_params": "",
            "on_before_build": "",
            "on_after_build": "",
            "on_drag_end": "",
        },
    }


def roles_walk(nodes, indent=0):
    for n in nodes or []:
        role = n.get("layout_role") or n.get("sectionLayoutRole") or ""
        print(f"{'  ' * indent}{n.get('type')}: {n.get('name')}  → {role or '—'}")
        if n.get("type") in ("section", "module") or role:
            roles_walk(n.get("children"), indent + 1)
        elif n.get("cldSupportLeg"):
            pass
        else:
            # show top-level walls briefly
            if indent <= 1 and n.get("type") == "wall" and not n.get("cldSupportLeg"):
                pass


def main():
    data = json.loads(PATH.read_text(encoding="utf-8"))
    item = None
    for it in data:
        if int(it.get("id") or 0) == ITEM_ID:
            item = it
            break
    if not item:
        raise SystemExit(f"item id={ITEM_ID} not found")

    d = item.setdefault("data", {})
    d["placementKind"] = "kitchen_base"
    d["width"] = str(d.get("width") or "600")
    d["height"] = str(d.get("height") or "720")
    d["depth"] = str(d.get("depth") or "500")
    d["clodisVariables"] = d.get("clodisVariables") or {}
    d["clodisVariables"]["h_bottom"] = int(d["clodisVariables"].get("h_bottom") or 100)
    d["clodisVariables"]["h_top"] = int(d["clodisVariables"].get("h_top") or 0)

    tree = d.get("clodisJSON") or []
    if not tree:
        raise SystemExit("empty clodisJSON")

    # Already wrapped?
    root0 = tree[0]
    role0 = (root0.get("layout_role") or root0.get("sectionLayoutRole") or "").strip()
    if role0 == "cabinet_root":
        print("Already has cabinet_root — updating children roles if needed")
        children = root0.get("children") or []
        has_plinth = any(
            (c.get("layout_role") or c.get("sectionLayoutRole")) == "plinth" for c in children
        )
        has_corpus = any(
            (c.get("layout_role") or c.get("sectionLayoutRole")) == "corpus" for c in children
        )
        if not has_plinth:
            children.insert(0, make_plinth_section())
        for c in children:
            r = (c.get("layout_role") or c.get("sectionLayoutRole") or "").strip()
            if not r and c.get("type") == "section":
                c["layout_role"] = "corpus"
                c["sectionLayoutRole"] = "corpus"
                c["size"] = {
                    "x": "s:x",
                    "y": "s:y - v:h_bottom - v:h_top - v:tech_zone_mm",
                    "z": "s:z",
                }
                c["pos"] = {"x": 0, "y": "v:h_bottom", "z": 0}
        if not any(
            (c.get("layout_role") or c.get("sectionLayoutRole")) == "facades_main" for c in children
        ) and not any(
            (c.get("layout_role") or c.get("sectionLayoutRole")) == "facades" for c in children
        ):
            children.append(make_facades_section())
        root0["children"] = children
    else:
        corpus = deepcopy(root0)
        corpus["layout_role"] = "corpus"
        corpus["sectionLayoutRole"] = "corpus"
        if not corpus.get("name"):
            corpus["name"] = "Корпус стола"
        # keep walls; adjust size/pos for pyramid under cabinet_root
        corpus["size"] = {
            "x": "s:x",
            "y": "s:y - v:h_bottom - v:h_top - v:tech_zone_mm",
            "z": "s:z",
        }
        corpus["pos"] = {"x": 0, "y": "v:h_bottom", "z": 0}
        corpus["pivot"] = corpus.get("pivot") or {"x": -1, "y": -1, "z": -1}

        root = {
            "type": "section",
            "id": nid("root"),
            "name": "Стол рабочий 1 дв.",
            "active": 1,
            "helpers_visible": 1,
            "size": {"x": "s:x", "y": "s:y", "z": "s:z"},
            "pos": {"x": 0, "y": 0, "z": 0},
            "pivot": {"x": -1, "y": -1, "z": -1},
            "rot": {"x": 0, "y": 0, "z": 0},
            "spec": {"orientation": "f"},
            "layout_role": "cabinet_root",
            "sectionLayoutRole": "cabinet_root",
            "children": [make_plinth_section(), corpus, make_facades_section()],
            "visible": 1,
            "events": {
                "on_before_params": "",
                "on_before_build": "",
                "on_after_build": "",
                "on_drag_end": "",
            },
        }
        d["clodisJSON"] = [root]
        # keep top-level mirror if used
        item["clodisJSON"] = d["clodisJSON"]

    # sync constructor_structure if present as copy
    if "constructor_structure" in item:
        item["constructor_structure"] = d["clodisJSON"]

    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Saved", PATH)
    print("--- roles ---")
    roles_walk(d["clodisJSON"])

    # POST to API so admin/server pick up
    payload = json.dumps(item, ensure_ascii=False).encode("utf-8")
    for base in ("http://localhost:8101", "http://localhost:8100"):
        for url in (
            f"{base}/api/catalog/item_save/catalog_45",
            f"{base}/api/catalog/items_set/catalog_45",
            f"{base}/api/catalog/item_update/catalog_45",
        ):
            try:
                req = urllib.request.Request(
                    url, data=payload, headers={"Content-Type": "application/json"}, method="POST"
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    print("API", url, resp.status, resp.read()[:120])
                    return
            except Exception as e:
                print("skip", url, type(e).__name__, e)


if __name__ == "__main__":
    main()
