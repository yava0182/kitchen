// Room class - builds room geometry according to Clodis specification
// Origin: front-left-bottom corner
// Units: millimeters (no conversion)
console.log('[ROOM_DEBUG] Room.js wallstrips1 — mitred strips, no concave Extrude ring');

/**
 * Exp14 / IKEA PORT — wall paint (SOT), MeshStandard only.
 * linear albedo + rough 0.75. Без normal-map (в лабе снята — иначе пятна).
 */
const IKEA_WALL_ALBEDO_LINEAR = Object.freeze([0.877005339, 0.874226034, 0.77851814]);
const IKEA_WALL_ROUGHNESS = 0.75;
const IKEA_WALL_METALNESS = 0;
const IKEA_WALL_PAINT_TILE_MM = 300;

const IKEA_CEILING_ALBEDO_LINEAR = Object.freeze([
  Math.pow(0.99609375, 2.2),
  Math.pow(0.99609375, 2.2),
  Math.pow(0.99609375, 2.2),
]);
const IKEA_CEILING_ROUGHNESS = 0.4;
const IKEA_CEILING_METALNESS = 0;

const IKEA_FLOOR_SLAB_LINEAR = Object.freeze([0.714, 0.702, 0.678]);
const IKEA_FLOOR_SLAB_ROUGHNESS = 0.88;
const IKEA_FLOOR_ROUGHNESS = 1.0;
const IKEA_FLOOR_METALNESS = 0;

function applyIkeaWallPaintToStandardMaterial(mat) {
  if (!mat || !mat.isMeshStandardMaterial) return mat;
  const [lr, lg, lb] = IKEA_WALL_ALBEDO_LINEAR;
  if (THREE.LinearSRGBColorSpace !== undefined) {
    mat.color.setRGB(lr, lg, lb, THREE.LinearSRGBColorSpace);
  } else {
    mat.color.setRGB(lr, lg, lb);
  }
  mat.roughness = IKEA_WALL_ROUGHNESS;
  mat.metalness = IKEA_WALL_METALNESS;
  if (mat.normalMap) mat.normalMap = null;
  mat.needsUpdate = true;
  return mat;
}

function makeIkeaWallStandardMaterial(side) {
  const mat = new THREE.MeshStandardMaterial({
    roughness: IKEA_WALL_ROUGHNESS,
    metalness: IKEA_WALL_METALNESS,
    side: side != null ? side : THREE.FrontSide,
  });
  return applyIkeaWallPaintToStandardMaterial(mat);
}

function makeIkeaCeilingStandardMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    roughness: IKEA_CEILING_ROUGHNESS,
    metalness: IKEA_CEILING_METALNESS,
    side: THREE.DoubleSide,
  });
  const [lr, lg, lb] = IKEA_CEILING_ALBEDO_LINEAR;
  if (THREE.LinearSRGBColorSpace !== undefined) {
    mat.color.setRGB(lr, lg, lb, THREE.LinearSRGBColorSpace);
  } else {
    mat.color.setRGB(lr, lg, lb);
  }
  return mat;
}

function makeIkeaFloorSlabStandardMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    roughness: IKEA_FLOOR_SLAB_ROUGHNESS,
    metalness: 0,
  });
  const [lr, lg, lb] = IKEA_FLOOR_SLAB_LINEAR;
  if (THREE.LinearSRGBColorSpace !== undefined) {
    mat.color.setRGB(lr, lg, lb, THREE.LinearSRGBColorSpace);
  } else {
    mat.color.setRGB(lr, lg, lb);
  }
  return mat;
}

if (typeof window !== 'undefined') {
  window.applyIkeaWallPaintToStandardMaterial = applyIkeaWallPaintToStandardMaterial;
  window.makeIkeaWallStandardMaterial = makeIkeaWallStandardMaterial;
}

/**
 * Offset CCW footprint наружу на dist (мм).
 * Вершины стыкуются по формуле unit-normals: (n0+n1)/(1+n0·n1)*dist —
 * даёт чистые митры (90° → T√2 по биссектрисе).
 */
function offsetPolygonOutward(verts, dist) {
  const n = verts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = verts[(i - 1 + n) % n];
    const cur = verts[i];
    const next = verts[(i + 1) % n];
    const e0x = cur.x - prev.x;
    const e0z = cur.z - prev.z;
    const e1x = next.x - cur.x;
    const e1z = next.z - cur.z;
    const l0 = Math.hypot(e0x, e0z) || 1;
    const l1 = Math.hypot(e1x, e1z) || 1;
    // CCW: inward = (-dz, dx), outward = (dz, -dx)
    const n0x = e0z / l0;
    const n0z = -e0x / l0;
    const n1x = e1z / l1;
    const n1z = -e1x / l1;
    const dot = Math.max(-0.999, Math.min(0.999, n0x * n1x + n0z * n1z));
    const denom = 1 + dot;
    out.push({
      x: cur.x + ((n0x + n1x) / denom) * dist,
      z: cur.z + ((n0z + n1z) / denom) * dist,
    });
  }
  return out;
}

class Room {
  constructor(width, depth, height, options) {
    this.width = width; // w in millimeters (AABB plot)
    this.depth = depth; // d in millimeters
    this.height = height; // h in millimeters

    const opts = options && typeof options === 'object' ? options : {};
    /** @type {{ shapeKey?: string, vertices?: Array<{x:number,z:number}>, segments?: Array<any> }|null} */
    this.footprintSpec = opts.footprint || null;
    this.shapeKey = (opts.shapeKey || this.footprintSpec?.shapeKey || 'enclosed_rect');

    this.group = new THREE.Group();
    this.wallPlanes = []; // Invisible planes for raycast
    this.bounds = {
      minX: 0,
      maxX: width,
      minZ: 0,
      maxZ: depth,
      minY: 0,
      maxY: height,
    };

    // Store Box3 for each surface
    this.surfaces = {
      floor: null,
      ceiling: null,
      front: null,
      back: null,
      left: null,
      right: null,
    };

    this.build();
  }

  build() {
    if (
      this.footprintSpec &&
      Array.isArray(this.footprintSpec.vertices) &&
      this.footprintSpec.vertices.length >= 3 &&
      Array.isArray(this.footprintSpec.segments)
    ) {
      this.buildPolygonRoom(this.footprintSpec);
      return;
    }
    this.buildRectangularRoom();
  }

  /** Прямоугольная комната (исторический путь PAX). */
  buildRectangularRoom() {
    const wallThickness = 100; // 100mm = 10cm thickness for walls, floor, ceiling

    // Пол: жилой объём пустой (как PlanPlace / kitchen planner).
    // Основание — коробка наружу вниз от Y=0; паркет — плоскость на логическом полу.
    const T = wallThickness;
    const baseThickness = T;

    const textureLoader = new THREE.TextureLoader();
    /** Как Exp14 lab / IKEA PORT: diffuse.jpg (светлый паркет под Phong). */
    const floorTextureUrl = '/images/textures/ikea/floor/diffuse.jpg';
    const floorFallbackUrl =
      '/images/textures/ikea/floor/ee604ccf7d4ed0ec53b5d8cf0032e707.jpg';
    const floorTileSize = 640;

    const bindFloorMapToCoating = (texture) => {
      const mat = this.floorCoating?.material;
      if (!mat || mat.userData?.__cldIkeaV0) return;
      if (texture.colorSpace !== undefined && THREE.SRGBColorSpace !== undefined) {
        texture.colorSpace = THREE.SRGBColorSpace;
      } else if (texture.encoding !== undefined && THREE.sRGBEncoding !== undefined) {
        texture.encoding = THREE.sRGBEncoding;
      }
      texture.needsUpdate = true;
      mat.map = texture;
      mat.color.set(0xffffff);
      mat.needsUpdate = true;
    };

    const applyFloorTexSettings = (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      /** ikea v0 shader tiles by world XZ / floorTileSize — repeat kept for pre-bind preview. */
      texture.repeat.set(this.width / floorTileSize, this.depth / floorTileSize);
      texture.anisotropy = 8;
      // Mips ON — без них паркет «в крапинку» в 2D/орто (LinearFilter aliasing).
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      if (typeof window.__cldResyncIkeaRoomFloorMap === 'function') {
        /** colorSpace + GPU upload — только resync после JPG→RGBA canvas (v0) */
      } else if (typeof window.__cldPrepareIkeaV0Map === 'function') {
        window.__cldPrepareIkeaV0Map(texture);
      } else if (texture.colorSpace !== undefined && THREE.SRGBColorSpace !== undefined) {
        texture.colorSpace = THREE.SRGBColorSpace;
      } else if (texture.encoding !== undefined && THREE.sRGBEncoding !== undefined) {
        texture.encoding = THREE.sRGBEncoding;
      }
      if (typeof texture.updateMatrix === 'function') texture.updateMatrix();
      /** ikea v0: JPG→RGBA + upload in resync — needsUpdate here → texSubImage2D RGB fail */
      if (typeof window.__cldResyncIkeaRoomFloorMap !== 'function') {
        const img = texture.image;
        const ready =
          img &&
          ((typeof HTMLImageElement !== 'undefined' &&
            img instanceof HTMLImageElement &&
            img.complete &&
            img.naturalWidth > 0) ||
            (img.width > 0 && img.height > 0));
        if (ready) texture.needsUpdate = true;
      }
    };

    const floorTexture = textureLoader.load(
      floorTextureUrl,
      (texture) => {
        texture.needsUpdate = false;
        console.log('✅ Текстура пола (IKEA diffuse.jpg):', floorTextureUrl);
        this.floorTexture = texture;
        applyFloorTexSettings(texture);
        if (typeof window.__cldResyncIkeaRoomFloorMap === 'function') {
          window.__cldResyncIkeaRoomFloorMap(texture);
        }
        // Lab / MeshBasic: v0 resync no-ops — bind map ourselves (was missing → flat beige 3D floor).
        bindFloorMapToCoating(texture);
      },
      undefined,
      () => {
        console.warn('⚠️ IKEA floor texture missing, fallback:', floorFallbackUrl);
        textureLoader.load(floorFallbackUrl, (texture) => {
          texture.needsUpdate = false;
          this.floorTexture = texture;
          applyFloorTexSettings(texture);
          if (typeof window.__cldResyncIkeaRoomFloorMap === 'function') {
            window.__cldResyncIkeaRoomFloorMap(texture);
          }
          bindFloorMapToCoating(texture);
        });
      }
    );
    /** Не присваивать до onLoad — TextureLoader ставит needsUpdate на RGB JPG до RGBA canvas. */

    const floorBaseGeometry = new THREE.BoxGeometry(this.width + 2 * T, baseThickness, this.depth + 2 * T);
    const floorBaseMaterial = makeIkeaFloorSlabStandardMaterial();
    const floorBase = new THREE.Mesh(floorBaseGeometry, floorBaseMaterial);
    // Верх основы чуть ниже Y=0 — иначе z-fight с паркетом → белые диагонали (изломы).
    floorBase.position.set(this.width / 2, -(baseThickness / 2) - 1, this.depth / 2);
    floorBase.receiveShadow = false;
    floorBase.castShadow = false;
    floorBase.userData.isFloorBase = true;
    floorBase.userData.ikeaPortMatRole = 'floor';
    this.floorBase = floorBase;
    this.group.add(floorBase);

    // Паркет — плоскость на Y=0. Exp14: MeshStandard + IKEA albedo.
    const floorCoatingGeometry = new THREE.PlaneGeometry(this.width, this.depth);
    const floorCoatingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: IKEA_FLOOR_ROUGHNESS,
      metalness: IKEA_FLOOR_METALNESS,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const floorCoating = new THREE.Mesh(floorCoatingGeometry, floorCoatingMaterial);
    floorCoating.rotation.x = -Math.PI / 2;
    floorCoating.position.set(this.width / 2, 0, this.depth / 2);
    floorCoating.receiveShadow = false;
    floorCoating.castShadow = false;
    floorCoating.userData.isFloorCoating = true;
    floorCoating.userData.ikeaPortMatRole = 'floor';
    this.floorCoating = floorCoating;
    this.group.add(floorCoating);

    const floorBox = new THREE.Box3().setFromObject(floorBase).union(new THREE.Box3().setFromObject(floorCoating));
    this.surfaces.floor = floorBox;

    // Dump empty PAX ceiling: SOT rough 0.4 — MeshStandard как в Exp14.
    const ceilingGeometry = new THREE.BoxGeometry(this.width + 2 * T, wallThickness, this.depth + 2 * T);
    const ceilingMaterial = makeIkeaCeilingStandardMaterial();
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(this.width / 2, this.height + wallThickness / 2, this.depth / 2);
    ceiling.userData.isCeiling = true;
    ceiling.userData.ikeaPortMatRole = 'ceiling';
    ceiling.receiveShadow = false;
    ceiling.castShadow = false;
    this.group.add(ceiling);
    
    if (!this.walls) this.walls = {};
    this.walls.ceiling = ceiling;

    const ceilingBox = new THREE.Box3().setFromObject(ceiling);
    this.surfaces.ceiling = ceilingBox;

    // Exp14 Step8A: IKEA wall paint MeshStandard.
    const frameMaterial = makeIkeaWallStandardMaterial(THREE.DoubleSide);
    const innerMaterial = makeIkeaWallStandardMaterial(THREE.FrontSide);
    const tileSize = IKEA_WALL_PAINT_TILE_MM;

    // Имена по виду камеры: front = ближняя (Z=depth), back = дальняя (Z=0)
    const frontWall = this.createMiteredWall(this.width, this.height, wallThickness, 'front', frameMaterial.clone());
    this.group.add(frontWall);
    if (!this.walls) this.walls = {};
    frontWall.userData.wallName = 'back';
    this.walls.back = frontWall;
    this.surfaces.back = new THREE.Box3().setFromObject(frontWall);

    const backWall = this.createMiteredWall(this.width, this.height, wallThickness, 'back', frameMaterial.clone());
    this.group.add(backWall);
    backWall.userData.wallName = 'front';
    this.walls.front = backWall;
    this.surfaces.front = new THREE.Box3().setFromObject(backWall);

    const leftWall = this.createMiteredWall(this.depth, this.height, wallThickness, 'left', frameMaterial.clone());
    this.group.add(leftWall);
    if (!this.walls) this.walls = {};
    this.walls.left = leftWall;
    this.surfaces.left = new THREE.Box3().setFromObject(leftWall);

    const rightWall = this.createMiteredWall(this.depth, this.height, wallThickness, 'right', frameMaterial.clone());
    this.group.add(rightWall);
    if (!this.walls) this.walls = {};
    this.walls.right = rightWall;
    this.surfaces.right = new THREE.Box3().setFromObject(rightWall);

    this.originalWallMaterials = {
      front: backWall.material,
      back: frontWall.material,
      left: leftWall.material,
      right: rightWall.material,
    };

    this.wallInners = this.createWallInnerFaces(innerMaterial, tileSize);

    this.highlightedWall = null;

    this.createWallPlanes();
    this._storeSolidWallGeoms();
    this.openingExtras = [];
    this.addDebugHelpers();

    // IKEA empty PAX: угловых debug-маркеров нет — не рисуем
  }

  /**
   * Полигональная кухня (форма шага 1): пол/потолок по контуру, стены по сегментам.
   * Открытые сегменты (open:true) — без стены (как open kitchen у IKEA).
   */
  buildPolygonRoom(spec) {
    const wallThickness = 100;
    const T = wallThickness;
    const vertices = spec.vertices;
    const segments = spec.segments || [];
    this.footprintSpec = spec;
    this.wallSegments = segments.slice();

    const textureLoader = new THREE.TextureLoader();
    const floorTextureUrl = '/images/textures/ikea/floor/diffuse.jpg';
    const floorFallbackUrl =
      '/images/textures/ikea/floor/ee604ccf7d4ed0ec53b5d8cf0032e707.jpg';
    const floorTileSize = 640;

    const applyFloorTexSettings = (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      // UV уже в мм комнаты (см. ShapeGeometry ниже) — repeat = 1
      texture.repeat.set(1, 1);
      texture.anisotropy = 8;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      if (typeof window.__cldResyncIkeaRoomFloorMap === 'function') {
        /* resync */
      } else if (typeof window.__cldPrepareIkeaV0Map === 'function') {
        window.__cldPrepareIkeaV0Map(texture);
      } else if (texture.colorSpace !== undefined && THREE.SRGBColorSpace !== undefined) {
        texture.colorSpace = THREE.SRGBColorSpace;
      } else if (texture.encoding !== undefined && THREE.sRGBEncoding !== undefined) {
        texture.encoding = THREE.sRGBEncoding;
      }
      if (typeof texture.updateMatrix === 'function') texture.updateMatrix();
      if (this.floorCoating?.material) {
        this.floorCoating.material.map = texture;
        this.floorCoating.material.needsUpdate = true;
      }
      if (typeof window.__cldResyncIkeaRoomFloorMap !== 'function') {
        const img = texture.image;
        const ready =
          img &&
          ((typeof HTMLImageElement !== 'undefined' &&
            img instanceof HTMLImageElement &&
            img.complete &&
            img.naturalWidth > 0) ||
            (img.width > 0 && img.height > 0));
        if (ready) texture.needsUpdate = true;
      }
    };

    const floorTexture = textureLoader.load(
      floorTextureUrl,
      (texture) => {
        texture.needsUpdate = false;
        this.floorTexture = texture;
        applyFloorTexSettings(texture);
        if (typeof window.__cldResyncIkeaRoomFloorMap === 'function') {
          window.__cldResyncIkeaRoomFloorMap(texture);
        }
      },
      undefined,
      () => {
        textureLoader.load(floorFallbackUrl, (texture) => {
          texture.needsUpdate = false;
          this.floorTexture = texture;
          applyFloorTexSettings(texture);
          if (typeof window.__cldResyncIkeaRoomFloorMap === 'function') {
            window.__cldResyncIkeaRoomFloorMap(texture);
          }
        });
      }
    );

    // Основание пола — точный footprint + правильный offset наружу на T
    const baseThickness = T;
    const outerFoot = offsetPolygonOutward(vertices, T);
    const baseShape = new THREE.Shape();
    baseShape.moveTo(outerFoot[0].x, outerFoot[0].z);
    for (let i = 1; i < outerFoot.length; i++) baseShape.lineTo(outerFoot[i].x, outerFoot[i].z);
    baseShape.closePath();
    const floorBaseGeometry = new THREE.ExtrudeGeometry(baseShape, {
      depth: baseThickness,
      bevelEnabled: false,
    });
    floorBaseGeometry.rotateX(Math.PI / 2);
    const floorBaseMaterial = makeIkeaFloorSlabStandardMaterial();
    const floorBase = new THREE.Mesh(floorBaseGeometry, floorBaseMaterial);
    floorBase.position.set(0, -1, 0);
    floorBase.receiveShadow = false;
    floorBase.castShadow = false;
    floorBase.userData.isFloorBase = true;
    floorBase.userData.ikeaPortMatRole = 'floor';
    this.floorBase = floorBase;
    this.group.add(floorBase);

    // Паркет строго по footprint (без кривого pad) — стык к внутренней грани стены
    const floorShape = new THREE.Shape();
    floorShape.moveTo(vertices[0].x, -vertices[0].z);
    for (let i = 1; i < vertices.length; i++) {
      floorShape.lineTo(vertices[i].x, -vertices[i].z);
    }
    floorShape.closePath();
    const floorCoatingGeometry = new THREE.ShapeGeometry(floorShape);
    floorCoatingGeometry.rotateX(-Math.PI / 2);
    {
      const uv = floorCoatingGeometry.attributes.uv;
      const pos = floorCoatingGeometry.attributes.position;
      if (uv && pos) {
        for (let i = 0; i < pos.count; i++) {
          uv.setXY(i, pos.getX(i) / floorTileSize, pos.getZ(i) / floorTileSize);
        }
        uv.needsUpdate = true;
      }
    }
    const floorCoatingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: IKEA_FLOOR_ROUGHNESS,
      metalness: IKEA_FLOOR_METALNESS,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const floorCoating = new THREE.Mesh(floorCoatingGeometry, floorCoatingMaterial);
    floorCoating.position.set(0, 0, 0);
    floorCoating.receiveShadow = false;
    floorCoating.castShadow = false;
    floorCoating.userData.isFloorCoating = true;
    floorCoating.userData.ikeaPortMatRole = 'floor';
    this.floorCoating = floorCoating;
    this.group.add(floorCoating);
    this.surfaces.floor = new THREE.Box3().setFromObject(floorBase).union(
      new THREE.Box3().setFromObject(floorCoating)
    );

    // Потолок — контур в +XZ, нормаль вниз
    const ceilingShape = new THREE.Shape();
    ceilingShape.moveTo(vertices[0].x, vertices[0].z);
    for (let i = 1; i < vertices.length; i++) {
      ceilingShape.lineTo(vertices[i].x, vertices[i].z);
    }
    ceilingShape.closePath();
    const ceilingGeom = new THREE.ShapeGeometry(ceilingShape);
    ceilingGeom.rotateX(Math.PI / 2);
    const ceilingMaterial = makeIkeaCeilingStandardMaterial();
    const ceiling = new THREE.Mesh(ceilingGeom, ceilingMaterial);
    ceiling.position.set(0, this.height, 0);
    ceiling.userData.isCeiling = true;
    ceiling.userData.ikeaPortMatRole = 'ceiling';
    ceiling.receiveShadow = false;
    ceiling.castShadow = false;
    this.group.add(ceiling);
    if (!this.walls) this.walls = {};
    this.walls.ceiling = ceiling;
    this.surfaces.ceiling = new THREE.Box3().setFromObject(ceiling);

    const frameMaterial = makeIkeaWallStandardMaterial(THREE.DoubleSide);
    const innerMaterial = makeIkeaWallStandardMaterial(THREE.FrontSide);

    this.walls = this.walls || {};
    this.wallInners = {};
    this.wallPlanes = [];
    this.originalWallMaterials = {};
    this._frameGeomSolid = {};
    this._innerGeomSolid = {};

    // Стены: полосы inner→outer с общими вершинами offset (IKEA-митры).
    // Одно Extrude-кольцо ломается на вогнутых углах (вырез) — щель во внутреннем углу.
    this._polygonWallRing = null;
    const nV = vertices.length;
    const nSeg = segments.length;
    for (let i = 0; i < nSeg; i++) {
      const s = segments[i];
      if (s.open) continue;
      let vi = i;
      if (vi >= nV) {
        vi = vertices.findIndex(
          (v) => Math.abs(v.x - s.x1) < 0.5 && Math.abs(v.z - s.z1) < 0.5
        );
        if (vi < 0) vi = 0;
      }
      const vj = (vi + 1) % nV;
      const built = this.createOffsetWallStrip(
        vertices[vi],
        vertices[vj],
        outerFoot[vi],
        outerFoot[vj],
        this.height,
        frameMaterial.clone(),
        innerMaterial.clone()
      );
      if (!built) continue;
      const { frame, inner, plane } = built;
      const key = s.wallName || s.id || 'seg_' + i;
      frame.userData.wallName = key;
      frame.userData.segmentId = s.id;
      frame.userData.buildSide = key;
      frame.userData.edgeIndex = vi;
      frame.userData.wallLength = Math.hypot(s.x2 - s.x1, s.z2 - s.z1);
      frame.userData.wallHeight = this.height;
      frame.userData.wallThickness = T;
      frame.userData.isPolygonWallStrip = true;
      frame.userData.segment = {
        x1: s.x1,
        z1: s.z1,
        x2: s.x2,
        z2: s.z2,
        len: frame.userData.wallLength,
      };
      // Плоский материал — IKEA-plan; не отдавать в v0 frame-шейдер
      frame.userData.cldPlanFlatWall = true;
      inner.userData.wallName = key;
      inner.userData.edgeIndex = vi;
      plane.userData.wallName = key;
      plane.userData.edgeIndex = vi;
      this.group.add(frame);
      this.group.add(inner);
      this.group.add(plane);
      this.wallPlanes.push(plane);
      if (s.wallName && !this.walls[s.wallName]) {
        this.walls[s.wallName] = frame;
        this.wallInners[s.wallName] = inner;
        this.surfaces[s.wallName] = new THREE.Box3().setFromObject(frame);
        this.originalWallMaterials[s.wallName] = frame.material;
        this._frameGeomSolid[s.wallName] = frame.geometry;
        this._innerGeomSolid[s.wallName] = inner.geometry;
      } else if (!s.wallName) {
        this.walls[key] = frame;
        this.wallInners[key] = inner;
        this.surfaces[key] = new THREE.Box3().setFromObject(frame);
        this.originalWallMaterials[key] = frame.material;
        this._frameGeomSolid[key] = frame.geometry;
        this._innerGeomSolid[key] = inner.geometry;
      }
    }

    this.highlightedWall = null;
    this.openingExtras = [];
    this.addDebugHelpers();
  }

  /**
   * Стена = экструзия четырёхугольника innerA–innerB–outerB–outerA.
   * Углы сходятся в вершинах outer-полигона (без «рогов» и щелей).
   *
   * Важно: внутреннюю грань короба утаскиваем в толщу стены — иначе в 3D
   * DoubleSide-frame и wallInners почти совпадают → рябь (z-fight).
   * На прямоугольнике этого нет: там createMiteredWall + createWallInnerFaces.
   */
  createOffsetWallStrip(innerA, innerB, outerA, outerB, height, frameMat, innerMat) {
    const dx = innerB.x - innerA.x;
    const dz = innerB.z - innerA.z;
    const len = Math.hypot(dx, dz);
    if (len < 1) return null;
    const ux = dx / len;
    const uz = dz / len;
    const nx = -uz; // inward CCW
    const nz = ux;

    // Толщина сегмента (мм) — recess не больше ~30%
    const thick = Math.hypot(outerA.x - innerA.x, outerA.z - innerA.z) || 100;
    const recess = Math.max(4, Math.min(12, thick * 0.12));

    // Грань короба со стороны комнаты — внутрь стены (−inward)
    const fA = { x: innerA.x - nx * recess, z: innerA.z - nz * recess };
    const fB = { x: innerB.x - nx * recess, z: innerB.z - nz * recess };

    const shape = new THREE.Shape();
    shape.moveTo(fA.x, fA.z);
    shape.lineTo(fB.x, fB.z);
    shape.lineTo(outerB.x, outerB.z);
    shape.lineTo(outerA.x, outerA.z);
    shape.closePath();
    let geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    geom.rotateX(Math.PI / 2);
    geom.translate(0, height, 0);

    // Короб уводим в глубину относительно декоративной плоскости
    if (frameMat) {
      frameMat.polygonOffset = true;
      frameMat.polygonOffsetFactor = 2;
      frameMat.polygonOffsetUnits = 2;
    }
    const frame = new THREE.Mesh(geom, frameMat);
    frame.receiveShadow = false;
    frame.castShadow = false;
    frame.position.set(0, 0, 0);
    frame.userData.isPolygonWallStrip = true;
    frame.userData.cldPlanFlatWall = true;

    if (innerMat) {
      innerMat.polygonOffset = true;
      innerMat.polygonOffsetFactor = -1;
      innerMat.polygonOffsetUnits = -1;
      // Нужно ближе к камере, чем frame
      if (innerMat.side == null) innerMat.side = THREE.FrontSide;
    }
    const midX = (innerA.x + innerB.x) / 2;
    const midZ = (innerA.z + innerB.z) / 2;
    // Чуть в комнату от footprint — единственная видимая внутренняя плоскость
    const inset = 0.5;
    const innerGeo = new THREE.PlaneGeometry(len, height);
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.rotation.y = Math.atan2(nx, nz);
    inner.position.set(midX + nx * inset, height / 2, midZ + nz * inset);
    inner.receiveShadow = false;
    inner.castShadow = false;
    inner.renderOrder = 1;
    inner.userData.isPolygonWallInner = true;

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(len, height),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    plane.rotation.y = Math.atan2(nx, nz);
    plane.position.set(midX + nx * inset, height / 2, midZ + nz * inset);
    plane.userData.normal = new THREE.Vector3(nx, 0, nz);
    plane.userData.visible = true;
    plane.userData.segmentLen = len;

    return { frame, inner, plane };
  }

  /** @deprecated — оставлен для совместимости; buildPolygonRoom использует createOffsetWallStrip */
  createSegmentWall(segment, height, thickness, frameMat, innerMat, miterStart, miterEnd) {
    const T = thickness;
    const x1 = segment.x1;
    const z1 = segment.z1;
    const x2 = segment.x2;
    const z2 = segment.z2;
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 1) return null;
    const ux = dx / len;
    const uz = dz / len;
    const nx = -uz;
    const nz = ux;
    const outerA = { x: x1 - nx * T, z: z1 - nz * T };
    const outerB = { x: x2 - nx * T, z: z2 - nz * T };
    return this.createOffsetWallStrip(
      { x: x1, z: z1 },
      { x: x2, z: z2 },
      outerA,
      outerB,
      height,
      frameMat,
      innerMat
    );
  }

  applyStaticRoomAoMaterials() {}

  refreshCabinetWallShadowShaders() {}

  _bindStaticRoomAo(_material, _kind, _wallName) {}

  static getLook() {
    if (!Room._look) {
      Room._look = { bright: 1 };
    }
    return Room._look;
  }

  static getLookUniforms() {
    return {};
  }

  applyLook(partial) {
    const look = Room.getLook();
    if (partial.bright != null) look.bright = Number(partial.bright);
    const base = 0xe8e8e0;
    const scale = Math.max(0.5, Math.min(1.5, look.bright));
    const r = Math.min(255, Math.round(((base >> 16) & 255) * scale));
    const g = Math.min(255, Math.round(((base >> 8) & 255) * scale));
    const b = Math.min(255, Math.round((base & 255) * scale));
    const hex = (r << 16) | (g << 8) | b;
    const inners = this.wallInners || {};
    [inners.front, inners.back, inners.left, inners.right].forEach((mesh) => {
      if (mesh?.material?.color) mesh.material.color.setHex(hex);
    });
    const frames = this.walls || {};
    [frames.front, frames.back, frames.left, frames.right, frames.ceiling].forEach((mesh) => {
      if (mesh?.material?.color) mesh.material.color.setHex(hex);
    });
  }

  installRoomLookTuner() {}

  /**
   * Галтели пол–стена 45°: quad на стену, материал пола для слияния, polygonOffset от z-fighting.
   */
  createFloorWallChamfers(wallThickness, floorMaterial) {
    const L = 35;
    const w = this.width;
    const d = this.depth;
    const mat = (floorMaterial && floorMaterial.map)
      ? new THREE.MeshBasicMaterial({
          map: floorMaterial.map,
          color: floorMaterial.color || 0xffffff,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshBasicMaterial({
          color: 0xd8d4cc,
          side: THREE.DoubleSide,
        });

    const quad = (a, b, c, d) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = false;
      m.castShadow = false;
      m.renderOrder = 1;
      m.material.polygonOffset = true;
      m.material.polygonOffsetFactor = 1;
      m.material.polygonOffsetUnits = 1;
      return m;
    };

    const tri = (a, b, c) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
      g.setIndex([0, 1, 2]);
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = false;
      m.castShadow = false;
      m.renderOrder = 1;
      m.material.polygonOffset = true;
      m.material.polygonOffsetFactor = 1;
      m.material.polygonOffsetUnits = 1;
      return m;
    };

    // Сверху вниз: край на полу (y=0), фаска идёт вниз (-L) и в комнату
    this.group.add(quad([0, 0, 0], [w, 0, 0], [w, -L, L], [0, -L, L]));
    this.group.add(quad([0, 0, d], [w, 0, d], [w, -L, d - L], [0, -L, d - L]));
    this.group.add(quad([0, 0, 0], [0, 0, d], [L, -L, d], [L, -L, 0]));
    this.group.add(quad([w, 0, 0], [w, 0, d], [w - L, -L, d], [w - L, -L, 0]));

    this.group.add(tri([0, 0, 0], [0, -L, L], [L, -L, 0]));
    this.group.add(tri([w, 0, 0], [w, -L, L], [w - L, -L, 0]));
    this.group.add(tri([0, 0, d], [L, -L, d], [0, -L, d - L]));
    this.group.add(tri([w, 0, d], [w, -L, d - L], [w - L, -L, d]));
  }

  /**
   * Внутренние плоские панели стен (только до скосов) — с текстурой.
   * UV-координаты масштабируются под физические размеры: 1 тайл = tileSize мм.
   */
  createWallInnerFaces(material, tileSize = 500) {
    // Как Exp14: offset 1 мм + polygonOffset −1 → без ряби/просветов на дальней стене.
    const offset = 1;
    const overlap = 1;
    const inners = {};
    const scaleUVs = (geom, w, h) => {
      const uv = geom.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) * (w / tileSize), uv.getY(i) * (h / tileSize));
      }
      uv.needsUpdate = true;
    };
    const makeInnerMat = () => {
      const mat = material.clone();
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = -1;
      mat.polygonOffsetUnits = -1;
      return mat;
    };

    const finishInner = (mesh) => {
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.renderOrder = 1;
      mesh.userData.isWallInner = true;
      mesh.userData.ikeaPortMatRole = 'wall';
      this.group.add(mesh);
    };

    const frontGeo = new THREE.PlaneGeometry(this.width + overlap * 2, this.height);
    scaleUVs(frontGeo, this.width, this.height);
    const frontInner = new THREE.Mesh(frontGeo, makeInnerMat());
    frontInner.position.set(this.width / 2, this.height / 2, offset);
    frontInner.userData.wallName = 'back';
    finishInner(frontInner);
    inners.back = frontInner;

    const backGeo = new THREE.PlaneGeometry(this.width + overlap * 2, this.height);
    scaleUVs(backGeo, this.width, this.height);
    const backInner = new THREE.Mesh(backGeo, makeInnerMat());
    backInner.rotation.y = Math.PI;
    backInner.position.set(this.width / 2, this.height / 2, this.depth - offset);
    backInner.userData.wallName = 'front';
    finishInner(backInner);
    inners.front = backInner;

    const leftGeo = new THREE.PlaneGeometry(this.depth + overlap * 2, this.height);
    scaleUVs(leftGeo, this.depth, this.height);
    const leftInner = new THREE.Mesh(leftGeo, makeInnerMat());
    leftInner.rotation.y = Math.PI / 2;
    leftInner.position.set(offset, this.height / 2, this.depth / 2);
    leftInner.userData.wallName = 'left';
    finishInner(leftInner);
    inners.left = leftInner;

    const rightGeo = new THREE.PlaneGeometry(this.depth + overlap * 2, this.height);
    scaleUVs(rightGeo, this.depth, this.height);
    const rightInner = new THREE.Mesh(rightGeo, makeInnerMat());
    rightInner.rotation.y = -Math.PI / 2;
    rightInner.position.set(this.width - offset, this.height / 2, this.depth / 2);
    rightInner.userData.wallName = 'right';
    finishInner(rightInner);
    inners.right = rightInner;

    return inners;
  }

  /**
   * Стена с митрованными концами (45°): левая стена — эталон.
   */
  createMiteredWall(length, height, thickness, side, material) {
    const T = thickness;
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, length);
    shape.lineTo(-T, length + T);
    shape.lineTo(-T, length);
    shape.lineTo(-T, 0);
    shape.lineTo(-T, -T);
    shape.lineTo(0, 0);

    let geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });

    if (side === 'front') {
      geom.rotateZ(-Math.PI / 2);
      geom.rotateX(-Math.PI / 2);
    } else if (side === 'back') {
      geom.rotateZ(Math.PI / 2);
      geom.rotateX(-Math.PI / 2);
    } else if (side === 'left') {
      geom.rotateX(Math.PI / 2);
    } else {
      geom.rotateZ(Math.PI);
      geom.rotateX(Math.PI / 2);
    }
    geom.computeBoundingBox();
    const c = new THREE.Vector3();
    geom.boundingBox.getCenter(c);
    geom.translate(-c.x, -c.y, -c.z);

    // Как Exp14: frame глубже inner (factor +2 / −1) — иначе рябь/«просветы» на стене.
    if (material && !material.userData?.__cldWallFrameOffset) {
      material.polygonOffset = true;
      material.polygonOffsetFactor = 2;
      material.polygonOffsetUnits = 2;
      if (!material.userData) material.userData = {};
      material.userData.__cldWallFrameOffset = true;
    }
    const mesh = new THREE.Mesh(geom, material);
    // Без Spot SM на стенах (Betrakta soft ≠ Three SM)
    mesh.receiveShadow = false;
    mesh.castShadow = false;
    mesh.userData.wallName = side;
    mesh.userData.buildSide = side;
    mesh.userData.ikeaPortMatRole = 'wall';
    mesh.userData.frameCenter = c.clone();
    mesh.userData.wallLength = length;
    mesh.userData.wallHeight = height;
    mesh.userData.wallThickness = T;

    if (side === 'front') {
      mesh.position.set(length / 2, height / 2, -T / 2);
    } else if (side === 'back') {
      mesh.position.set(length / 2, height / 2, this.depth + T / 2);
    } else if (side === 'left') {
      mesh.position.set(-T / 2, height / 2, length / 2);
    } else {
      mesh.position.set(this.width + T / 2, height / 2, length / 2);
    }

    return mesh;
  }

  createWallPlanes() {
    const wallThickness = 0.1;

    const frontPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.width, this.height),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    frontPlane.rotation.y = 0;
    frontPlane.position.set(this.width / 2, this.height / 2, 0);
    frontPlane.userData.wallName = 'back';
    frontPlane.userData.normal = new THREE.Vector3(0, 0, 1);
    frontPlane.userData.visible = true;
    this.group.add(frontPlane);
    this.wallPlanes.push(frontPlane);

    const backPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.width, this.height),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    backPlane.rotation.y = Math.PI;
    backPlane.position.set(this.width / 2, this.height / 2, this.depth);
    backPlane.userData.wallName = 'front';
    backPlane.userData.normal = new THREE.Vector3(0, 0, -1);
    backPlane.userData.visible = true;
    this.group.add(backPlane);
    this.wallPlanes.push(backPlane);

    const leftPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.depth, this.height),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    leftPlane.rotation.y = Math.PI / 2;
    leftPlane.position.set(0, this.height / 2, this.depth / 2);
    leftPlane.userData.wallName = 'left';
    leftPlane.userData.normal = new THREE.Vector3(1, 0, 0);
    leftPlane.userData.visible = true;
    this.group.add(leftPlane);
    this.wallPlanes.push(leftPlane);

    const rightPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.depth, this.height),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    rightPlane.rotation.y = -Math.PI / 2;
    rightPlane.position.set(this.width, this.height / 2, this.depth / 2);
    rightPlane.userData.wallName = 'right';
    rightPlane.userData.normal = new THREE.Vector3(-1, 0, 0);
    rightPlane.userData.visible = true;
    this.group.add(rightPlane);
    this.wallPlanes.push(rightPlane);
  }

  addDebugHelpers() {
    // В проде убираем зелёный контур и оси, оставляем только маркеры стен
    if (this.innerContourHelper) {
      this.group.remove(this.innerContourHelper);
      if (this.innerContourHelper.geometry) this.innerContourHelper.geometry.dispose();
      if (this.innerContourHelper.material) this.innerContourHelper.material.dispose();
      this.innerContourHelper = null;
    }

    this.createWallMarkers();
  }

  createWallMarkers() {
    const markerGeometry = new THREE.SphereGeometry(20, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });

    this.wallMarkers = {};

    const frontMarker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
    frontMarker.position.set(this.width / 2, 0, 0);
    frontMarker.visible = false;
    frontMarker.userData.wallName = 'back';
    this.group.add(frontMarker);
    this.wallMarkers.back = frontMarker;

    const backMarker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
    backMarker.position.set(this.width / 2, 0, this.depth);
    backMarker.visible = false;
    backMarker.userData.wallName = 'front';
    this.group.add(backMarker);
    this.wallMarkers.front = backMarker;

    const leftMarker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
    leftMarker.position.set(0, 0, this.depth / 2);
    leftMarker.visible = false;
    leftMarker.userData.wallName = 'left';
    this.group.add(leftMarker);
    this.wallMarkers.left = leftMarker;

    const rightMarker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
    rightMarker.position.set(this.width, 0, this.depth / 2);
    rightMarker.visible = false;
    rightMarker.userData.wallName = 'right';
    this.group.add(rightMarker);
    this.wallMarkers.right = rightMarker;
  }

  /**
   * Красные маркеры во всех нижних углах комнаты + подписи с координатами.
   * Помогает визуально понять, где front/back/left/right.
   */
  createCornerMarkers() {
    const markerGeometry = new THREE.SphereGeometry(20, 8, 8);
    const baseMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });

    /**
     * Создать простую текстовую подпись через CanvasTexture.
     * @param {string} text
     */
    const createLabelSprite = (text) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(250, 125, 1);
      return sprite;
    };

    const addCorner = (x, y, z, label) => {
      const marker = new THREE.Mesh(markerGeometry, baseMaterial.clone());
      marker.position.set(x, y, z);
      marker.userData.cornerLabel = label;
      this.group.add(marker);

      const sprite = createLabelSprite(label);
      sprite.position.set(x, y + 120, z);
      this.group.add(sprite);
    };

    // Нумерация углов по часовой стрелке, если смотреть сверху:
    // 1 – front-left, 2 – front-right, 3 – back-right, 4 – back-left.
    addCorner(0, 0, 0, '1');
    addCorner(this.width, 0, 0, '2');
    addCorner(this.width, 0, this.depth, '3');
    addCorner(0, 0, this.depth, '4');

    console.log('[ROOM] Corner markers legend:', {
      1: 'front-left (0, 0)',
      2: `front-right (${this.width}, 0)`,
      3: `back-right (${this.width}, ${this.depth})`,
      4: `back-left (0, ${this.depth})`,
    });
  }

  updateWallMarker(wallName, x, z) {
    if (!this.wallMarkers || !this.wallMarkers[wallName]) return;
    const marker = this.wallMarkers[wallName];
    marker.visible = true;
    switch (wallName) {
      case 'front': marker.position.set(x, 0, this.depth); break;
      case 'back': marker.position.set(x, 0, 0); break;
      case 'left': marker.position.set(0, 0, z); break;
      case 'right': marker.position.set(this.width, 0, z); break;
    }
  }

  hideAllMarkers() {
    if (!this.wallMarkers) return;
    Object.values(this.wallMarkers).forEach(m => { m.visible = false; });
  }

  updateWallVisibility(camera) {
    if (!camera || !this.walls) return;
    const cameraPos = camera.position.clone();
    const roomGroupWorldPos = new THREE.Vector3();
    this.group.getWorldPosition(roomGroupWorldPos);
    const localCameraPos = cameraPos.clone().sub(roomGroupWorldPos);

    const slopeForcedHidden = (mesh) =>
      !!(mesh && mesh.userData && mesh.userData._slopeCutBackup && mesh.userData._slopeCutBackup.kind === 'hide');

    const setVisible = (name, visible) => {
      // скошенный потолок прячет исходную стену — не возвращать её каждый кадр
      if (this.walls[name]) {
        this.walls[name].visible = slopeForcedHidden(this.walls[name]) ? false : visible;
      }
      // В 2D-плане — только толстый контур стен (IKEA top view).
      // Иначе через щель двери видна «перемычка» внутренней панели.
      const hideInnerTop =
        typeof window !== 'undefined' && window.__cldRoomEditView === '2d';
      if (this.wallInners?.[name]) {
        this.wallInners[name].visible = slopeForcedHidden(this.wallInners[name])
          ? false
          : visible && !hideInnerTop;
      }
      // Синхронизируем видимость вспомогательных плоскостей стен (для raycast),
      // чтобы по скрытым стенам нельзя было кликнуть/ставить мебель.
      if (this.wallPlanes && this.wallPlanes.length) {
        this.wallPlanes.forEach((p) => {
          if (p.userData && p.userData.wallName === name) {
            p.visible = slopeForcedHidden(p) ? false : visible;
          }
        });
      }
      (this.openingExtras || []).forEach((m) => {
        if (!m || !m.userData || m.userData.wallName !== name) return;
        if (slopeForcedHidden(m)) {
          m.visible = false;
          return;
        }
        const view2d = typeof window !== 'undefined' && window.__cldRoomEditView === '2d';
        const view3d = typeof window !== 'undefined' && window.__cldRoomEditView === '3d';
        const hideTop = view2d && m.userData.hideInTopView;
        const hide3d = view3d && m.userData.hideIn3dView;
        m.visible = visible && !hideTop && !hide3d;
      });
    };

    // Полигон + 2D план / сценические CAD: стены без 3D cutaway.
    // front/side: прячем ближнюю стену (иначе ortho смотрит в наружную грань → серый кадр).
    const plan2d =
      typeof window !== 'undefined' && window.__cldRoomEditView === '2d';
    const scenePreset =
      typeof window !== 'undefined'
        ? String(window.__cldSceneViewPreset || '')
            .trim()
            .toLowerCase()
        : '';
    const sceneCadOrtho =
      scenePreset === 'top' || scenePreset === 'front' || scenePreset === 'side';
    if (
      (plan2d || sceneCadOrtho) &&
      Array.isArray(this.wallSegments) &&
      this.wallSegments.length
    ) {
      Object.keys(this.walls).forEach((name) => {
        if (name === 'ceiling') {
          this.walls.ceiling.visible = false;
          return;
        }
        let on = true;
        if (scenePreset === 'front' && name === 'front') on = false;
        if (scenePreset === 'side' && name === 'left') on = false;
        setVisible(name, on);
      });
      if (this.wallPlanes) {
        this.wallPlanes.forEach((p) => {
          const wn = p.userData?.wallName;
          let on = true;
          if (scenePreset === 'front' && wn === 'front') on = false;
          if (scenePreset === 'side' && wn === 'left') on = false;
          p.visible = on;
        });
      }
      return;
    }

    setVisible('back', localCameraPos.z >= 0);
    setVisible('front', localCameraPos.z <= this.depth);
    setVisible('left', localCameraPos.x >= 0);
    setVisible('right', localCameraPos.x <= this.width);
    // Extra polygon segments (notch etc.): keep visible in 3D
    if (Array.isArray(this.wallSegments)) {
      Object.keys(this.walls).forEach((name) => {
        if (name === 'ceiling' || name === 'front' || name === 'back' || name === 'left' || name === 'right') {
          return;
        }
        setVisible(name, true);
      });
    }
    // Потолок: у IKEA в elevated exterior не видно «крыши» плиты, но низ может быть
    // в кадре при более горизонтальном взгляде. Прячем только верхнюю грань снаружи.
    if (this.walls.ceiling) {
      if (typeof window !== 'undefined' && window.__cldRoomEditOpen) {
        this.walls.ceiling.visible = false;
      } else {
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        const aboveSlab = localCameraPos.y > this.height - 40;
        const seeingExteriorTop = aboveSlab && camDir.y < 0.08;
        // Как раньше по направлению, но без крыши при взгляде сверху снаружи.
        this.walls.ceiling.visible = !seeingExteriorTop && camDir.y >= -0.35;
      }
    }
  }

  _storeSolidWallGeoms() {
    this._frameGeomSolid = {};
    this._innerGeomSolid = {};
    ['front', 'back', 'left', 'right'].forEach((name) => {
      const frame = this.walls && this.walls[name];
      const inner = this.wallInners && this.wallInners[name];
      if (frame && frame.geometry) {
        frame.geometry.computeBoundingBox();
        this._frameGeomSolid[name] = frame.geometry.clone();
      }
      if (inner && inner.geometry) this._innerGeomSolid[name] = inner.geometry.clone();
    });
  }

  wallLengthOf(wallName) {
    if (this.walls && this.walls[wallName] && this.walls[wallName].userData?.wallLength) {
      return this.walls[wallName].userData.wallLength;
    }
    const hit = this.findWallSegment(wallName);
    if (hit) {
      return Math.hypot(hit.x2 - hit.x1, hit.z2 - hit.z1);
    }
    return wallName === 'left' || wallName === 'right' ? this.depth : this.width;
  }

  /** Сегмент footprint по legacy-имени или id (e3… для внутренних рёбер выреза). */
  findWallSegment(wallName) {
    const segs = Array.isArray(this.wallSegments)
      ? this.wallSegments
      : this.footprintSpec && Array.isArray(this.footprintSpec.segments)
        ? this.footprintSpec.segments
        : null;
    if (!segs || !wallName) return null;
    return (
      segs.find((s) => s && !s.open && (s.wallName === wallName || s.id === wallName)) || null
    );
  }

  /** Ось along: 'x' (как front/back) или 'z' (как left/right). */
  wallAlongAxis(wallName) {
    if (wallName === 'front' || wallName === 'back') return 'x';
    if (wallName === 'left' || wallName === 'right') return 'z';
    const s = this.findWallSegment(wallName);
    if (!s) return 'x';
    return Math.abs(s.x2 - s.x1) >= Math.abs(s.z2 - s.z1) ? 'x' : 'z';
  }

  /**
   * Кардинальная сторона для inward (дверь/подсветка).
   * Для polygon-рёбер — по нормали CCW (inward = (-dz, dx)).
   */
  wallCardinalSide(wallName) {
    if (
      wallName === 'front' ||
      wallName === 'back' ||
      wallName === 'left' ||
      wallName === 'right'
    ) {
      return wallName;
    }
    const s = this.findWallSegment(wallName);
    if (!s) return 'back';
    const dx = s.x2 - s.x1;
    const dz = s.z2 - s.z1;
    const len = Math.hypot(dx, dz) || 1;
    const inx = -dz / len;
    const inz = dx / len;
    if (Math.abs(inx) >= Math.abs(inz)) return inx > 0 ? 'left' : 'right';
    return inz > 0 ? 'back' : 'front';
  }

  /** Начало сегмента стены в абсолютных along (X или Z комнаты). */
  wallAlongOrigin(wallName) {
    const hit = this.findWallSegment(wallName);
    if (!hit) return 0;
    if (this.wallAlongAxis(wallName) === 'x') return Math.min(hit.x1, hit.x2);
    return Math.min(hit.z1, hit.z2);
  }

  _relAlong(wallName, alongAbs) {
    return (Number(alongAbs) || 0) - this.wallAlongOrigin(wallName);
  }

  _clearOpeningExtras() {
    (this.openingExtras || []).forEach((m) => {
      if (!m) return;
      if (m.parent) m.parent.remove(m);
      if (typeof m.traverse === 'function') {
        m.traverse((c) => {
          if (c && c.geometry) c.geometry.dispose();
        });
      } else if (m.geometry) {
        m.geometry.dispose();
      }
    });
    this.openingExtras = [];
  }

  _mergeGeoms(list) {
    const pieces = (list || []).filter(Boolean).map((g) => (g.index ? g.toNonIndexed() : g));
    if (!pieces.length) return null;
    if (pieces.length === 1) return pieces[0];
    let count = 0;
    pieces.forEach((g) => {
      count += g.attributes.position.count;
    });
    const pos = new Float32Array(count * 3);
    const nrm = new Float32Array(count * 3);
    const hasUv = pieces.every((g) => g.attributes.uv);
    const uv = hasUv ? new Float32Array(count * 2) : null;
    let offset = 0;
    pieces.forEach((g) => {
      pos.set(g.attributes.position.array, offset * 3);
      if (g.attributes.normal) nrm.set(g.attributes.normal.array, offset * 3);
      if (uv) uv.set(g.attributes.uv.array, offset * 2);
      offset += g.attributes.position.count;
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    if (uv) out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.computeVertexNormals();
    pieces.forEach((g) => g.dispose());
    return out;
  }

  /**
   * Кусок той же митрованной стены (как createMiteredWall), не Box —
   * иначе углы комнаты разъезжаются.
   */
  _extrudeWallSlice(length, height, T, side, y0, y1, miterStart, miterEnd, center) {
    const shape = new THREE.Shape();
    const a = Math.max(0, y0);
    const b = Math.min(length, y1);
    if (b - a < 1) return null;
    shape.moveTo(0, a);
    shape.lineTo(0, b);
    if (miterEnd && Math.abs(b - length) < 0.5) {
      shape.lineTo(-T, length + T);
      shape.lineTo(-T, length);
    } else {
      shape.lineTo(-T, b);
    }
    if (miterStart && a <= 0.5) {
      shape.lineTo(-T, 0);
      shape.lineTo(-T, -T);
      shape.lineTo(0, 0);
    } else {
      shape.lineTo(-T, a);
      shape.lineTo(0, a);
    }

    let geom = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    if (side === 'front') {
      geom.rotateZ(-Math.PI / 2);
      geom.rotateX(-Math.PI / 2);
    } else if (side === 'back') {
      geom.rotateZ(Math.PI / 2);
      geom.rotateX(-Math.PI / 2);
    } else if (side === 'left') {
      geom.rotateX(Math.PI / 2);
    } else {
      geom.rotateZ(Math.PI);
      geom.rotateX(Math.PI / 2);
    }
    if (center) geom.translate(-center.x, -center.y, -center.z);
    return geom;
  }

  _solidIntervals(length, holes, wallName) {
    const origin = wallName ? this.wallAlongOrigin(wallName) : 0;
    const cuts = (holes || [])
      .map((h) => {
        const rel = (h.alongMm || 0) - origin;
        return {
          a: Math.max(0, rel - h.widthMm / 2),
          b: Math.min(length, rel + h.widthMm / 2),
        };
      })
      .filter((h) => h.b - h.a > 1)
      .sort((x, y) => x.a - y.a);
    const merged = [];
    cuts.forEach((c) => {
      const last = merged[merged.length - 1];
      if (last && c.a <= last.b + 1) last.b = Math.max(last.b, c.b);
      else merged.push({ a: c.a, b: c.b });
    });
    const solids = [];
    let cursor = 0;
    merged.forEach((c) => {
      if (c.a - cursor > 1) solids.push({ a: cursor, b: c.a });
      cursor = Math.max(cursor, c.b);
    });
    if (length - cursor > 1) solids.push({ a: cursor, b: length });
    return { solids, holes: merged };
  }

  _alongToLocalX(wallName, alongAbs) {
    const len = this.wallLengthOf(wallName);
    const rel = this._relAlong(wallName, alongAbs);
    if (this.wallCardinalSide(wallName) === 'left') return len / 2 - rel;
    return rel - len / 2;
  }

  _rebuildInnerWithHoles(wallName, openings) {
    const inner = this.wallInners && this.wallInners[wallName];
    if (!inner) return;
    const solid = this._innerGeomSolid && this._innerGeomSolid[wallName];
    const len = this.wallLengthOf(wallName);
    const h = this.height;
    const overlap = 1;
    if (!openings.length) {
      if (solid && inner.userData.openingCut) {
        if (inner.geometry) inner.geometry.dispose();
        inner.geometry = solid.clone();
        inner.userData.openingCut = false;
      }
      return;
    }
    const hw = len / 2 + overlap;
    const hh = h / 2;
    const tileSize = 380;
    const holes = openings
      .map((op) => {
        const x0 = this._alongToLocalX(wallName, op.alongMm - op.widthMm / 2);
        const x1 = this._alongToLocalX(wallName, op.alongMm + op.widthMm / 2);
        return {
          x0: Math.min(x0, x1),
          x1: Math.max(x0, x1),
          y0: (op.sillMm || 0) - hh,
          y1: (op.sillMm || 0) + op.heightMm - hh,
        };
      })
      .sort((a, b) => a.x0 - b.x0);
    const geoms = [];
    const addQuad = (xa, ya, xb, yb) => {
      if (xb - xa < 0.5 || yb - ya < 0.5) return;
      const g = new THREE.PlaneGeometry(xb - xa, yb - ya);
      g.translate((xa + xb) / 2, (ya + yb) / 2, 0);
      const uv = g.attributes.uv;
      const pos = g.attributes.position;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, (pos.getX(i) + hw) / tileSize, (pos.getY(i) + hh) / tileSize);
      }
      geoms.push(g);
    };
    let xCursor = -hw;
    holes.forEach((hole) => {
      addQuad(xCursor, -hh, hole.x0, hh);
      addQuad(hole.x0, -hh, hole.x1, hole.y0);
      addQuad(hole.x0, hole.y1, hole.x1, hh);
      xCursor = hole.x1;
    });
    addQuad(xCursor, -hh, hw, hh);
    const merged = this._mergeGeoms(geoms);
    if (!merged) return;
    if (inner.geometry && inner.geometry !== solid) inner.geometry.dispose();
    inner.geometry = merged;
    inner.userData.openingCut = true;
  }

  _rebuildFrameWithHoles(wallName, openings) {
    const frame = this.walls && this.walls[wallName];
    if (!frame) return;
    const solid = this._frameGeomSolid && this._frameGeomSolid[wallName];
    if (!openings.length) {
      if (solid && frame.userData.openingCut) {
        if (frame.geometry && frame.geometry !== solid) frame.geometry.dispose();
        frame.geometry = solid.clone();
        frame.userData.openingCut = false;
      }
      frame.visible = true;
      return;
    }
    const T = frame.userData.wallThickness || 100;
    const length = this.wallLengthOf(wallName);
    const height = this.height;
    const side = frame.userData.buildSide || wallName;
    const center = frame.userData.frameCenter;
    if (!center) return;
    const split = this._solidIntervals(length, openings, wallName);
    // Только боковые сегменты в той же митрованной геометрии — углы как до двери.
    const geoms = split.solids.map((s) =>
      this._extrudeWallSlice(length, height, T, side, s.a, s.b, s.a <= 0.5, s.b >= length - 0.5, center)
    );
    const merged = this._mergeGeoms(geoms);
    if (!merged) return;
    if (frame.geometry && frame.geometry !== solid) frame.geometry.dispose();
    frame.geometry = merged;
    frame.userData.openingCut = true;
    frame.visible = true;

    // Перемычка / подоконник — только 3D (в 2D у IKEA в плане — разрыв стены).
    openings.forEach((op) => {
      const a = op.alongMm - op.widthMm / 2;
      const b = op.alongMm + op.widthMm / 2;
      const sill = op.sillMm || 0;
      const top = sill + op.heightMm;
      if (sill > 1) this._addLintelBox(wallName, a, b, 0, sill);
      if (height - top > 1) this._addLintelBox(wallName, a, b, top, height);
    });
  }

  _addLintelBox(wallName, along0, along1, y0, y1) {
    const T = 100;
    const span = along1 - along0;
    const h = y1 - y0;
    if (span < 1 || h < 1) return null;
    const along = (along0 + along1) / 2;
    const y = (y0 + y1) / 2;
    const side = this.wallCardinalSide(wallName);
    const axis = this.wallAlongAxis(wallName);
    const seg = this.findWallSegment(wallName);
    let mesh;
    if (axis === 'x') {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(span, h, T));
      const mz = seg ? (seg.z1 + seg.z2) / 2 : side === 'back' ? 0 : this.depth;
      const z = side === 'back' ? mz - T / 2 : mz + T / 2;
      mesh.position.set(along, y, z);
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(T, h, span));
      const mx = seg ? (seg.x1 + seg.x2) / 2 : side === 'left' ? 0 : this.width;
      const x = side === 'left' ? mx - T / 2 : mx + T / 2;
      mesh.position.set(x, y, along);
    }
    const frame = this.walls && this.walls[wallName];
    mesh.material = (frame && frame.material) || new THREE.MeshBasicMaterial({ color: 0xe8e8e0, side: THREE.DoubleSide });
    mesh.userData.wallName = wallName;
    mesh.userData.isRoomOpeningLintel = true;
    mesh.userData.isRoomOpeningFrame = true;
    mesh.userData.hideInTopView = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    if (typeof window !== 'undefined' && window.__cldRoomEditView === '2d') mesh.visible = false;
    this.group.add(mesh);
    this.openingExtras = (this.openingExtras || []).concat(mesh);
    return mesh;
  }

  syncOpeningExtraMaterials() {
    (this.openingExtras || []).forEach((m) => {
      if (!m || !m.userData || !(m.userData.isRoomOpeningFrame || m.userData.isRoomOpeningLintel)) return;
      const frame = this.walls && this.walls[m.userData.wallName];
      if (frame && frame.material) m.material = frame.material;
    });
  }

  /**
   * Роли FBX: PVC-рама / Metall1 / стекло / уплотнитель.
   * Рама → IKEA v0 (как мебель), softCaster off. Стекло → Basic transparent + exterior plane.
   */
  _openingMatRole(mat) {
    if (!mat) return 'other';
    if (mat.userData && mat.userData.openingRole) return mat.userData.openingRole;
    const name = String(mat.name || '').toLowerCase();
    const opacity = mat.opacity != null ? Number(mat.opacity) : 1;
    const transparent = !!mat.transparent || opacity < 0.95;
    const col = mat.color;
    const lum = col ? (col.r + col.g + col.b) / 3 : 1;
    const mapName = String(
      (mat.map && (mat.map.name || (mat.map.image && mat.map.image.name))) || ''
    ).toLowerCase();
    const metalness = mat.metalness != null ? Number(mat.metalness) : 0;
    if (
      transparent ||
      opacity < 0.5 ||
      name.indexOf('glass') !== -1 ||
      name.indexOf('glas') !== -1
    ) {
      return 'glass';
    }
    if (
      metalness >= 0.45 ||
      mapName.indexOf('metal') !== -1 ||
      mapName.indexOf('metall') !== -1 ||
      name.indexOf('metal') !== -1
    ) {
      return 'metal';
    }
    if (lum < 0.22 && !mat.map) return 'gasket';
    return 'frame';
  }

  /** outer / sash / metal(как в GLB) / gasket — PVC не перекрашиваем в «ручку». */
  _openingClassifyPart(mesh, mat, role) {
    if (role === 'glass') return 'glass';
    if (role === 'metal') return 'metal';
    if (role === 'gasket') return 'gasket';
    const name = String((mat && mat.name) || '').toLowerCase();
    if (name.indexOf('plastic') !== -1) return 'sash';
    if (/2304|2305|frame|outer/.test(name)) return 'outer';
    return 'sash';
  }

  _tagOpeningTextureColorSpace(tex) {
    if (!tex) return;
    if (typeof window !== 'undefined' && typeof window.__cldPrepareIkeaV0Map === 'function') {
      window.__cldPrepareIkeaV0Map(tex);
      return;
    }
    if (tex.colorSpace !== undefined && THREE.SRGBColorSpace !== undefined) {
      tex.colorSpace = THREE.SRGBColorSpace;
    } else if (tex.encoding !== undefined && THREE.sRGBEncoding !== undefined) {
      tex.encoding = THREE.sRGBEncoding;
    }
  }

  _openingGlassMaterial() {
    return new THREE.MeshBasicMaterial({
      color: 0xb8d4e8,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  _openingV0BindOpts(role, srcMat, finishSpec, part) {
    const softOff = {
      softCaster: false,
      softFloorCaster: false,
      softAoSilhouette: false,
      cabinet: true,
      side: THREE.DoubleSide,
      forceVisual: true,
    };
    if (role === 'metal' || part === 'metal') {
      // Как в GLB (Metall1). metalness≈0: иначе IKEA v0 без iblSpec делает металл чёрным.
      const col =
        srcMat && srcMat.color ? srcMat.color.clone() : new THREE.Color(0xffffff);
      return {
        ...softOff,
        map: srcMat && srcMat.map ? srcMat.map : null,
        color: col,
        metalness: 0,
        roughness: srcMat && srcMat.roughness != null ? Number(srcMat.roughness) : 0.45,
      };
    }
    if (role === 'gasket' || part === 'gasket') {
      return {
        ...softOff,
        map: null,
        color: new THREE.Color(0x0e0e0e),
        roughness: 0.9,
        metalness: 0,
      };
    }
    // Дверь / as-is: цвета и карты из GLB, без отделки окна
    if (!finishSpec || finishSpec.kind === 'as-is') {
      const col =
        srcMat && srcMat.color ? srcMat.color.clone() : new THREE.Color(0x6e7d7b);
      return {
        ...softOff,
        map: srcMat && srcMat.map ? srcMat.map : null,
        color: col,
        roughness: srcMat && srcMat.roughness != null ? Number(srcMat.roughness) : 0.55,
        metalness: 0,
      };
    }
    if (finishSpec && finishSpec.kind === 'map' && finishSpec.map) {
      return {
        ...softOff,
        map: finishSpec.map,
        color: new THREE.Color(0xffffff),
        roughness: part === 'outer' ? 0.52 : 0.45,
        metalness: 0,
      };
    }
    const rgb = (finishSpec && finishSpec.rgb) || [0.93, 0.93, 0.92];
    const shade = part === 'outer' ? 0.94 : part === 'sash' ? 1.02 : 1;
    return {
      ...softOff,
      map: null,
      color: new THREE.Color(
        Math.min(1, rgb[0] * shade),
        Math.min(1, rgb[1] * shade),
        Math.min(1, rgb[2] * shade)
      ),
      roughness: part === 'outer' ? 0.5 : 0.42,
      metalness: 0,
    };
  }

  _openingRoleToV0Kind(role, part) {
    if (role === 'metal' || part === 'metal') return 'metal';
    if (role === 'gasket' || part === 'gasket') return 'rubber';
    return 'trim';
  }

  _openingDisableSoftSpotLayers(mesh) {
    if (!mesh || !mesh.layers) return;
    mesh.layers.enable(0);
    mesh.layers.disable(2);
    mesh.layers.disable(3);
    mesh.layers.disable(4);
    mesh.layers.disable(5);
  }

  /** Bind opening mesh in-place (real geometry → panel edge AO / Spot shading). */
  _bindOpeningMeshToV0(mesh, role, finishSpec, part) {
    const bind = typeof window !== 'undefined' ? window.__cldBindMeshToIkeaV0 : null;
    const useRole = part === 'metal' ? 'metal' : role;
    if (useRole === 'glass' || part === 'glass') {
      const g = this._openingGlassMaterial();
      g.userData.openingRole = 'glass';
      g.userData.openingPart = 'glass';
      mesh.material = g;
      this._openingDisableSoftSpotLayers(mesh);
      return;
    }
    if (!bind) {
      const rgb = (finishSpec && finishSpec.rgb) || [0.93, 0.93, 0.92];
      mesh.material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(rgb[0], rgb[1], rgb[2]),
        side: THREE.DoubleSide,
      });
      mesh.material.userData.openingRole = useRole;
      mesh.material.userData.openingPart = part || 'sash';
      return;
    }
    const src = mesh.material;
    const kind = this._openingRoleToV0Kind(useRole, part);
    const opts = this._openingV0BindOpts(useRole, src, finishSpec, part);
    if (opts.map) this._tagOpeningTextureColorSpace(opts.map);
    mesh.userData.spotShadowCaster = false;
    mesh.userData.openingPart = part || 'sash';
    bind(mesh, kind, opts);
    if (mesh.material) {
      mesh.material.userData.openingRole = useRole;
      mesh.material.userData.openingPart = part || 'sash';
      if (src && src.name) mesh.material.name = src.name;
      if (kind === 'rubber') {
        // Уплотнитель почти копланарен раме — без сдвига глубины z-fighting пунктиром.
        mesh.material.polygonOffset = true;
        mesh.material.polygonOffsetFactor = 1;
        mesh.material.polygonOffsetUnits = 2;
      }
    }
    this._openingDisableSoftSpotLayers(mesh);
  }

  /** @deprecated slot helper — prefer _bindOpeningMeshToV0 */
  _bindOpeningMaterialToV0(srcMat, role, finishSpec, part) {
    const bind = typeof window !== 'undefined' ? window.__cldBindMeshToIkeaV0 : null;
    const useRole = part === 'metal' ? 'metal' : role;
    if (!bind || useRole === 'glass') {
      if (useRole === 'glass') {
        const g = this._openingGlassMaterial();
        g.userData.openingRole = 'glass';
        g.userData.openingPart = 'glass';
        return g;
      }
      const c = new THREE.Color(0xe8e8e6);
      const m = new THREE.MeshBasicMaterial({
        color: c,
        map: srcMat && srcMat.map ? srcMat.map : null,
        side: THREE.DoubleSide,
      });
      m.userData.openingRole = useRole;
      m.userData.openingPart = part || 'sash';
      return m;
    }
    const kind = this._openingRoleToV0Kind(useRole, part);
    const opts = this._openingV0BindOpts(useRole, srcMat, finishSpec, part);
    if (opts.map) this._tagOpeningTextureColorSpace(opts.map);
    const tmp = new THREE.Mesh(new THREE.BufferGeometry());
    tmp.material = srcMat;
    tmp.userData.spotShadowCaster = false;
    bind(tmp, kind, opts);
    const out = tmp.material;
    if (out) {
      out.userData.openingRole = useRole;
      out.userData.openingPart = part || 'sash';
      out.name = (srcMat && srcMat.name) || out.name || '';
    }
    tmp.geometry.dispose();
    return out || srcMat;
  }

  /** Геометрия створки/ручки — только как в GLB, без сдвигов. */
  _applyOpeningSashDepth(_root) {}

  _openingFinishSpecSync(finishId) {
    const id = finishId || 'white';
    const FINISH = {
      white: { kind: 'solid', rgb: [0.93, 0.93, 0.92] },
      beige: { kind: 'solid', rgb: [0.9, 0.84, 0.74] },
      Wood_2: { kind: 'map', url: '/models/windows/maps/Wood_2.jpg' },
      Wood_1: { kind: 'map', url: '/models/windows/maps/Wood_1.jpg' },
    };
    return { id, spec: FINISH[id] || FINISH.white };
  }

  _openingFinishSolidColor(finishId) {
    const { spec } = this._openingFinishSpecSync(finishId);
    if (spec.kind === 'solid' && spec.rgb) {
      return new THREE.Color(spec.rgb[0], spec.rgb[1], spec.rgb[2]);
    }
    // wood — mid tone for sill until map loads
    if (finishId === 'Wood_1') return new THREE.Color(0x32200a);
    if (finishId === 'Wood_2') return new THREE.Color(0xd6ad6f);
    return new THREE.Color(0xeeeeec);
  }

  _applyOpeningMaterialsToRoot(root, resolvedFinish) {
    root.traverse((c) => {
      if (!c.isMesh) return;
      c.castShadow = false;
      c.receiveShadow = false;
      c.userData.hideInTopView = true;
      c.userData.isRoomOpeningLeaf = true;
      c.userData.spotShadowCaster = false;
      if (Array.isArray(c.material)) {
        const srcMats = c.material.slice();
        c.material = srcMats.map((src) => {
          const role = this._openingMatRole(src);
          const part = this._openingClassifyPart(c, src, role);
          if (role === 'glass' || part === 'glass') {
            const g = this._openingGlassMaterial();
            g.userData.openingRole = 'glass';
            g.userData.openingPart = 'glass';
            return g;
          }
          if (src && src.map) this._tagOpeningTextureColorSpace(src.map);
          const asIs = !resolvedFinish || resolvedFinish.kind === 'as-is';
          const useFinish = asIs
            ? resolvedFinish || { kind: 'as-is' }
            : part === 'outer' || part === 'sash'
              ? resolvedFinish
              : null;
          return this._bindOpeningMaterialToV0(src, role, useFinish, part);
        });
        this._openingDisableSoftSpotLayers(c);
        return;
      }
      const src = c.material;
      const role = this._openingMatRole(src);
      const part = this._openingClassifyPart(c, src, role);
      c.userData.openingPart = part;
      if (src && src.map) this._tagOpeningTextureColorSpace(src.map);
      const asIs = !resolvedFinish || resolvedFinish.kind === 'as-is';
      const useFinish = asIs
        ? resolvedFinish || { kind: 'as-is' }
        : part === 'outer' || part === 'sash'
          ? resolvedFinish
          : null;
      this._bindOpeningMeshToV0(c, role, useFinish, part);
    });
    this._applyOpeningSashDepth(root);
  }

  _applyOpeningFinish(root, finishId) {
    if (!root) return;
    const { id, spec } = this._openingFinishSpecSync(finishId);
    const applyResolved = (resolved) => {
      this._applyOpeningMaterialsToRoot(root, resolved);
      if (typeof window !== 'undefined' && typeof window.__cldScheduleIkeaRoomLightSync === 'function') {
        window.__cldScheduleIkeaRoomLightSync();
      }
    };
    if (spec.kind === 'map') {
      new THREE.TextureLoader().load(spec.url, (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2.5, 2.5);
        tex.flipY = false;
        this._tagOpeningTextureColorSpace(tex);
        applyResolved({ kind: 'map', map: tex });
      });
    } else {
      applyResolved(spec);
    }
    root.userData.openingFinishId = id;
  }

  _mountOpeningGlb(holder, url, widthMm, heightMm, gen, finishId) {
    const Loader = typeof window !== 'undefined' ? window.GLTFLoader : null;
    if (!Loader || !holder || !url) return;
    const absUrl =
      url.charAt(0) === '/' && typeof window !== 'undefined' && window.location
        ? String(window.location.origin || '') + url
        : url;
    const asIs = !finishId || finishId === 'as-is';
    const { spec: finishSpec } = asIs
      ? { spec: { kind: 'as-is' } }
      : this._openingFinishSpecSync(finishId);

    const finishAndAttach = (root, resolvedFinish) => {
      this._applyOpeningMaterialsToRoot(root, resolvedFinish);
      while (holder.children.length) holder.remove(holder.children[0]);
      holder.add(root);
      holder.userData.openingFinishId = asIs ? 'as-is' : finishId || 'white';
      if (typeof window !== 'undefined' && typeof window.__cldScheduleIkeaRoomLightSync === 'function') {
        window.__cldScheduleIkeaRoomLightSync();
      }
    };

    new Loader().load(
      absUrl,
      (gltf) => {
        if (!gltf || !gltf.scene) return;
        if (this._openingExtrasGen !== gen) return;
        if (!holder.parent) return;
        const root = gltf.scene;
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        if (size.x < 0.001 || size.y < 0.001) return;
        const sx = widthMm / size.x;
        const sy = heightMm / size.y;
        root.scale.set(sx, sy, Math.min(sx, sy));
        root.updateMatrixWorld(true);
        box.setFromObject(root);
        const center = new THREE.Vector3();
        box.getCenter(center);
        root.position.sub(center);

        if (!asIs && finishSpec.kind === 'map') {
          new THREE.TextureLoader().load(
            finishSpec.url,
            (tex) => {
              if (this._openingExtrasGen !== gen || !holder.parent) return;
              tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
              tex.repeat.set(2.5, 2.5);
              tex.flipY = false;
              this._tagOpeningTextureColorSpace(tex);
              finishAndAttach(root, { kind: 'map', map: tex });
            },
            undefined,
            () => finishAndAttach(root, { kind: 'solid', rgb: [0.93, 0.93, 0.92] })
          );
        } else {
          finishAndAttach(root, finishSpec);
        }
      },
      undefined,
      (err) => {
        console.warn('[Room] window GLB load failed:', url, err && err.message ? err.message : err);
      }
    );
  }

  _getOpeningExteriorTexture() {
    if (Room._openingExteriorTex) return Room._openingExteriorTex;
    const w = 512;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    sky.addColorStop(0, '#e6eff6');
    sky.addColorStop(0.55, '#f4f7fa');
    sky.addColorStop(1, '#fbfcfd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.72);
    const ground = ctx.createLinearGradient(0, h * 0.72, 0, h);
    ground.addColorStop(0, '#eef0ea');
    ground.addColorStop(1, '#dfe3d8');
    ctx.fillStyle = ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, h * 0.68, w, h * 0.06);
    const tex = new THREE.CanvasTexture(canvas);
    if (THREE.SRGBColorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    Room._openingExteriorTex = tex;
    return tex;
  }

  _addOpeningExteriorPlane(op, extras) {
    if (!op || op.type !== 'window') return;
    const wallName = op.wallName;
    const along = op.alongMm;
    const w = op.widthMm;
    const h = op.heightMm;
    const sill = op.sillMm || 0;
    const midY = sill + h / 2;
    const T = 100;
    const out = 120;
    const pad = 40;
    const tex = this._getOpeningExteriorTexture();
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w + pad, h + pad), mat);
    plane.userData.wallName = wallName;
    plane.userData.isRoomOpeningExterior = true;
    plane.userData.hideInTopView = true;
    plane.userData.openingId = op.id;
    plane.castShadow = false;
    plane.receiveShadow = false;
    if (wallName === 'back') {
      plane.position.set(along, midY, -T - out);
    } else if (wallName === 'front') {
      plane.rotation.y = Math.PI;
      plane.position.set(along, midY, this.depth + T + out);
    } else if (wallName === 'left') {
      plane.rotation.y = Math.PI / 2;
      plane.position.set(-T - out, midY, along);
    } else {
      plane.rotation.y = -Math.PI / 2;
      plane.position.set(this.width + T + out, midY, along);
    }
    if (typeof window !== 'undefined' && window.__cldRoomEditView === '2d') plane.visible = false;
    this.group.add(plane);
    extras.push(plane);
  }

  _getOpeningWallAoTexture() {
    if (Room._openingWallAoTex) return Room._openingWallAoTex;
    const s = 128;
    const canvas = document.createElement('canvas');
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(s * 0.5, s * 0.55, s * 0.05, s * 0.5, s * 0.55, s * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0.38)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    Room._openingWallAoTex = tex;
    return tex;
  }

  /** GLB-окно стоит в середине толщины стены — откосы видны и получают свет/тень спота. */
  _openingWindowInsetMm(op) {
    if (!op || op.type !== 'window' || !String(op.modelUrl || '').trim()) return 0;
    return 50;
  }

  /** Contact shadows как у IKEA: мягкая AO-полоса рамы на стене + тень под подоконником. */
  _addOpeningContactShadows(op, extras) {
    if (!op || op.type !== 'window') return;
    const recessed = this._openingWindowInsetMm(op) > 0;
    const wallName = op.wallName;
    const along = op.alongMm;
    const w = op.widthMm;
    const h = op.heightMm;
    const sill = op.sillMm || 0;
    const midY = sill + h / 2;
    const hasSill = op.hasWindowsill !== false;
    const sillDepth = 120;
    const sillW = Math.max(40, w + 40);

    const placeOnWall = (mesh, inset) => {
      const d = inset != null ? inset : 1.2;
      if (wallName === 'back') mesh.position.set(along, midY, d);
      else if (wallName === 'front') {
        mesh.rotation.y = Math.PI;
        mesh.position.set(along, midY, this.depth - d);
      } else if (wallName === 'left') {
        mesh.rotation.y = Math.PI / 2;
        mesh.position.set(d, midY, along);
      } else {
        mesh.rotation.y = -Math.PI / 2;
        mesh.position.set(this.width - d, midY, along);
      }
    };

    // Мягкая тень рамы на стене (IKEA contact under/around frame)
    const aoTex = this._getOpeningWallAoTexture();
    const frameAo = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 90, h + 70),
      new THREE.MeshBasicMaterial({
        map: aoTex,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    frameAo.userData.hideInTopView = true;
    frameAo.userData.isRoomOpeningContactShadow = true;
    frameAo.userData.openingId = op.id;
    frameAo.castShadow = false;
    frameAo.receiveShadow = false;
    placeOnWall(frameAo, 0.8);
    // сдвиг вниз — сильнее пятно снизу как у IKEA
    frameAo.position.y -= 18;

    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    if (hasSill) {
      const wallBlob = new THREE.Mesh(
        wallName === 'left' || wallName === 'right'
          ? new THREE.PlaneGeometry(sillDepth * 0.85, 36)
          : new THREE.PlaneGeometry(sillW * 0.95, 36),
        shadowMat.clone()
      );
      wallBlob.material.opacity = 0.28;
      wallBlob.userData.hideInTopView = true;
      wallBlob.userData.isRoomOpeningContactShadow = true;
      wallBlob.userData.openingId = op.id;
      const yBlob = Math.max(4, sill - 14);
      if (wallName === 'back') wallBlob.position.set(along, yBlob, 1.4);
      else if (wallName === 'front') {
        wallBlob.rotation.y = Math.PI;
        wallBlob.position.set(along, yBlob, this.depth - 1.4);
      } else if (wallName === 'left') {
        wallBlob.rotation.y = Math.PI / 2;
        wallBlob.position.set(1.4, yBlob, along);
      } else {
        wallBlob.rotation.y = -Math.PI / 2;
        wallBlob.position.set(this.width - 1.4, yBlob, along);
      }

      const sillStrip = new THREE.Mesh(
        wallName === 'left' || wallName === 'right'
          ? new THREE.PlaneGeometry(26, sillW * 0.92)
          : new THREE.PlaneGeometry(sillW * 0.92, 26),
        shadowMat.clone()
      );
      sillStrip.material.opacity = 0.3;
      sillStrip.rotation.x = -Math.PI / 2;
      sillStrip.userData.hideInTopView = true;
      sillStrip.userData.isRoomOpeningContactShadow = true;
      sillStrip.userData.openingId = op.id;
      const sillY = sill + 30 / 2 + 0.8;
      if (wallName === 'back') sillStrip.position.set(along, sillY, 16);
      else if (wallName === 'front') sillStrip.position.set(along, sillY, this.depth - 16);
      else if (wallName === 'left') {
        sillStrip.rotation.z = Math.PI / 2;
        sillStrip.position.set(16, sillY, along);
      } else {
        sillStrip.rotation.z = Math.PI / 2;
        sillStrip.position.set(this.width - 16, sillY, along);
      }

      if (typeof window !== 'undefined' && window.__cldRoomEditView === '2d') {
        wallBlob.visible = false;
        sillStrip.visible = false;
      }
      this.group.add(wallBlob);
      extras.push(wallBlob);
      if (!recessed) {
        this.group.add(sillStrip);
        extras.push(sillStrip);
      }
    }

    if (recessed) return;
    if (typeof window !== 'undefined' && window.__cldRoomEditView === '2d') frameAo.visible = false;
    this.group.add(frameAo);
    extras.push(frameAo);
  }

  _addOpeningWindowsill(op, extras) {
    if (!op || op.hasWindowsill === false) return;
    const wallName = op.wallName;
    const along = op.alongMm;
    const w = op.widthMm;
    const sill = op.sillMm || 0;
    const finishId = op.finishId || 'white';
    const { spec } = this._openingFinishSpecSync(finishId);
    const inset = this._openingWindowInsetMm(op);
    const sillDepth = 120 + inset;
    const sillThick = 30;
    const sillW = Math.max(40, w + 40);
    const sillY = sill + sillThick / 2;
    const sillMid = sillDepth / 2 - inset;
    let geo;
    if (wallName === 'back' || wallName === 'front') {
      geo = new THREE.BoxGeometry(sillW, sillThick, sillDepth);
    } else {
      geo = new THREE.BoxGeometry(sillDepth, sillThick, sillW);
    }
    const sillMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    sillMesh.userData.wallName = wallName;
    sillMesh.userData.isRoomOpeningWindowsill = true;
    sillMesh.userData.hideInTopView = true;
    sillMesh.userData.openingId = op.id;
    sillMesh.castShadow = false;
    sillMesh.receiveShadow = false;
    sillMesh.userData.spotShadowCaster = false;
    if (wallName === 'back') sillMesh.position.set(along, sillY, sillMid);
    else if (wallName === 'front') sillMesh.position.set(along, sillY, this.depth - sillMid);
    else if (wallName === 'left') sillMesh.position.set(sillMid, sillY, along);
    else sillMesh.position.set(this.width - sillMid, sillY, along);

    const attachSillMat = (resolved) => {
      this._bindOpeningMeshToV0(sillMesh, 'frame', resolved);
      sillMesh.userData.openingRole = 'frame';
    };
    if (spec.kind === 'map') {
      // solid mid-tone first, then wood map
      attachSillMat({ kind: 'solid', rgb: [
        this._openingFinishSolidColor(finishId).r,
        this._openingFinishSolidColor(finishId).g,
        this._openingFinishSolidColor(finishId).b,
      ] });
      new THREE.TextureLoader().load(spec.url, (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2.2, 2.2);
        tex.flipY = false;
        this._tagOpeningTextureColorSpace(tex);
        attachSillMat({ kind: 'map', map: tex });
        if (typeof window.__cldScheduleIkeaRoomLightSync === 'function') {
          window.__cldScheduleIkeaRoomLightSync();
        }
      });
    } else {
      attachSillMat(spec);
    }
    if (typeof window !== 'undefined' && window.__cldRoomEditView === '2d') sillMesh.visible = false;
    this.group.add(sillMesh);
    extras.push(sillMesh);
  }

  _addOpeningExtras(op, opts) {
    const gen = this._openingExtrasGen || 0;
    const wallName = op.wallName;
    const along = op.alongMm;
    const w = op.widthMm;
    const h = op.heightMm;
    const sill = op.sillMm || 0;
    const selected = !!(opts && opts.selectedId && opts.selectedId === op.id);
    const handleSide = op.handleSide === 'RIGHT' ? 'RIGHT' : 'LEFT';
    const openOut = op.openingDirection === 'OUTWARDS';
    const extras = [];
    const T = 100;
    const midY = sill + h / 2;
    const side = this.wallCardinalSide(wallName);
    const axis = this.wallAlongAxis(wallName);
    const seg = this.findWallSegment(wallName);

    // 2D proxy в щели стены (как у IKEA) — только план; в 3D скрыт
    let proxy;
    if (axis === 'x') {
      const mz = seg ? (seg.z1 + seg.z2) / 2 : side === 'back' ? 0 : this.depth;
      const z = side === 'back' ? mz - T / 2 : mz + T / 2;
      proxy = new THREE.Mesh(
        new THREE.BoxGeometry(w, 24, T - 4),
        new THREE.MeshBasicMaterial({
          color: selected ? 0xd6e8f8 : 0xf3eee6,
          transparent: true,
          opacity: selected ? 0.98 : 0.96,
          depthWrite: false,
          depthTest: false,
        })
      );
      proxy.position.set(along, 14, z);
    } else {
      const mx = seg ? (seg.x1 + seg.x2) / 2 : side === 'left' ? 0 : this.width;
      const x = side === 'left' ? mx - T / 2 : mx + T / 2;
      proxy = new THREE.Mesh(
        new THREE.BoxGeometry(T - 4, 24, w),
        new THREE.MeshBasicMaterial({
          color: selected ? 0xd6e8f8 : 0xf3eee6,
          transparent: true,
          opacity: selected ? 0.98 : 0.96,
          depthWrite: false,
          depthTest: false,
        })
      );
      proxy.position.set(x, 14, along);
    }
    proxy.userData.wallName = wallName;
    proxy.userData.isRoomOpening = true;
    proxy.userData.isRoomOpeningProxy = true;
    proxy.userData.hideIn3dView = true;
    proxy.userData.openingId = op.id;
    proxy.castShadow = false;
    proxy.receiveShadow = false;
    proxy.renderOrder = 3;
    if (typeof window !== 'undefined' && window.__cldRoomEditView === '3d') proxy.visible = false;
    this.group.add(proxy);
    extras.push(proxy);

    // IKEA-план: дверь/окно читаются сверху (дуга / переплёт)
    this._addOpeningPlan2dSymbol(op, extras, selected);

    if (selected) {
      const ikeaBlue = 0x4a90d9;
      // 2D: синяя обводка proxy
      const edge2d = new THREE.LineSegments(
        new THREE.EdgesGeometry(proxy.geometry),
        new THREE.LineBasicMaterial({ color: ikeaBlue })
      );
      edge2d.position.copy(proxy.position);
      edge2d.rotation.copy(proxy.rotation);
      edge2d.userData.wallName = wallName;
      edge2d.userData.hideIn3dView = true;
      edge2d.userData.openingId = op.id;
      edge2d.renderOrder = 4;
      if (typeof window !== 'undefined' && window.__cldRoomEditView === '3d') edge2d.visible = false;
      this.group.add(edge2d);
      extras.push(edge2d);

      // 3D: синяя рамка проёма (IKEA outline)
      let outlineGeo;
      if (axis === 'x') {
        outlineGeo = new THREE.BoxGeometry(w, h, 10);
      } else {
        outlineGeo = new THREE.BoxGeometry(10, h, w);
      }
      const edge3d = new THREE.LineSegments(
        new THREE.EdgesGeometry(outlineGeo),
        new THREE.LineBasicMaterial({ color: ikeaBlue })
      );
      outlineGeo.dispose();
      if (axis === 'x') {
        const mz = seg ? (seg.z1 + seg.z2) / 2 : side === 'back' ? 0 : this.depth;
        const z = side === 'back' ? mz + 6 : mz - 6;
        edge3d.position.set(along, midY, z);
      } else {
        const mx = seg ? (seg.x1 + seg.x2) / 2 : side === 'left' ? 0 : this.width;
        const x = side === 'left' ? mx + 6 : mx - 6;
        edge3d.position.set(x, midY, along);
      }
      edge3d.userData.wallName = wallName;
      edge3d.userData.hideInTopView = true;
      edge3d.userData.isRoomOpeningOutline = true;
      edge3d.userData.openingId = op.id;
      edge3d.renderOrder = 5;
      if (typeof window !== 'undefined' && window.__cldRoomEditView === '2d') edge3d.visible = false;
      this.group.add(edge3d);
      extras.push(edge3d);
    }

    const pickGeo = new THREE.PlaneGeometry(w, h);
    const pickMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    const pick = new THREE.Mesh(pickGeo, pickMat);
    pick.userData.wallName = wallName;
    pick.userData.isRoomOpening = true;
    pick.userData.openingId = op.id;
    if (wallName === 'back') {
      pick.position.set(along, midY, 2);
    } else if (wallName === 'front') {
      pick.rotation.y = Math.PI;
      pick.position.set(along, midY, this.depth - 2);
    } else if (wallName === 'left') {
      pick.rotation.y = Math.PI / 2;
      pick.position.set(2, midY, along);
    } else {
      pick.rotation.y = -Math.PI / 2;
      pick.position.set(this.width - 2, midY, along);
    }
    this.group.add(pick);
    extras.push(pick);

    if (op.type === 'window') {
      const modelUrl = (op.modelUrl || '').trim();
      if (modelUrl) {
        const holder = new THREE.Group();
        holder.userData.wallName = wallName;
        holder.userData.isRoomOpeningLeaf = true;
        holder.userData.isRoomOpeningModel = true;
        holder.userData.hideInTopView = true;
        holder.userData.openingId = op.id;
        const inset = this._openingWindowInsetMm(op);
        if (wallName === 'back') holder.position.set(along, midY, -inset);
        else if (wallName === 'front') {
          holder.rotation.y = Math.PI;
          holder.position.set(along, midY, this.depth + inset);
        } else if (wallName === 'left') {
          holder.rotation.y = Math.PI / 2;
          holder.position.set(-inset, midY, along);
        } else {
          holder.rotation.y = -Math.PI / 2;
          holder.position.set(this.width + inset, midY, along);
        }
        if (typeof window !== 'undefined' && window.__cldRoomEditView === '2d') holder.visible = false;
        this.group.add(holder);
        extras.push(holder);
        this._mountOpeningGlb(holder, modelUrl, w, h, gen, op.finishId || 'white');
        this._addOpeningExteriorPlane(op, extras);
      } else {
        // Стекло в проёме (3D) — заглушка, если нет modelUrl
        const glassT = 12;
        const glassW = Math.max(20, w - 20);
        const glassH = Math.max(20, h - 20);
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(glassW, glassH, glassT),
          new THREE.MeshBasicMaterial({
            color: 0xc5d8e8,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        glass.userData.wallName = wallName;
        glass.userData.isRoomOpeningLeaf = true;
        glass.userData.hideInTopView = true;
        glass.userData.openingId = op.id;
        glass.castShadow = false;
        glass.receiveShadow = false;
        if (wallName === 'back') glass.position.set(along, midY, glassT / 2 + 2);
        else if (wallName === 'front') glass.position.set(along, midY, this.depth - glassT / 2 - 2);
        else if (wallName === 'left') {
          glass.rotation.y = Math.PI / 2;
          glass.position.set(glassT / 2 + 2, midY, along);
        } else {
          glass.rotation.y = Math.PI / 2;
          glass.position.set(this.width - glassT / 2 - 2, midY, along);
        }
        if (typeof window !== 'undefined' && window.__cldRoomEditView === '2d') glass.visible = false;
        this.group.add(glass);
        extras.push(glass);
        this._addOpeningExteriorPlane(op, extras);
      }

      // IKEA: подоконник — тот же декор, что рама; контактные тени рамы на стене
      this._addOpeningContactShadows(op, extras);
      if (op.hasWindowsill) {
        this._addOpeningWindowsill(op, extras);
      }
    } else if (op.kind !== 'opening') {
      const modelUrl = (op.modelUrl || '').trim();
      if (modelUrl) {
        // Свой GLB (полотно+коробка): в проём как окно, цвета из модели (as-is)
        const holder = new THREE.Group();
        holder.userData.wallName = wallName;
        holder.userData.isRoomOpeningLeaf = true;
        holder.userData.isRoomOpeningModel = true;
        holder.userData.hideInTopView = true;
        holder.userData.openingId = op.id;
        if (wallName === 'back') holder.position.set(along, midY, 20);
        else if (wallName === 'front') {
          holder.rotation.y = Math.PI;
          holder.position.set(along, midY, this.depth - 20);
        } else if (wallName === 'left') {
          holder.rotation.y = Math.PI / 2;
          holder.position.set(20, midY, along);
        } else {
          holder.rotation.y = -Math.PI / 2;
          holder.position.set(this.width - 20, midY, along);
        }
        if (typeof window !== 'undefined' && window.__cldRoomEditView === '2d') holder.visible = false;
        this.group.add(holder);
        extras.push(holder);
        this._mountOpeningGlb(holder, modelUrl, w, h, gen, 'as-is');
      } else {
        const leafT = 18;
        const leafW = Math.max(20, w - 16);
        const leafH = Math.max(20, h - 16);
        const leaf = new THREE.Mesh(
          new THREE.BoxGeometry(leafW, leafH, leafT),
          new THREE.MeshBasicMaterial({ color: 0xf4f3ee, side: THREE.DoubleSide })
        );
        leaf.userData.wallName = wallName;
        leaf.userData.isRoomOpeningLeaf = true;
        leaf.userData.hideInTopView = true;
        leaf.userData.openingId = op.id;
        leaf.castShadow = false;
        leaf.receiveShadow = false;
        const ajar = (handleSide === 'LEFT' ? 1 : -1) * (openOut ? -0.4 : 0.4);
        if (wallName === 'back') {
          const zIn = leafT / 2 + 4;
          const zOut = -T - leafT / 2 - 4;
          leaf.position.set(along, midY, openOut ? zOut : zIn);
          leaf.rotation.y = ajar;
        } else if (wallName === 'front') {
          const zIn = this.depth - leafT / 2 - 4;
          const zOut = this.depth + T + leafT / 2 + 4;
          leaf.position.set(along, midY, openOut ? zOut : zIn);
          leaf.rotation.y = -ajar;
        } else if (wallName === 'left') {
          const xIn = leafT / 2 + 4;
          const xOut = -T - leafT / 2 - 4;
          leaf.position.set(openOut ? xOut : xIn, midY, along);
          leaf.rotation.y = Math.PI / 2 + ajar;
        } else {
          const xIn = this.width - leafT / 2 - 4;
          const xOut = this.width + T + leafT / 2 + 4;
          leaf.position.set(openOut ? xOut : xIn, midY, along);
          leaf.rotation.y = Math.PI / 2 - ajar;
        }
        if (typeof window !== 'undefined' && window.__cldRoomEditView === '2d') leaf.visible = false;
        this.group.add(leaf);
        extras.push(leaf);
      }
    }

    this.openingExtras = (this.openingExtras || []).concat(extras);
  }

  /**
   * 2D-символ проёма как у IKEA: дверь = полотно + дуга; окно = двойной переплёт в щели стены.
   */
  _addOpeningPlan2dSymbol(op, extras, selected) {
    if (!op || op.kind === 'opening') return;
    const wallName = op.wallName;
    const along = Number(op.alongMm) || 0;
    const w = Math.max(40, Number(op.widthMm) || 900);
    const T = 100;
    const y = 28;
    const isWindow = op.type === 'window';
    const ink = selected ? 0x1a5fb4 : 0x222222;
    const inkSoft = selected ? 0x3584e4 : 0x444444;
    const side = this.wallCardinalSide(wallName);
    const axis = this.wallAlongAxis(wallName);
    const seg = this.findWallSegment(wallName);
    const group = new THREE.Group();
    group.userData.wallName = wallName;
    group.userData.openingId = op.id;
    group.userData.isRoomOpeningPlanSymbol = true;
    group.userData.hideIn3dView = true;
    group.renderOrder = 30;
    if (typeof window !== 'undefined' && window.__cldRoomEditView === '3d') group.visible = false;

    const wallZ = () => {
      const mz = seg ? (seg.z1 + seg.z2) / 2 : side === 'back' ? 0 : this.depth;
      return side === 'back' ? mz - T / 2 : mz + T / 2;
    };
    const wallX = () => {
      const mx = seg ? (seg.x1 + seg.x2) / 2 : side === 'left' ? 0 : this.width;
      return side === 'left' ? mx - T / 2 : mx + T / 2;
    };
    const hingeOnSeg = (hingeAlong) => {
      if (axis === 'x') {
        const mz = seg ? (seg.z1 + seg.z2) / 2 : side === 'back' ? 0 : this.depth;
        return new THREE.Vector3(hingeAlong, y, mz);
      }
      const mx = seg ? (seg.x1 + seg.x2) / 2 : side === 'left' ? 0 : this.width;
      return new THREE.Vector3(mx, y, hingeAlong);
    };

    const addSeg = (x1, z1, x2, z2, color, thick) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz) || 1;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(len, 5, Math.max(6, thick || 10)),
        new THREE.MeshBasicMaterial({
          color: color,
          depthTest: false,
          depthWrite: false,
        })
      );
      mesh.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
      mesh.rotation.y = Math.atan2(dx, dz) - Math.PI / 2;
      mesh.renderOrder = 31;
      mesh.userData.wallName = wallName;
      mesh.userData.openingId = op.id;
      mesh.userData.hideIn3dView = true;
      group.add(mesh);
      return mesh;
    };

    const addArc = (hx, hz, radius, fromAng, toAng, color) => {
      const steps = 28;
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = fromAng + (toAng - fromAng) * t;
        pts.push(new THREE.Vector3(hx + Math.cos(a) * radius, y, hz + Math.sin(a) * radius));
      }
      // дуга как цепочка коротких сегментов-боксов (linewidth в WebGL ≈1)
      for (let i = 0; i < pts.length - 1; i++) {
        addSeg(pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z, color, 7);
      }
    };

    const addThinLeaf = (cx, cy, cz, rotY, len, thick, color) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(len, 7, thick),
        new THREE.MeshBasicMaterial({
          color: color,
          depthTest: false,
          depthWrite: false,
        })
      );
      mesh.position.set(cx, cy, cz);
      mesh.rotation.y = rotY;
      mesh.renderOrder = 32;
      mesh.userData.wallName = wallName;
      mesh.userData.openingId = op.id;
      mesh.userData.hideIn3dView = true;
      group.add(mesh);
      return mesh;
    };

    if (isWindow) {
      // Двойной переплёт в толщине стены — жирные линии (как IKEA casement)
      const gap = 12;
      const pane = (w - gap) / 2;
      const frameT = Math.max(28, T - 12);
      const ft = 12;
      if (axis === 'x') {
        const z = wallZ();
        const x0 = along - w / 2;
        addSeg(x0, z - frameT / 2, x0 + w, z - frameT / 2, ink, ft);
        addSeg(x0, z + frameT / 2, x0 + w, z + frameT / 2, ink, ft);
        addSeg(along, z - frameT / 2, along, z + frameT / 2, ink, ft);
        addSeg(x0, z - frameT / 2, x0, z + frameT / 2, ink, ft);
        addSeg(x0 + w, z - frameT / 2, x0 + w, z + frameT / 2, ink, ft);
        const mkPane = (cx) => {
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(Math.max(20, pane - 8), 4, frameT - 16),
            new THREE.MeshBasicMaterial({
              color: selected ? 0x9ec5e8 : 0xa8c4d8,
              transparent: true,
              opacity: 0.75,
              depthTest: false,
              depthWrite: false,
            })
          );
          m.position.set(cx, y, z);
          m.renderOrder = 30;
          m.userData.wallName = wallName;
          m.userData.openingId = op.id;
          m.userData.hideIn3dView = true;
          group.add(m);
        };
        mkPane(along - pane / 2 - gap / 4);
        mkPane(along + pane / 2 + gap / 4);
      } else {
        const x = wallX();
        const z0 = along - w / 2;
        addSeg(x - frameT / 2, z0, x - frameT / 2, z0 + w, ink, ft);
        addSeg(x + frameT / 2, z0, x + frameT / 2, z0 + w, ink, ft);
        addSeg(x - frameT / 2, along, x + frameT / 2, along, ink, ft);
        addSeg(x - frameT / 2, z0, x + frameT / 2, z0, ink, ft);
        addSeg(x - frameT / 2, z0 + w, x + frameT / 2, z0 + w, ink, ft);
        const mkPane = (cz) => {
          const m = new THREE.Mesh(
            new THREE.BoxGeometry(frameT - 16, 4, Math.max(20, pane - 8)),
            new THREE.MeshBasicMaterial({
              color: selected ? 0x9ec5e8 : 0xa8c4d8,
              transparent: true,
              opacity: 0.75,
              depthTest: false,
              depthWrite: false,
            })
          );
          m.position.set(x, y, cz);
          m.renderOrder = 30;
          m.userData.wallName = wallName;
          m.userData.openingId = op.id;
          m.userData.hideIn3dView = true;
          group.add(m);
        };
        mkPane(along - pane / 2 - gap / 4);
        mkPane(along + pane / 2 + gap / 4);
      }
    } else {
      // Дверь: полотно 90° + дуга
      const handleLeft = op.handleSide !== 'RIGHT';
      const openOut = op.openingDirection === 'OUTWARDS';
      const mirrored = side !== 'back';
      const hingeSign = handleLeft ? (mirrored ? -1 : 1) : mirrored ? 1 : -1;
      const hingeAlong = along + hingeSign * (w / 2);
      const leafThick = 16;

      let alongAxis;
      let inward;
      if (side === 'back') {
        alongAxis = new THREE.Vector3(1, 0, 0);
        inward = new THREE.Vector3(0, 0, 1);
      } else if (side === 'front') {
        alongAxis = new THREE.Vector3(1, 0, 0);
        inward = new THREE.Vector3(0, 0, -1);
      } else if (side === 'left') {
        alongAxis = new THREE.Vector3(0, 0, 1);
        inward = new THREE.Vector3(1, 0, 0);
      } else {
        alongAxis = new THREE.Vector3(0, 0, 1);
        inward = new THREE.Vector3(-1, 0, 0);
      }
      const hinge = hingeOnSeg(hingeAlong);

      const closedDir = alongAxis.clone().multiplyScalar(-hingeSign);
      const swingDir = openOut ? inward.clone().negate() : inward.clone();
      const leafDir = swingDir.clone().normalize();
      const mid = hinge.clone().add(leafDir.clone().multiplyScalar(w / 2));
      const rotY = Math.atan2(leafDir.x, leafDir.z) - Math.PI / 2;
      addThinLeaf(mid.x, y, mid.z, rotY, w, leafThick, ink);

      const a0 = Math.atan2(closedDir.z, closedDir.x);
      const a1 = Math.atan2(swingDir.z, swingDir.x);
      let da = a1 - a0;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      addArc(hinge.x, hinge.z, w, a0, a0 + da, inkSoft);

      if (axis === 'x') {
        const z = wallZ();
        addSeg(along - w / 2, z, along + w / 2, z, inkSoft, 8);
      } else {
        const x = wallX();
        addSeg(x, along - w / 2, x, along + w / 2, inkSoft, 8);
      }
    }

    this.group.add(group);
    extras.push(group);
  }

  applyOpenings(openings, opts) {
    const list = Array.isArray(openings) ? openings : [];
    this.openings = list;
    this._openingExtrasGen = (this._openingExtrasGen || 0) + 1;
    this._clearOpeningExtras();
    const byWall = {};
    list.forEach((op) => {
      if (!op || !op.wallName) return;
      if (!byWall[op.wallName]) byWall[op.wallName] = [];
      byWall[op.wallName].push(op);
    });
    const wallKeys = new Set(['front', 'back', 'left', 'right', ...Object.keys(byWall)]);
    if (this.walls) {
      Object.keys(this.walls).forEach((k) => {
        if (k !== 'ceiling') wallKeys.add(k);
      });
    }
    wallKeys.forEach((name) => {
      this._rebuildFrameWithHoles(name, byWall[name] || []);
      this._rebuildInnerWithHoles(name, byWall[name] || []);
    });
    list.forEach((op) => this._addOpeningExtras(op, opts || {}));
    const sel = opts && opts.selectedId;
    const selOp = sel && list.find((o) => o && o.id === sel);
    this.setFeatureWallHighlight(selOp ? selOp.wallName : null);
  }

  clearFeatureWallHighlight() {
    const m = this._featureWallHighlight;
    if (!m) return;
    if (m.parent) m.parent.remove(m);
    if (m.geometry) m.geometry.dispose();
    if (m.material) m.material.dispose();
    this._featureWallHighlight = null;
  }

  /**
   * IKEA: 2D — толстая тёмная полоса стены; 3D — тонкая синяя линия по верху стены.
   * Длина = реальный сегмент (wallLengthOf), не AABB — иначе на L/вырезе полоса уходит в пустоту.
   */
  setFeatureWallHighlight(wallName) {
    this.clearFeatureWallHighlight();
    if (!wallName || !this.walls || !this.walls[wallName]) return;
    const T = 100;
    const len = Math.max(1, this.wallLengthOf(wallName));
    const start = this.wallAlongOrigin(wallName);
    const mid = start + len / 2;
    const side = this.wallCardinalSide(wallName);
    const axis = this.wallAlongAxis(wallName);
    const seg = this.findWallSegment(wallName);
    const is2d = typeof window !== 'undefined' && window.__cldRoomEditView !== '3d';
    const y = is2d ? 6 : this.height + 4;
    const barH = is2d ? 10 : 8;
    const stroke = is2d ? 36 : 12;
    const mat = new THREE.MeshBasicMaterial({
      color: is2d ? 0x1a1a1a : 0x4a90d9,
      depthTest: !is2d,
      depthWrite: false,
    });
    let mesh;
    if (axis === 'x') {
      const mz = seg ? (seg.z1 + seg.z2) / 2 : side === 'back' ? 0 : this.depth;
      const z = side === 'back' ? mz - T / 2 : mz + T / 2;
      mesh = new THREE.Mesh(new THREE.BoxGeometry(len + T * 2, barH, stroke), mat);
      mesh.position.set(mid, y, z);
    } else {
      const mx = seg ? (seg.x1 + seg.x2) / 2 : side === 'left' ? 0 : this.width;
      const x = side === 'left' ? mx - T / 2 : mx + T / 2;
      mesh = new THREE.Mesh(new THREE.BoxGeometry(stroke, barH, len + T * 2), mat);
      mesh.position.set(x, y, mid);
    }
    mesh.userData.isFeatureWallHighlight = true;
    mesh.userData.wallName = wallName;
    mesh.renderOrder = 2;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    this._featureWallHighlight = mesh;
    this.group.add(mesh);
  }

  highlightWall(wallName) {
    return;
  }

  resetWallHighlight() {
    if (this.highlightedWall && this.walls && this.walls[this.highlightedWall]) {
      const wall = this.walls[this.highlightedWall];
      if (wall.userData.originalMaterial) {
        wall.material = wall.userData.originalMaterial;
        delete wall.userData.originalMaterial;
      } else if (this.originalWallMaterials && this.originalWallMaterials[this.highlightedWall]) {
        wall.material = this.originalWallMaterials[this.highlightedWall].clone();
      }
      this.highlightedWall = null;
    }
  }

  /**
   * Внутренние перегородки (не в outer footprint ring).
   * Сегмент — осевая линия; толщина ±T/2 по нормали в XZ.
   * @param {Array<{id?:string,x1:number,z1:number,x2:number,z2:number}>} walls
   */
  applyInteriorWalls(walls) {
    const disposeObj = (o) => {
      if (!o) return;
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    };
    if (this._interiorWallObjs && this._interiorWallObjs.length) {
      for (const o of this._interiorWallObjs) {
        if (o.parent) o.parent.remove(o);
        disposeObj(o);
      }
    }
    this._interiorWallObjs = [];
    if (!this.walls) this.walls = {};
    if (!this.wallInners) this.wallInners = {};
    if (!this.wallPlanes) this.wallPlanes = [];
    if (!this.originalWallMaterials) this.originalWallMaterials = {};
    if (!this._frameGeomSolid) this._frameGeomSolid = {};
    if (!this._innerGeomSolid) this._innerGeomSolid = {};

    // Убрать прошлые ключи iw*
    for (const k of Object.keys(this.walls)) {
      if (String(k).startsWith('iw')) {
        delete this.walls[k];
        delete this.wallInners[k];
        delete this.surfaces[k];
        delete this.originalWallMaterials[k];
        delete this._frameGeomSolid[k];
        delete this._innerGeomSolid[k];
      }
    }
    this.wallPlanes = (this.wallPlanes || []).filter(
      (p) => !(p && p.userData && p.userData.isInteriorWall)
    );

    const list = Array.isArray(walls) ? walls : [];
    if (!list.length) return;

    const T = 100;
    const half = T / 2;
    const wallColor = 0xe8e8e0;
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: wallColor,
      side: THREE.DoubleSide,
    });
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: wallColor,
      side: THREE.FrontSide,
    });

    for (let i = 0; i < list.length; i++) {
      const w = list[i];
      if (!w) continue;
      const x1 = Number(w.x1);
      const z1 = Number(w.z1);
      const x2 = Number(w.x2);
      const z2 = Number(w.z2);
      if (![x1, z1, x2, z2].every(Number.isFinite)) continue;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      if (len < 1) continue;
      const ux = dx / len;
      const uz = dz / len;
      const nx = -uz;
      const nz = ux;
      const innerA = { x: x1 - nx * half, z: z1 - nz * half };
      const innerB = { x: x2 - nx * half, z: z2 - nz * half };
      const outerA = { x: x1 + nx * half, z: z1 + nz * half };
      const outerB = { x: x2 + nx * half, z: z2 + nz * half };
      const built = this.createOffsetWallStrip(
        innerA,
        innerB,
        outerA,
        outerB,
        this.height,
        frameMaterial.clone(),
        innerMaterial.clone()
      );
      if (!built) continue;
      const { frame, inner, plane } = built;
      const key = w.id || 'iw' + i;
      frame.userData.wallName = key;
      frame.userData.segmentId = key;
      frame.userData.buildSide = key;
      frame.userData.isInteriorWall = true;
      frame.userData.isPolygonWallStrip = true;
      frame.userData.cldPlanFlatWall = true;
      frame.userData.wallLength = len;
      frame.userData.wallHeight = this.height;
      frame.userData.wallThickness = T;
      frame.userData.segment = { x1, z1, x2, z2, len };
      inner.userData.wallName = key;
      inner.userData.isInteriorWall = true;
      plane.userData.wallName = key;
      plane.userData.isInteriorWall = true;
      this.group.add(frame);
      this.group.add(inner);
      this.group.add(plane);
      this._interiorWallObjs.push(frame, inner, plane);
      this.wallPlanes.push(plane);
      this.walls[key] = frame;
      this.wallInners[key] = inner;
      this.surfaces[key] = new THREE.Box3().setFromObject(frame);
      this.originalWallMaterials[key] = frame.material;
      this._frameGeomSolid[key] = frame.geometry;
      this._innerGeomSolid[key] = inner.geometry;
    }
  }
}
