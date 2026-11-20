/** Столешка: якорь от переда корпуса (+40), глубина = s:z + 10 + 40 */
const fs = require("fs");
const path = require("path");

const NEST = {
  size: { x: "s:x", y: 38, z: "s:z + 50" }, // корпус + зад 10 + свес 40
  pos: { x: 0, y: "s:y", z: "s:z + 40" }, // перед доски = перед корпуса + 40
  pivot: { x: -1, y: -1, z: 1 },
};

function isTtNest(n) {
  if (!n || n.type !== "module") return false;
  const et = String((n.spec && n.spec.element_type) || "");
  return et === "catalog_53" || String(n.name || "").includes("Столешница");
}

function fix(obj, stats) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) return obj.forEach((x) => fix(x, stats));
  if (isTtNest(obj)) {
    obj.size = { ...NEST.size };
    obj.pos = { ...NEST.pos };
    obj.pivot = { ...NEST.pivot };
    stats.n++;
  }
  if (Array.isArray(obj.children)) obj.children.forEach((c) => fix(c, stats));
  for (const [k, v] of Object.entries(obj)) {
    if (k === "children") continue;
    if (v && typeof v === "object") fix(v, stats);
  }
}

for (const f of ["catalog_46.json", "catalog_44.json", "catalog_52.json"]) {
  const p = path.join("catalog_items", f);
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  const stats = { n: 0 };
  fix(data, stats);
  const json = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(p, json);
  fs.writeFileSync(path.join("public", "catalog_items", f), json);
  console.log(f, stats);
}
console.log("recipe", NEST);
