/**
 * Stage12C — pure check (no browser, no app import).
 * Reproduces: restore keeps old jointId + remapped section ids,
 * then ensureKitchenJoint(new sections) creates a second map entry.
 *
 * Run: node scripts/check-l-joint-id-dup-after-restore.mjs
 * Exit 0 = duplicate mechanism confirmed (expected failure mode documented).
 */
function stableId(parts) {
  return parts.filter((p) => p != null && p !== '').map(String).join('|');
}

/** Mirror of kitchen-joint.js ensureKitchenJoint id + map insert (minimal). */
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
      moduleUuid: null,
      cornerCell: { widthMm: 1050, atStart: true },
    };
    map[jointId] = j;
  } else {
    j.sectionAId = String(sectionA.id);
    j.sectionBId = String(sectionB.id);
  }
  return { j, created, jointId };
}

function findBySectionIds(map, sectionId) {
  const sid = String(sectionId);
  return Object.values(map).filter(
    (j) =>
      j &&
      (String(j.sectionAId) === sid ||
        String(j.sectionBId) === sid ||
        String(j.hostSectionId) === sid)
  );
}

const map = Object.create(null);
const oldA = 101;
const oldB = 202;
const newA = 501;
const newB = 602;
const oldJointId = stableId(['kj', 'L', 'pair', oldA, oldB]);

// Stage12B restore shape: old key, remapped section ids, furniture stamp = oldJointId
map[oldJointId] = {
  jointId: oldJointId,
  sectionAId: String(newA),
  sectionBId: String(newB),
  hostSectionId: String(newA),
  kind: 'L',
  moduleUuid: 'uuid-restored',
  cornerCell: { widthMm: 1050, atStart: true },
};
const furnitureStamp = oldJointId;

const beforeCount = Object.keys(map).length;
const lookupByStamp = map[furnitureStamp] || null;
const lookupBySectionBefore = findBySectionIds(map, newA);

// Staff edit path that calls ensureJointsForLPair → ensureKitchenJoint(new ids)
const ensured = ensureKitchenJoint(map, {
  kind: 'L',
  sectionA: { id: newA },
  sectionB: { id: newB },
  preferHostId: newA,
});

const keys = Object.keys(map);
const lookupBySectionAfter = findBySectionIds(map, newA);
const duplicate =
  keys.includes(oldJointId) && keys.includes(ensured.jointId) && keys.length >= 2;

const report = {
  ok: true,
  mechanism: 'old_jointId_plus_ensure_new_section_ids',
  beforeCount,
  afterCount: keys.length,
  oldJointId,
  newJointId: ensured.jointId,
  ensureCreatedNew: ensured.created,
  duplicate,
  stampStillResolvesOld: !!lookupByStamp && lookupByStamp.jointId === oldJointId,
  sectionLookupBefore: lookupBySectionBefore.length,
  sectionLookupAfter: lookupBySectionAfter.length,
  keys,
  invariantOneJointPerPair: !duplicate,
};

console.log(JSON.stringify(report, null, 2));

if (!duplicate || !ensured.created) {
  console.error('[12C] expected duplicate after ensure on remapped restore shape');
  process.exit(1);
}
if (lookupBySectionAfter.length !== 2) {
  console.error('[12C] expected 2 joints matching section after duplicate');
  process.exit(1);
}
console.log('[12C] PASS: duplicate KitchenJoint mechanism confirmed (restore+ensure)');
process.exit(0);
