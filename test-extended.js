const { JSDOM } = require("jsdom");

const dom = new JSDOM(`<!DOCTYPE html><body><div id="stage"></div></body>`, { pretendToBeVisual: true, runScripts: "outside-only" });
global.window = dom.window;
global.document = dom.window.document;
global.performance = { now: () => Date.now() };
window.performance = global.performance;
global.requestAnimationFrame = window.requestAnimationFrame = (cb) => setTimeout(() => cb(global.performance.now()), 16);
window.katex = require("katex");

require("./animl.js");
const Animl = window.Animl;

function assert(cond, msg){ if(!cond){ console.error("FAIL:", msg); process.exitCode = 1; } else { console.log("OK:", msg); } }

console.log("--- VMobject path generation ---");
const tri = Animl.shapes.regularPolygon(3, 50, { fill: "#4f8fff" });
assert(tri.props.points.length === 3, "triangle has 3 points");
const scene = new Animl.Scene("#stage", { width: 800, height: 500 });
scene.add(tri);
assert(tri.node.tagName === "path", "vmobject renders as an svg <path>");
assert(tri.node.getAttribute("d").startsWith("M "), "path d string starts with M command");

console.log("--- Point count alignment / subdivision ---");
const square = Animl.shapes.regularPolygon(4, 40);
const star = Animl.shapes.star(5, 20, 40);
assert(square.props.points.length === 4, "square starts with 4 points");
assert(star.props.points.length === 10, "5-point star has 10 points");
const [alignedA, alignedB] = (function(){
  // access via morphTo's internal alignment indirectly by checking resulting counts post-morph setup
  const clone = Animl.shapes.regularPolygon(4, 40);
  const a = Animl.anim.morphTo(clone, star.props.points, { duration: 0.4 });
  return [a.fromPoints, a.toPoints];
})();
assert(alignedA.length === alignedB.length, "aligned point arrays have equal length: " + alignedA.length + " vs " + alignedB.length);
assert(alignedA.length === 10, "square was subdivided up to star's 10 points, got " + alignedA.length);

console.log("--- Updaters run every frame ---");
const dot = new Animl.Dot({ x: 0, y: 0, fill: "#fff" });
scene.add(dot);
let updateCalls = 0;
dot.addUpdater((el, dt) => { updateCalls++; el.props.x = Math.min(100, el.props.x + 50*dt); });

console.log("--- Relative layout (nextTo / arrange) ---");
const a1 = new Animl.Rect({ width: 40, height: 40 });
const a2 = new Animl.Rect({ width: 40, height: 40 });
const a3 = new Animl.Rect({ width: 40, height: 40 });
scene.add(a1); scene.add(a2); scene.add(a3);
Animl.arrange([a1,a2,a3], "right", 10);
assert(a2.props.x > a1.props.x, "arrange: a2 is right of a1");
assert(a3.props.x > a2.props.x, "arrange: a3 is right of a2");
const gap1 = a2.props.x - a1.props.x;
const gap2 = a3.props.x - a2.props.x;
assert(Math.abs(gap1 - gap2) < 0.01, "arrange: even spacing between elements, got " + gap1 + " vs " + gap2);

console.log("--- MathTex renders real LaTeX via vendored KaTeX ---");
const eq = new Animl.MathTex({ tex: "E = mc^2", x: 0, y: 0 });
scene.add(eq);
assert(eq._htmlNode !== undefined, "mathtex creates an html overlay node");
assert(eq._htmlNode.innerHTML.includes("katex"), "mathtex overlay contains katex-rendered markup");
assert(eq._htmlNode.querySelector("math") !== null, "mathtex overlay contains real MathML output");

console.log("--- New named animations exist and build valid descriptors ---");
["growFromCenter","shrinkToCenter","spin","indicate","wiggle","morphTo","drawBorderThenFill"].forEach(name => {
  assert(typeof Animl.anim[name] === "function", "anim." + name + " exists");
});

(async () => {
  await scene.play(
    Animl.anim.create(tri, { duration: 0.2 }),
    Animl.anim.moveTo(dot, 0, 0, { duration: 0.2 })
  );
  await new Promise(r => setTimeout(r, 350));
  assert(updateCalls > 3, "updater fired multiple times during real-time playback, got " + updateCalls + " calls");
  assert(dot.props.x > 0, "updater actually moved the dot, x=" + dot.props.x);

  console.log("--- indicate() pulse animation runs without throwing ---");
  const pulseTarget = new Animl.Circle({ radius: 20, fill: "#4f8fff" });
  scene.add(pulseTarget);
  await scene.play(Animl.anim.indicate(pulseTarget, { duration: 0.2 }));
  assert(Math.abs(pulseTarget.props.scale - 1) < 0.05, "indicate returns scale to baseline after completing, got " + pulseTarget.props.scale);

  console.log("--- wiggle() runs and settles back to base rotation ---");
  const wiggleTarget = new Animl.Rect({ width: 30, height: 30 });
  scene.add(wiggleTarget);
  await scene.play(Animl.anim.wiggle(wiggleTarget, { duration: 0.2 }));
  assert(Math.abs(wiggleTarget.props.rotation) < 1, "wiggle dampens back to baseline rotation, got " + wiggleTarget.props.rotation);

  console.log("--- morphTo actually changes point geometry over time ---");
  const morphShape = Animl.shapes.regularPolygon(4, 40, { fill:"#4f8fff" });
  scene.add(morphShape);
  const beforePoints = JSON.stringify(morphShape.props.points);
  await scene.play(Animl.anim.morphTo(morphShape, Animl.shapes.star(5,20,40).props.points, { duration: 0.2 }));
  const afterPoints = JSON.stringify(morphShape.props.points);
  assert(beforePoints !== afterPoints, "morphTo changed the shape's point geometry");
  assert(morphShape.props.points.length === 10, "morphed shape ended with target's 10 points, got " + morphShape.props.points.length);

  console.log("--- drawBorderThenFill runs and ends fully filled ---");
  const borderShape = Animl.shapes.circleVM(30, { fill:"#4f8fff" });
  scene.add(borderShape);
  await scene.play(Animl.anim.drawBorderThenFill(borderShape, { duration: 0.2 }));
  assert(Math.abs(borderShape.props.fillOpacity - 1) < 0.05, "drawBorderThenFill ends fully opaque, got " + borderShape.props.fillOpacity);

  console.log("--- circumscribe / focusOn compound helpers run without throwing ---");
  const target = new Animl.Circle({ radius: 30, fill:"#4f8fff" });
  scene.add(target);
  await scene.circumscribe(target, { holdTime: 0.1 });
  await scene.focusOn(target, { duration: 0.1 });
  assert(true, "circumscribe and focusOn completed without error");

  scene.destroy();
  console.log("\\n" + (process.exitCode ? "SOME TESTS FAILED" : "ALL EXTENDED TESTS PASSED"));
  process.exit(process.exitCode || 0);
})();
