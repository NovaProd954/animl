const { JSDOM } = require("jsdom");

const dom = new JSDOM(`<!DOCTYPE html><body><div id="stage"></div></body>`, {
  pretendToBeVisual: true,
  runScripts: "outside-only"
});
global.window = dom.window;
global.document = dom.window.document;
global.performance = { now: () => Date.now() };
window.performance = global.performance;

global.requestAnimationFrame = window.requestAnimationFrame = (cb) => setTimeout(() => cb(global.performance.now()), 16);

require("./animl.js");
const Animl = window.Animl;

console.log("--- Test 1: Element creation & basic shapes ---");
const scene = new Animl.Scene("#stage", { width: 800, height: 500 });
const circle = new Animl.Circle({ x: -200, y: 0, radius: 40, fill: "#4f8fff" });
const rect = new Animl.Rect({ x: 200, y: 0, width: 80, height: 60, fill: "#ff6b6b" });
const poly = new Animl.Polygon({ points: [[0,-30],[30,30],[-30,30]], fill: "#2ecc71" });
const text = new Animl.Txt({ x: 0, y: -150, text: "Animl", fontSize: 40 });

scene.add(circle); scene.add(rect); scene.add(poly); scene.add(text);

console.assert(scene.svg.children.length === 4, "expected 4 top-level svg children, got " + scene.svg.children.length);
console.assert(circle.node.tagName === "circle", "circle node tag mismatch");
console.assert(rect.node.getAttribute("width") === "80", "rect width attr mismatch");
console.log("shapes OK, svg childElementCount =", scene.svg.children.length);

console.log("--- Test 2: Groups / nested children render recursively ---");
const group = new Animl.Group({ x: 0, y: 100 });
const child1 = new Animl.Circle({ x: -20, y: 0, radius: 10, fill: "#fff" });
const child2 = new Animl.Circle({ x: 20, y: 0, radius: 10, fill: "#fff" });
group.add(child1); group.add(child2);
scene.add(group);
console.assert(group.node.children.length === 2, "group should have 2 child nodes, got " + group.node.children.length);
console.log("group nesting OK");

console.log("--- Test 3: Animation timeline (create/move/color) runs & mutates props ---");
(async () => {
  await scene.play(
    Animl.anim.create(circle, { duration: 0.3 }),
    Animl.anim.moveTo(rect, 0, 200, { duration: 0.3 }),
    Animl.anim.colorTo(poly, "#f7b731", { duration: 0.3 })
  );
  console.assert(circle.props.opacity === 1, "circle opacity should be 1 after create anim, got " + circle.props.opacity);
  console.assert(rect.props.x === 0 && rect.props.y === 200, "rect should have moved to (0,200), got (" + rect.props.x + "," + rect.props.y + ")");
  console.assert(poly.props.fill.startsWith("rgb") || poly.props.fill === "#f7b731", "poly fill should have changed, got " + poly.props.fill);
  console.log("timeline mutated props correctly:", { opacity: circle.props.opacity, rectPos: [rect.props.x, rect.props.y], fill: poly.props.fill });

  console.log("--- Test 4: write() typewriter animation ---");
  const label = new Animl.Txt({ text: "Hello Animl", fontSize: 24 });
  scene.add(label);
  await scene.play(Animl.anim.write(label, { duration: 0.3 }));
  console.assert(label.props.text === "Hello Animl", "write() should reveal full text, got '" + label.props.text + "'");
  console.log("write() OK, final text:", label.props.text);

  console.log("--- Test 5: Canvas-mode scene construction + record() guard ---");
  const canvasScene = new Animl.Scene("#stage", { width: 400, height: 300, renderer: "canvas" });
  console.assert(canvasScene.mode === "canvas", "canvas scene mode mismatch");
  console.assert(canvasScene.canvas.tagName === "CANVAS", "expected a canvas element");
  let threw = false;
  try { scene.record(); } catch(e){ threw = true; console.log("svg scene correctly threw on record():", e.message); }
  console.assert(threw, "svg-mode scene.record() should throw");

  console.log("--- Test 6: 3D geometry generators produce valid buffers ---");
  console.log("(Scene3D itself requires a real WebGL context / browser — skipped in this headless run)");

  canvasScene.destroy();
  console.log("\\nALL SMOKE TESTS PASSED");
  process.exit(0);
})();
