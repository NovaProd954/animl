# Animl

A Manim-inspired animation engine for the browser — single dependency-free JS file, built for AI chatbots to generate scenes with directly inside sandboxed artifacts/canvases. No build step, no network calls, no external APIs (including no AI APIs).

## What this is

Animl is a plain HTML/JavaScript **library**, not a framework or app. You include `animl.js` in a webpage exactly like you'd include `three.js` or `p5.js` — one `<script>` tag — and write scene code directly in that page. There is:

- **No build step.** No bundler, no compiler, no transpilation.
- **No server component.** It runs entirely in the browser.
- **No install required to use it.** `npm`/`package.json` in this repo exist only for the *dev test suite* (`test-*.js`) — they are not needed to embed Animl in an HTML page. An AI chatbot (or a human) can drop `animl.js` straight into an artifact/canvas/webpage and start writing scene code immediately.
- **One optional vendored dependency:** `vendor/katex/` (for the `MathTex` element), also just static files you `<script src>`/`<link>` — no CDN, no network call.

## Why

Manim (CE and GL) requires Python, LaTeX, FFmpeg, and OpenGL, and its sprawling API is easy for AI models to get subtly wrong. Animl is HTML/SVG/Canvas/WebGL/JS — the syntax models are most consistent at generating — ships as one `<script>` include, and has a vocabulary designed to fit in an LLM's context (see `docs/AI_GUIDE.md`).

The only vendored dependency is KaTeX (`vendor/katex/`), for real LaTeX typesetting — shipped as static files in this repo, not loaded from a CDN, so the engine stays fully offline-capable.

## Quickstart — 2D

```html
<div id="stage"></div>
<script src="animl.js"></script>
<script>
const scene = new Animl.Scene("#stage", { width: 800, height: 500 });
const circle = new Animl.Circle({ x: 0, y: 0, radius: 50, fill: "#4f8fff" });
scene.add(circle);

async function run(){
  await scene.play(Animl.anim.create(circle, { duration: 0.8 }));
  await scene.play(Animl.anim.moveTo(circle, 200, 0, { duration: 1 }));
}
run();
</script>
```

## Quickstart — 3D

```html
<div id="stage"></div>
<script src="animl.js"></script>
<script>
const scene = new Animl.Scene3D("#stage", { width: 800, height: 500 });
const cube = new Animl.Cube({ size: 1.5, fill: "#ff6b6b" });
scene.add(cube);
scene.play(Animl.anim.rotateTo3D(cube, 0, Math.PI*2, 0, { duration: 2 }));
</script>
```

Drag to orbit, scroll to zoom — built in automatically.

## Examples

- `examples/demo.html` — 2D shapes, movement, color/scale animation
- `examples/demo-3d.html` — orbiting 3D cube/sphere/plane scene
- `examples/demo-export.html` — record a 2D scene to a downloadable `.webm`
- `examples/demo-morph.html` — VMobject shape morphing (triangle → star → circle → hexagon)
- `examples/demo-latex.html` — real LaTeX equations via vendored KaTeX
- `examples/demo-graphing.html` — Axes, function plotting, ValueTracker-driven updater, tracedPath, playLagged
- `examples/demo-svgimport-camera.html` — SVGMobject import, brace/doubleArrow/underline, scripted 3D camera moves

## Exporting video

Client-side only, zero external services: uses `canvas.captureStream()` + the browser's native `MediaRecorder`. Requires a canvas-backed scene:

```js
const scene = new Animl.Scene("#stage", { renderer: "canvas" }); // or any Scene3D
const recorder = scene.record({ fps: 30, filename: "my-scene" });
await playAnimations();
recorder.stop(); // downloads a .webm
```

SVG-mode 2D scenes throw a clear error if you call `record()` on them, since SVG has no canvas surface to capture — switch `renderer` if you need export.

## Status

- [x] **SVGMobject** — import arbitrary SVG path data (M/L/H/V/C/S/Q/T/A/Z commands, including elliptical arcs converted to bezier) into VMobjects. Animl does not ship or fetch any third-party icon/asset libraries itself — bring your own SVG content you have rights to use.
- [x] More annotation shapes: `shapes.brace`, `shapes.doubleArrow`, `shapes.underline`
- [x] **Scripted 3D camera moves** — `scene.moveCamera({azimuth, elevation, radius, ...}, opts)`, animated through the same generic timeline as everything else; interactive mouse-orbit still works alongside it
- [x] **Graphing** — `Axes` (Cartesian, grid, `plot(fn)`, `parametricPlot(fn, tRange)`), `NumberLine`
- [x] **ValueTracker** + **updaters** together drive dynamic scenes (a dot walking along a live-plotted curve, etc.)
- [x] **tracedPath** — a growing trail that follows a moving element, like Manim's `TracedPath`
- [x] More shapes/helpers: `shapes.arrow`, `shapes.surroundingRectangle`, `Element.copy()` (deep clone), `scene.playLagged()` (LaggedStart-style staggered starts)
- [x] Core Element model — 2D shapes (Circle, Dot, Rect, Ellipse, Line, Path, Polygon, Text, Group)
- [x] **VMobject bezier-path system** — real cubic-bezier shapes with point-count alignment/subdivision, enabling actual shape morphing (`anim.morphTo`) between arbitrary shapes, not just simple prop tweening
- [x] Shape factories: `shapes.regularPolygon`, `shapes.star`, `shapes.circleVM`, `shapes.triangle`
- [x] **Real LaTeX** via vendored KaTeX (`MathTex` element, offline, no CDN dependency — `vendor/katex/` ships in this repo)
- [x] **Updaters** — `el.addUpdater((el, dt) => ...)`, runs every frame independent of `play()` calls
- [x] **Relative layout** — `Animl.nextTo()`, `Animl.arrange()`
- [x] SVG renderer (default) + Canvas2D renderer (`renderer: "canvas"`)
- [x] Custom hand-built WebGL 3D renderer (no Three.js) — Cube, Sphere, Plane, Phong-ish lighting, orbit camera with mouse/wheel controls
- [x] ~18 animations: create, fadeIn, fadeOut, moveTo/moveTo3D, scaleTo, rotateTo/rotateTo3D, transform, colorTo, write, growFromCenter, shrinkToCenter, spin, indicate, wiggle, morphTo, drawBorderThenFill, plus scene-level `circumscribe`/`focusOn`
- [x] Easing functions: linear, smooth, easeIn, easeOut, bounce
- [x] Client-side video export (WebM via MediaRecorder, no external services) — note: MathTex's HTML overlay is not currently captured in exports
- [x] `docs/AI_GUIDE.md` — condensed API reference for LLM context, kept current with every feature above
- [x] Smoke + extended test suites (`test-smoke.js`, `test-extended.js`) covering shape creation, group nesting, animation prop mutation, VMobject path generation, point-count subdivision math, morph interpolation, updater execution, layout helpers, real KaTeX rendering output, and all new named animations
- [ ] GIF encoder (currently WebM only)
- [ ] Standalone single-file HTML bundler (currently ship `animl.js` + `vendor/katex/` + your scene script as separate files)
- [ ] JSON scene schema + validator
- [ ] 3D VMobject / 3D shape morphing (3D primitives are fixed meshes, not yet bezier-based)
- [ ] MathTex captured in video export
- [ ] `TransformMatchingTex` (equation-aware morphing between two LaTeX expressions)
- [ ] Rich text markup, `Code` (syntax-highlighted code blocks)
- [ ] Sound/audio track syncing
- [ ] "SciDraw" original scientific-illustration icon set (planned next, 2D+3D together per icon)

## Testing

`test-smoke.js`, `test-extended.js`, `test-manimce-features.js`, and `test-track-a.js` run the engine headlessly via jsdom (`npm install` first, dev-only — not needed to use the engine itself; `npm test` runs all four). Together they cover: 2D shape/DOM structure, group nesting, animation prop mutation, `write()` reveal, `record()` guard, 3D geometry generators, Mat4/Vec3 camera math, VMobject path generation, point-count subdivision/alignment, morph interpolation, updater execution every frame, `nextTo`/`arrange` layout, real KaTeX/MathML output, Axes coordinate transforms and function/parametric plotting, NumberLine, ValueTracker, arrow/surroundingRectangle geometry, `Element.copy()` deep-cloning, tracedPath accumulation, playLagged's delay staggering, SVG path parsing (line/cubic/relative/quadratic/arc commands, including verified arc endpoint accuracy), SVGMobject import, brace/doubleArrow/underline shape structure, and camera-object animation interpolation. Canvas2D and WebGL visual rendering themselves need a real browser to verify — open the files in `examples/` directly.

## Design principles

1. One `Element` model per dimension — 2D and 3D share the same animation/timeline system.
2. Every animation is a pure interpolation over `t`, so the same code path drives playback and export.
3. Small, memorizable vocabulary over Manim's large Animation-class zoo — this is what makes it AI-generatable.
4. No external network calls, ever. Everything runs client-side.

## License

MIT
