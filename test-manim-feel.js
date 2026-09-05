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
function approx(a, b, eps=0.01){ return Math.abs(a-b) < eps; }

console.log("--- Manim smooth() rate function hits exact endpoints and is monotonic ---");
assert(approx(Animl.Easing.smooth(0), 0), "smooth(0) = 0, got " + Animl.Easing.smooth(0));
assert(approx(Animl.Easing.smooth(1), 1), "smooth(1) = 1, got " + Animl.Easing.smooth(1));
assert(approx(Animl.Easing.smooth(0.5), 0.5), "smooth(0.5) = 0.5 (symmetric sigmoid), got " + Animl.Easing.smooth(0.5));
let prev = -1, monotonic = true;
for (let t=0; t<=1; t+=0.05){ const v = Animl.Easing.smooth(t); if (v < prev) monotonic = false; prev = v; }
assert(monotonic, "smooth() is monotonically increasing across [0,1]");

console.log("--- rushInto / rushFrom / doubleSmooth / thereAndBack endpoint behavior ---");
assert(approx(Animl.Easing.rushInto(0), 0) && approx(Animl.Easing.rushInto(1), 1), "rushInto endpoints correct, got " + Animl.Easing.rushInto(0) + "," + Animl.Easing.rushInto(1));
assert(approx(Animl.Easing.rushFrom(0), 0) && approx(Animl.Easing.rushFrom(1), 1), "rushFrom endpoints correct");
assert(approx(Animl.Easing.doubleSmooth(0), 0) && approx(Animl.Easing.doubleSmooth(1), 1), "doubleSmooth endpoints correct");
assert(approx(Animl.Easing.thereAndBack(0), 0) && approx(Animl.Easing.thereAndBack(1), 0) , "thereAndBack returns to 0 at both ends, got " + Animl.Easing.thereAndBack(0) + "," + Animl.Easing.thereAndBack(1));
assert(Animl.Easing.thereAndBack(0.5) > 0.9, "thereAndBack peaks near the middle, got " + Animl.Easing.thereAndBack(0.5));

console.log("--- exponentialDecay approaches 1 ---");
assert(Animl.Easing.exponentialDecay(0) === 0, "exponentialDecay(0) = 0");
assert(Animl.Easing.exponentialDecay(1, 0.1) > 0.99, "exponentialDecay approaches 1 after several half-lives, got " + Animl.Easing.exponentialDecay(1, 0.1));

console.log("--- sine/cubic/quad family hit correct endpoints ---");
["easeInSine","easeOutSine","easeInOutSine","easeInCubic","easeOutCubic","easeInOutCubic","easeInQuad","easeOutQuad","easeInOutQuad"].forEach(name => {
  const f = Animl.Easing[name];
  assert(typeof f === "function", "Easing." + name + " exists");
  assert(approx(f(0), 0, 0.02), name + "(0) ≈ 0, got " + f(0));
  assert(approx(f(1), 1, 0.02), name + "(1) ≈ 1, got " + f(1));
});

console.log("--- Manim color palette matches official docs table ---");
assert(Animl.Colors.BLUE === "#58C4DD", "BLUE matches ManimCE docs, got " + Animl.Colors.BLUE);
assert(Animl.Colors.RED === "#FC6255", "RED matches ManimCE docs, got " + Animl.Colors.RED);
assert(Animl.Colors.GREEN === "#83C167", "GREEN matches ManimCE docs, got " + Animl.Colors.GREEN);
assert(Animl.Colors.YELLOW === "#F7D96F", "YELLOW matches ManimCE docs, got " + Animl.Colors.YELLOW);
assert(Animl.Colors.PURPLE === "#9A72AC", "PURPLE matches ManimCE docs, got " + Animl.Colors.PURPLE);
assert(Animl.Colors.BLUE_E === "#236B8E", "BLUE_E (darkest variant) matches docs, got " + Animl.Colors.BLUE_E);

console.log("--- Default colors now use Manim palette instead of generic blue, and text is visible on black bg ---");
const circle = new Animl.Circle({});
assert(circle.props.fill === Animl.Colors.BLUE, "Circle defaults to Manim BLUE, got " + circle.props.fill);
const txt = new Animl.Txt({ text: "hi" });
assert(txt.props.fill === Animl.Colors.WHITE, "Text now defaults to white (visible on black bg), got " + txt.props.fill);

const scene = new Animl.Scene("#stage", {});
assert(scene.bg === "#000000", "Scene defaults to Manim's classic black background, got " + scene.bg);

console.log("--- smoothVPoints: Catmull-Rom curve passes exactly through every input point ---");
const rawPoints = [[0,0],[50,80],[100,20],[150,90],[200,0]];
const smoothed = Animl.smoothVPoints(rawPoints, false);
assert(smoothed.length === rawPoints.length, "smoothVPoints preserves point count");
smoothed.forEach((p, i) => {
  assert(p.anchor[0] === rawPoints[i][0] && p.anchor[1] === rawPoints[i][1], "anchor " + i + " passes exactly through input point, got " + JSON.stringify(p.anchor) + " vs " + JSON.stringify(rawPoints[i]));
});
assert(smoothed[2].h1[0] !== smoothed[2].anchor[0] || smoothed[2].h1[1] !== smoothed[2].anchor[1], "interior point has a real (non-degenerate) tangent handle, not a straight-line corner");

console.log("--- smoothVPoints closed curve wraps tangents around correctly ---");
const closedPts = [[0,-50],[50,0],[0,50],[-50,0]];
const closedSmooth = Animl.smoothVPoints(closedPts, true);
assert(closedSmooth.length === 4, "closed smooth curve preserves point count");
const p0 = closedSmooth[0];
assert(p0.h1[0] !== p0.anchor[0] || p0.h1[1] !== p0.anchor[1], "closed curve's first point has a wrapped-around tangent, not a corner");

console.log("--- Axes.plot() now produces smooth curves by default (not straight polyline segments) ---");
const axes = new Animl.Axes({ xRange:[-3,3,1], yRange:[-1,1,1], width:300, height:200 });
const curve = axes.plot(x => Math.sin(x));
const anyNonDegenerate = curve.props.points.some(p => p.h1[0] !== p.anchor[0] || p.h1[1] !== p.anchor[1]);
assert(anyNonDegenerate, "plot() output has real bezier tangents by default (smooth), not degenerate straight segments");
const straightCurve = axes.plot(x => Math.sin(x), { smooth:false });
const allDegenerate = straightCurve.props.points.every(p => p.h1[0] === p.anchor[0] && p.h1[1] === p.anchor[1]);
assert(allDegenerate, "plot() with smooth:false still supports the old straight-segment behavior");

console.log("--- Stroke rendering uses round caps/joins (softer Manim-like line quality) ---");
const line = new Animl.Line({});
scene.add(line);
assert(line.node.getAttribute("stroke-linecap") === "round", "SVG line has round stroke-linecap");
assert(line.node.getAttribute("stroke-linejoin") === "round", "SVG line has round stroke-linejoin");

console.log("\n" + (process.exitCode ? "SOME TESTS FAILED" : "ALL MANIM-FEEL TESTS PASSED"));
process.exit(process.exitCode || 0);
