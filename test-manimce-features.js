const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><body><div id="stage"></div></body>`, { pretendToBeVisual: true, runScripts: "outside-only" });
global.window = dom.window;
global.document = dom.window.document;
global.performance = { now: () => Date.now() };
window.performance = global.performance;
global.requestAnimationFrame = window.requestAnimationFrame = (cb) => setTimeout(() => cb(global.performance.now()), 16);

require("./animl.js");
const Animl = window.Animl;
function assert(cond, msg){ if(!cond){ console.error("FAIL:", msg); process.exitCode = 1; } else { console.log("OK:", msg); } }

const scene = new Animl.Scene("#stage", { width: 800, height: 500 });

console.log("--- Axes: coordinate transform ---");
const axes = new Animl.Axes({ xRange:[-5,5,1], yRange:[-5,5,1], width:400, height:300 });
scene.add(axes);
const [cx, cy] = axes.toScreen(0,0);
assert(cx === 0 && cy === 0, "origin (0,0) maps to screen center, got [" + cx + "," + cy + "]");
const [rx] = axes.toScreen(5,0);
assert(Math.abs(rx - 200) < 0.01, "x=5 (max of range) maps to +width/2=200, got " + rx);

console.log("--- Axes: function plotting ---");
const curve = axes.plot(x => x*x/5, { samples: 50 });
assert(curve.type === "vmobject", "plot() returns a VMobject");
assert(curve.props.points.length === 51, "plot sampled 51 points (samples+1), got " + curve.props.points.length);
assert(curve.props.closed === false, "plotted curve is not closed");

console.log("--- Axes: parametric plotting ---");
const circleCurve = axes.parametricPlot(t => [2*Math.cos(t), 2*Math.sin(t)], [0, Math.PI*2], { samples: 40 });
assert(circleCurve.props.points.length === 41, "parametric plot sampled correctly");

console.log("--- NumberLine ---");
const nl = new Animl.NumberLine({ range:[-5,5,1], length:400 });
scene.add(nl);
assert(Math.abs(nl.toScreen(0)) < 0.01, "NumberLine 0 maps to center");
assert(Math.abs(nl.toScreen(5) - 200) < 0.01, "NumberLine max maps to +length/2");
assert(nl.children.length === 12, "NumberLine has 1 axis line + 11 ticks (range -5..5 step 1), got " + nl.children.length);

console.log("--- ValueTracker ---");
const vt = new Animl.ValueTracker(3);
assert(vt.value === 3, "ValueTracker initial value readable");
vt.value = 7;
assert(vt.props.value === 7, "ValueTracker value settable and reflected in props");

console.log("--- Arrow shape ---");
const arr = Animl.shapes.arrow(0,0,100,0, { color:"#fff" });
assert(arr.type === "group", "arrow() returns a Group");
assert(arr.children.length === 2, "arrow has shaft + head, got " + arr.children.length);

console.log("--- SurroundingRectangle ---");
const target = new Animl.Circle({ x:50, y:50, radius:30 });
scene.add(target);
const box = Animl.shapes.surroundingRectangle(target, { padding: 10 });
assert(box.type === "rect", "surroundingRectangle returns a Rect");
assert(box.props.width === 30*2 + 20, "surroundingRectangle width = bounds + padding*2, got " + box.props.width);
assert(box.props.x === 50 && box.props.y === 50, "surroundingRectangle centered on target");

console.log("--- Element.copy() ---");
const original = new Animl.Circle({ x:10, y:20, radius:15, fill:"#abc" });
const clone = original.copy();
assert(clone !== original, "copy() returns a new instance");
assert(clone.props.x === 10 && clone.props.radius === 15, "copy() preserves props");
clone.props.x = 999;
assert(original.props.x === 10, "copy() is a deep clone, mutating clone doesn't affect original");

const groupOrig = new Animl.Group({ x:0, y:0 });
groupOrig.add(new Animl.Circle({ x:5, y:5, radius:5 }));
const groupClone = groupOrig.copy();
assert(groupClone.children.length === 1, "copy() deep-clones children, got " + groupClone.children.length);
assert(groupClone.children[0] !== groupOrig.children[0], "copy() children are distinct instances");

(async () => {
  console.log("--- tracedPath: grows as target moves ---");
  const mover = new Animl.Dot({ x:-100, y:0, fill:"#fff" });
  scene.add(mover);
  const trace = Animl.tracedPath(mover, { minDist: 1 });
  scene.add(trace);
  await scene.play(Animl.anim.moveTo(mover, 100, 0, { duration: 0.3 }));
  await new Promise(r => setTimeout(r, 50));
  assert(trace._verts.length > 2, "tracedPath accumulated multiple points as target moved, got " + trace._verts.length);
  assert(trace.props.points.length === trace._verts.length, "tracedPath VMobject points match accumulated verts");

  console.log("--- playLagged: staggers delays across animations ---");
  const s1 = new Animl.Circle({ radius:10 });
  const s2 = new Animl.Circle({ radius:10 });
  const s3 = new Animl.Circle({ radius:10 });
  [s1,s2,s3].forEach(s => scene.add(s));
  const anims = [Animl.anim.fadeIn(s1,{duration:1}), Animl.anim.fadeIn(s2,{duration:1}), Animl.anim.fadeIn(s3,{duration:1})];
  const before = anims.map(a => a.delay||0);
  scene.playLagged(anims, 0.2);
  assert(anims[0].delay === 0, "first lagged anim has 0 added delay");
  assert(Math.abs(anims[1].delay - 0.2) < 0.001, "second lagged anim delayed by lagRatio*duration, got " + anims[1].delay);
  assert(Math.abs(anims[2].delay - 0.4) < 0.001, "third lagged anim delayed cumulatively, got " + anims[2].delay);
  await scene.wait(1.5);

  scene.destroy();
  console.log("\\n" + (process.exitCode ? "SOME TESTS FAILED" : "ALL MANIMCE-FEATURE TESTS PASSED"));
  process.exit(process.exitCode || 0);
})();
