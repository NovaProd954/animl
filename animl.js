(function(global){

const SVG_NS = "http://www.w3.org/2000/svg";

function sigmoid(x){ return 1/(1+Math.exp(-x)); }

const Easing = {
  linear: t => t,
  smooth: t => {
    const inflection = 10.0;
    const error = sigmoid(-inflection/2);
    return Math.min(1, Math.max(0, (sigmoid(inflection*(t-0.5)) - error) / (1 - 2*error)));
  },
  easeIn: t => t*t*t,
  easeOut: t => 1 - Math.pow(1-t,3),
  bounce: t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1/d1) return n1*t*t;
    if (t < 2/d1) return n1*(t-=1.5/d1)*t + 0.75;
    if (t < 2.5/d1) return n1*(t-=2.25/d1)*t + 0.9375;
    return n1*(t-=2.625/d1)*t + 0.984375;
  },
  rushInto: t => 2*Easing.smooth(t/2),
  rushFrom: t => 2*Easing.smooth(t/2+0.5) - 1,
  slowInto: t => Math.sqrt(1 - (1-t)*(1-t)),
  doubleSmooth: t => t < 0.5 ? 0.5*Easing.smooth(2*t) : 0.5*(1+Easing.smooth(2*t-1)),
  thereAndBack: t => t < 0.5 ? Easing.smooth(2*t) : Easing.smooth(2*(1-t)),
  wiggleRate: (t, wiggles=2) => Easing.thereAndBack(t) * Math.sin(wiggles*Math.PI*t),
  exponentialDecay: (t, halfLife=0.1) => 1 - Math.exp(-t/halfLife),
  easeInSine: t => 1 - Math.cos((t*Math.PI)/2),
  easeOutSine: t => Math.sin((t*Math.PI)/2),
  easeInOutSine: t => -(Math.cos(Math.PI*t) - 1)/2,
  easeInCubic: t => t*t*t,
  easeOutCubic: t => 1 - Math.pow(1-t,3),
  easeInOutCubic: t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2,
  easeInQuad: t => t*t,
  easeOutQuad: t => 1 - (1-t)*(1-t),
  easeInOutQuad: t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2,
  easeInBack: t => 2.70158*t*t*t - 1.70158*t*t,
  easeOutBack: t => 1 + 2.70158*Math.pow(t-1,3) + 1.70158*Math.pow(t-1,2)
};
function resolveEasing(e){ return typeof e === "string" ? (Easing[e]||Easing.smooth) : (e||Easing.smooth); }

const Colors = {
  BLACK:"#000000", WHITE:"#FFFFFF",
  BLUE:"#58C4DD", BLUE_A:"#C7E9F1", BLUE_B:"#9CDCEB", BLUE_C:"#58C4DD", BLUE_D:"#29ABCA", BLUE_E:"#236B8E", DARK_BLUE:"#236B8E",
  TEAL:"#5CD0B3", TEAL_A:"#ACEAD7", TEAL_B:"#76DDC0", TEAL_C:"#5CD0B3", TEAL_D:"#55C1A7", TEAL_E:"#49A88F",
  GREEN:"#83C167", GREEN_A:"#C9E2AE", GREEN_B:"#A6CF8C", GREEN_C:"#83C167", GREEN_D:"#77B05D", GREEN_E:"#699C52",
  YELLOW:"#F7D96F", YELLOW_A:"#FFF1B6", YELLOW_B:"#FFEA94", YELLOW_C:"#F7D96F", YELLOW_D:"#F4D345", YELLOW_E:"#E8C11C",
  GOLD:"#F0AC5F", GOLD_A:"#F7C797", GOLD_B:"#F9B775", GOLD_C:"#F0AC5F", GOLD_D:"#E1A158", GOLD_E:"#C78D46",
  RED:"#FC6255", RED_A:"#F7A1A3", RED_B:"#FF8080", RED_C:"#FC6255", RED_D:"#E65A4C", RED_E:"#CF5044",
  MAROON:"#C55F73", MAROON_A:"#ECABC1", MAROON_B:"#EC92AB", MAROON_C:"#C55F73", MAROON_D:"#A24D61", MAROON_E:"#94424F",
  PURPLE:"#9A72AC", PURPLE_A:"#CAA3E8", PURPLE_B:"#B189C6", PURPLE_C:"#9A72AC", PURPLE_D:"#715582", PURPLE_E:"#644172",
  PINK:"#D147BD", LIGHT_PINK:"#DC75CD", ORANGE:"#FF862F",
  GRAY:"#888888", GRAY_A:"#DDDDDD", GRAY_B:"#BBBBBB", GRAY_C:"#888888", GRAY_D:"#444444", GRAY_E:"#222222",
  GREY:"#888888", GREY_A:"#DDDDDD", GREY_B:"#BBBBBB", GREY_C:"#888888", GREY_D:"#444444", GREY_E:"#222222",
  LIGHT_GRAY:"#BBBBBB", DARK_GRAY:"#444444", LIGHTER_GRAY:"#DDDDDD", DARKER_GRAY:"#222222",
  LIGHT_BROWN:"#CD853F", DARK_BROWN:"#8B4513", GRAY_BROWN:"#736357",
  PURE_RED:"#FF0000", PURE_GREEN:"#00FF00", PURE_BLUE:"#0000FF",
  LOGO_BLACK:"#343434", LOGO_BLUE:"#525893", LOGO_GREEN:"#87C2A5", LOGO_RED:"#E07A5F", LOGO_WHITE:"#ECE7E2"
};

function lerp(a,b,t){ return a + (b-a)*t; }
function hexToRgb(hex){
  hex = hex.replace("#","");
  if (hex.length===3) hex = hex.split("").map(c=>c+c).join("");
  const num = parseInt(hex,16);
  return { r:(num>>16)&255, g:(num>>8)&255, b:num&255 };
}
function lerpColor(a,b,t){
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const r = Math.round(lerp(pa.r,pb.r,t));
  const g = Math.round(lerp(pa.g,pb.g,t));
  const bl = Math.round(lerp(pa.b,pb.b,t));
  return `rgb(${r},${g},${bl})`;
}
function lerpValue(a,b,t){
  if (typeof a === "number" && typeof b === "number") return lerp(a,b,t);
  if (typeof a === "string" && typeof b === "string" && a[0]==="#" && b[0]==="#") return lerpColor(a,b,t);
  return t < 0.5 ? a : b;
}

const Vec3 = {
  create(x=0,y=0,z=0){ return [x,y,z]; },
  sub(a,b){ return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; },
  cross(a,b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; },
  normalize(a){ const l=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/l,a[1]/l,a[2]/l]; },
  dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
};

const Mat4 = {
  identity(){ return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; },
  multiply(a,b){
    const out = new Array(16);
    for(let i=0;i<4;i++){
      for(let j=0;j<4;j++){
        out[i*4+j] = a[0*4+j]*b[i*4+0] + a[1*4+j]*b[i*4+1] + a[2*4+j]*b[i*4+2] + a[3*4+j]*b[i*4+3];
      }
    }
    return out;
  },
  translate(x,y,z){ return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]; },
  scale(x,y,z){ return [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]; },
  rotateX(rad){ const c=Math.cos(rad), s=Math.sin(rad); return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]; },
  rotateY(rad){ const c=Math.cos(rad), s=Math.sin(rad); return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; },
  rotateZ(rad){ const c=Math.cos(rad), s=Math.sin(rad); return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]; },
  perspective(fovy, aspect, near, far){
    const f = 1/Math.tan(fovy/2), nf = 1/(near-far);
    return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0];
  },
  lookAt(eye, target, up){
    const z = Vec3.normalize(Vec3.sub(eye,target));
    const x = Vec3.normalize(Vec3.cross(up,z));
    const y = Vec3.cross(z,x);
    return [
      x[0],y[0],z[0],0,
      x[1],y[1],z[1],0,
      x[2],y[2],z[2],0,
      -Vec3.dot(x,eye), -Vec3.dot(y,eye), -Vec3.dot(z,eye), 1
    ];
  }
};

let ID = 0;
function nextId(){ return "el" + (ID++); }

class Element {
  constructor(type, props={}){
    this.type = type;
    this.id = nextId();
    this.props = Object.assign({
      x:0, y:0, z:0, rotation:0, rotationX:0, rotationY:0, rotationZ:0, scale:1,
      fill:Colors.BLUE, stroke:"none", strokeWidth:2, opacity:1, fillOpacity:1
    }, props);
    this.children = [];
    this.node = null;
  }
  set(props){ Object.assign(this.props, props); return this; }
  add(child){ this.children.push(child); return this; }
  addUpdater(fn){ this._updaters = this._updaters || []; this._updaters.push(fn); return this; }
  removeUpdaters(){ this._updaters = []; return this; }
  copy(){
    const clone = new this.constructor(JSON.parse(JSON.stringify(this.props)));
    clone.children = this.children.map(c => c.copy());
    return clone;
  }
}

function walkElements(list, cb){
  list.forEach(el => { cb(el); if (el.children && el.children.length) walkElements(el.children, cb); });
}

function getBounds(el){
  const p = el.props;
  switch(el.type){
    case "circle": return { width: p.radius*2, height: p.radius*2 };
    case "rect": return { width: p.width, height: p.height };
    case "ellipse": return { width: p.rx*2, height: p.ry*2 };
    case "text": return { width: (p.text.length||1) * p.fontSize * 0.55, height: p.fontSize };
    case "mathtex": return { width: (p.tex.length||1) * (p.fontSize||32) * 0.5, height: (p.fontSize||32) * 1.4 };
    case "vmobject": {
      if (!p.points.length) return { width: 0, height: 0 };
      const xs = p.points.map(pt => pt.anchor[0]), ys = p.points.map(pt => pt.anchor[1]);
      return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
    }
    case "group": {
      if (!el.children.length) return { width: 0, height: 0 };
      const boxes = el.children.map(c => ({ b: getBounds(c), x: c.props.x, y: c.props.y }));
      const xs = boxes.flatMap(o => [o.x - o.b.width/2, o.x + o.b.width/2]);
      const ys = boxes.flatMap(o => [o.y - o.b.height/2, o.y + o.b.height/2]);
      return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
    }
    default: return { width: 100, height: 60 };
  }
}

const DIRS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
function nextTo(el, other, direction="right", gap=20){
  const d = Array.isArray(direction) ? direction : (DIRS[direction] || DIRS.right);
  const a = getBounds(el), b = getBounds(other);
  const reach = (Math.abs(d[0])*(a.width+b.width)/2) + (Math.abs(d[1])*(a.height+b.height)/2) + gap;
  el.props.x = other.props.x + d[0]*reach;
  el.props.y = other.props.y + d[1]*reach;
  if (el.node) syncSvgNode(el);
  return el;
}
function arrange(elements, direction="right", gap=20){
  const d = Array.isArray(direction) ? direction : (DIRS[direction] || DIRS.right);
  for (let i=1; i<elements.length; i++) nextTo(elements[i], elements[i-1], d, gap);
  return elements;
}

class Circle extends Element { constructor(p){ super("circle", Object.assign({radius:50}, p)); } }
class Dot extends Element { constructor(p){ super("circle", Object.assign({radius:6}, p)); } }
class Rect extends Element { constructor(p){ super("rect", Object.assign({width:100,height:60}, p)); } }
class Ellipse extends Element { constructor(p){ super("ellipse", Object.assign({rx:60,ry:35}, p)); } }
class Line extends Element { constructor(p){ super("line", Object.assign({x1:0,y1:0,x2:100,y2:0,stroke:Colors.BLUE,strokeWidth:3}, p)); } }
class Path extends Element { constructor(p){ super("path", Object.assign({d:""}, p)); } }
class Polygon extends Element { constructor(p){ super("polygon", Object.assign({points:[]}, p)); } }
class Txt extends Element { constructor(p){ super("text", Object.assign({text:"",fontSize:32,fontFamily:"sans-serif",fill:Colors.WHITE}, p)); } }
class Group extends Element { constructor(p){ super("group", p); } }
class MathTex extends Element { constructor(p){ super("mathtex", Object.assign({tex:"", fontSize:32, fill:Colors.WHITE}, p)); } }

class VMobject extends Element {
  constructor(p={}){ super("vmobject", Object.assign({ points: p.points||[], closed: p.closed!==false, fill:Colors.BLUE, stroke:"none", strokeWidth:2 }, p)); }
}

function pathFromVPoints(points, closed){
  if (!points.length) return "";
  let d = `M ${points[0].anchor[0]},${points[0].anchor[1]} `;
  for (let i=1; i<points.length; i++){
    const prev = points[i-1], cur = points[i];
    d += `C ${prev.h2[0]},${prev.h2[1]} ${cur.h1[0]},${cur.h1[1]} ${cur.anchor[0]},${cur.anchor[1]} `;
  }
  if (closed && points.length>1){
    const last = points[points.length-1], first = points[0];
    d += `C ${last.h2[0]},${last.h2[1]} ${first.h1[0]},${first.h1[1]} ${first.anchor[0]},${first.anchor[1]} Z`;
  }
  return d;
}

function straightVPoints(vertices){
  return vertices.map(v => ({ anchor:[v[0],v[1]], h1:[v[0],v[1]], h2:[v[0],v[1]] }));
}

function smoothVPoints(vertices, closed=false){
  const n = vertices.length;
  if (n < 3) return straightVPoints(vertices);
  const get = i => closed ? vertices[(i+n)%n] : vertices[Math.max(0, Math.min(n-1, i))];
  const pts = [];
  for (let i=0;i<n;i++){
    const p0=get(i-1), p1=get(i), p2=get(i+1);
    const dx=(p2[0]-p0[0])/6, dy=(p2[1]-p0[1])/6;
    pts.push({ anchor:[p1[0],p1[1]], h1:[p1[0]-dx,p1[1]-dy], h2:[p1[0]+dx,p1[1]+dy] });
  }
  return pts;
}

const CIRC_K = 0.5522847498;
function circleVPoints(radius){
  const r = radius, k = r*CIRC_K;
  return [
    { anchor:[r,0], h1:[r,-k], h2:[r,k] },
    { anchor:[0,r], h1:[k,r], h2:[-k,r] },
    { anchor:[-r,0], h1:[-r,k], h2:[-r,-k] },
    { anchor:[0,-r], h1:[-k,-r], h2:[k,-r] }
  ];
}

function regularPolygonVertices(n, radius){
  const pts = [];
  for (let i=0;i<n;i++){
    const a = -Math.PI/2 + i*2*Math.PI/n;
    pts.push([radius*Math.cos(a), radius*Math.sin(a)]);
  }
  return pts;
}

function starVertices(n, innerRadius, outerRadius){
  const pts = [];
  for (let i=0;i<n*2;i++){
    const a = -Math.PI/2 + i*Math.PI/n;
    const r = i%2===0 ? outerRadius : innerRadius;
    pts.push([r*Math.cos(a), r*Math.sin(a)]);
  }
  return pts;
}

const shapes = {
  regularPolygon(n, radius, props={}){ return new VMobject(Object.assign({ points: straightVPoints(regularPolygonVertices(n, radius)) }, props)); },
  star(n, innerRadius, outerRadius, props={}){ return new VMobject(Object.assign({ points: straightVPoints(starVertices(n, innerRadius, outerRadius)) }, props)); },
  circleVM(radius, props={}){ return new VMobject(Object.assign({ points: circleVPoints(radius) }, props)); },
  triangle(radius, props={}){ return shapes.regularPolygon(3, radius, props); }
};

function lerpPoint(a, b, t){ return [lerp(a[0],b[0],t), lerp(a[1],b[1],t)]; }

function subdivideSegment(p0, p1){
  const mid = (u,v)=>lerpPoint(u,v,0.5);
  const h1h2mid = mid(p0.h2, p1.h1);
  const newH1 = mid(p0.h2, h1h2mid);
  const newH2 = mid(p1.h1, h1h2mid);
  const newAnchor = mid(newH1, newH2);
  return {
    a: { anchor:p0.anchor, h1:p0.h1, h2:newH1 },
    b: { anchor:newAnchor, h1:newH1, h2:newH2 },
    c: { anchor:p1.anchor, h1:newH2, h2:p1.h2 }
  };
}

function alignPointCounts(pointsA, pointsB){
  let a = pointsA.map(p=>({anchor:[...p.anchor],h1:[...p.h1],h2:[...p.h2]}));
  let b = pointsB.map(p=>({anchor:[...p.anchor],h1:[...p.h1],h2:[...p.h2]}));
  function segLength(pts, i){
    const p0=pts[i], p1=pts[(i+1)%pts.length];
    return Math.hypot(p1.anchor[0]-p0.anchor[0], p1.anchor[1]-p0.anchor[1]);
  }
  function subdivideLongest(pts){
    let maxI=0, maxLen=-1;
    for (let i=0;i<pts.length;i++){ const l=segLength(pts,i); if(l>maxLen){maxLen=l;maxI=i;} }
    const i2 = (maxI+1)%pts.length;
    const split = subdivideSegment(pts[maxI], pts[i2]);
    const out = pts.slice();
    if (i2===0){ out[maxI]=split.a; out.push(split.b); out[0] = { anchor: out[0].anchor, h1: split.c.h1, h2: out[0].h2 }; }
    else { out[maxI]=split.a; out.splice(i2,0,split.b); out[i2+1]=split.c; }
    return out;
  }
  while (a.length < b.length) a = subdivideLongest(a);
  while (b.length < a.length) b = subdivideLongest(b);
  return [a,b];
}

function transformAttr(p){ return `translate(${p.x},${p.y}) rotate(${p.rotation}) scale(${p.scale})`; }

function makeSvgNode(el){
  let node;
  switch(el.type){
    case "circle": node = document.createElementNS(SVG_NS,"circle"); break;
    case "rect": node = document.createElementNS(SVG_NS,"rect"); break;
    case "ellipse": node = document.createElementNS(SVG_NS,"ellipse"); break;
    case "line": node = document.createElementNS(SVG_NS,"line"); break;
    case "path": node = document.createElementNS(SVG_NS,"path"); break;
    case "polygon": node = document.createElementNS(SVG_NS,"polygon"); break;
    case "vmobject": node = document.createElementNS(SVG_NS,"path"); break;
    case "text": node = document.createElementNS(SVG_NS,"text"); break;
    case "group": node = document.createElementNS(SVG_NS,"g"); break;
    default: node = document.createElementNS(SVG_NS,"g");
  }
  el.node = node;
  return node;
}

function syncSvgNode(el){
  const n = el.node, p = el.props;
  n.setAttribute("transform", transformAttr(p));
  n.setAttribute("opacity", p.opacity);
  if (el.type !== "group"){
    n.setAttribute("fill", p.fill);
    n.setAttribute("fill-opacity", p.fillOpacity!==undefined?p.fillOpacity:1);
    n.setAttribute("stroke", p.stroke);
    n.setAttribute("stroke-width", p.strokeWidth);
    n.setAttribute("stroke-linecap", "round");
    n.setAttribute("stroke-linejoin", "round");
  }
  switch(el.type){
    case "circle":
      n.setAttribute("cx",0); n.setAttribute("cy",0); n.setAttribute("r", p.radius); break;
    case "rect":
      n.setAttribute("x", -p.width/2); n.setAttribute("y", -p.height/2);
      n.setAttribute("width", p.width); n.setAttribute("height", p.height); break;
    case "ellipse":
      n.setAttribute("cx",0); n.setAttribute("cy",0); n.setAttribute("rx",p.rx); n.setAttribute("ry",p.ry); break;
    case "line":
      n.setAttribute("x1",p.x1); n.setAttribute("y1",p.y1); n.setAttribute("x2",p.x2); n.setAttribute("y2",p.y2); break;
    case "path":
      n.setAttribute("d", p.d); break;
    case "polygon":
      n.setAttribute("points", p.points.map(pt=>pt.join(",")).join(" ")); break;
    case "vmobject": {
      const d = pathFromVPoints(p.points, p.closed);
      n.setAttribute("d", d);
      if (p._drawProgress !== undefined && p._drawProgress < 1){
        const len = n.getTotalLength ? n.getTotalLength() : 0;
        n.style.strokeDasharray = len;
        n.style.strokeDashoffset = len * (1 - p._drawProgress);
      } else {
        n.style.strokeDasharray = ""; n.style.strokeDashoffset = "";
      }
      break;
    }
    case "text":
      n.textContent = p.text;
      n.setAttribute("font-size", p.fontSize);
      n.setAttribute("font-family", p.fontFamily);
      n.setAttribute("text-anchor","middle");
      n.setAttribute("dominant-baseline","middle"); break;
  }
}

function addSvgRecursive(container, el){
  const node = makeSvgNode(el);
  syncSvgNode(el);
  container.appendChild(node);
  el.children.forEach(c => addSvgRecursive(node, c));
}

function syncMathTexOverlay(el, scene){
  if (!el._htmlNode){
    el._htmlNode = document.createElement("div");
    el._htmlNode.style.position = "absolute";
    el._htmlNode.style.pointerEvents = "none";
    el._htmlNode.style.transformOrigin = "center center";
    el._htmlNode.style.whiteSpace = "nowrap";
    scene.htmlLayer.appendChild(el._htmlNode);
  }
  const p = el.props;
  if (el._lastTex !== p.tex || !el._renderedWithKatex){
    const k = (typeof katex !== "undefined") ? katex : (typeof window !== "undefined" ? window.katex : undefined);
    if (k){
      try { el._htmlNode.innerHTML = k.renderToString(p.tex, { throwOnError:false }); el._renderedWithKatex = true; }
      catch(e){ el._htmlNode.textContent = p.tex; el._renderedWithKatex = false; }
    } else { el._htmlNode.textContent = p.tex; el._renderedWithKatex = false; }
    el._lastTex = p.tex;
  }
  el._htmlNode.style.left = (scene.width/2 + p.x) + "px";
  el._htmlNode.style.top = (scene.height/2 + p.y) + "px";
  el._htmlNode.style.fontSize = (p.fontSize||32) + "px";
  el._htmlNode.style.color = p.fill;
  el._htmlNode.style.opacity = p.opacity;
  el._htmlNode.style.transform = `translate(-50%,-50%) rotate(${p.rotation||0}deg) scale(${p.scale||1})`;
}

function drawCanvasElement(ctx, el){
  const p = el.props;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation * Math.PI/180);
  ctx.scale(p.scale, p.scale);
  ctx.globalAlpha = p.opacity;
  ctx.fillStyle = p.fill;
  ctx.strokeStyle = p.stroke === "none" ? "transparent" : p.stroke;
  ctx.lineWidth = p.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  switch(el.type){
    case "circle":
      ctx.beginPath(); ctx.arc(0,0,p.radius,0,Math.PI*2);
      ctx.fill(); if(p.stroke!=="none") ctx.stroke(); break;
    case "rect":
      ctx.fillRect(-p.width/2,-p.height/2,p.width,p.height);
      if(p.stroke!=="none") ctx.strokeRect(-p.width/2,-p.height/2,p.width,p.height); break;
    case "ellipse":
      ctx.beginPath(); ctx.ellipse(0,0,p.rx,p.ry,0,0,Math.PI*2);
      ctx.fill(); if(p.stroke!=="none") ctx.stroke(); break;
    case "line":
      ctx.beginPath(); ctx.moveTo(p.x1,p.y1); ctx.lineTo(p.x2,p.y2); ctx.stroke(); break;
    case "path":
      if (p.d){ const path = new Path2D(p.d); ctx.fill(path); if(p.stroke!=="none") ctx.stroke(path); } break;
    case "vmobject": {
      const d = pathFromVPoints(p.points, p.closed);
      if (d){ const path = new Path2D(d); ctx.fill(path); if(p.stroke!=="none") ctx.stroke(path); }
      break;
    }
    case "polygon":
      if (p.points.length){
        ctx.beginPath(); ctx.moveTo(p.points[0][0],p.points[0][1]);
        p.points.slice(1).forEach(pt=>ctx.lineTo(pt[0],pt[1]));
        ctx.closePath(); ctx.fill(); if(p.stroke!=="none") ctx.stroke();
      } break;
    case "text":
      ctx.font = `${p.fontSize}px ${p.fontFamily}`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(p.text, 0, 0); break;
  }
  el.children.forEach(c => drawCanvasElement(ctx, c));
  ctx.restore();
}

class ValueTracker extends Element {
  constructor(value=0){ super("valuetracker", { value }); }
  get value(){ return this.props.value; }
  set value(v){ this.props.value = v; }
}

class Axes extends Group {
  constructor(props={}){
    super({ x: props.x||0, y: props.y||0 });
    this.xRange = props.xRange || [-5,5,1];
    this.yRange = props.yRange || [-5,5,1];
    this.width = props.width || 400;
    this.height = props.height || 300;
    this.axisColor = props.axisColor || "#888";
    this.gridColor = props.gridColor || "#2a2f38";
    this.showGrid = props.showGrid !== false;
    this._build();
  }
  toScreen(dataX, dataY){
    const [xmin,xmax] = this.xRange, [ymin,ymax] = this.yRange;
    const sx = (dataX-xmin)/(xmax-xmin) * this.width - this.width/2;
    const sy = -((dataY-ymin)/(ymax-ymin) * this.height - this.height/2);
    return [sx, sy];
  }
  _build(){
    if (this.showGrid){
      for (let gx=this.xRange[0]; gx<=this.xRange[1]+1e-9; gx+=this.xRange[2]){
        const [sx1,sy1]=this.toScreen(gx,this.yRange[0]), [sx2,sy2]=this.toScreen(gx,this.yRange[1]);
        this.add(new Line({x1:sx1,y1:sy1,x2:sx2,y2:sy2,stroke:this.gridColor,strokeWidth:1}));
      }
      for (let gy=this.yRange[0]; gy<=this.yRange[1]+1e-9; gy+=this.yRange[2]){
        const [sx1,sy1]=this.toScreen(this.xRange[0],gy), [sx2,sy2]=this.toScreen(this.xRange[1],gy);
        this.add(new Line({x1:sx1,y1:sy1,x2:sx2,y2:sy2,stroke:this.gridColor,strokeWidth:1}));
      }
    }
    const [ax1,ay1]=this.toScreen(this.xRange[0],0), [ax2,ay2]=this.toScreen(this.xRange[1],0);
    this.add(new Line({x1:ax1,y1:ay1,x2:ax2,y2:ay2,stroke:this.axisColor,strokeWidth:2}));
    const [bx1,by1]=this.toScreen(0,this.yRange[0]), [bx2,by2]=this.toScreen(0,this.yRange[1]);
    this.add(new Line({x1:bx1,y1:by1,x2:bx2,y2:by2,stroke:this.axisColor,strokeWidth:2}));
  }
  plot(fn, opts={}){
    const samples = opts.samples || 120;
    const [xmin,xmax] = this.xRange;
    const verts = [];
    for (let i=0;i<=samples;i++){
      const x = xmin + (xmax-xmin)*i/samples, y = fn(x);
      if (Number.isFinite(y)) verts.push(this.toScreen(x,y));
    }
    const pts = opts.smooth === false ? straightVPoints(verts) : smoothVPoints(verts, false);
    return new VMobject({ points: pts, closed:false, fill:"none", stroke: opts.color||Colors.BLUE, strokeWidth: opts.strokeWidth||4 });
  }
  parametricPlot(fn, tRange, opts={}){
    const samples = opts.samples || 120;
    const verts = [];
    for (let i=0;i<=samples;i++){
      const t = tRange[0] + (tRange[1]-tRange[0])*i/samples;
      const [x,y] = fn(t);
      if (Number.isFinite(x) && Number.isFinite(y)) verts.push(this.toScreen(x,y));
    }
    const closed = opts.closed||false;
    const pts = opts.smooth === false ? straightVPoints(verts) : smoothVPoints(verts, closed);
    return new VMobject({ points: pts, closed, fill: opts.fill||"none", stroke: opts.color||Colors.BLUE, strokeWidth: opts.strokeWidth||4 });
  }
}

class NumberLine extends Group {
  constructor(props={}){
    super({ x: props.x||0, y: props.y||0 });
    this.range = props.range || [-5,5,1];
    this.length = props.length || 400;
    this.color = props.color || "#888";
    this._build();
  }
  toScreen(v){ const [min,max]=this.range; return (v-min)/(max-min)*this.length - this.length/2; }
  _build(){
    this.add(new Line({x1:-this.length/2,y1:0,x2:this.length/2,y2:0,stroke:this.color,strokeWidth:2}));
    for (let v=this.range[0]; v<=this.range[1]+1e-9; v+=this.range[2]){
      const sx = this.toScreen(v);
      this.add(new Line({x1:sx,y1:-6,x2:sx,y2:6,stroke:this.color,strokeWidth:2}));
    }
  }
}

function arrow(x1,y1,x2,y2,props={}){
  const angle = Math.atan2(y2-y1, x2-x1);
  const headLen = props.headLength||15, headWidth = props.headWidth||10;
  const color = props.color||Colors.BLUE;
  const shaftEndX = x2-Math.cos(angle)*headLen*0.6, shaftEndY = y2-Math.sin(angle)*headLen*0.6;
  const perpX = -Math.sin(angle), perpY = Math.cos(angle);
  const backX = x2-Math.cos(angle)*headLen, backY = y2-Math.sin(angle)*headLen;
  const group = new Group({});
  group.add(new Line({x1,y1,x2:shaftEndX,y2:shaftEndY,stroke:color,strokeWidth:props.strokeWidth||3}));
  group.add(new Polygon({ points: [[x2,y2],[backX+perpX*headWidth/2,backY+perpY*headWidth/2],[backX-perpX*headWidth/2,backY-perpY*headWidth/2]], fill: color }));
  return group;
}

function surroundingRectangle(el, opts={}){
  const b = getBounds(el);
  const pad = opts.padding !== undefined ? opts.padding : 12;
  return new Rect({ x: el.props.x, y: el.props.y, width: b.width+pad*2, height: b.height+pad*2, fill:"none", stroke: opts.color||"#f7b731", strokeWidth: opts.strokeWidth||3 });
}

function tracedPath(targetEl, opts={}){
  const trace = new VMobject({ points: [], closed:false, fill:"none", stroke: opts.color||Colors.BLUE, strokeWidth: opts.strokeWidth||3 });
  trace._verts = [];
  trace.addUpdater(el => {
    const verts = trace._verts;
    const last = verts[verts.length-1];
    const cur = [targetEl.props.x, targetEl.props.y];
    if (!last || Math.hypot(cur[0]-last[0], cur[1]-last[1]) > (opts.minDist||2)){
      verts.push(cur);
      if (opts.maxPoints && verts.length > opts.maxPoints) verts.shift();
      el.props.points = smoothVPoints(verts, false);
    }
  });
  return trace;
}

function arcToCubicSegments(x1,y1,rx,ry,xAxisRotDeg,largeArcFlag,sweepFlag,x2,y2){
  if (rx===0 || ry===0) return [{c1x:x1,c1y:y1,c2x:x2,c2y:y2,x:x2,y:y2}];
  rx=Math.abs(rx); ry=Math.abs(ry);
  const phi = xAxisRotDeg*Math.PI/180, cosPhi=Math.cos(phi), sinPhi=Math.sin(phi);
  const dx2=(x1-x2)/2, dy2=(y1-y2)/2;
  const x1p = cosPhi*dx2+sinPhi*dy2, y1p = -sinPhi*dx2+cosPhi*dy2;
  let rxsq=rx*rx, rysq=ry*ry, x1psq=x1p*x1p, y1psq=y1p*y1p;
  const lambda = x1psq/rxsq + y1psq/rysq;
  if (lambda>1){ const s=Math.sqrt(lambda); rx*=s; ry*=s; rxsq=rx*rx; rysq=ry*ry; }
  const sign = largeArcFlag!==sweepFlag ? 1 : -1;
  let num = rxsq*rysq - rxsq*y1psq - rysq*x1psq;
  num = Math.max(num,0);
  const co = sign*Math.sqrt(num/((rxsq*y1psq+rysq*x1psq)||1));
  const cxp = co*(rx*y1p/ry), cyp = co*(-ry*x1p/rx);
  const cx = cosPhi*cxp - sinPhi*cyp + (x1+x2)/2, cy = sinPhi*cxp + cosPhi*cyp + (y1+y2)/2;
  function angleBetween(ux,uy,vx,vy){
    const dot=ux*vx+uy*vy, len=Math.sqrt((ux*ux+uy*uy)*(vx*vx+vy*vy));
    let ang=Math.acos(Math.min(1,Math.max(-1,dot/len)));
    if (ux*vy-uy*vx<0) ang=-ang;
    return ang;
  }
  const theta1 = angleBetween(1,0,(x1p-cxp)/rx,(y1p-cyp)/ry);
  let dtheta = angleBetween((x1p-cxp)/rx,(y1p-cyp)/ry,(-x1p-cxp)/rx,(-y1p-cyp)/ry);
  if (!sweepFlag && dtheta>0) dtheta-=2*Math.PI;
  if (sweepFlag && dtheta<0) dtheta+=2*Math.PI;
  const segCount = Math.max(1, Math.ceil(Math.abs(dtheta)/(Math.PI/2)));
  const delta = dtheta/segCount, t = 4/3*Math.tan(delta/4);
  const segments=[]; let angleI=theta1;
  for (let s=0;s<segCount;s++){
    const angleNext = angleI+delta;
    const cosA=Math.cos(angleI), sinA=Math.sin(angleI), cosB=Math.cos(angleNext), sinB=Math.sin(angleNext);
    const p1x = cx+rx*cosPhi*cosA-ry*sinPhi*sinA, p1y=cy+rx*sinPhi*cosA+ry*cosPhi*sinA;
    const p2x = cx+rx*cosPhi*cosB-ry*sinPhi*sinB, p2y=cy+rx*sinPhi*cosB+ry*cosPhi*sinB;
    const q1x = p1x - t*(rx*cosPhi*sinA+ry*sinPhi*cosA), q1y = p1y - t*(rx*sinPhi*sinA-ry*cosPhi*cosA);
    const q2x = p2x + t*(rx*cosPhi*sinB+ry*sinPhi*cosB), q2y = p2y + t*(rx*sinPhi*sinB-ry*cosPhi*cosB);
    segments.push({c1x:q1x,c1y:q1y,c2x:q2x,c2y:q2y,x:p2x,y:p2y});
    angleI = angleNext;
  }
  return segments;
}

function parsePathData(d){
  const tokens = d.match(/[a-zA-Z]|-?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g) || [];
  let i=0;
  function isCmd(tok){ return tok !== undefined && /[a-zA-Z]/.test(tok); }
  function readNum(){ return parseFloat(tokens[i++]); }
  let cx=0,cy=0,sx=0,sy=0, prevCtrl=null, current=null;
  const subpaths = [];
  function startSubpath(x,y){ current = { points:[{anchor:[x,y],h1:[x,y],h2:[x,y]}], closed:false }; subpaths.push(current); cx=x;cy=y;sx=x;sy=y; }
  function lineTo(x,y){
    if (!current) startSubpath(x,y);
    else { const prev=current.points[current.points.length-1]; prev.h2=[prev.anchor[0],prev.anchor[1]]; current.points.push({anchor:[x,y],h1:[x,y],h2:[x,y]}); }
    cx=x; cy=y;
  }
  function curveTo(c1x,c1y,c2x,c2y,x,y){
    if (!current) startSubpath(cx,cy);
    const prev = current.points[current.points.length-1];
    prev.h2=[c1x,c1y];
    current.points.push({anchor:[x,y], h1:[c2x,c2y], h2:[x,y]});
    cx=x; cy=y;
  }
  function quadTo(qx,qy,x,y){
    const c1x=cx+2/3*(qx-cx), c1y=cy+2/3*(qy-cy), c2x=x+2/3*(qx-x), c2y=y+2/3*(qy-y);
    curveTo(c1x,c1y,c2x,c2y,x,y);
  }
  while (i<tokens.length){
    if (!isCmd(tokens[i])){ i++; continue; }
    const cmd = tokens[i++], rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()){
      case "M": {
        let x=readNum(), y=readNum(); if (rel){x+=cx;y+=cy;}
        startSubpath(x,y);
        while (i<tokens.length && !isCmd(tokens[i])){ let x2=readNum(),y2=readNum(); if(rel){x2+=cx;y2+=cy;} lineTo(x2,y2); }
        prevCtrl=null; break;
      }
      case "L": { while (i<tokens.length && !isCmd(tokens[i])){ let x=readNum(),y=readNum(); if(rel){x+=cx;y+=cy;} lineTo(x,y); } prevCtrl=null; break; }
      case "H": { while (i<tokens.length && !isCmd(tokens[i])){ let x=readNum(); if(rel)x+=cx; lineTo(x,cy); } prevCtrl=null; break; }
      case "V": { while (i<tokens.length && !isCmd(tokens[i])){ let y=readNum(); if(rel)y+=cy; lineTo(cx,y); } prevCtrl=null; break; }
      case "C": {
        while (i<tokens.length && !isCmd(tokens[i])){
          let c1x=readNum(),c1y=readNum(),c2x=readNum(),c2y=readNum(),x=readNum(),y=readNum();
          if (rel){c1x+=cx;c1y+=cy;c2x+=cx;c2y+=cy;x+=cx;y+=cy;}
          curveTo(c1x,c1y,c2x,c2y,x,y); prevCtrl={x:c2x,y:c2y,type:"C"};
        } break;
      }
      case "S": {
        while (i<tokens.length && !isCmd(tokens[i])){
          let c2x=readNum(),c2y=readNum(),x=readNum(),y=readNum();
          if (rel){c2x+=cx;c2y+=cy;x+=cx;y+=cy;}
          let c1x,c1y;
          if (prevCtrl && prevCtrl.type==="C"){ c1x=2*cx-prevCtrl.x; c1y=2*cy-prevCtrl.y; } else { c1x=cx; c1y=cy; }
          curveTo(c1x,c1y,c2x,c2y,x,y); prevCtrl={x:c2x,y:c2y,type:"C"};
        } break;
      }
      case "Q": {
        while (i<tokens.length && !isCmd(tokens[i])){
          let qx=readNum(),qy=readNum(),x=readNum(),y=readNum();
          if (rel){qx+=cx;qy+=cy;x+=cx;y+=cy;}
          quadTo(qx,qy,x,y); prevCtrl={x:qx,y:qy,type:"Q"};
        } break;
      }
      case "T": {
        while (i<tokens.length && !isCmd(tokens[i])){
          let x=readNum(),y=readNum(); if (rel){x+=cx;y+=cy;}
          let qx,qy;
          if (prevCtrl && prevCtrl.type==="Q"){ qx=2*cx-prevCtrl.x; qy=2*cy-prevCtrl.y; } else { qx=cx; qy=cy; }
          quadTo(qx,qy,x,y); prevCtrl={x:qx,y:qy,type:"Q"};
        } break;
      }
      case "A": {
        while (i<tokens.length && !isCmd(tokens[i])){
          let rx=readNum(),ry=readNum(),rot=readNum(),laf=readNum(),sf=readNum(),x=readNum(),y=readNum();
          if (rel){x+=cx;y+=cy;}
          arcToCubicSegments(cx,cy,rx,ry,rot,!!laf,!!sf,x,y).forEach(s => curveTo(s.c1x,s.c1y,s.c2x,s.c2y,s.x,s.y));
        }
        prevCtrl=null; break;
      }
      case "Z": { if (current){ current.closed=true; cx=sx; cy=sy; } prevCtrl=null; break; }
      default: throw new Error("SVGMobject: unsupported path command '"+cmd+"'");
    }
  }
  return subpaths;
}

function svgMobject(svgString, props={}){
  let pathDs = [];
  if (typeof DOMParser !== "undefined"){
    const doc = new DOMParser().parseFromString(svgString, "image/svg+xml");
    doc.querySelectorAll("path").forEach(p => pathDs.push(p.getAttribute("d")));
  } else {
    const re = /<path[^>]*\sd="([^"]+)"/g; let m;
    while ((m = re.exec(svgString))) pathDs.push(m[1]);
  }
  const group = new Group(Object.assign({ x:0, y:0 }, props.groupProps||{}));
  pathDs.forEach(d => {
    if (!d) return;
    parsePathData(d).forEach(sp => {
      group.add(new VMobject({ points: sp.points, closed: sp.closed, fill: props.fill||Colors.BLUE, stroke: props.stroke||"none", strokeWidth: props.strokeWidth||2 }));
    });
  });
  return group;
}

function brace(x1,y1,x2,y2,props={}){
  const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy)||1;
  const ux=dx/len, uy=dy/len, px=-uy, py=ux, depth=props.depth||15;
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  const tipX=mx+px*depth*1.6, tipY=my+py*depth*1.6;
  const points = [
    { anchor:[x1,y1], h1:[x1,y1], h2:[x1+ux*len*0.25+px*depth*0.6, y1+uy*len*0.25+py*depth*0.6] },
    { anchor:[mx-ux*len*0.05+px*depth, my-uy*len*0.05+py*depth], h1:[mx-ux*len*0.1+px*depth, my-uy*len*0.1+py*depth], h2:[tipX-ux*len*0.02, tipY-uy*len*0.02] },
    { anchor:[tipX,tipY], h1:[tipX-ux*len*0.02,tipY-uy*len*0.02], h2:[tipX+ux*len*0.02,tipY+uy*len*0.02] },
    { anchor:[mx+ux*len*0.05+px*depth, my+uy*len*0.05+py*depth], h1:[tipX+ux*len*0.02,tipY+uy*len*0.02], h2:[mx+ux*len*0.1+px*depth, my+uy*len*0.1+py*depth] },
    { anchor:[x2,y2], h1:[x2-ux*len*0.25+px*depth*0.6, y2-uy*len*0.25+py*depth*0.6], h2:[x2,y2] }
  ];
  return new VMobject({ points, closed:false, fill:"none", stroke: props.color||"#e6edf3", strokeWidth: props.strokeWidth||3 });
}

function doubleArrow(x1,y1,x2,y2,props={}){
  const angle = Math.atan2(y2-y1, x2-x1), dx=Math.cos(angle), dy=Math.sin(angle);
  const headLen = props.headLength||15, headWidth = props.headWidth||10, color = props.color||Colors.BLUE;
  const perpX=-dy, perpY=dx;
  const group = new Group({});
  group.add(new Line({ x1:x1+dx*headLen*0.6, y1:y1+dy*headLen*0.6, x2:x2-dx*headLen*0.6, y2:y2-dy*headLen*0.6, stroke:color, strokeWidth:props.strokeWidth||3 }));
  const b1x=x1+dx*headLen, b1y=y1+dy*headLen;
  group.add(new Polygon({ points:[[x1,y1],[b1x+perpX*headWidth/2,b1y+perpY*headWidth/2],[b1x-perpX*headWidth/2,b1y-perpY*headWidth/2]], fill:color }));
  const b2x=x2-dx*headLen, b2y=y2-dy*headLen;
  group.add(new Polygon({ points:[[x2,y2],[b2x+perpX*headWidth/2,b2y+perpY*headWidth/2],[b2x-perpX*headWidth/2,b2y-perpY*headWidth/2]], fill:color }));
  return group;
}

function underline(el, opts={}){
  const b = getBounds(el);
  const y = el.props.y + b.height/2 + (opts.gap!==undefined?opts.gap:6);
  return new Line({ x1: el.props.x-b.width/2, y1:y, x2: el.props.x+b.width/2, y2:y, stroke: opts.color||"#e6edf3", strokeWidth: opts.strokeWidth||3 });
}

class Scene {
  constructor(target, opts={}){
    this.container = typeof target === "string" ? document.querySelector(target) : target;
    this.width = opts.width || 800;
    this.height = opts.height || 500;
    this.bg = opts.background || "#000000";
    this.mode = opts.renderer === "canvas" ? "canvas" : "svg";
    this.roots = [];
    this._running = true;
    this.container.style.position = "relative";

    if (this.mode === "svg"){
      this.svg = document.createElementNS(SVG_NS,"svg");
      this.svg.setAttribute("viewBox", `${-this.width/2} ${-this.height/2} ${this.width} ${this.height}`);
      this.svg.style.width = "100%"; this.svg.style.height = "auto";
      this.svg.style.background = this.bg; this.svg.style.display = "block";
      this.container.appendChild(this.svg);
    } else {
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.width; this.canvas.height = this.height;
      this.canvas.style.width = "100%"; this.canvas.style.background = this.bg;
      this.canvas.style.display = "block";
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
    }

    this.htmlLayer = document.createElement("div");
    this.htmlLayer.style.position = "absolute";
    this.htmlLayer.style.top = "0"; this.htmlLayer.style.left = "0";
    this.htmlLayer.style.width = "100%"; this.htmlLayer.style.height = "100%";
    this.htmlLayer.style.pointerEvents = "none";
    this.container.appendChild(this.htmlLayer);

    this._lastFrame = null;
    requestAnimationFrame(t => this._loop(t));
  }
  _loop(now){
    if (!this._running) return;
    if (this._lastFrame === null) this._lastFrame = now;
    const dt = (now - this._lastFrame) / 1000;
    this._lastFrame = now;

    walkElements(this.roots, el => { if (el._updaters) el._updaters.forEach(fn => fn(el, dt)); });
    walkElements(this.roots, el => { if (el.type === "mathtex") syncMathTexOverlay(el, this); });

    if (this.mode === "svg"){
      walkElements(this.roots, el => { if (el.node) syncSvgNode(el); });
    } else if (this.mode === "canvas"){
      this.ctx.save();
      this.ctx.clearRect(0,0,this.width,this.height);
      this.ctx.translate(this.width/2, this.height/2);
      this.roots.forEach(el => drawCanvasElement(this.ctx, el));
      this.ctx.restore();
    }
    requestAnimationFrame(t => this._loop(t));
  }
  add(el){
    this.roots.push(el);
    if (el.type === "valuetracker") return el;
    if (el.type === "mathtex"){ syncMathTexOverlay(el, this); return el; }
    if (this.mode === "svg") addSvgRecursive(this.svg, el);
    return el;
  }
  remove(el){
    this.roots = this.roots.filter(e => e !== el);
    if (el._htmlNode && el._htmlNode.parentNode) el._htmlNode.parentNode.removeChild(el._htmlNode);
    if (this.mode === "svg" && el.node && el.node.parentNode) el.node.parentNode.removeChild(el.node);
  }
  play(...animations){ return runTimeline(animations.flat(), this); }
  wait(seconds){ return new Promise(resolve => setTimeout(resolve, seconds*1000)); }
  nextTo(el, other, direction, gap){ return nextTo(el, other, direction, gap); }
  arrange(elements, direction, gap){ return arrange(elements, direction, gap); }
  playLagged(animations, lagRatio=0.15){ return this.play(...laggedDelays(animations, lagRatio)); }
  record(opts={}){
    if (this.mode !== "canvas") throw new Error("record() needs a canvas surface — create the Scene with { renderer: 'canvas' } or use Scene3D. Note: the MathTex HTML overlay layer is not captured in exported video.");
    return recordCanvas(this.canvas, opts);
  }
  async circumscribe(el, opts={}){
    const b = getBounds(el);
    const pad = opts.padding !== undefined ? opts.padding : 12;
    const box = new Rect({ x: el.props.x, y: el.props.y, width: b.width+pad*2, height: b.height+pad*2, fill:"none", stroke: opts.color||"#f7b731", strokeWidth: opts.strokeWidth||3, opacity:0 });
    this.add(box);
    await this.play(anim.fadeIn(box, { duration: 0.25 }));
    await this.wait(opts.holdTime !== undefined ? opts.holdTime : 0.4);
    await this.play(anim.fadeOut(box, { duration: 0.35 }));
    this.remove(box);
  }
  async focusOn(el, opts={}){
    const spot = new Circle({ x: el.props.x, y: el.props.y, radius: (opts.startRadius||300), fill: opts.color||"#ffffff", opacity: 0 });
    this.add(spot);
    spot.props.opacity = opts.maxOpacity !== undefined ? opts.maxOpacity : 0.15;
    if (spot.node) syncSvgNode(spot);
    await this.play(anim.scaleTo(spot, (opts.endRadius||30)/(opts.startRadius||300), { duration: opts.duration||0.8, easing:"easeOut" }));
    await this.play(anim.fadeOut(spot, { duration:0.3 }));
    this.remove(spot);
  }
  destroy(){ this._running = false; }
}

function syncElement(el, scene){
  if (scene.mode === "svg" && el.node) syncSvgNode(el);
}

function applyAnimation(a, elapsed, scene){
  const t = Math.min(1, Math.max(0, (elapsed - (a.delay||0)) / a.duration));
  if (t < 0) return;
  const eased = a.easing(t);
  const el = a.target;
  if (a.type === "write"){
    const n = Math.round(a.fullText.length * eased);
    el.props.text = a.fullText.slice(0, n);
  } else if (a.type === "morph"){
    el.props.points = a.fromPoints.map((p,i) => ({
      anchor: lerpPoint(p.anchor, a.toPoints[i].anchor, eased),
      h1: lerpPoint(p.h1, a.toPoints[i].h1, eased),
      h2: lerpPoint(p.h2, a.toPoints[i].h2, eased)
    }));
    if (a.toFill) el.props.fill = lerpValue(a.fromFill, a.toFill, eased);
  } else if (a.type === "indicate"){
    const pulse = Math.sin(Math.PI * eased);
    el.props.scale = a.baseScale * (1 + (a.scaleAmount||0.2) * pulse);
    el.props.fill = pulse > 0.05 ? lerpColor(a.baseFill, a.color||"#f7b731", pulse) : a.baseFill;
  } else if (a.type === "wiggle"){
    const damp = Math.sin(Math.PI * eased);
    el.props.rotation = a.baseRotation + (a.amount||12) * Math.sin(eased * Math.PI * 2 * (a.cycles||3)) * damp;
  } else if (a.type === "drawBorder"){
    if (eased <= 0.5){ el.props._drawProgress = eased*2; el.props.fillOpacity = 0; }
    else { el.props._drawProgress = 1; el.props.fillOpacity = (eased-0.5)*2*(a.targetFillOpacity!==undefined?a.targetFillOpacity:1); }
  } else {
    Object.keys(a.to).forEach(key => { el.props[key] = lerpValue(a.from[key], a.to[key], eased); });
  }
  syncElement(el, scene);
}

function laggedDelays(animations, lagRatio){
  const flat = animations.flat();
  flat.forEach((a,i) => { a.delay = (a.delay||0) + i*lagRatio*(a.duration||1); });
  return flat;
}

function runTimeline(flat, scene){
  const start = performance.now();
  const maxDuration = Math.max(0, ...flat.map(a => (a.delay||0) + a.duration));
  return new Promise(resolve => {
    function tick(now){
      const elapsed = (now - start) / 1000;
      flat.forEach(a => applyAnimation(a, elapsed, scene));
      if (elapsed < maxDuration) requestAnimationFrame(tick);
      else { flat.forEach(a => applyAnimation(a, a.duration, scene)); resolve(); }
    }
    requestAnimationFrame(tick);
  });
}

function buildAnim(target, to, opts={}){
  const from = {};
  Object.keys(to).forEach(k => from[k] = target.props[k]);
  return { target, from, to, duration: opts.duration!==undefined?opts.duration:1, delay: opts.delay||0, easing: resolveEasing(opts.easing) };
}

const anim = {
  create(el, opts={}){ el.props.opacity = 0; if (el.node) syncSvgNode(el); return buildAnim(el, {opacity:1}, opts); },
  fadeIn(el, opts={}){ return buildAnim(el, {opacity:1}, opts); },
  fadeOut(el, opts={}){ return buildAnim(el, {opacity:0}, opts); },
  moveTo(el, x, y, opts={}){ return buildAnim(el, {x,y}, opts); },
  moveTo3D(el, x, y, z, opts={}){ return buildAnim(el, {x,y,z}, opts); },
  scaleTo(el, scale, opts={}){ return buildAnim(el, {scale}, opts); },
  rotateTo(el, rotation, opts={}){ return buildAnim(el, {rotation}, opts); },
  rotateTo3D(el, rx, ry, rz, opts={}){ return buildAnim(el, {rotationX:rx, rotationY:ry, rotationZ:rz}, opts); },
  transform(el, props, opts={}){ return buildAnim(el, props, opts); },
  colorTo(el, fill, opts={}){ return buildAnim(el, {fill}, opts); },
  write(el, opts={}){
    const full = el.props.text;
    return { type:"write", target: el, fullText: full, duration: opts.duration!==undefined?opts.duration:1, delay: opts.delay||0, easing: resolveEasing(opts.easing) };
  },
  growFromCenter(el, opts={}){
    const target = el.props.scale;
    el.props.scale = 0; el.props.opacity = el.props.opacity || 1;
    if (el.node) syncSvgNode(el);
    return buildAnim(el, {scale:target, opacity:1}, opts);
  },
  shrinkToCenter(el, opts={}){ return buildAnim(el, {scale:0, opacity:0}, opts); },
  spin(el, turns=1, opts={}){ return buildAnim(el, {rotation: el.props.rotation + 360*turns}, opts); },
  indicate(el, opts={}){
    return { type:"indicate", target: el, baseScale: el.props.scale, baseFill: el.props.fill, color: opts.color, scaleAmount: opts.scaleAmount!==undefined?opts.scaleAmount:0.25,
      duration: opts.duration!==undefined?opts.duration:1, delay: opts.delay||0, easing: resolveEasing(opts.easing||"linear") };
  },
  wiggle(el, opts={}){
    return { type:"wiggle", target: el, baseRotation: el.props.rotation, amount: opts.amount!==undefined?opts.amount:12, cycles: opts.cycles||3,
      duration: opts.duration!==undefined?opts.duration:1, delay: opts.delay||0, easing: resolveEasing(opts.easing||"linear") };
  },
  morphTo(el, target, opts={}){
    const targetPoints = target instanceof Element ? target.props.points : target;
    const [fromPoints, toPoints] = alignPointCounts(el.props.points, targetPoints);
    el.props.points = fromPoints;
    if (el.node) syncSvgNode(el);
    return { type:"morph", target: el, fromPoints, toPoints, toFill: opts.fill, fromFill: el.props.fill,
      duration: opts.duration!==undefined?opts.duration:1, delay: opts.delay||0, easing: resolveEasing(opts.easing) };
  },
  drawBorderThenFill(el, opts={}){
    el.props._drawProgress = 0; el.props.fillOpacity = 0; el.props.opacity = 1;
    if (el.node) syncSvgNode(el);
    return { type:"drawBorder", target: el, targetFillOpacity: opts.fillOpacity!==undefined?opts.fillOpacity:1,
      duration: opts.duration!==undefined?opts.duration:1.5, delay: opts.delay||0, easing: resolveEasing(opts.easing||"linear") };
  }
};

function recordCanvas(canvas, opts={}){
  const fps = opts.fps || 30;
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise(resolve => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      if (opts.download !== false){
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = (opts.filename || "animl-export") + ".webm";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      resolve(blob);
    };
  });
  recorder.start();
  return {
    stop(){ recorder.stop(); return done; },
    async duration(seconds){ await new Promise(r=>setTimeout(r, seconds*1000)); recorder.stop(); return done; }
  };
}

const VERT_SRC = `
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
varying vec3 vNormal;
void main(){
  vNormal = mat3(uModel) * aNormal;
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}`;

const FRAG_SRC = `
precision mediump float;
varying vec3 vNormal;
uniform vec3 uColor;
void main(){
  vec3 n = normalize(vNormal);
  vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
  float diff = max(dot(n, lightDir), 0.0);
  float ambient = 0.35;
  vec3 c = uColor * (ambient + diff * 0.65);
  gl_FragColor = vec4(c, 1.0);
}`;

function compileShader(gl, type, src){
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function createProgram(gl){
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  return prog;
}

function cubeGeometry(size=1){
  const s = size/2;
  const faces = [
    [[-s,-s, s],[ s,-s, s],[ s, s, s],[-s, s, s]], [0,0,1],
    [[ s,-s,-s],[-s,-s,-s],[-s, s,-s],[ s, s,-s]], [0,0,-1],
    [[-s, s, s],[ s, s, s],[ s, s,-s],[-s, s,-s]], [0,1,0],
    [[-s,-s,-s],[ s,-s,-s],[ s,-s, s],[-s,-s, s]], [0,-1,0],
    [[ s,-s, s],[ s,-s,-s],[ s, s,-s],[ s, s, s]], [1,0,0],
    [[-s,-s,-s],[-s,-s, s],[-s, s, s],[-s, s,-s]], [-1,0,0]
  ];
  const positions = [], normals = [], indices = [];
  for (let f=0; f<faces.length; f+=2){
    const verts = faces[f], n = faces[f+1];
    const base = positions.length/3;
    verts.forEach(v => { positions.push(...v); normals.push(...n); });
    indices.push(base,base+1,base+2, base,base+2,base+3);
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices) };
}

function sphereGeometry(radius=1, segments=16){
  const positions = [], normals = [], indices = [];
  for (let lat=0; lat<=segments; lat++){
    const theta = lat*Math.PI/segments, sinT = Math.sin(theta), cosT = Math.cos(theta);
    for (let lon=0; lon<=segments; lon++){
      const phi = lon*2*Math.PI/segments, sinP = Math.sin(phi), cosP = Math.cos(phi);
      const x = cosP*sinT, y = cosT, z = sinP*sinT;
      positions.push(radius*x, radius*y, radius*z);
      normals.push(x,y,z);
    }
  }
  for (let lat=0; lat<segments; lat++){
    for (let lon=0; lon<segments; lon++){
      const a = lat*(segments+1)+lon, b = a+segments+1;
      indices.push(a,b,a+1, b,b+1,a+1);
    }
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint16Array(indices) };
}

function planeGeometry(w=1, h=1){
  const hw = w/2, hh = h/2;
  return {
    positions: new Float32Array([-hw,0,-hh, hw,0,-hh, hw,0,hh, -hw,0,hh]),
    normals: new Float32Array([0,1,0, 0,1,0, 0,1,0, 0,1,0]),
    indices: new Uint16Array([0,1,2, 0,2,3])
  };
}

class Element3D {
  constructor(geomFn, props={}){
    this.geomFn = geomFn;
    this.id = nextId();
    this.props = Object.assign({ x:0,y:0,z:0, rotationX:0,rotationY:0,rotationZ:0, scale:1, fill:Colors.BLUE, opacity:1 }, props);
    this._buffers = null;
  }
  set(props){ Object.assign(this.props, props); return this; }
}
class Cube extends Element3D { constructor(p={}){ super(()=>cubeGeometry(p.size||1), p); } }
class Sphere extends Element3D { constructor(p={}){ super(()=>sphereGeometry(p.radius||1, p.segments||16), p); } }
class Plane extends Element3D { constructor(p={}){ super(()=>planeGeometry(p.width||1, p.height||1), p); } }

class Scene3D {
  constructor(target, opts={}){
    this.container = typeof target === "string" ? document.querySelector(target) : target;
    this.width = opts.width || 800;
    this.height = opts.height || 500;
    this.mode = "webgl";
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width; this.canvas.height = this.height;
    this.canvas.style.width = "100%"; this.canvas.style.display = "block";
    this.canvas.style.background = opts.background || "#000000";
    this.container.appendChild(this.canvas);
    const gl = this.canvas.getContext("webgl");
    if (!gl) throw new Error("WebGL not available in this environment.");
    this.gl = gl;
    this.program = createProgram(gl);
    this.roots = [];
    this.camera = { props: { radius: opts.cameraDistance || 6, azimuth: 0.6, elevation: 0.5, targetX:0, targetY:0, targetZ:0 } };
    this._running = true;
    this._bindOrbitControls();
    gl.enable(gl.DEPTH_TEST);
    requestAnimationFrame(() => this._loop());
  }
  _bindOrbitControls(){
    let dragging = false, lastX = 0, lastY = 0;
    this.canvas.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener("pointerup", () => dragging = false);
    window.addEventListener("pointermove", e => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      this.camera.props.azimuth -= dx * 0.005;
      this.camera.props.elevation = Math.max(-1.4, Math.min(1.4, this.camera.props.elevation - dy*0.005));
    });
    this.canvas.addEventListener("wheel", e => {
      this.camera.props.radius = Math.max(1.5, this.camera.props.radius + e.deltaY*0.003);
      e.preventDefault();
    }, { passive:false });
  }
  add(el){
    if (!el._buffers){
      const gl = this.gl, geom = el.geomFn();
      const posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, geom.positions, gl.STATIC_DRAW);
      const normBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuf); gl.bufferData(gl.ARRAY_BUFFER, geom.normals, gl.STATIC_DRAW);
      const idxBuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geom.indices, gl.STATIC_DRAW);
      el._buffers = { posBuf, normBuf, idxBuf, count: geom.indices.length };
    }
    this.roots.push(el);
    return el;
  }
  remove(el){ this.roots = this.roots.filter(e => e !== el); }
  play(...animations){ return runTimeline(animations.flat(), this); }
  playLagged(animations, lagRatio=0.15){ return this.play(...laggedDelays(animations, lagRatio)); }
  moveCamera(props, opts={}){ return this.play(anim.transform(this.camera, props, opts)); }
  wait(seconds){ return new Promise(resolve => setTimeout(resolve, seconds*1000)); }
  record(opts={}){ return recordCanvas(this.canvas, opts); }
  destroy(){ this._running = false; }
  _loop(){
    if (!this._running) return;
    const gl = this.gl;
    gl.viewport(0,0,this.canvas.width,this.canvas.height);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);

    const cam = this.camera.props;
    const target = [cam.targetX, cam.targetY, cam.targetZ];
    const eye = [
      target[0] + cam.radius*Math.cos(cam.elevation)*Math.sin(cam.azimuth),
      target[1] + cam.radius*Math.sin(cam.elevation),
      target[2] + cam.radius*Math.cos(cam.elevation)*Math.cos(cam.azimuth)
    ];
    const view = Mat4.lookAt(eye, target, [0,1,0]);
    const proj = Mat4.perspective(Math.PI/4, this.canvas.width/this.canvas.height, 0.1, 100);

    const aPos = gl.getAttribLocation(this.program, "aPosition");
    const aNorm = gl.getAttribLocation(this.program, "aNormal");
    const uModel = gl.getUniformLocation(this.program, "uModel");
    const uView = gl.getUniformLocation(this.program, "uView");
    const uProj = gl.getUniformLocation(this.program, "uProjection");
    const uColor = gl.getUniformLocation(this.program, "uColor");

    gl.uniformMatrix4fv(uView, false, view);
    gl.uniformMatrix4fv(uProj, false, proj);

    this.roots.forEach(el => {
      const p = el.props;
      let m = Mat4.translate(p.x,p.y,p.z);
      m = Mat4.multiply(m, Mat4.rotateY(p.rotationY));
      m = Mat4.multiply(m, Mat4.rotateX(p.rotationX));
      m = Mat4.multiply(m, Mat4.rotateZ(p.rotationZ));
      m = Mat4.multiply(m, Mat4.scale(p.scale,p.scale,p.scale));
      gl.uniformMatrix4fv(uModel, false, m);
      const rgb = hexToRgb(p.fill);
      gl.uniform3f(uColor, rgb.r/255, rgb.g/255, rgb.b/255);

      gl.bindBuffer(gl.ARRAY_BUFFER, el._buffers.posBuf);
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER, el._buffers.normBuf);
      gl.enableVertexAttribArray(aNorm); gl.vertexAttribPointer(aNorm,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, el._buffers.idxBuf);
      gl.drawElements(gl.TRIANGLES, el._buffers.count, gl.UNSIGNED_SHORT, 0);
    });

    requestAnimationFrame(() => this._loop());
  }
}

shapes.arrow = arrow;
shapes.surroundingRectangle = surroundingRectangle;
shapes.brace = brace;
shapes.doubleArrow = doubleArrow;
shapes.underline = underline;

global.Animl = {
  Scene, Scene3D,
  Circle, Rect, Ellipse, Line, Path, Polygon, Txt, Group, Dot,
  VMobject, MathTex, shapes,
  SVGMobject: svgMobject, parsePathData,
  Cube, Sphere, Plane,
  Axes, NumberLine, ValueTracker, tracedPath,
  anim, Easing, Colors, Mat4, Vec3,
  nextTo, arrange, getBounds, smoothVPoints, straightVPoints
};

})(typeof window !== "undefined" ? window : globalThis);
