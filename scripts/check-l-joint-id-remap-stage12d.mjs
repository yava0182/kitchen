/**
 * Stage12D — pure check: after atomic remap to canonical jointId,
 * ensureKitchenJoint(new sections) must NOT create a second entry.
 *
 * Run: node scripts/check-l-joint-id-remap-stage12d.mjs
 */
function stableId(parts) {
  return parts.filter((p) => p != null && p !== '').map(String).join('|');
}

function computeCanonical(joint) {
  const idKind = joint.kind === 'U' ? 'U' : 'L';
  const handKey =
    idKind === 'U' && (joint.hand === 'left' || joint.hand === 'right')
      ? joint.hand
      : 'pair';
  return stableId(['kj', idKind, handKey, joint.sectionAId, joint.sectionBId]);
}

function ensureKitchenJoint(map, { kind, hand = null, sectionA, sectionB, preferHostId = null }) {
  const idKind = kind === 'U' ? 'U' : 'L';
  const handKey = idKind === 'U' && (hand === 'left' || hand === 'right') ? hand : 'pair';
  const jointId = stableId(['kj', idKind, handKey, sectionA.id, sectionB.id]);
  let j = map[jointId];
  const created = !j;
  if (!j) {
    const prefer =
      preferHostId != null &&
      (String(preferHostId) === String(sectionA.id) ||
        String(preferHostId) === String(sectionB.id))
        ? String(preferHostId)
        : String(sectionA.id);
    j = {
      jointId,
      sectionAId: String(sectionA.id),
      sectionBId: String(sectionB.id),
      hostSectionId: prefer,
      kind: idKind,
      cornerCell: { widthMm: 1050, atStart: true },
    };
    map[jointId] = j;
  }
  return { j, created, jointId };
}

function atomicRemap(map) {
  const idMap = Object.create(null);
  const newMap = Object.create(null);
  const used = new Set();
  for (const [mapKey, j] of Object.entries(map)) {
    const oldId = String(j.jointId || mapKey);
    const newId = computeCanonical(j);
    if (used.has(newId)) return { ok: false, reason: 'conflict', newId };
    used.add(newId);
    idMap[oldId] = newId;
    j.jointId = newId;
    j.cornerCellId = stableId(['cc', newId]);
    j.upperCornerCellId = stableId(['ucc', newId]);
    if (j.cornerCell) j.cornerCell.cornerCellId = j.cornerCellId;
    newMap[newId] = j;
  }
  return { ok: true, idMap, newMap };
}

const oldA = 101;
const oldB = 202;
const newA = 501;
const newB = 602;
const oldJointId = stableId(['kj', 'L', 'pair', oldA, oldB]);

let map = Object.create(null);
map[oldJointId] = {
  jointId: oldJointId,
  sectionAId: String(newA),
  sectionBId: String(newB),
  hostSectionId: String(newA),
  kind: 'L',
  moduleUuid: 'u1',
  cornerCell: { widthMm: 1050, atStart: true, cornerCellId: stableId(['cc', oldJointId]) },
};
const furnitureStamp = { __kitchenJointId: oldJointId };

const remapped = atomicRemap(map);
if (!remapped.ok) {
  console.error(remapped);
  process.exit(1);
}
map = remapped.newMap;
const newId = remapped.idMap[oldJointId];
furnitureStamp.__kitchenJointId = remapped.idMap[furnitureStamp.__kitchenJointId];

const ensured = ensureKitchenJoint(map, {
  kind: 'L',
  sectionA: { id: newA },
  sectionB: { id: newB },
  preferHostId: newA,
});

const keys = Object.keys(map);
const report = {
  remappedOk: remapped.ok,
  oldJointId,
  canonicalId: newId,
  stampAfterRemap: furnitureStamp.__kitchenJointId,
  stampMatchesCanonical: furnitureStamp.__kitchenJointId === newId,
  ensureCreatedNew: ensured.created,
  afterCount: keys.length,
  noDuplicate: keys.length === 1 && keys[0] === newId && !ensured.created,
  keys,
};

console.log(JSON.stringify(report, null, 2));

if (!report.noDuplicate || !report.stampMatchesCanonical) {
  console.error('[12D] FAIL: expected single joint after remap+ensure');
  process.exit(1);
}
console.log('[12D] PASS: remap then ensure reuses same Joint (no duplicate)');
process.exit(0);
