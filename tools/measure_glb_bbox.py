import json
import os
import struct
import sys
from typing import Dict, List, Tuple, Optional


def _mat4_identity() -> List[List[float]]:
    return [
        [1.0, 0.0, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ]


def _mat4_mul(a: List[List[float]], b: List[List[float]]) -> List[List[float]]:
    out = [[0.0] * 4 for _ in range(4)]
    for i in range(4):
        for j in range(4):
            out[i][j] = sum(a[i][k] * b[k][j] for k in range(4))
    return out


def _mat4_from_trs(
    t: List[float], r: List[float], s: List[float]
) -> List[List[float]]:
    tx, ty, tz = t
    x, y, z, w = r
    sx, sy, sz = s

    # quaternion to rotation matrix
    xx = x * x
    yy = y * y
    zz = z * z
    xy = x * y
    xz = x * z
    yz = y * z
    wx = w * x
    wy = w * y
    wz = w * z

    m00 = 1 - 2 * (yy + zz)
    m01 = 2 * (xy - wz)
    m02 = 2 * (xz + wy)

    m10 = 2 * (xy + wz)
    m11 = 1 - 2 * (xx + zz)
    m12 = 2 * (yz - wx)

    m20 = 2 * (xz - wy)
    m21 = 2 * (yz + wx)
    m22 = 1 - 2 * (xx + yy)

    # apply scale (column-wise like glTF TRS)
    m00 *= sx
    m01 *= sy
    m02 *= sz
    m10 *= sx
    m11 *= sy
    m12 *= sz
    m20 *= sx
    m21 *= sy
    m22 *= sz

    return [
        [m00, m01, m02, tx],
        [m10, m11, m12, ty],
        [m20, m21, m22, tz],
        [0.0, 0.0, 0.0, 1.0],
    ]


def _mat4_from_node(node: Dict) -> List[List[float]]:
    if "matrix" in node:
        m = node["matrix"]
        # glTF matrix is column-major 4x4
        return [
            [m[0], m[4], m[8], m[12]],
            [m[1], m[5], m[9], m[13]],
            [m[2], m[6], m[10], m[14]],
            [m[3], m[7], m[11], m[15]],
        ]

    t = node.get("translation", [0.0, 0.0, 0.0])
    r = node.get("rotation", [0.0, 0.0, 0.0, 1.0])
    s = node.get("scale", [1.0, 1.0, 1.0])
    return _mat4_from_trs(t, r, s)


def _transform_point(m: List[List[float]], p: Tuple[float, float, float]) -> Tuple[float, float, float]:
    x, y, z = p
    xp = m[0][0] * x + m[0][1] * y + m[0][2] * z + m[0][3]
    yp = m[1][0] * x + m[1][1] * y + m[1][2] * z + m[1][3]
    zp = m[2][0] * x + m[2][1] * y + m[2][2] * z + m[2][3]
    wp = m[3][0] * x + m[3][1] * y + m[3][2] * z + m[3][3]
    if wp and abs(wp - 1.0) > 1e-9:
        xp /= wp
        yp /= wp
        zp /= wp
    return (xp, yp, zp)


def _aabb_corners(mn: List[float], mx: List[float]) -> List[Tuple[float, float, float]]:
    return [
        (mn[0], mn[1], mn[2]),
        (mn[0], mn[1], mx[2]),
        (mn[0], mx[1], mn[2]),
        (mn[0], mx[1], mx[2]),
        (mx[0], mn[1], mn[2]),
        (mx[0], mn[1], mx[2]),
        (mx[0], mx[1], mn[2]),
        (mx[0], mx[1], mx[2]),
    ]


def load_glb_json(path: str) -> Dict:
    with open(path, "rb") as f:
        data = f.read()

    if len(data) < 12:
        raise ValueError("GLB too small")
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF":
        raise ValueError(f"Not a GLB (magic={magic!r})")

    offset = 12
    json_chunk: Optional[bytes] = None
    while offset + 8 <= len(data):
        chunk_len, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_len]
        offset += chunk_len
        if chunk_type == 0x4E4F534A:  # JSON
            json_chunk = chunk

    if json_chunk is None:
        raise ValueError("No JSON chunk found")

    return json.loads(json_chunk.decode("utf-8"))


def compute_scene_aabb(gltf: Dict) -> Tuple[List[float], List[float], int]:
    nodes = gltf.get("nodes", [])
    meshes = gltf.get("meshes", [])
    accessors = gltf.get("accessors", [])

    scene_index = gltf.get("scene", 0)
    scenes = gltf.get("scenes", [])
    root_nodes = scenes[scene_index].get("nodes", []) if scenes else list(range(len(nodes)))
    children_map = {i: nodes[i].get("children", []) for i in range(len(nodes))}

    world_mats: Dict[int, List[List[float]]] = {}

    def dfs(node_idx: int, parent_mat: List[List[float]]) -> None:
        local = _mat4_from_node(nodes[node_idx])
        world = _mat4_mul(parent_mat, local)
        world_mats[node_idx] = world
        for ch in children_map.get(node_idx, []):
            dfs(ch, world)

    for rn in root_nodes:
        dfs(rn, _mat4_identity())

    have = False
    gmin = [float("inf"), float("inf"), float("inf")]
    gmax = [float("-inf"), float("-inf"), float("-inf")]
    missing = 0

    for ni, node in enumerate(nodes):
        mesh_idx = node.get("mesh")
        if mesh_idx is None:
            continue
        wm = world_mats.get(ni, _mat4_identity())
        mesh = meshes[mesh_idx]
        for prim in mesh.get("primitives", []):
            attrs = prim.get("attributes", {}) or {}
            acc_idx = attrs.get("POSITION")
            if acc_idx is None:
                missing += 1
                continue
            acc = accessors[acc_idx]
            if "min" not in acc or "max" not in acc:
                missing += 1
                continue
            mn = acc["min"]
            mx = acc["max"]
            for c in _aabb_corners(mn, mx):
                x, y, z = _transform_point(wm, c)
                gmin[0] = min(gmin[0], x)
                gmin[1] = min(gmin[1], y)
                gmin[2] = min(gmin[2], z)
                gmax[0] = max(gmax[0], x)
                gmax[1] = max(gmax[1], y)
                gmax[2] = max(gmax[2], z)
                have = True

    if not have:
        raise ValueError("No AABB could be computed (missing accessor min/max?)")

    return gmin, gmax, missing


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python tools/measure_glb_bbox.py <path-to-glb>", file=sys.stderr)
        return 2

    path = sys.argv[1]
    if not os.path.exists(path):
        print(f"File not found: {path}", file=sys.stderr)
        return 2

    gltf = load_glb_json(path)
    gmin, gmax, missing = compute_scene_aabb(gltf)
    size = [gmax[i] - gmin[i] for i in range(3)]

    print("File:", path)
    print("glTF asset version:", (gltf.get("asset") or {}).get("version"))
    print("AABB min:", gmin)
    print("AABB max:", gmax)
    print("Size (file units) X,Y,Z:", size)
    if missing:
        print("Primitives missing POSITION min/max:", missing)

    m = max(size)
    # heuristic for typical kitchen legs:
    if 0.02 < m < 5.0:
        print("Heuristic: likely meters. Size (mm):", [round(s * 1000, 3) for s in size])
    elif 20 < m < 5000:
        print("Heuristic: likely millimeters. Size (mm):", [round(s, 3) for s in size])
    else:
        print(
            "Heuristic: unknown units; if meters->mm:",
            [round(s * 1000, 3) for s in size],
            "; if cm->mm:",
            [round(s * 10, 3) for s in size],
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
