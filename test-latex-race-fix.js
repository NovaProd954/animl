const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><body><div id="stage"></div></body>`, { pretendToBeVisual: true, runScripts: "outside-only" });
global.window = dom.window;
global.document = dom.window.document;
global.performance = { now: () => Date.now() };
window.performance = global.performance;
global.requestAnimationFrame = window.requestAnimationFrame = (cb) => setTimeout(() => cb(global.performance.now()), 16);
// deliberately do NOT define window.katex yet, to simulate the race condition

require("./animl.js");
const Animl = window.Animl;
function assert(cond, msg){ if(!cond){ console.error("FAIL:", msg); process.exitCode = 1; } else { console.log("OK:", msg); } }

const scene = new Animl.Scene("#stage", { width: 800, height: 500 });
const eq = new Animl.MathTex({ tex: "E = mc^2", x: 0, y: 0 });
scene.add(eq); // katex NOT yet loaded at this point — simulates a script-order race

assert(eq._htmlNode.textContent === "E = mc^2", "before KaTeX loads: falls back to raw text (expected)");
assert(eq._renderedWithKatex === false, "before KaTeX loads: _renderedWithKatex correctly false");

// Now simulate KaTeX finishing its load a moment later (this is the exact real-world race)
window.katex = require("katex");

// Re-run the same sync that the persistent per-frame loop calls every frame —
// with the OLD buggy code this would never re-render because _lastTex already equals p.tex.
scene.add(new Animl.Circle({})); // no-op, just to advance state naturally
// Directly invoke what the frame loop does: re-add triggers syncMathTexOverlay again via add(),
// but the real test is the persistent loop, so let's simulate a frame tick instead.
(async () => {
  await new Promise(r => setTimeout(r, 50)); // let the persistent _loop() run a few frames
  assert(eq._renderedWithKatex === true, "after KaTeX loads: _renderedWithKatex flips to true on next frame, got " + eq._renderedWithKatex);
  assert(eq._htmlNode.innerHTML.includes("katex"), "after KaTeX loads: overlay now contains real katex-rendered markup");
  assert(eq._htmlNode.querySelector("math") !== null, "after KaTeX loads: overlay now contains real MathML output");
  scene.destroy();
  console.log("\n" + (process.exitCode ? "BUG STILL PRESENT" : "BUG FIXED — MathTex self-heals once KaTeX loads"));
  process.exit(process.exitCode || 0);
})();
