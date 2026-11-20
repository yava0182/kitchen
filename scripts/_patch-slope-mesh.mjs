import fs from 'fs';

const path = 'D:/Clodis-Kitchen/js/room/kitchen-room-draw-mode.js';
let t = fs.readFileSync(path, 'utf8');

const pickStart = t.indexOf('function pickSlopeWallEdge(clientX, clientY)');
const pickEnd = t.indexOf('function clearSlopePreviewMesh()', pickStart);
const meshStart = t.indexOf('function buildSlopeMesh(edge, aMm, bMm, live)');
const meshEnd = t.indexOf('function refreshSlopePreview()', meshStart);
if (pickStart < 0 || pickEnd < 0 || meshStart < 0 || meshEnd < 0) {
  console.error({ pickStart, pickEnd, meshStart, meshEnd });
  process.exit(1);
}

const pickFn = `function pickSlopeWallEdge(clientX, clientY) {
  const r = state.room;
  const box = canvasEl();
  if (!r || !box || !state.camera || !state.raycaster || typeof THREE === 'undefined') {
    return null;
  }
  const rect = box.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  state.raycaster.setFromCamera(mouse, state.camera);

  let edgeIndex = null;
  let segFromHit = null;
  const strips = [];
  r.group.traverse((o) => {
    if (o.isMesh && o.userData && (o.userData.isPolygonWallStrip || Number.isFinite(o.userData.edgeIndex))) {
      strips.push(o);
    }
  });
  if (strips.length) {
    const hits = state.raycaster.intersectObjects(strips, false);
    if (hits.length && Number.isFinite(hits[0].object.userData.edgeIndex)) {
      edgeIndex = hits[0].object.userData.edgeIndex;
      const seg = hits[0].object.userData.segment;
      if (seg && Number.isFinite(seg.x1) && Number.isFinite(seg.z1)) segFromHit = seg;
    }
  }
  if (edgeIndex == null && r.wallPlanes && r.wallPlanes.length) {
    const hits = state.raycaster.intersectObjects(r.wallPlanes, false);
    if (hits.length && Number.isFinite(hits[0].object.userData.edgeIndex)) {
      edgeIndex = hits[0].object.userData.edgeIndex;
      const seg = hits[0].object.userData.segment;
      if (seg && Number.isFinite(seg.x1) && Number.isFinite(seg.z1)) segFromHit = seg;
    }
  }
  if (edgeIndex == null) {
    const raw = pickFloorXZ(clientX, clientY);
    if (!raw) return null;
    const hover = nearestWallHover(raw.x, raw.z);
    if (!hover || hover.edgeIndex == null) return null;
    edgeIndex = hover.edgeIndex;
  }

  const verts = footprintVerts();
  const segs = footprintSegs();
  if (!verts || edgeIndex < 0 || edgeIndex >= verts.length) return null;
  if (segs && segs[edgeIndex] && segs[edgeIndex].open) return null;

  let x1;
  let z1;
  let x2;
  let z2;
  if (segFromHit) {
    x1 = segFromHit.x1;
    z1 = segFromHit.z1;
    x2 = segFromHit.x2;
    z2 = segFromHit.z2;
  } else if (segs && segs[edgeIndex]) {
    x1 = segs[edgeIndex].x1;
    z1 = segs[edgeIndex].z1;
    x2 = segs[edgeIndex].x2;
    z2 = segs[edgeIndex].z2;
  } else {
    const a = verts[edgeIndex];
    const b = verts[(edgeIndex + 1) % verts.length];
    x1 = a.x;
    z1 = a.z;
    x2 = b.x;
    z2 = b.z;
  }
  const { nx, nz } = wallInwardNormal(x1, z1, x2, z2);
  return { edgeIndex, x1, z1, x2, z2, nx, nz };
}

`;

const meshFn = `/**
 * IKEA 3D preview: синяя полоса на стене (A→H) + плоскость скоса внутрь на глубину B.
 */
function buildSlopeMesh(edge, aMm, bMm, live) {
  if (!edge || typeof THREE === 'undefined') return null;
  const H = roomCeilingHeightMm();
  const A = clampSlopeA(aMm, H);
  const B = clampSlopeB(bMm);

  const { nx, nz } = wallInwardNormal(edge.x1, edge.z1, edge.x2, edge.z2);
  // внутрь комнаты, чтобы не сливаться со стеной (иначе видна только косая грань)
  const inset = 12;
  const x1 = edge.x1 + nx * inset;
  const z1 = edge.z1 + nz * inset;
  const x2 = edge.x2 + nx * inset;
  const z2 = edge.z2 + nz * inset;
  const depth = Math.max(1, B);

  const wA1 = new THREE.Vector3(x1, A, z1);
  const wA2 = new THREE.Vector3(x2, A, z2);
  const wH1 = new THREE.Vector3(x1, H, z1);
  const wH2 = new THREE.Vector3(x2, H, z2);
  const iH1 = new THREE.Vector3(x1 + nx * depth, H, z1 + nz * depth);
  const iH2 = new THREE.Vector3(x2 + nx * depth, H, z2 + nz * depth);

  const root = new THREE.Group();
  root.userData.isSlopePreview = !!live;
  root.userData.isKitchenCeilingSlope = !live;
  root.name = live ? 'cld-slope-preview' : 'cld-slope-solid';
  root.renderOrder = 3;

  const mkMat = (opacity) =>
    new THREE.MeshBasicMaterial({
      color: 0x7ec8f0,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

  const mkQuad = (a, b, c, d, opacity) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z]),
        3
      )
    );
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mkMat(opacity));
    m.userData.isSlopePreview = !!live;
    m.userData.isKitchenCeilingSlope = !live;
    return m;
  };

  root.add(mkQuad(wA1, wA2, wH2, wH1, live ? 0.5 : 0.38));
  root.add(mkQuad(wA1, wA2, iH2, iH1, live ? 0.45 : 0.34));
  root.add(mkQuad(wH1, wH2, iH2, iH1, live ? 0.28 : 0.22));

  const outline = [
    wA1, wH1, wH1, iH1, iH1, wA1,
    wA2, wH2, wH2, iH2, iH2, wA2,
    wA1, wA2,
    wH1, wH2,
    iH1, iH2,
  ];
  const line = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(outline),
    new THREE.LineBasicMaterial({
      color: 0x0058a3,
      transparent: true,
      opacity: live ? 0.95 : 0.7,
      depthWrite: false,
    })
  );
  line.userData.isSlopePreview = !!live;
  line.userData.isKitchenCeilingSlope = !live;
  line.renderOrder = 4;
  root.add(line);

  const mx = (x1 + x2) * 0.5;
  const mz = (z1 + z2) * 0.5;
  const dash = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(mx, 0, mz),
      new THREE.Vector3(mx, A, mz),
    ]),
    new THREE.LineDashedMaterial({
      color: 0x0058a3,
      dashSize: 40,
      gapSize: 30,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  dash.computeLineDistances();
  dash.userData.isSlopePreview = !!live;
  dash.userData.isKitchenCeilingSlope = !live;
  root.add(dash);

  return root;
}

`;

// clearSlopePreviewMesh must dispose Group children recursively — keep as is if it traverses
t = t.slice(0, pickStart) + pickFn + t.slice(pickEnd, meshStart) + meshFn + t.slice(meshEnd);
fs.writeFileSync(path, t);
console.log('patched ok');
