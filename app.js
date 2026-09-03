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
    high: { count: 36000, dust: 1400, dpr: 2 },
    mid:  { count: 18000, dust: 900,  dpr: 1.5 },
    low:  { count: 7000,  dust: 420,  dpr: 1.25 }
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
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true; pointer.moved = performance.now();
    if (field) field.setPointer(e.clientX, e.clientY);
  }, { passive: true });

  /* ------------------------------------------------------------------
     WebGL particle field
     ------------------------------------------------------------------ */
  const CAM_Z = 6;
  const FOV = 40 * Math.PI / 180;

  const VERT = [
    'precision highp float;',
    'attribute vec3 aP0; attribute vec3 aP1; attribute vec3 aP2; attribute vec3 aP3; attribute vec3 aP4;',
    'attribute vec4 aRand;',
    'uniform mat4 uProj;',
    'uniform float uTime; uniform float uProgress; uniform float uRotX; uniform float uRotY;',
    'uniform float uScale; uniform float uPointScale; uniform float uCamZ; uniform float uMouseR; uniform float uMouseF;',
    'uniform vec2 uOffset; uniform vec2 uMouse;',
    'varying float vA; varying float vB;',
    'mat3 rotX(float a){ float c = cos(a); float s = sin(a); return mat3(1.0,0.0,0.0, 0.0,c,s, 0.0,-s,c); }',
    'mat3 rotY(float a){ float c = cos(a); float s = sin(a); return mat3(c,0.0,-s, 0.0,1.0,0.0, s,0.0,c); }',
    'void main(){',
    '  float p = clamp(uProgress, 0.0, 4.0);',
    '  float seg = floor(min(p, 3.999));',
    '  float f = p - seg;',
    '  float st = aRand.z * 0.4;',
    '  f = clamp((f - st) / 0.6, 0.0, 1.0);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  vec3 a; vec3 b;',
    '  if (seg < 0.5) { a = aP0; b = aP1; }',
    '  else if (seg < 1.5) { a = aP1; b = aP2; }',
    '  else if (seg < 2.5) { a = aP2; b = aP3; }',
    '  else { a = aP3; b = aP4; }',
    '  vec3 pos = mix(a, b, f);',
    '  float burst = sin(f * 3.14159265);',
    '  pos += normalize(pos + vec3(0.001)) * burst * (0.3 + 0.35 * aRand.y);',
    '  float t = uTime * (0.5 + aRand.w * 0.7);',
    '  pos += 0.035 * vec3(sin(t + pos.y * 3.0 + aRand.z * 6.2831), cos(t * 0.9 + pos.z * 3.0 + aRand.z * 3.1), sin(t * 1.1 + pos.x * 3.0 + aRand.z * 1.7));',
    '  pos = rotX(uRotX) * (rotY(uRotY) * pos);',
    '  pos *= uScale;',
    '  pos.xy += uOffset;',
    '  vec2 d = pos.xy - uMouse;',
    '  float dist = length(d);',
    '  float infl = 1.0 - smoothstep(0.0, uMouseR, dist);',
    '  infl *= infl;',
    '  pos.xy += (d / max(dist, 0.001)) * infl * uMouseF;',
    '  float dz = uCamZ - pos.z;',
    '  gl_Position = uProj * vec4(pos.x, pos.y, pos.z - uCamZ, 1.0);',
    '  gl_PointSize = aRand.x * uPointScale / max(dz, 0.5);',
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
  function finish(pts) {
    for (let i = 0; i < pts.length; i++) pts[i][3] = Math.atan2(pts[i][2], pts[i][0]);
    pts.sort((a, b) => a[3] - b[3]);
    const out = new Float32Array(pts.length * 3);
    for (let i = 0; i < pts.length; i++) { out[i * 3] = pts[i][0]; out[i * 3 + 1] = pts[i][1]; out[i * 3 + 2] = pts[i][2]; }
    return out;
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
  function genSphere(N) {
    const pts = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y0 = 1 - 2 * (i + 0.5) / N;
      const rr = Math.sqrt(1 - y0 * y0);
      const phi = i * ga;
      const rad = rnd() < 0.72 ? 1.08 + 0.1 * rnd() : 1.12 * Math.sqrt(rnd());
      pts.push([Math.cos(phi) * rr * rad, y0 * rad, Math.sin(phi) * rr * rad, 0]);
    }
    return finish(pts);
  }
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
  function genRing(N) {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const k = rnd();
      if (k < 0.14) {
        const r = Math.sqrt(rnd()) * 1.25, th = rnd() * TAU;
        pts.push([r * Math.cos(th), (rnd() - 0.5) * 0.04, r * Math.sin(th), 0]);
      } else if (k < 0.24) {
        const r = 0.28 * Math.cbrt(rnd()), th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
        pts.push([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th), 0]);
      } else {
        const R = 1.48, tube = 0.035 + 0.1 * Math.pow(rnd(), 2.2);
        const th = rnd() * TAU, ph = rnd() * TAU;
        const rr = R + tube * Math.cos(ph);
        pts.push([rr * Math.cos(th), tube * Math.sin(ph), rr * Math.sin(th), 0]);
      }
    }
    return finish(pts);
  }
  function genCone(N) {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const h = Math.pow(rnd(), 1.7);
      const y = 1.55 - h * 3.0;
      const radius = (0.02 + h * 1.25) * Math.sqrt(rnd());
      const th = rnd() * TAU + h * 4.0;
      pts.push([radius * Math.cos(th), y, radius * Math.sin(th), 0]);
    }
    return finish(pts);
  }
  const SHAPES = [genGalaxy, genSphere, genKnot, genRing, genCone];

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
      this.state = { progress: 0, rotX: 1.05, rotY: 0.6, offX: mobile() ? 0 : 1.15, offY: 0.05, scale: 0.55, opacity: 1, intro: 0, mouseF: 0.34, mouseR: 0.95, spin: 0.12 };
      this.mouse = { x: 9, y: 9, tx: 9, ty: 9 };
      this.ndc = { x: 9, y: 9, tx: 9, ty: 9 };
      this.scroll = 0; this.boost = 0; this.time = 0;

      this.prog = createProgram(gl, VERT, FRAG, ['aP0', 'aP1', 'aP2', 'aP3', 'aP4', 'aRand']);
      this.dprog = createProgram(gl, DVERT, DFRAG, ['aPos', 'aSeed']);
      this.u = uniformMap(gl, this.prog);
      this.du = uniformMap(gl, this.dprog);
      this.buffers = SHAPES.map((fn) => makeBuffer(gl, fn(this.count)));
      this.randBuf = makeBuffer(gl, genRandoms(this.count));
      const dust = genDust(this.dustCount);
      this.dustPos = makeBuffer(gl, dust.pos);
      this.dustSeed = makeBuffer(gl, dust.seed);

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
        const t = this.time;
        this.mouse.tx = Math.sin(t * 0.31) * 0.9; this.mouse.ty = Math.cos(t * 0.23) * 0.7;
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
      gl.uniform2f(this.u.uOffset, s.offX, s.offY);
      gl.uniform2f(this.u.uMouse, this.mouse.x, this.mouse.y);
      gl.uniform1f(this.u.uOpacity, s.opacity * s.intro);
      gl.uniform3f(this.u.uColor, 0.79, 0.79, 0.82);
      for (let i = 0; i < 5; i++) bindAttrib(gl, this.buffers[i], i, 3);
      bindAttrib(gl, this.randBuf, 5, 4);
      gl.drawArrays(gl.POINTS, 0, this.drawCount);
      for (let i = 0; i < 6; i++) gl.disableVertexAttribArray(i);
    }
  }

  let field = null;
  try {
    field = new Field($('.field'), TIERS[tier]);
    window.addEventListener('resize', () => field.resize(), { passive: true });
    window.__nuit = { field: field, tier: tier };
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
      const cfgFor = (sec) => {
        const m = mobile();
        return {
          progress: +sec.dataset.shape,
          rotX: +sec.dataset.rotx,
          offX: m ? 0 : +sec.dataset.x,
          offY: +sec.dataset.y * (m ? 0.6 : 1),
          scale: +sec.dataset.scale * (m ? 0.72 : 1),
          opacity: +sec.dataset.opacity,
          spin: +sec.dataset.spin
        };
      };
      let activeSec = null;
      const go = (sec) => {
        activeSec = sec;
        gsap.to(field.state, Object.assign({ duration: 1.5, ease: 'power3.inOut', overwrite: 'auto' }, cfgFor(sec)));
      };
      $$('[data-shape]').forEach((sec) => {
        ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onEnter: () => go(sec), onEnterBack: () => go(sec) });
      });
      window.addEventListener('resize', () => { if (activeSec) go(activeSec); }, { passive: true });
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
    if (field) field.render(dt);
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
