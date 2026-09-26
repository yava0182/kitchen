# -*- coding: utf-8 -*-
"""Audit SECTION_TRIM_BEHAVIOR_SPEC.md §4.0 / §6.7 / §7 / §10 vs code."""
import pathlib
import sys

sys.stdout.reconfigure(encoding="utf-8")
root = pathlib.Path(__file__).resolve().parents[1]
sm = (root / "js/sections/section-manager.js").read_text(encoding="utf-8")
tm = (root / "js/sections/section-transition-manager.js").read_text(encoding="utf-8")
vl = (root / "js/sections/vertical-layout.js").read_text(encoding="utf-8")
idx = (root / "index.html").read_text(encoding="utf-8")
spec = (root / "docs/SECTION_TRIM_BEHAVIOR_SPEC.md").read_text(encoding="utf-8")

checks = []


def ok(name, cond, detail=""):
    checks.append((bool(cond), name, detail))


# --- cache / doc ---
ok("index cache cohabit31", "20260923-cohabit32" in idx)
ok("SPEC §6.7 cache cohabit20+", "cohabit20" in spec)
ok(
    "§6.7.2 hang|wardrobe both tall gap",
    "hang_wardrobe_both_tall" in (root / "js/sections/trim-junction-classify.js").read_text(encoding="utf-8"),
)
ok(
    "§6.8 A1 L free shoulder helper",
    "function _isLCornerSpecialFurniture" in tm,
)
ok(
    "§6.8 A2 hangWardrobeSideCapAllowed",
    "function _hangWardrobeSideCapAllowed" in tm,
)
ok(
    "§6.8 A1 ordinary not blanket lShape",
    "lShape: не blanket-special" in tm or "sec.lShape" in tm.split("function _furnitureSectionIsOrdinaryStraight")[1][:800],
)

# --- §4.0 ---
fn = sm.split("function sectionHasFurnitureNearLocalSide")[1].split("\nfunction ")[0]
ok("§4.0 applyStraightFrameVisibility", "function applyStraightFrameVisibility" in sm)
ok("§4.0 empty hides frame", "setSectionEmptyFrameMeshesVisible(g, false)" in sm)
ok("§4.0 nearLocalSide for sides", "sectionHasFurnitureNearLocalSide(sectionData, side)" in sm)
ok("§4.0 world-U left wall", "secUMin = pos.z - span" in fn)
ok("§4.0 world-U right wall", "secUMin = pos.z" in fn and "secUMax = pos.z + span" in fn)
ok("§4.0 no left/right always-true", "return true" not in fn or "wall !== 'back'" not in fn)
ok("§4.0 orphan empty_edge", "empty_edge" in tm)
ok("§4.0 orphan empty_straight", "empty_straight" in tm)

# --- §6.7.1 ---
ok("§6.7.1 AutoBottom fn", "function _buildWallHungHighBottomCapsOnWall" in tm)
ok("§6.7.1 PLANK 16", "PLANK_THICKNESS_MM = 16" in tm)
ab = tm.split("function _buildWallHungHighBottomCapsOnWall")[1][:900]
ok("§6.7.1 AutoBottom skip special", "_furnitureSectionIsOrdinaryStraight(grp)" in ab)
ok("§6.7.1 no plinth hang", "return !isWallHungPlacementKind(pk)" in vl)

# --- §6.7.2 ---
ok(
    "§6.7.2 hangward SideCap null",
    "_buildSideCapFromGroups(wardrobe, hangGrp, dresserSide, wallName, key, null)"
    in tm,
)
ok(
    "§6.7.2 no SideCap on hang niche",
    "isWallHungHighPlacementKind(partners.niche" in tm,
)
ok("§6.7.2 hangward skip special", "_furnitureSectionIsOrdinaryStraight(wardrobe)" in tm)
ok("§6.7.2 needsHangWardrobeCap place", "needsHangWardrobeCap" in tm)

# --- §6.7.3 ---
ok("§6.7.3 HangHighVsAdjacentLow", "function _buildHangHighSideOverlaysVsAdjacentLowOnWall" in tm)
ok("§6.7.3 yBottom hang-16", "hangBox.min.y - PLANK_THICKNESS_MM" in tm)
ok("§6.7.3 yTop + topPlank", "hangBox.max.y + _sectionTopPlankHeightMm" in tm)
ok("§6.7.3 skip wardrobe side", "_findAdjacentWardrobeNeighborForHang" in tm)
ok("§6.7.3 require low", "_findAdjacentLowNeighborForHang" in tm)
hh = tm.split("function _buildHangHighSideOverlaysVsAdjacentLowOnWall")[1][:700]
ok("§6.7.3 skip special", "_furnitureSectionIsOrdinaryStraight(grp)" in hh)

# --- §7 ---
impl_head = tm.split("function _rebuildWallTransitionsImpl")[1][:2000]
ok("§7 no restoreFullH at start", "_restoreSideOverlaysFullHeight" not in impl_head)

# --- §10 order (full path markers) ---
# Use positions of key _tx labels in the main full rebuild region after sortedAfterFit
anchor = tm.find("const sortedAfterFit")
region = tm[anchor : anchor + 8000] if anchor >= 0 else ""
ok("§10 has sortedAfterFit", anchor >= 0)
ok("§10 hangHighBottom in region", "hangHighBottom" in region)
ok("§10 hangHighOpenSide in region", "hangHighOpenSide" in region)
ok("§10 adjustSide after hang in region", region.find("hangHighOpenSide") < region.find("adjustSide"))
ok("§10 mergedCaps before hangBottom", region.find("mergedCaps") < region.find("hangHighBottom"))

# SideCap before merged (buildPairs before step 8)
pairs_before = tm.find("_buildSideCapFromGroups", anchor) if anchor >= 0 else -1
merged_pos = tm.find("_tx('mergedCaps'", anchor) if anchor >= 0 else -1
ok("§10 SideCap before mergedCaps", 0 <= pairs_before < merged_pos)

# OVERLAY overhang
ok("§6.4.1 OVERLAY_TOP_OVERHANG", "OVERLAY_TOP_OVERHANG_MM" in tm)

fail = [c for c in checks if not c[0]]
print(f"PASS {sum(1 for c in checks if c[0])} / {len(checks)}")
for okf, name, detail in checks:
    print(("OK  " if okf else "FAIL"), name, detail)
if fail:
    print("\nFAILURES:")
    for f in fail:
        print(" ", f[1], f[2])
    sys.exit(1)
print("\nALL CHECKS PASSED")
