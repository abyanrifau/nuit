/* =====================================================================
   Nuit Works — app.js
   Smooth scroll (Lenis) + GSAP ScrollTrigger + raw-WebGL particle field
   + custom cursor, magnetic buttons, typewriter and scroll reveals.
   No build step. Everything degrades gracefully by device tier.
   ===================================================================== */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]static/.test(location.search);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobile = () => matchMedia('(max-width: 760px)').matches;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------
     Device tier — decides particle budget, DPR cap and effect density
     ------------------------------------------------------------------ */
  function detectTier() {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    const dpr = window.devicePixelRatio || 1;
    let score = 0;
    if (cores >= 8) score += 2; else if (cores >= 4) score += 1;
    if (mem >= 8) score += 2; else if (mem >= 4) score += 1;
    if (!finePointer) score -= 2;
    if (mobile()) score -= 1;
    if (dpr > 2.5) score -= 1;
    if (score >= 3) return 'high';
    if (score >= 1) return 'mid';
    return 'low';
  }
  const TIERS = {
    high: { count: 36000, dust: 1400, comets: 6, dpr: 2 },
    mid:  { count: 18000, dust: 900,  comets: 4, dpr: 1.5 },
    low:  { count: 7000,  dust: 420,  comets: 3, dpr: 1.25 }
  };
  const tier = detectTier();
  html.classList.add('tier-' + tier);
  if (finePointer) html.classList.add('has-cursor');

  /* ------------------------------------------------------------------
     Smooth scroll
     ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduced && hasGSAP && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.16, wheelMultiplier: 1.2, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.3, easing: easeOutQuart });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ------------------------------------------------------------------
     Pointer state (shared by cursor, glow and particles)
     ------------------------------------------------------------------ */
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, seen: false, moved: 0 };
  // Touch devices get no pointer tracking at all. A finger dragging the page emits
  // pointermove just like a mouse, which fed the field's cursor repulsion and pushed
  // the particles around under the thumb — a cursor effect with no cursor.
  if (finePointer) {
    window.addEventListener('pointermove', (e) => {
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true; pointer.moved = performance.now();
      if (field) field.setPointer(e.clientX, e.clientY);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     WebGL particle field
     ------------------------------------------------------------------ */
  const CAM_Z = 6;
  const FOV = 40 * Math.PI / 180;

  // Kept in step with SHAPES by hand: one `attribute vec3 aPn` per shape and one
  // segment per gap between them. The check beside SHAPES shouts if they drift.
  const SHADER_SHAPES = 3;
  const VERT = [
    'precision highp float;',
    'attribute vec3 aP0; attribute vec3 aP1; attribute vec3 aP2;',
    'attribute vec4 aRand;',
    'uniform mat4 uProj;',
    'uniform float uTime; uniform float uProgress; uniform float uRotX; uniform float uRotY;',
    'uniform float uScale; uniform float uPointScale; uniform float uCamZ; uniform float uMouseR; uniform float uMouseF;',
    'uniform float uDisperse; uniform vec2 uScatter;',
    'uniform vec2 uOffset; uniform vec2 uMouse;',
    'varying float vA; varying float vB;',
    'mat3 rotX(float a){ float c = cos(a); float s = sin(a); return mat3(1.0,0.0,0.0, 0.0,c,s, 0.0,-s,c); }',
    'mat3 rotY(float a){ float c = cos(a); float s = sin(a); return mat3(c,0.0,-s, 0.0,1.0,0.0, s,0.0,c); }',
    'void main(){',
    '  float p = clamp(uProgress, 0.0, 2.0);',
    '  float seg = floor(min(p, 1.999));',
    '  float f = p - seg;',
    '  float st = aRand.z * 0.4;',
    '  f = clamp((f - st) / 0.6, 0.0, 1.0);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  vec3 a = aP0; vec3 b = aP1;',
    '  if (seg > 0.5) { a = aP1; b = aP2; }',
    '  vec3 pos = mix(a, b, f);',
    '  float burst = sin(f * 3.14159265);',
    '  pos += normalize(pos + vec3(0.001)) * burst * (0.3 + 0.35 * aRand.y);',
    '  float t = uTime * (0.5 + aRand.w * 0.7);',
    '  pos += 0.035 * vec3(sin(t + pos.y * 3.0 + aRand.z * 6.2831), cos(t * 0.9 + pos.z * 3.0 + aRand.z * 3.1), sin(t * 1.1 + pos.x * 3.0 + aRand.z * 1.7));',
    '  pos = rotX(uRotX) * (rotY(uRotY) * pos);',
    '  pos *= uScale;',
    '  pos.xy += uOffset;',
    // Dispersion: blend the assembled shape out into a wide, camera-facing haze so
    // sections with copy over them read as background dust instead of a solid object.
    // Applied after rotate/scale/offset so the dispersed state is identical everywhere,
    // whatever shape the section happens to be morphing through underneath.
    '  float dsp = clamp(uDisperse, 0.0, 1.0);',
    '  if (dsp > 0.001) {',
    '    float h1 = fract(sin(aRand.z * 91.7 + aRand.w * 47.3) * 43758.5453);',
    '    float h2 = fract(sin(aRand.y * 63.1 + aRand.z * 21.9) * 24634.6345);',
    '    float h3 = fract(sin(aRand.w * 39.9 + aRand.y * 75.4) * 13758.5453);',
    '    float sth = h1 * 6.2831853;',
    '    float sr = sqrt(h2);',
    '    vec3 scat = vec3(sr * cos(sth) * uScatter.x, sr * sin(sth) * uScatter.y, (h3 - 0.5) * 2.4);',
    '    scat.x += 0.18 * sin(t * 0.35 + h1 * 6.2831853);',
    '    scat.y += 0.18 * cos(t * 0.30 + h2 * 6.2831853);',
    '    pos = mix(pos, scat, dsp * dsp * (3.0 - 2.0 * dsp));',
    '  }',
    '  vec2 d = pos.xy - uMouse;',
    '  float dist = length(d);',
    '  float infl = 1.0 - smoothstep(0.0, uMouseR, dist);',
    '  infl *= infl;',
    '  pos.xy += (d / max(dist, 0.001)) * infl * uMouseF;',
    '  float dz = uCamZ - pos.z;',
    '  gl_Position = uProj * vec4(pos.x, pos.y, pos.z - uCamZ, 1.0);',
    '  gl_PointSize = aRand.x * uPointScale * (1.0 - 0.35 * dsp) / max(dz, 0.5);',
    '  vA = 0.35 + 0.65 * smoothstep(-2.0, 1.5, pos.z);',
    '  vB = aRand.y;',
    '}'
  ].join('\n');

  const FRAG = [
    'precision mediump float;',
    'uniform float uOpacity; uniform vec3 uColor;',
    'varying float vA; varying float vB;',
    'void main(){',
    '  vec2 c = gl_PointCoord - 0.5;',
    '  float d2 = dot(c, c);',
    '  if (d2 > 0.25) discard;',
    '  float a = 1.0 - smoothstep(0.0, 0.25, d2);',
    '  a *= a;',
    '  vec3 col = mix(uColor * 0.8, vec3(1.0), vB * 0.5);',
    '  float al = a * vA * uOpacity;',
    '  gl_FragColor = vec4(col * al, al);',
    '}'
  ].join('\n');

  const DVERT = [
    'precision mediump float;',
    'attribute vec3 aPos; attribute vec2 aSeed;',
    'uniform float uTime; uniform float uAspect; uniform float uScroll; uniform float uPx;',
    'uniform vec2 uMouse;',
    'varying float vA;',
    'void main(){',
    '  float depth = aPos.z;',
    '  float sp = 0.3 + depth;',
    '  vec2 p = aPos.xy;',
    '  p.y = mod(p.y + uTime * 0.012 * sp + uScroll * (0.12 + 0.3 * depth) + 1.1, 2.2) - 1.1;',
    '  p.x += 0.02 * sin(uTime * 0.25 * sp + aSeed.x * 6.2831);',
    '  p += uMouse * (0.008 + 0.03 * depth);',
    '  vec2 d = (p - uMouse) * vec2(uAspect, 1.0);',
    '  float l = length(d);',
    '  p += (d / max(l, 0.001)) * 0.05 * (1.0 - smoothstep(0.0, 0.35, l)) / vec2(uAspect, 1.0);',
    '  gl_Position = vec4(p, 0.0, 1.0);',
    '  gl_PointSize = (0.9 + 1.7 * depth) * aSeed.y * uPx;',
    '  vA = (0.22 + 0.5 * depth) * (0.65 + 0.35 * sin(uTime * (1.0 + aSeed.x * 2.0) + aSeed.x * 40.0));',
    '}'
  ].join('\n');

  const DFRAG = [
    'precision mediump float;',
    'uniform float uOpacity;',
    'varying float vA;',
    'void main(){',
    '  vec2 c = gl_PointCoord - 0.5;',
    '  float d2 = dot(c, c);',
    '  if (d2 > 0.25) discard;',
    '  float a = (1.0 - smoothstep(0.0, 0.25, d2)) * vA * uOpacity;',
    '  gl_FragColor = vec4(vec3(0.86, 0.86, 0.9) * a, a);',
    '}'
  ].join('\n');

  /* Comets. Each is a string of points trailing a head, and every position comes from
     uTime plus a per-comet seed — so the whole layer is one static buffer that never
     needs updating from JS. They work in "visual" space (y in [-1,1], x in
     [-aspect, aspect]) so the streaks keep their angle whatever the window shape. */
  const COMET_TAIL = 64;
  const CVERT = [
    'precision highp float;',
    'attribute vec2 aC;',
    'uniform float uTime; uniform float uAspect; uniform float uPx;',
    'varying float vA;',
    'float h(float n){ return fract(sin(n * 12.9898) * 43758.5453); }',
    'void main(){',
    '  float id = aC.x, tail = aC.y;',
    '  float period = 11.0 + 13.0 * h(id + 1.3);',
    '  float ph = fract((uTime + h(id + 4.7) * period) / period);',
    '  float win = 0.13;',
    '  float k = ph / win;',
    '  float ang = 3.55 + 0.6 * h(id + 9.1);',
    '  vec2 dir = vec2(cos(ang), sin(ang));',
    // Travel far enough that the vertical drop always clears the screen, however
    // shallow the angle, so no comet stalls half way across.
    '  float dist = 2.6 / max(0.35, -dir.y);',
    '  vec2 v = vec2(0.6 + 2.2 * h(id + 2.9), 1.25) + dir * dist * k;',
    '  v -= dir * tail * (0.26 + 0.20 * h(id + 8.7));',
    '  gl_Position = vec4(v.x / uAspect, v.y, 0.0, 1.0);',
    '  float head = 1.0 - tail;',
    '  gl_PointSize = uPx * (0.8 + 3.4 * head * head);',
    '  vA = step(ph, win) * sin(k * 3.14159265) * pow(head, 1.6) * (0.5 + 0.5 * h(id + 11.9));',
    '}'
  ].join('\n');

  const CFRAG = [
    'precision mediump float;',
    'uniform float uOpacity;',
    'varying float vA;',
    'void main(){',
    '  vec2 c = gl_PointCoord - 0.5;',
    '  float d2 = dot(c, c);',
    '  if (d2 > 0.25) discard;',
    '  float a = (1.0 - smoothstep(0.0, 0.25, d2)) * vA * uOpacity;',
    '  gl_FragColor = vec4(vec3(0.88, 0.91, 1.0) * a, a);',
    '}'
  ].join('\n');

  function genComets(N) {
    const arr = new Float32Array(N * COMET_TAIL * 2);
    let k = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < COMET_TAIL; j++) {
        arr[k++] = i + 1;
        // Bunch the points toward the head so the streak stays solid where it is bright.
        arr[k++] = Math.pow(j / (COMET_TAIL - 1), 1.4);
      }
    }
    return arr;
  }

  function compileShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error('Shader: ' + gl.getShaderInfoLog(s));
    }
    return s;
  }
  function createProgram(gl, vs, fs, attribs) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fs));
    attribs.forEach((name, i) => gl.bindAttribLocation(p, i, name));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Program: ' + gl.getProgramInfoLog(p));
    return p;
  }
  function uniformMap(gl, prog) {
    const u = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(prog, i);
      u[info.name] = gl.getUniformLocation(prog, info.name);
    }
    return u;
  }
  function makeBuffer(gl, data) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  }
  function bindAttrib(gl, buffer, loc, size) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    const m = new Float32Array(16);
    m[0] = f / aspect; m[5] = f; m[10] = (far + near) * nf; m[11] = -1; m[14] = 2 * far * near * nf;
    return m;
  }

  /* --- Shape generators. Each returns N points sorted by angle so morphs flow. --- */
  const TAU = Math.PI * 2;
  const rnd = Math.random;
  /* Shapes are angle-sorted so morphs flow, but degrade() draws only the first
     drawCount particles — and a prefix of an angle-sorted array is a wedge, not the
     whole shape. One shared permutation applied to every shape keeps index i paired
     across shapes (so the morph is unchanged) while making any prefix a uniform
     sample of the whole form. */
  function makeOrder(N) {
    const idx = new Uint32Array(N);
    for (let i = 0; i < N; i++) idx[i] = i;
    for (let i = N - 1; i > 0; i--) {
      const j = (rnd() * (i + 1)) | 0;
      const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    return idx;
  }
  function applyOrder(src, order) {
    const out = new Float32Array(order.length * 3);
    for (let i = 0; i < order.length; i++) {
      const s = order[i] * 3, d = i * 3;
      out[d] = src[s]; out[d + 1] = src[s + 1]; out[d + 2] = src[s + 2];
    }
    return out;
  }
  function flatten(pts) {
    pts.sort((a, b) => a[3] - b[3]);
    const out = new Float32Array(pts.length * 3);
    for (let i = 0; i < pts.length; i++) { out[i * 3] = pts[i][0]; out[i * 3 + 1] = pts[i][1]; out[i * 3 + 2] = pts[i][2]; }
    return out;
  }
  // Volumetric shapes sort around the Y axis; the flat wordmark sorts in the screen
  // plane instead, so particles sweep radially into the letterforms rather than
  // collapsing from one side.
  function finish(pts) {
    for (let i = 0; i < pts.length; i++) pts[i][3] = Math.atan2(pts[i][2], pts[i][0]);
    return flatten(pts);
  }
  function finishXY(pts) {
    for (let i = 0; i < pts.length; i++) pts[i][3] = Math.atan2(pts[i][1], pts[i][0]);
    return flatten(pts);
  }
  function genGalaxy(N) {
    const pts = [];
    for (let i = 0; i < N; i++) {
      if (rnd() < 0.1) {
        const r = 0.32 * Math.cbrt(rnd()), th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
        pts.push([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.55, r * Math.sin(ph) * Math.sin(th), 0]);
        continue;
      }
      const arm = i % 3;
      const r = Math.pow(rnd(), 0.6) * 1.65;
      const spread = (0.08 + r * 0.16) * (rnd() + rnd() - 1);
      const theta = r * 2.3 + arm * (TAU / 3) + spread * Math.PI;
      const y = (rnd() + rnd() - 1) * 0.09 * (1.2 - r / 1.65);
      pts.push([r * Math.cos(theta), y, r * Math.sin(theta), 0]);
    }
    return finish(pts);
  }
  function sampleAlpha(ctx, W, H, N) {
    const data = ctx.getImageData(0, 0, W, H).data;
    const hits = [];
    for (let i = 0; i < W * H; i++) if (data[i * 4 + 3] > 128) hits.push(i);
    if (hits.length < 32) return null;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const idx = hits[(rnd() * hits.length) | 0];
      const px = (idx % W) + rnd(), py = ((idx / W) | 0) + rnd();
      pts.push([
        (px / W) * 2 - 1,
        -((py / H) * 2 - 1) / LOGO_RATIO,
        (rnd() - 0.5) * 0.09,
        0
      ]);
    }
    return pts;
  }
  function wordmarkCanvas() {
    const W = 640, H = Math.round(W / LOGO_RATIO);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    return { c: c, ctx: c.getContext('2d', { willReadFrequently: true }), W: W, H: H };
  }
  // Synchronous fallback so the buffer is never empty; replaced by the real logo
  // artwork as soon as it decodes (see loadLogoWordmark).
  function genKnot(N) {
    const pts = [];
    const p = 2, q = 3, S = 0.44;
    for (let i = 0; i < N; i++) {
      const t = rnd() * TAU;
      const r = 2 + Math.cos(q * t);
      let x = r * Math.cos(p * t), y = r * Math.sin(p * t), z = -Math.sin(q * t);
      const tr = 0.42 * Math.cbrt(rnd());
      const th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
      x += tr * Math.sin(ph) * Math.cos(th); y += tr * Math.sin(ph) * Math.sin(th); z += tr * Math.cos(ph);
      pts.push([x * S, z * S * 1.6, y * S, 0]);
    }
    return finish(pts);
  }

  /* --- Wordmark. Particles sampled from the opaque pixels of a rendering of the
     NUIT logo, normalised to x in [-1,1] (y follows the logo's aspect) so a section
     can scale it to whatever share of the viewport width it wants. --------------- */
  const LOGO_RATIO = 3.082;
  function genWordmark(N) {
    const { ctx, W, H } = wordmarkCanvas();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = H * 0.8;
    const font = (s) => '600 ' + s + 'px Inter, system-ui, sans-serif';
    ctx.font = font(size);
    const w = ctx.measureText('NUIT').width;
    if (w > W * 0.92) ctx.font = font(size * (W * 0.92) / w);
    ctx.fillText('NUIT', W / 2, H / 2);
    const pts = sampleAlpha(ctx, W, H, N);
    return finishXY(pts || [[0, 0, 0, 0]]);
  }
  function loadLogoWordmark(field) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--logo-img').trim();
    const m = raw.match(/url\(\s*["']?(.+?)["']?\s*\)$/);
    if (!m) return;
    const img = new Image();
    img.onload = () => {
      const { ctx, W, H } = wordmarkCanvas();
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      let pts;
      try { pts = sampleAlpha(ctx, W, H, field.count); } catch (e) { return; }
      if (pts) field.setWordmark(finishXY(pts));
    };
    img.src = m[1];
  }
  // The forms a section can ask for by index: the galaxy the landing hero opens on,
  // the knot the calculator opens on, and the wordmark the footer lands on. Sections
  // in between disperse whichever they hold. See shapes-parked.js for retired ones.
  const SHAPES = [genGalaxy, genKnot, genWordmark];
  const LAST_I = SHAPES.length - 1;          // highest data-shape a section may use
  const WORDMARK_I = SHAPES.indexOf(genWordmark);
  if (SHAPES.length !== SHADER_SHAPES) console.warn('SHAPES has ' + SHAPES.length + ' entries but the vertex shader is built for ' + SHADER_SHAPES);

  function genRandoms(N) {
    const r = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      const hero = rnd() < 0.05;
      r[i * 4] = hero ? 2.6 + rnd() * 1.6 : 0.6 + rnd() * 1.5;
      r[i * 4 + 1] = hero ? 0.8 + rnd() * 0.2 : rnd();
      r[i * 4 + 2] = rnd();
      r[i * 4 + 3] = 0.5 + rnd();
    }
    return r;
  }
  function genDust(N) {
    const pos = new Float32Array(N * 3), seed = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (rnd() * 2 - 1) * 1.1; pos[i * 3 + 1] = (rnd() * 2 - 1) * 1.1; pos[i * 3 + 2] = rnd();
      seed[i * 2] = rnd(); seed[i * 2 + 1] = 0.6 + rnd();
    }
    return { pos, seed };
  }

  class Field {
    constructor(canvas, budget) {
      const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL unavailable');
      this.canvas = canvas; this.gl = gl;
      this.count = budget.count; this.dustCount = budget.dust; this.maxDpr = budget.dpr;
      this.drawCount = this.count; this.dustDraw = this.dustCount;
      this.state = { progress: 0, rotX: 1.05, rotY: 0.6, offX: mobile() ? 0 : 1.15, offY: 0.05, scale: 0.55, opacity: 1, intro: 0, mouseF: finePointer ? 0.34 : 0, mouseR: 0.95, spin: 0.12, disperse: 0 };
      this.mouse = { x: 9, y: 9, tx: 9, ty: 9 };
      this.ndc = { x: 9, y: 9, tx: 9, ty: 9 };
      this.scroll = 0; this.boost = 0; this.time = 0;

      this.prog = createProgram(gl, VERT, FRAG, ['aP0', 'aP1', 'aP2', 'aRand']);
      this.dprog = createProgram(gl, DVERT, DFRAG, ['aPos', 'aSeed']);
      this.u = uniformMap(gl, this.prog);
      this.du = uniformMap(gl, this.dprog);
      this.order = makeOrder(this.count);
      this.buffers = SHAPES.map((fn) => makeBuffer(gl, applyOrder(fn(this.count), this.order)));
      this.randBuf = makeBuffer(gl, genRandoms(this.count));
      const dust = genDust(this.dustCount);
      this.dustPos = makeBuffer(gl, dust.pos);
      this.dustSeed = makeBuffer(gl, dust.seed);
      this.cprog = createProgram(gl, CVERT, CFRAG, ['aC']);
      this.cu = uniformMap(gl, this.cprog);
      this.cometBuf = makeBuffer(gl, genComets(budget.comets));
      this.cometDraw = reduced ? 0 : budget.comets * COMET_TAIL;

      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.clearColor(0, 0, 0, 0);
      this.resize();
    }
    resize() {
      // Clamp to at least 1px: a zero-size viewport (hidden pane, detached iframe)
      // must still produce a valid projection, or render() throws on uniformMatrix4fv.
      const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight);
      this.dpr = Math.min(this.maxDpr, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(w * this.dpr);
      this.canvas.height = Math.round(h * this.dpr);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.aspect = w / h;
      this.proj = perspective(FOV, this.aspect, 0.1, 100);
      this.halfH = Math.tan(FOV / 2) * CAM_Z;
      this.halfW = this.halfH * this.aspect;
      this.pointScale = this.canvas.height * 0.0115;
      // Dispersed-haze radii: 1.35x the viewport half-extents at the cloud's depth, so the
      // scattered state fills the screen the same way on a phone as on a widescreen desktop.
      this.scatterX = this.halfW * 1.35;
      this.scatterY = this.halfH * 1.35;
    }
    // Swap the wordmark shape for a better sampling once the logo decodes.
    setWordmark(data) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[WORDMARK_I]);
      gl.bufferData(gl.ARRAY_BUFFER, applyOrder(data, this.order), gl.STATIC_DRAW);
    }
    setPointer(px, py) {
      const nx = px / innerWidth * 2 - 1, ny = -(py / innerHeight * 2 - 1);
      this.ndc.tx = nx; this.ndc.ty = ny;
      this.mouse.tx = nx * this.halfW; this.mouse.ty = ny * this.halfH;
    }
    degrade() {
      this.drawCount = Math.floor(this.drawCount * 0.55);
      this.dustDraw = Math.floor(this.dustDraw * 0.6);
      this.maxDpr = 1;
      this.resize();
    }
    render(dt) {
      const gl = this.gl, s = this.state;
      if (!this.proj) { this.resize(); if (!this.proj) return; }
      if (!reduced) this.time += dt;
      s.rotY += dt * s.spin + this.boost;
      this.boost *= 0.9;
      const k = 1 - Math.exp(-dt * 11);
      if (!finePointer) {
        // Touch device: there is no cursor to react to, so park the repulsion point
        // far outside the field. Flying a phantom one around on a sine path pushed a
        // drifting hole through the shape — a cursor effect with no cursor behind it.
        // The dust layer already does this; the centrepiece was the odd one out.
        this.mouse.tx = 9; this.mouse.ty = 9;
      }
      this.mouse.x += (this.mouse.tx - this.mouse.x) * k;
      this.mouse.y += (this.mouse.ty - this.mouse.y) * k;
      this.ndc.x += (this.ndc.tx - this.ndc.x) * k;
      this.ndc.y += (this.ndc.ty - this.ndc.y) * k;

      gl.clear(gl.COLOR_BUFFER_BIT);

      // Background dust
      gl.useProgram(this.dprog);
      gl.uniform1f(this.du.uTime, this.time);
      gl.uniform1f(this.du.uAspect, this.aspect);
      gl.uniform1f(this.du.uScroll, this.scroll);
      gl.uniform1f(this.du.uPx, this.dpr);
      gl.uniform1f(this.du.uOpacity, 0.35 + 0.65 * s.intro);
      gl.uniform2f(this.du.uMouse, finePointer ? this.ndc.x : 9, finePointer ? this.ndc.y : 9);
      bindAttrib(gl, this.dustPos, 0, 3);
      bindAttrib(gl, this.dustSeed, 1, 2);
      gl.drawArrays(gl.POINTS, 0, this.dustDraw);
      gl.disableVertexAttribArray(0); gl.disableVertexAttribArray(1);

      // Comets
      if (this.cometDraw) {
        gl.useProgram(this.cprog);
        gl.uniform1f(this.cu.uTime, this.time);
        gl.uniform1f(this.cu.uAspect, this.aspect);
        gl.uniform1f(this.cu.uPx, this.dpr);
        gl.uniform1f(this.cu.uOpacity, s.intro);
        bindAttrib(gl, this.cometBuf, 0, 2);
        gl.drawArrays(gl.POINTS, 0, this.cometDraw);
        gl.disableVertexAttribArray(0);
      }

      // Centerpiece
      gl.useProgram(this.prog);
      gl.uniformMatrix4fv(this.u.uProj, false, this.proj);
      gl.uniform1f(this.u.uTime, this.time);
      gl.uniform1f(this.u.uProgress, s.progress);
      gl.uniform1f(this.u.uRotX, s.rotX);
      gl.uniform1f(this.u.uRotY, s.rotY);
      gl.uniform1f(this.u.uScale, s.scale);
      gl.uniform1f(this.u.uPointScale, this.pointScale);
      gl.uniform1f(this.u.uCamZ, CAM_Z);
      gl.uniform1f(this.u.uMouseR, s.mouseR);
      gl.uniform1f(this.u.uMouseF, s.mouseF);
      if (this.u.uDisperse) gl.uniform1f(this.u.uDisperse, s.disperse);
      if (this.u.uScatter) gl.uniform2f(this.u.uScatter, this.scatterX, this.scatterY);
      gl.uniform2f(this.u.uOffset, s.offX, s.offY);
      gl.uniform2f(this.u.uMouse, this.mouse.x, this.mouse.y);
      gl.uniform1f(this.u.uOpacity, s.opacity * s.intro);
      gl.uniform3f(this.u.uColor, 0.79, 0.79, 0.82);
      for (let i = 0; i < SHAPES.length; i++) bindAttrib(gl, this.buffers[i], i, 3);
      bindAttrib(gl, this.randBuf, SHAPES.length, 4);
      gl.drawArrays(gl.POINTS, 0, this.drawCount);
      for (let i = 0; i <= SHAPES.length; i++) gl.disableVertexAttribArray(i);
    }
  }

  let field = null;
  // Set while a width-fitted shape is showing: returns the offY that keeps it
  // inside its own section's box on screen. See cfgFor / anchorFor below.
  let fitAnchor = null;
  try {
    field = new Field($('.field'), TIERS[tier]);
    window.addEventListener('resize', () => field.resize(), { passive: true });
    window.__nuit = { field: field, tier: tier };
    loadLogoWordmark(field);
  } catch (err) {
    console.warn('Particle field disabled:', err.message);
    $('.field').style.display = 'none';
  }

  /* ------------------------------------------------------------------
     Cursor + glow (desktop only)
     ------------------------------------------------------------------ */
  const dot = $('.cursor-dot'), ring = $('.cursor-ring'), ringLabel = $('.cursor-ring span'), glow = $('.glow');
  const ringPos = { x: pointer.x, y: pointer.y }, glowPos = { x: pointer.x, y: pointer.y };

  // Motion trail: a chain of nodes, each easing toward the one ahead of it, so the
  // tail bends along the path the cursor actually took. Desktop pointers only.
  const TRAIL_N = 10;
  const trail = [];
  let trailFade = 0, pointerIn = true;
  if (finePointer && !reduced) {
    const host = $('.cursor-trail');
    if (host) {
      for (let i = 0; i < TRAIL_N; i++) {
        const el = document.createElement('i');
        host.appendChild(el);
        trail.push({ el: el, x: pointer.x, y: pointer.y });
      }
    }
  }

  if (finePointer) {
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('[data-cursor], a, button');
      if (!t) return;
      ring.classList.add('is-hover');
      const label = t.getAttribute('data-cursor');
      if (label) { ringLabel.textContent = label; ring.classList.add('is-label'); }
    });
    document.addEventListener('mouseout', (e) => {
      const t = e.target.closest('[data-cursor], a, button');
      if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
      ring.classList.remove('is-hover', 'is-label');
    });
    document.addEventListener('mouseleave', () => { pointerIn = false; dot.classList.add('is-hidden'); ring.classList.add('is-hidden'); });
    document.addEventListener('mouseenter', () => { pointerIn = true; dot.classList.remove('is-hidden'); ring.classList.remove('is-hidden'); });
    window.addEventListener('pointerdown', () => {
      ring.classList.add('is-down');
      if (field && hasGSAP) {
        gsap.fromTo(field.state, { mouseF: 0.34, mouseR: 0.95 }, { mouseF: 1.5, mouseR: 1.7, duration: 0.5, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: 'auto' });
      }
    });
    window.addEventListener('pointerup', () => ring.classList.remove('is-down'));
  }

  /* ------------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------------ */
  if (finePointer && !reduced && hasGSAP) {
    $$('.magnetic').forEach((el) => {
      const label = el.querySelector('.btn-label');
      const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
      const lx = label ? gsap.quickTo(label, 'x', { duration: 0.7, ease: 'power3.out' }) : null;
      const ly = label ? gsap.quickTo(label, 'y', { duration: 0.7, ease: 'power3.out' }) : null;
      const setFill = (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--x', (e.clientX - r.left) + 'px');
        el.style.setProperty('--y', (e.clientY - r.top) + 'px');
        return r;
      };
      el.addEventListener('mouseenter', setFill);
      el.addEventListener('mousemove', (e) => {
        const r = setFill(e);
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * 0.32); yTo(dy * 0.32);
        if (lx) { lx(dx * 0.1); ly(dy * 0.1); }
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); if (lx) { lx(0); ly(0); } });
    });
  }

  /* ------------------------------------------------------------------
     Typewriter
     ------------------------------------------------------------------ */
  function splitChars(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const chars = [];
    nodes.forEach((node) => {
      const text = node.textContent.replace(/\s+/g, ' ');
      const frag = document.createDocumentFragment();
      for (const ch of text) {
        const s = document.createElement('span');
        s.className = 'tw-c';
        s.textContent = ch;
        frag.appendChild(s);
        chars.push(s);
      }
      node.parentNode.replaceChild(frag, node);
    });
    return chars;
  }
  function typewrite(el, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const chars = el._tw || (el._tw = splitChars(el));
      if (reduced) { chars.forEach((c) => c.classList.add('on')); resolve(); return; }
      let i = 0, caret = null;
      const setCaret = (c) => { if (caret) caret.classList.remove('caret'); caret = c; if (c) c.classList.add('caret'); };
      setCaret(chars[0]);
      const step = () => {
        if (i >= chars.length) {
          setTimeout(() => { if (caret) caret.classList.add('caret-off'); resolve(); }, opts.hold != null ? opts.hold : 1800);
          return;
        }
        const c = chars[i++];
        c.classList.add('on');
        setCaret(c);
        const ch = c.textContent;
        let d = (opts.speed || 44) + (Math.random() - 0.5) * 28;
        if (/[.,!?]/.test(ch)) d += 240;
        if (ch === ' ') d *= 0.55;
        setTimeout(step, d);
      };
      setTimeout(step, opts.delay || 0);
    });
  }

  function splitWords(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const words = [];
    nodes.forEach((node) => {
      const parts = node.textContent.replace(/\s+/g, ' ').split(' ');
      const frag = document.createDocumentFragment();
      parts.forEach((word, idx) => {
        if (word) {
          const w = document.createElement('span'); w.className = 'w';
          const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = word;
          w.appendChild(wi); frag.appendChild(w); words.push(wi);
        }
        if (idx < parts.length - 1) frag.appendChild(document.createTextNode(' '));
      });
      node.parentNode.replaceChild(frag, node);
    });
    return words;
  }

  /* ------------------------------------------------------------------
     Scroll-driven reveals, section-driven particle morphs
     ------------------------------------------------------------------ */
  const heroH1 = $('.hero [data-typewriter]');
  const heroBits = ['.hero-eyebrow', '.hero-sub', '.hero-cta', '.scroll-hint'];

  function setupScroll() {
    if (!hasGSAP) return;

    // Nav scrim
    ScrollTrigger.create({ start: 'top -60', end: 'max', toggleClass: { targets: '.nav', className: 'is-scrolled' } });

    // Two wordmarks at once reads badly, so the small one steps aside for the big one.
    // Same start as the footer's shape trigger, so the nav begins fading exactly as the
    // particles start gathering into the logo.
    // Driven by callbacks rather than toggleClass: at the very bottom of the page the
    // scroll position lands exactly on a 'max' end, which counts as past the range, so
    // a range-based toggle pops the logo back on in the last pixel. Only crossing the
    // start upward should bring it back.
    const navMark = $('.nav .wordmark');
    if (navMark) {
      const eclipse = (on) => navMark.classList.toggle('is-eclipsed', on);
      ScrollTrigger.create({
        trigger: '.footer', start: 'top 55%', end: 'max',
        onEnter: () => eclipse(true),
        onEnterBack: () => eclipse(true),
        onLeaveBack: () => eclipse(false),
        onRefresh: (self) => eclipse(self.scroll() >= self.start)
      });
    }

    // Hero drifts up and fades as you leave it
    if (!reduced) {
      gsap.to('.hero-inner', { yPercent: -14, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    // Word-rise headlines
    $$('[data-split]').forEach((el) => {
      const words = splitWords(el);
      if (reduced) return;
      gsap.fromTo(words, { yPercent: 140, rotate: 2 }, {
        yPercent: 0, rotate: 0, duration: 0.95, ease: 'power4.out', stagger: 0.03,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    });

    // Typewriters below the fold
    $$('[data-typewriter]').forEach((el) => {
      if (el === heroH1) return;
      el._tw = splitChars(el);
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => typewrite(el, { speed: 40 }) });
    });

    // Generic reveals (grouped → staggered)
    const handled = new Set();
    $$('[data-reveal-group]').forEach((group) => {
      const items = $$('[data-reveal]', group);
      items.forEach((i) => handled.add(i));
      if (reduced) return;
      gsap.fromTo(items, { opacity: 0, y: 32 }, {
        opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.07,
        scrollTrigger: { trigger: group, start: 'top 92%', once: true }
      });
    });
    $$('[data-reveal]').forEach((el) => {
      if (handled.has(el) || el.closest('.hero') || reduced) return;
      gsap.fromTo(el, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 94%', once: true }
      });
    });

    // Process line draws with scroll
    const pline = $('.process-line i');
    if (pline && reduced) pline.style.transform = 'scaleX(1)';
    else if (pline) gsap.to(pline, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'bottom 55%', scrub: 0.6 } });

    // Portfolio covers drift for depth
    if (!reduced) {
      $$('.card .art').forEach((art) => {
        gsap.fromTo(art, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: art.closest('.card'), start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }

    // Section → particle shape
    if (field) {
      // The canvas is fixed to the viewport, so a shape placed at a fixed viewport
      // fraction sits wherever the scroll happens to be — which is how the wordmark
      // ended up drawn over the contact copy while the footer was still coming up.
      // Measure the gap from the section's own top edge instead, so the shape travels
      // with its section and stays in the space reserved for it. With the footer parked
      // at the top of the viewport (page bottom) this returns exactly what the old
      // fixed-fraction maths did, so the settled composition is unchanged.
      const anchorFor = (sec) => () => {
        const scale = field.halfW * +sec.dataset.scale;
        const halfFrac = (scale / LOGO_RATIO) / (2 * field.halfH);
        const topFrac = sec.getBoundingClientRect().top / innerHeight;
        return field.halfH * (1 - 2 * (topFrac + +sec.dataset.y + halfFrac));
      };
      const cfgFor = (sec) => {
        const m = mobile();
        // data-fit="width" sizes the shape as a share of the viewport width rather than
        // a fixed world scale, and reads data-y as the gap above it as a fraction of the
        // viewport. A width-fitted wordmark changes height with the aspect ratio, so
        // anchoring its top (not its centre) is what keeps it clear of the footer copy
        // on every screen.
        const fit = sec.dataset.fit === 'width';
        const scale = fit ? field.halfW * +sec.dataset.scale : +sec.dataset.scale * (m ? 0.72 : 1);
        let offY;
        if (fit) {
          offY = anchorFor(sec)();
        } else {
          offY = +sec.dataset.y * (m ? 0.6 : 1);
        }
        // data-m-* are phone overrides. A narrow screen has no room beside the copy —
        // the hero text alone fills most of the viewport — so a centred shape ends up
        // behind the words however it is placed. Sections that would collide say so
        // here and show the dispersed starfield instead.
        const mOver = (key, fallback) => (m && sec.dataset[key] !== undefined ? +sec.dataset[key] : fallback);
        return {
          progress: +sec.dataset.shape,
          rotX: +sec.dataset.rotx,
          offX: m ? 0 : +sec.dataset.x,
          offY: offY,
          scale: scale,
          opacity: mOver('mOpacity', +sec.dataset.opacity),
          spin: +sec.dataset.spin,
          disperse: mOver('mDisperse', +(sec.dataset.disperse || 0))
        };
      };
      let activeSec = null;
      /* A page that only uses a couple of the shapes has nothing to gain from morphing
         through the ones in between: walking galaxy → sphere → knot → ring on the way to
         the wordmark just shows forms belonging to sections that page does not have.
         Opting in with data-shape-snap on <body> reuses the fling technique below for
         every shape change — scatter to the haze, swap the index while it cannot be seen,
         then condense — so only the shapes a page actually declares are ever visible. */
      const snapShapes = document.body.hasAttribute('data-shape-snap');
      const go = (sec) => {
        activeSec = sec;
        const cfg = cfgFor(sec);
        // A fitted shape's offY tracks scroll every frame, so leave it out of the tween
        // rather than have the two write the same property.
        fitAnchor = sec.dataset.fit === 'width' ? anchorFor(sec) : null;
        if (fitAnchor) delete cfg.offY;
        // A flat shape has to face the camera, so data-roty pins the spin angle. Aim at
        // the nearest equivalent turn to keep the rotation short, and snap on completion
        // because render() keeps adding spin to rotY while the tween runs.
        let lock = null;
        if (sec.dataset.roty !== undefined) {
          const target = +sec.dataset.roty;
          lock = target + Math.round((field.state.rotY - target) / TAU) * TAU;
          cfg.rotY = lock;
        }
        const tween = Object.assign({
          duration: 1.5,
          ease: 'power3.inOut',
          overwrite: 'auto',
          onComplete: () => { if (lock !== null && activeSec === sec) field.state.rotY = lock; }
        }, cfg);

        if (snapShapes && Math.round(field.state.progress) !== +sec.dataset.shape) {
          // Named properties only, for the same reason as the fling path below.
          gsap.killTweensOf(field.state, 'progress,rotX,rotY,scale,offX,offY,opacity,spin,disperse');
          gsap.timeline()
            .to(field.state, { disperse: 1, duration: 0.4, ease: 'power2.out' })
            .set(field.state, { progress: +sec.dataset.shape })
            .to(field.state, Object.assign({}, tween, { duration: 1.1, ease: 'power3.out' }));
          return;
        }
        gsap.to(field.state, tween);
      };
      /* Flinging across the page fires every section's trigger in turn, and each one
         starting its own 1.5s morph means you sit and watch the shape crawl back down
         the chain — footer to hero replays every form on the way. So when triggers
         arrive in quick succession, scatter to the haze instead, snap the shape index
         across silently (invisible while dispersed), and condense once only into
         whatever section the scroll actually settles on. */
      // SETTLE stays above RAPID: if it were shorter it could fire between two triggers
      // that are still part of the same fling, condensing and scattering on every step.
      const RAPID = 350;   // ms between triggers below which we treat it as a fling
      const SETTLE = 400;  // ms of quiet that ends one
      let lastTrigger = -1e9, flying = false, settleTimer = null;

      const settle = () => {
        settleTimer = null;
        if (!flying) return;
        flying = false;
        if (activeSec) go(activeSec);
      };
      const request = (sec) => {
        const now = performance.now();
        const rapid = now - lastTrigger < RAPID;
        lastTrigger = now;
        if (rapid && !flying) {
          flying = true;
          // Kill outright rather than relying on overwrite:'auto' — that only drops the
          // properties this tween touches, leaving the previous section's tween still
          // walking `progress` down the shape chain underneath us. Named properties
          // only: a bare killTweensOf would also stop the intro tween's `intro` ramp
          // if the visitor flings within the first couple of seconds, leaving the whole
          // field dimmed until the watchdog fires.
          gsap.killTweensOf(field.state, 'progress,rotX,rotY,scale,offX,offY,opacity,spin,disperse');
          gsap.to(field.state, { disperse: 1, duration: 0.4, ease: 'power2.out' });
        }
        if (flying) {
          activeSec = sec;
          fitAnchor = null;
          gsap.set(field.state, { progress: +sec.dataset.shape });
          clearTimeout(settleTimer);
          settleTimer = setTimeout(settle, SETTLE);
        } else {
          go(sec);
        }
      };
      $$('[data-shape]').forEach((sec) => {
        ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onEnter: () => request(sec), onEnterBack: () => request(sec) });
      });
      window.addEventListener('resize', () => { if (activeSec && !flying) go(activeSec); }, { passive: true });
      const onScroll = () => {
        const y = window.scrollY || 0;
        field.scroll = y / innerHeight;
      };
      if (lenis) {
        lenis.on('scroll', (e) => { field.scroll = e.scroll / innerHeight; field.boost += (e.velocity || 0) * 0.00002; });
      } else {
        window.addEventListener('scroll', onScroll, { passive: true });
      }
    }
  }

  /* ------------------------------------------------------------------
     Portfolio tilt + pricing spotlight
     ------------------------------------------------------------------ */
  if (finePointer && !reduced && hasGSAP) {
    $$('.card').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rx(-(py - 0.5) * 7); ry((px - 0.5) * 9);
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      });
      card.addEventListener('mouseleave', () => { rx(0); ry(0); });
    });
  }
  if (finePointer) {
    $$('.tier').forEach((tierEl) => {
      tierEl.addEventListener('mousemove', (e) => {
        const r = tierEl.getBoundingClientRect();
        tierEl.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        tierEl.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ------------------------------------------------------------------
     Frame loop
     ------------------------------------------------------------------ */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (finePointer) {
      dot.style.transform = 'translate3d(' + pointer.x + 'px,' + pointer.y + 'px,0)';
      ringPos.x += (pointer.x - ringPos.x) * 0.22; ringPos.y += (pointer.y - ringPos.y) * 0.22;
      ring.style.transform = 'translate3d(' + ringPos.x + 'px,' + ringPos.y + 'px,0)';
      glowPos.x += (pointer.x - glowPos.x) * 0.07; glowPos.y += (pointer.y - glowPos.y) * 0.07;
      glow.style.transform = 'translate3d(' + glowPos.x + 'px,' + glowPos.y + 'px,0)';

      if (trail.length) {
        // Fade in quickly while moving, then out over ~0.7s once the cursor rests.
        const moving = pointerIn && (now - pointer.moved) < 90;
        const tau = moving ? 0.05 : 0.22;
        trailFade += ((moving ? 1 : 0) - trailFade) * (1 - Math.exp(-dt / tau));
        const k = 1 - Math.pow(0.6, dt * 60);
        let px = pointer.x, py = pointer.y;
        for (let i = 0; i < trail.length; i++) {
          const t = trail[i];
          t.x += (px - t.x) * k; t.y += (py - t.y) * k;
          px = t.x; py = t.y;
          const taper = 1 - i / TRAIL_N;
          t.el.style.transform = 'translate3d(' + t.x + 'px,' + t.y + 'px,0) scale(' + (0.16 + 0.62 * taper) + ')';
          t.el.style.opacity = String(trailFade * 0.42 * taper);
        }
      }
    }
    if (field) {
      // Follow the anchor rather than snapping to it, so entering the footer still eases
      // in and scrolling does not make the shape jitter frame to frame.
      if (fitAnchor) field.state.offY += (fitAnchor() - field.state.offY) * (1 - Math.exp(-dt / 0.3));
      field.render(dt);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // FPS watchdog: if the device can't hold a smooth frame rate, scale effects down instead of stuttering.
  function watchdog() {
    if (!field || reduced) return;
    let frames = 0, t0 = performance.now(), strikes = 0, windows = 0;
    function tick(now) {
      frames++;
      const elapsed = now - t0;
      if (elapsed >= 2500) {
        const fps = frames / (elapsed / 1000);
        if (fps < 46) {
          strikes++;
          field.degrade();
          html.classList.add('low-fx');
        }
        frames = 0; t0 = now;
        windows++; if (strikes >= 2 || strikes === 0 || windows >= 3) return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------
     Intro
     ------------------------------------------------------------------ */
  function startHero() {
    if (lenis) lenis.start();
    setupScroll();
    ScrollTrigger.refresh();
    if (reduced) {
      if (field) { field.state.intro = 1; field.state.scale = mobile() ? 0.72 : 1; }
      typewrite(heroH1);
      return;
    }
    if (field) gsap.to(field.state, { intro: 1, scale: mobile() ? 0.72 : 1, duration: 2.2, ease: 'power3.out' });
    const chrome = ['.nav', '.frame span', '.hud'];
    gsap.fromTo(chrome, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.05 });
    typewrite(heroH1, { delay: 250, speed: 46 });
    gsap.fromTo(heroBits, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', stagger: 0.14, delay: 1.0 });
    // If the frame loop is starved (occluded window, screenshot bots), land the intro anyway.
    setTimeout(() => {
      if (field) field.state.intro = 1;
      gsap.set(chrome.concat(heroBits), { clearProps: 'opacity,transform' });
    }, 4500);
    setTimeout(watchdog, 1200);
  }

  function intro() {
    const pre = $('.preloader');
    if (!hasGSAP) { pre.remove(); if (heroH1) splitChars(heroH1).forEach((c) => c.classList.add('on')); return; }
    if (lenis) lenis.stop();
    heroH1._tw = splitChars(heroH1);
    if (reduced) { pre.remove(); startHero(); return; }
    gsap.set(heroBits, { opacity: 0 });
    let seen = false;
    try { seen = !!sessionStorage.getItem('nuit-seen'); sessionStorage.setItem('nuit-seen', '1'); } catch (e) { /* private mode */ }
    const tl = gsap.timeline({ onComplete: () => { pre.remove(); } });
    if (seen) {
      tl.to(pre, { opacity: 0, duration: 0.45, ease: 'power2.out', onStart: startHero });
      return;
    }
    tl.from('.pre-logo', { yPercent: 118, duration: 1, ease: 'power4.out' }, 0.1)
      .fromTo('.pre-bar i', { scaleX: 0 }, { scaleX: 1, duration: 0.75, ease: 'power2.inOut' }, 0.35)
      .to('.pre-logo, .pre-bar', { opacity: 0, duration: 0.3, ease: 'power2.in' }, 1.05)
      .to(pre, { yPercent: -100, duration: 0.95, ease: 'power4.inOut', onStart: startHero }, 1.15);
  }

  /* ------------------------------------------------------------------
     Music — starts on its own, click to pause. Browsers refuse to play sound
     until the visitor has interacted with the page, so the load-time attempt
     usually fails; when it does we arm a one-shot fallback that starts the
     track on the first click, key, scroll or touch anywhere. Kept to a few
     characters in the corner.
     ------------------------------------------------------------------ */
  const player = $('.player');
  if (player) {
    const audio = $('.player-audio', player);
    const btn = $('.player-btn', player);
    const label = $('.player-state', player);
    const TRACK = 'Aphex Twin — #3';
    const GESTURES = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    let started = false, armed = false;

    // A dead control is worse than none: if the file will not load — moved, or the
    // standalone build opened without its assets folder — drop the player entirely.
    audio.addEventListener('error', () => { player.remove(); disarm(); });

    const sync = () => {
      const on = !audio.paused;
      player.classList.toggle('is-playing', on);
      label.textContent = on ? 'Playing' : (started ? 'Paused' : 'Play');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', (on ? 'Pause ' : 'Play ') + TRACK);
    };
    audio.addEventListener('play', () => { started = true; sync(); });
    audio.addEventListener('pause', sync);

    function disarm() {
      if (!armed) return;
      armed = false;
      GESTURES.forEach((t) => document.removeEventListener(t, onGesture, true));
    }
    function onGesture(e) {
      // A click on the control itself is the visitor deciding for themselves —
      // leave it to the button handler, or pointerdown would start the track and
      // the click that follows would immediately pause it again.
      if (e.target && e.target.closest && e.target.closest('.player')) return;
      audio.play().catch(() => {});
      disarm();
    }
    const arm = () => {
      if (armed) return;
      armed = true;
      GESTURES.forEach((t) => document.addEventListener(t, onGesture, true));
    };

    btn.addEventListener('click', () => {
      disarm();
      if (audio.paused) audio.play().catch(() => sync());
      else audio.pause();
    });

    audio.volume = 0.5;
    // preload stays "none": play() pulls the file in on its own, so a visitor who
    // never triggers it is not made to download several megabytes.
    audio.play().catch(arm);
    sync();
  }

  /* ------------------------------------------------------------------
     Work card previews — scale each embedded site to fit its cover
     ------------------------------------------------------------------ */
  /* Cover screenshots. Drop a file into assets/ named after data-shot and it appears —
     no markup change needed. Several extensions are tried because a saved screenshot is
     as likely to be a .png as a .jpg; if none of them exist the image stays hidden and
     the gradient cover art stands in, so a missing file is never a broken card. */
  $$('.shot').forEach((img) => {
    const exts = ['.jpg', '.webp', '.png', '.jpeg'];
    let i = 0;
    const tryNext = () => {
      if (i >= exts.length) { img.classList.add('is-off'); return; }
      img.src = 'assets/' + img.dataset.shot + exts[i++];
    };
    img.addEventListener('load', () => img.classList.add('is-on'));
    img.addEventListener('error', tryNext);
    tryNext();
  });

  const previews = $$('.preview');
  if (previews.length) {
    // Each frame renders an entire other website at desktop size. That is far too much
    // for a phone on top of the WebGL field — it stutters and runs out of memory — so
    // previews are for cursor-driven, desktop-class devices only. The src lives in
    // data-src until then, so on a phone nothing is ever fetched or rendered and the
    // gradient cover art stands in.
    const previewOK = () => finePointer && !reduced && tier !== 'low' && innerWidth > 760;
    let previewsOn = null;
    const syncPreviews = () => {
      const on = previewOK();
      if (on === previewsOn) return;   // only act on a real transition, not every resize
      previewsOn = on;
      previews.forEach((fr) => {
        fr.hidden = !on;
        if (on) {
          if (!fr.hasAttribute('src') && fr.dataset.src) fr.src = fr.dataset.src;
        } else if (fr.hasAttribute('src')) {
          fr.removeAttribute('src');   // let the window drop the embedded page
        }
      });
    };
    const fit = (fr) => {
      const cover = fr.parentElement;
      const w = fr.offsetWidth;
      if (cover && w) fr.style.setProperty('--pv', (cover.clientWidth / w).toFixed(4));
    };
    // Watch the cover itself rather than the window: the card is inside a responsive
    // grid, so its width changes for reasons a resize event never sees, and a stale
    // scale leaves the preview cropped or floating inside its frame.
    const fitAll = () => { syncPreviews(); if (previewsOn) previews.forEach(fit); };
    fitAll();
    // Only now allow the transform to animate, so hover and resize ease but the initial
    // scale is not seen ramping up from the stylesheet's fallback value.
    setTimeout(() => previews.forEach((fr) => fr.classList.add('is-fitted')), 80);
    // Both, deliberately. ResizeObserver catches width changes the window never hears
    // about, but it is delivered with the rendering steps, so it goes quiet whenever the
    // page is not painting; the resize listener still fires in that state.
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        entries.forEach((e) => { const fr = e.target.querySelector('.preview'); if (fr) fit(fr); });
      });
      previews.forEach((fr) => { if (fr.parentElement) ro.observe(fr.parentElement); });
    }
    window.addEventListener('resize', fitAll, { passive: true });
    // The card is still settling when the script first runs — webfonts reflow the copy
    // and a scrollbar can appear — so re-fit once the layout is final. Both are plain
    // events, so they land even where the observer above is throttled.
    window.addEventListener('load', fitAll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll, fitAll);
    previews.forEach((fr) => {
      fr.addEventListener('load', () => fit(fr));
      // If the site refuses to be framed, hide the frame so the gradient behind it shows
      // rather than leaving a blank white rectangle on the card.
      fr.addEventListener('error', () => { fr.hidden = true; });
    });
  }

  /* ------------------------------------------------------------------
     Small things: clock, year
     ------------------------------------------------------------------ */
  const clock = $('#clock');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Indian/Maldives', hour: '2-digit', minute: '2-digit' });
    const tickClock = () => { clock.textContent = fmt.format(new Date()); };
    tickClock(); setInterval(tickClock, 30000);
  }
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  const boot = () => {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(intro, intro);
    else intro();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
