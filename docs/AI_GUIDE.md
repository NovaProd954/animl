# Animl — API Guide for AI Code Generation

Animl is an **HTML/JS library**, not a framework or npm package to install — treat it exactly like including `three.js` or `p5.js` in a page. You write scene code directly inside the HTML document, right after loading it: `<script src="animl.js"></script>` then a `<script>` block with your scene. No imports, no build step, no bundler, no server, no network calls at runtime. This makes it safe to generate directly inside a sandboxed chatbot artifact/canvas.

## Rules

1. Only use the API below. Do not invent methods, properties, or shape types.
2. Always call `scene.add(element)` before animating an element.
3. Animations are created with `Animl.anim.*` functions and run via `scene.play(...)`. `scene.play()` returns a Promise — `await` it to sequence animations; pass multiple animations to one `scene.play()` call to run them in parallel.
4. Colors are hex strings: `"#rrggbb"`.
5. 2D coordinate origin `(0,0)` is the center of the scene, y increases downward, matching SVG convention.
6. 3D coordinate origin `(0,0,0)` is the center of the scene, y increases upward.

## Setting up a 2D scene

```js
const scene = new Animl.Scene("#stage", { width: 800, height: 500, background: "#0d1117" });
// optional: { renderer: "canvas" } instead of default SVG — required if you plan to call scene.record()
```

## Setting up a 3D scene

```js
const scene = new Animl.Scene3D("#stage", { width: 800, height: 500, background: "#0d1117", cameraDistance: 6 });
// mouse-drag orbit and scroll-zoom are built in automatically
```

## 2D shapes

| Class | Key props (defaults) |
|---|---|
| `Animl.Circle` | `x,y,radius(50),fill` |
| `Animl.Dot` | `x,y,radius(6),fill` |
| `Animl.Rect` | `x,y,width(100),height(60),fill` |
| `Animl.Ellipse` | `x,y,rx(60),ry(35),fill` |
| `Animl.Line` | `x1,y1,x2,y2,stroke,strokeWidth` |
| `Animl.Polygon` | `points([[x,y],...]),fill` |
| `Animl.Path` | `d("<svg path d string>"),fill` |
| `Animl.Txt` | `x,y,text,fontSize(32),fontFamily,fill` |
| `Animl.Group` | container; `.add(childElement)` to nest; group's own `x,y,rotation,scale` apply to all children |

All 2D elements also accept: `rotation` (degrees), `scale`, `opacity` (0-1), `stroke`, `strokeWidth`.

```js
const c = new Animl.Circle({ x: -100, y: 0, radius: 40, fill: "#4f8fff" });
scene.add(c);
```

## 3D shapes

| Class | Key props (defaults) |
|---|---|
| `Animl.Cube` | `x,y,z,size(1),fill` |
| `Animl.Sphere` | `x,y,z,radius(1),segments(16),fill` |
| `Animl.Plane` | `x,y,z,width(1),height(1),fill` |

All 3D elements also accept: `rotationX,rotationY,rotationZ` (radians), `scale` (uniform).

```js
const cube = new Animl.Cube({ x: 0, y: 0, z: 0, size: 1.5, fill: "#ff6b6b" });
scene.add(cube);
```

## Animations (`Animl.anim.*`)

Every anim function returns an animation object. Pass one or more into `scene.play(...)`. All accept an options object: `{ duration: seconds (default 1), delay: seconds (default 0), easing: "linear"|"smooth"|"easeIn"|"easeOut"|"bounce" (default "smooth") }`.

| Function | Effect |
|---|---|
| `anim.create(el, opts)` | fade element in from invisible (use for "element appears") |
| `anim.fadeIn(el, opts)` | animate opacity to 1 |
| `anim.fadeOut(el, opts)` | animate opacity to 0 |
| `anim.moveTo(el, x, y, opts)` | 2D move |
| `anim.moveTo3D(el, x, y, z, opts)` | 3D move |
| `anim.scaleTo(el, scale, opts)` | uniform scale |
| `anim.rotateTo(el, degrees, opts)` | 2D rotate |
| `anim.rotateTo3D(el, rx, ry, rz, opts)` | 3D rotate (radians) |
| `anim.colorTo(el, "#hex", opts)` | animate fill color |
| `anim.transform(el, {props}, opts)` | animate any combination of numeric props at once |
| `anim.write(el, opts)` | typewriter-reveal a Txt element's text |

## Playing and sequencing

```js
async function run(){
  // parallel: both happen at once
  await scene.play(
    Animl.anim.create(shapeA, { duration: 0.8 }),
    Animl.anim.create(shapeB, { duration: 0.8, delay: 0.2 })
  );
  // sequential: second play() only starts after the first resolves
  await scene.play(Animl.anim.moveTo(shapeA, 100, 0, { duration: 1 }));
  await scene.wait(0.5); // pause
}
run();
```

## Exporting video (client-side only, no external services)

Only works on a `Scene` created with `{ renderer: "canvas" }`, or any `Scene3D` (both have a real `<canvas>` backing them). SVG-mode scenes will throw a clear error if you call `record()` — switch renderer if you need export.

```js
const recorder = scene.record({ fps: 30, filename: "my-scene" }); // starts recording immediately
await playSceneAnimations();
recorder.stop(); // downloads a .webm automatically
```

## Bezier shapes (VMobject) — for real morphing/Transform

`VMobject` is a bezier-path shape (like Manim's core object) defined by an array of points, each `{ anchor:[x,y], h1:[x,y], h2:[x,y] }` (h1 = incoming control handle, h2 = outgoing). Straight-edged shapes just repeat the anchor for both handles.

Built-in factories (all return a ready-to-add `VMobject`):

```js
Animl.shapes.regularPolygon(sides, radius, props)
Animl.shapes.star(points, innerRadius, outerRadius, props)
Animl.shapes.circleVM(radius, props)
Animl.shapes.triangle(radius, props)
```

```js
const tri = Animl.shapes.regularPolygon(3, 80, { fill: "#4f8fff" });
scene.add(tri);
await scene.play(Animl.anim.morphTo(tri, Animl.shapes.star(5, 35, 80).props.points, { fill: "#f7b731", duration: 1.2 }));
```

`anim.morphTo(el, targetPointsOrVMobject, opts)` automatically aligns point counts between mismatched shapes (subdivides the simpler one) before interpolating — this is how a triangle can morph into a star.

## Real LaTeX (`MathTex`)

Requires loading vendored KaTeX first (ship `vendor/katex/` alongside `animl.js`):

```html
<link rel="stylesheet" href="vendor/katex/katex.min.css">
<script src="vendor/katex/katex.min.js"></script>
<script src="animl.js"></script>
```

```js
const eq = new Animl.MathTex({ x: 0, y: 0, tex: "\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", fontSize: 40, fill: "#e6edf3" });
scene.add(eq);
```

`MathTex` renders as a real typeset equation (actual TeX layout via KaTeX, not an approximation) on an HTML overlay layer above the scene. It animates like any other element (`fadeIn`, `moveTo`, `scaleTo`, `colorTo`). **Known limitation: the overlay is not captured by `scene.record()`** — video export currently only captures the canvas/SVG layer, not MathTex.

## Updaters — per-frame recomputed behavior

```js
dot.addUpdater((el, dt) => { el.props.x += 50 * dt; }); // dt = seconds since last frame
dot.removeUpdaters();
```

Updaters run continuously every frame regardless of `scene.play()` calls — use them for things that must track another object or follow a rule every frame (a dot chasing a curve, a label that follows a moving shape).

## Relative layout

```js
Animl.nextTo(el, otherEl, "right", 20);      // direction: "up"|"down"|"left"|"right" or [dx,dy]
Animl.arrange([el1, el2, el3], "right", 15); // lays elements out in a row/column with even gaps
```

## Expanded animation vocabulary (`Animl.anim.*`)

Beyond the 11 core functions above, these are also available:

| Function | Effect |
|---|---|
| `growFromCenter(el, opts)` | scale up from 0 while fading in |
| `shrinkToCenter(el, opts)` | scale down to 0 while fading out |
| `spin(el, turns, opts)` | rotate by N full turns relative to current rotation |
| `indicate(el, opts)` | brief scale+color pulse to draw attention |
| `wiggle(el, opts)` | damped rotational shake |
| `morphTo(el, targetPoints, opts)` | morph a VMobject's shape into another (+ optional color) |
| `drawBorderThenFill(el, opts)` | stroke draws on first, then fill fades in (VMobject only) |

Scene-level compound helpers (these run their own internal `play()`/`add()`/`remove()` sequence, so `await` them directly instead of passing to `scene.play()`):

```js
await scene.circumscribe(el, { color: "#f7b731", holdTime: 0.4 }); // draws a highlight box around el, then removes it
await scene.focusOn(el, { duration: 0.8 }); // spotlight-shrink effect onto el
```

## Graphing

```js
const axes = new Animl.Axes({ xRange:[-5,5,1], yRange:[-2,2,1], width:600, height:350 });
scene.add(axes);
const curve = axes.plot(x => Math.sin(x), { color:"#4f8fff" });
scene.add(curve);
const parametric = axes.parametricPlot(t => [2*Math.cos(t), 2*Math.sin(t)], [0, Math.PI*2]);
```

`axes.toScreen(dataX, dataY)` converts data-space coordinates to scene pixel coordinates — use it to position other elements (like a dot tracking a point on the curve) relative to the graph. `Animl.NumberLine({ range, length })` is the 1D equivalent for simpler number-line visuals.

## ValueTracker, updaters, and tracedPath together

```js
const tracker = new Animl.ValueTracker(0);
const dot = new Animl.Dot({ fill:"#f7b731" });
scene.add(dot);
dot.addUpdater(() => { dot.props.x = axes.toScreen(tracker.value, Math.sin(tracker.value))[0]; });
await scene.play(Animl.anim.transform(tracker, { value: 5 }, { duration: 3 })); // drives the dot via its updater

const trail = Animl.tracedPath(dot, { color:"#f7b731", minDist:1 }); // grows as dot.props.x/y change
scene.add(trail);
```

`ValueTracker` doesn't need `scene.add()` — it's just an animatable number other objects' updaters can read.

## More shapes and helpers

```js
Animl.shapes.arrow(x1, y1, x2, y2, { color:"#4f8fff" });      // returns a Group (shaft + head)
Animl.shapes.surroundingRectangle(el, { padding:10 });        // returns a Rect sized to el's bounds
el.copy();                                                     // deep clone (new instance, own children)
scene.playLagged([anim1, anim2, anim3], 0.15);                 // staggered start times, like Manim's LaggedStart
```

## Importing arbitrary SVG (SVGMobject)

```js
const svgSource = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 100 0 L 50 80 Z"/></svg>`;
const shape = Animl.SVGMobject(svgSource, { fill: "#4f8fff" });
scene.add(shape);
```

Parses every `<path d="...">` in the SVG into VMobjects (supports M/L/H/V/C/S/Q/T/A/Z commands) and returns them as a `Group`. Each subpath becomes a separate VMobject — compound paths with holes (e.g. a letter "O") are not fully supported (each subpath fills independently rather than cutting a hole). Only use this with SVG content you have the rights to use; Animl does not ship or fetch any third-party icon sets itself.

## More annotation shapes

```js
Animl.shapes.brace(x1, y1, x2, y2, { color:"#e6edf3" });        // curly-brace-style VMobject between two points
Animl.shapes.doubleArrow(x1, y1, x2, y2, { color:"#4f8fff" });  // arrowheads on both ends, returns a Group
Animl.shapes.underline(el, { gap:6 });                           // returns a Line positioned under el's bounds
```

## Scripted 3D camera moves

`Scene3D`'s camera is animatable through the normal timeline system — no separate API to learn:

```js
await scene.moveCamera({ azimuth: Math.PI, elevation: 0.9, radius: 4 }, { duration: 3, easing:"smooth" });
// equivalent to: scene.play(Animl.anim.transform(scene.camera, { azimuth: Math.PI, ... }, opts))
```

`camera` properties: `azimuth`, `elevation` (radians, orbit angles), `radius` (distance from target), `targetX/targetY/targetZ` (look-at point). Mouse-drag/scroll orbit controls still work alongside scripted moves — a user can grab the camera mid-animation.

## Manim's exact color palette (`Animl.Colors`)

Use these instead of arbitrary hex codes to match Manim's actual visual style:

```js
Animl.Colors.BLUE   // "#58C4DD"   Animl.Colors.RED     // "#FC6255"
Animl.Colors.GREEN  // "#83C167"   Animl.Colors.YELLOW  // "#F7D96F"
Animl.Colors.PURPLE // "#9A72AC"   Animl.Colors.TEAL    // "#5CD0B3"
Animl.Colors.GOLD   // "#F0AC5F"   Animl.Colors.MAROON  // "#C55F73"
Animl.Colors.WHITE  // "#FFFFFF"   Animl.Colors.BLACK   // "#000000"
```

Most also have `_A` (lightest) through `_E` (darkest) variants: `BLUE_A`...`BLUE_E`, `RED_A`...`RED_E`, `GREEN_A`...`GREEN_E`, `GOLD_A`...`GOLD_E`, `PURPLE_A`...`PURPLE_E`, `MAROON_A`...`MAROON_E`, `TEAL_A`...`TEAL_E`, `YELLOW_A`...`YELLOW_E`, `GRAY_A`...`GRAY_E` (`GREY_*` aliases also work). All default shape fills now use `Colors.BLUE`, default text uses `Colors.WHITE`, and `Scene`/`Scene3D` default to a black background — matching Manim's classic look out of the box.

## Expanded easing (`Animl.Easing`)

Beyond `linear`, `smooth`, `easeIn`, `easeOut`, `bounce`: `rushInto`, `rushFrom`, `slowInto`, `doubleSmooth`, `thereAndBack`, `exponentialDecay(t, halfLife)`, `easeInSine`/`easeOutSine`/`easeInOutSine`, `easeInCubic`/`easeOutCubic`/`easeInOutCubic`, `easeInQuad`/`easeOutQuad`/`easeInOutQuad`, `easeInBack`/`easeOutBack`. `smooth` (the default) is Manim's actual sigmoid-based rate function, not a generic quadratic ease.

## Smooth curves through points (`Animl.smoothVPoints`)

`Axes.plot()` and `Axes.parametricPlot()` now fit a smooth curve through sampled points by default (Catmull-Rom → cubic Bezier conversion) instead of connecting them with straight segments — this is what gives plotted functions Manim's organic, fluid look. Pass `{ smooth: false }` to fall back to straight polyline segments. Use `Animl.smoothVPoints(points, closed)` directly to smooth any array of `[x,y]` vertices for a custom `VMobject`.

## Full minimal example (copy-adapt this)

```html
<div id="stage"></div>
<script src="animl.js"></script>
<script>
const scene = new Animl.Scene("#stage", { width: 800, height: 500 });
const circle = new Animl.Circle({ x: -200, y: 0, radius: 50, fill: "#4f8fff" });
const label = new Animl.Txt({ x: 0, y: -150, text: "Hello", fontSize: 40 });
scene.add(circle);
scene.add(label);

async function run(){
  await scene.play(Animl.anim.create(circle, { duration: 0.6 }), Animl.anim.write(label, { duration: 0.8 }));
  await scene.play(Animl.anim.moveTo(circle, 200, 0, { duration: 1, easing: "bounce" }));
}
run();
</script>
```

## What NOT to do

- Do not call `fetch()`, load external scripts, or call any API — the engine and every scene must be fully self-contained and offline-capable.
- Do not use CSS `localStorage`/`sessionStorage`.
- Do not invent animation names beyond the table above — compose `anim.transform()` for anything not covered.
- Do not mix 2D elements into a `Scene3D` or vice versa.
