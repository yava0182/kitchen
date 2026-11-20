const fs = require("fs");

function walk(n, fn) {
  if (!n || typeof n !== "object") return;
  if (Array.isArray(n)) return n.forEach((x) => walk(x, fn));
  fn(n);
  if (Array.isArray(n.children)) n.children.forEach((c) => walk(c, fn));
}

for (const f of ["catalog_46.json", "catalog_44.json", "catalog_52.json", "catalog_53.json"]) {
  const data = JSON.parse(fs.readFileSync("catalog_items/" + f, "utf8"));
  console.log("\n==", f);
  for (const item of data) {
    const d = item.data || {};
    const hits = [];
    walk(d.clodisJSON, (n) => {
      if (!n.spec) return;
      const et = String(n.spec.element_type || "");
      if (et === "catalog_53" || (n.type === "module" && /столеш/i.test(n.name || ""))) {
        hits.push({
          name: n.name,
          size: n.size,
          pos: n.pos,
          pivot: n.pivot,
        });
      }
    });
    console.log(
      `id=${item.id} D=${d.depth} pk=${d.placementKind} tt=${hits.length}`,
      hits[0] ? JSON.stringify(hits[0]) : ""
    );
  }
}
