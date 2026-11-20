const fs = require('fs');
const a = JSON.parse(fs.readFileSync('catalog_items/catalog_45.json', 'utf8'));
const raw = a[0].clodisJSON;
const tree = typeof raw === 'string' ? JSON.parse(raw) : raw;
const out = [];
function walk(n) {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) return n.forEach(walk);
  if (n.fromJointScheme) {
    out.push({
      name: n.name,
      type: n.type,
      id: n.spec && n.spec.id,
      jtf: n.spec && n.spec.joint_template_frame,
      jtm: n.spec && n.spec.joint_template_model,
      jh: n.spec && n.spec.joint_hardware,
      kids: (n.children || []).map((c) => ({
        n: c.name,
        t: c.type,
        id: c.spec && c.spec.id,
        jtm: c.spec && c.spec.joint_template_model,
        jh: c.spec && c.spec.joint_hardware,
        fjs: !!c.fromJointScheme,
        size: c.size,
      })),
    });
  }
  if (n.children) n.children.forEach(walk);
}
walk(tree);
console.log(JSON.stringify(out.slice(0, 3), null, 2));
console.log('count', out.length);
